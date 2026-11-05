import { CONFIG } from '../config';
import { VesselState, StormState, AICopilotBrief } from '@ocean-pulse/shared';

export interface CopilotContext {
  vessel: VesselState;
  storm: StormState;
  rankedPosition: number;
  totalVessels: number;
}

export function generateDeterministicRuleBrief(ctx: CopilotContext): AICopilotBrief {
  const v = ctx.vessel;
  const a = v.assessment;
  const factors = a?.factors || [];
  const dominantFactors = factors.slice(0, 4).map((f) => f.text).join(' • ');

  const prioritySection = `${(a?.level || 'UNKNOWN').toUpperCase()} — Vessel ${v.id} (${v.name}) is ranked #${ctx.rankedPosition} of ${ctx.totalVessels} in fleet urgency. Deterministic Scenario Score: ${a?.scenarioRiskScore ?? 0}/100.`;

  const whySection = dominantFactors.length > 0
    ? dominantFactors
    : 'No critical hazard intersecting the 15-minute projected trajectory under current sea and weather conditions.';

  let whatToDo = `Current safety advisory: ${v.lastDeliveredWarning.level}.`;
  if (a?.recommendedCompass) {
    whatToDo += ` Recommended evasive bearing: ${a.recommendedCompass} (${Math.round(a.safeBearingDeg || 0)}° compass).`;
  }
  if (v.commState === 'lost') {
    whatToDo += ` WARNING: Vessel lost communication ~${Math.round(v.lastContactMinAgo)} min ago. Vessel is operating on the last delivered warning (${v.lastDeliveredWarning.level}). Shore team should attempt coastal VHF relay or contact nearby vessels.`;
  } else {
    whatToDo += ` Advise vessel master (${v.master}) to maintain vigil and monitor shore broadcasts.`;
  }

  const dataLimitations = `Assessment Confidence: ${a?.confidence ?? 0}%. Data Quality: ${a?.dataQuality || 'PARTIAL'}. Equipment Profile: ${v.equipment.label} (${v.equipment.comms}, ${v.equipment.rangeKm} km max range). ${
    !v.equipment.hasWeatherReceiver ? 'No onboard marine weather receiver; relying exclusively on coastal forecasts.' : ''
  } ${!v.equipment.hasCompass ? 'No gyrocompass; heading is estimated from satellite GPS trajectory.' : ''} ${
    v.glitchActive ? 'CRITICAL DATA CONFLICT: Active GPS glitch detected; fix diverges from beacon coordinates.' : ''
  }`;

  const evidenceTags = [
    `Vessel ${v.id} (${v.name})`,
    `${v.equipment.label}`,
    `GPS: ${v.glitchActive ? 'CONFLICT' : 'VALID'}`,
    `Comms: ${v.commState.toUpperCase()}`,
    v.equipment.hasWeatherReceiver ? 'Weather Receiver' : 'No Weather Sensor',
    v.equipment.hasCompass ? 'Compass' : 'Estimated Heading',
    v.equipment.hasEngineSensor ? (v.engineFault ? 'ENGINE FAULT' : 'Engine Normal') : 'No Engine Sensor',
    `Risk: ${a?.scenarioRiskScore ?? 0}% (${a?.level})`,
    `Confidence: ${a?.confidence ?? 0}%`,
    `TTD: ${a?.timeToDangerLabel || 'None'}`,
  ];

  return {
    vesselId: v.id,
    modelVersion: 'ocean-pulse-copilot-deterministic-v1',
    generatedAt: new Date().toISOString(),
    isFallback: true,
    prioritySection,
    whySection,
    whatToDoSection: whatToDo,
    dataLimitationsSection: dataLimitations,
    evidenceTags,
  };
}

export async function generateAICopilotBrief(ctx: CopilotContext): Promise<AICopilotBrief> {
  const fallback = generateDeterministicRuleBrief(ctx);

  if (CONFIG.aiProvider === 'fallback' || !CONFIG.aiEndpoint) {
    return fallback;
  }

  try {
    const v = ctx.vessel;
    const a = v.assessment;

    const systemPrompt = `You are Ocean Pulse's SHORE SAFETY COPILOT for maritime decision support.
STRICT MARITIME OPERATING CONSTRAINTS:
1. NEVER invent sensor measurements, fictitious radar hits, or unverified wave heights.
2. The deterministic risk engine authoritative score (${a?.scenarioRiskScore}%) and level (${a?.level}) must NOT be altered or overridden.
3. Unknown or missing equipment must NEVER be declared safe.
4. Distinguish clearly between verified facts and missing data.
5. Provide actionable, concise operator briefing under 4 specific headings:
PRIORITY
WHY
WHAT TO DO
DATA LIMITATIONS`;

    const userPrompt = `VESSEL VERIFIED TELEMETRY & STATE:
- Vessel ID: ${v.id} (${v.name}, Reg: ${v.regNo})
- Master: ${v.master}
- Equipment: ${v.equipment.label} (${v.equipment.comms})
- Deterministic Risk: ${a?.scenarioRiskScore}% (${a?.level})
- Time to Danger: ${a?.timeToDangerLabel}
- Comms Status: ${v.commState} (Last contact: ${Math.round(v.lastContactMinAgo)} min ago)
- Engine Propulsion Fault: ${v.engineFault}
- GPS Fix Conflict: ${v.glitchActive}
- Recommended Safe Direction: ${a?.recommendedCompass || 'None'}
- Contributing Factors: ${a?.factors.map((f) => f.text).join('; ')}
- Storm: Distance ${Math.round(Math.hypot(v.x - ctx.storm.x, v.y - ctx.storm.y))} km, Radius ${ctx.storm.radiusKm} km, Bearing ${ctx.storm.bearingDeg}°`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    let rawText = '';

    if (CONFIG.aiProvider === 'openai') {
      const resp = await fetch(CONFIG.aiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(CONFIG.aiApiKey ? { Authorization: `Bearer ${CONFIG.aiApiKey}` } : {}),
        },
        body: JSON.stringify({
          model: CONFIG.aiModel,
          temperature: 0.1,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (resp.ok) {
        const json: any = await resp.json();
        rawText = json.choices?.[0]?.message?.content || '';
      }
    } else if (CONFIG.aiProvider === 'ollama') {
      const resp = await fetch(CONFIG.aiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: CONFIG.aiModel,
          prompt: `${systemPrompt}\n\n${userPrompt}`,
          stream: false,
          options: { temperature: 0.1 },
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (resp.ok) {
        const json: any = await resp.json();
        rawText = json.response || '';
      }
    }

    if (!rawText) {
      return fallback;
    }

    // Parse sections
    const priorityMatch = rawText.match(/PRIORITY[\s\S]*?(?=WHY|$)/i);
    const whyMatch = rawText.match(/WHY[\s\S]*?(?=WHAT TO DO|$)/i);
    const whatMatch = rawText.match(/WHAT TO DO[\s\S]*?(?=DATA LIMITATIONS|$)/i);
    const limitationsMatch = rawText.match(/DATA LIMITATIONS[\s\S]*?$/i);

    return {
      vesselId: v.id,
      modelVersion: `${CONFIG.aiProvider}:${CONFIG.aiModel}`,
      generatedAt: new Date().toISOString(),
      isFallback: false,
      prioritySection: priorityMatch ? priorityMatch[0].replace(/PRIORITY[:\s]*/i, '').trim() : fallback.prioritySection,
      whySection: whyMatch ? whyMatch[0].replace(/WHY[:\s]*/i, '').trim() : fallback.whySection,
      whatToDoSection: whatMatch ? whatMatch[0].replace(/WHAT TO DO[:\s]*/i, '').trim() : fallback.whatToDoSection,
      dataLimitationsSection: limitationsMatch ? limitationsMatch[0].replace(/DATA LIMITATIONS[:\s]*/i, '').trim() : fallback.dataLimitationsSection,
      evidenceTags: fallback.evidenceTags,
    };
  } catch (error) {
    console.warn('[AICopilot] External LLM failed; smoothly using deterministic fallback:', (error as any).message);
    return fallback;
  }
}
