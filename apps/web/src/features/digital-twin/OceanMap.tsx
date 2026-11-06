import React, { useEffect, useRef, useState } from 'react';
import { useFleet } from '../../context/FleetContext';
import {
  WORLD_BOUNDS,
  TOWER_COORDS,
  VesselState,
} from '@ocean-pulse/shared';
import {
  gridToGeo,
  angleToBearing,
  bearingToAngle,
  coastX,
} from '../../../../api/src/risk-engine/calculations';
import { Layers, Compass, Wind, ShieldAlert } from 'lucide-react';

export const OceanMap: React.FC = () => {
  const { vessels, storm, hazards, selectedVesselId, setSelectedVesselId, simulation, updateWhatIf, updateStorm } = useFleet();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Layer visibility toggles
  const [showPredictions, setShowPredictions] = useState(true);
  const [showTrails, setShowTrails] = useState(true);
  const [showSafeArrows, setShowSafeArrows] = useState(true);
  const [showHazards, setShowHazards] = useState(true);
  const [showRange, setShowRange] = useState(true);

  // Dragging storm state
  const draggingRef = useRef<{ dx: number; dy: number } | null>(null);
  const [reroutingActive, setReroutingActive] = useState(false);

  const selectedVessel = vessels.find((v) => v.id === selectedVesselId) || vessels[0];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrame: number;

    const render = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      ctx.save();
      ctx.scale(dpr, dpr);

      const W = WORLD_BOUNDS.widthKm;
      const H = WORLD_BOUNDS.heightKm;
      const scale = Math.min(rect.width / W, rect.height / H);
      const ox = (rect.width - W * scale) / 2;
      const oy = (rect.height - H * scale) / 2;

      const S = (x: number, y: number) => [ox + x * scale, oy + y * scale];

      // 1. Background / Deep Maritime Void
      ctx.fillStyle = '#020813';
      ctx.fillRect(0, 0, rect.width, rect.height);

      ctx.save();
      ctx.beginPath();
      ctx.rect(ox, oy, W * scale, H * scale);
      ctx.clip();

      // Deep Ocean Multi-stop Gradient
      const seaGrad = ctx.createLinearGradient(0, oy, 0, oy + H * scale);
      seaGrad.addColorStop(0, '#04162e');
      seaGrad.addColorStop(0.5, '#061d3c');
      seaGrad.addColorStop(1, '#031024');
      ctx.fillStyle = seaGrad;
      ctx.fillRect(ox, oy, W * scale, H * scale);

      // Subtle ambient radar glow in sea center
      const ambientGlow = ctx.createRadialGradient(ox + (W * scale) / 2, oy + (H * scale) / 2, 0, ox + (W * scale) / 2, oy + (H * scale) / 2, (W * scale) * 0.6);
      ambientGlow.addColorStop(0, 'rgba(0, 240, 255, 0.05)');
      ambientGlow.addColorStop(1, 'rgba(0, 240, 255, 0)');
      ctx.fillStyle = ambientGlow;
      ctx.fillRect(ox, oy, W * scale, H * scale);

      // Bathymetry / Nautical Grid Lines (10 km grid)
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.09)';
      ctx.lineWidth = 1;
      ctx.fillStyle = 'rgba(147, 197, 253, 0.5)';
      ctx.font = '10px "Segoe UI", system-ui, sans-serif';

      for (let x = 10; x < W; x += 10) {
        const [px] = S(x, 0);
        ctx.beginPath();
        ctx.moveTo(px, oy);
        ctx.lineTo(px, oy + H * scale);
        ctx.stroke();
        if (x % 20 === 0) {
          ctx.fillText(`${x} km`, px + 4, oy + H * scale - 7);
        }
      }
      for (let y = 10; y < H; y += 10) {
        const [, py] = S(0, y);
        ctx.beginPath();
        ctx.moveTo(ox, py);
        ctx.lineTo(ox + W * scale, py);
        ctx.stroke();
      }

      // Coastline & Landmass (Western Coast of India - Kerala/Malabar)
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      for (let y = 0; y <= H; y += 1) {
        const [px, py] = S(coastX(y), y);
        ctx.lineTo(px, py);
      }
      ctx.lineTo(ox, oy + H * scale);
      ctx.closePath();

      // Land tactical gradient
      const landGrad = ctx.createLinearGradient(ox, oy, ox + 30 * scale, oy);
      landGrad.addColorStop(0, '#0a2118');
      landGrad.addColorStop(1, '#0e2d20');
      ctx.fillStyle = landGrad;
      ctx.fill();

      // Glowing Shoreline Contour
      ctx.save();
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#10b981';
      ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.restore();

      // Coast label
      ctx.fillStyle = '#6ee7b7';
      ctx.font = '800 11px "Segoe UI", sans-serif';
      ctx.fillText('MALABAR COAST (INDIA)', ox + 10, oy + 26);

      // 2. Shore Command Station & Radio Coverage
      const [tx, ty] = S(TOWER_COORDS.x, TOWER_COORDS.y);

      if (showRange && selectedVessel?.equipment?.rangeKm) {
        ctx.save();
        ctx.setLineDash([4, 6]);
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.45)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(tx, ty, selectedVessel.equipment.rangeKm * scale, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Shore Station Marker
      ctx.save();
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#00f0ff';
      ctx.beginPath();
      ctx.arc(tx, ty, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = '#ffffff';
      ctx.font = '700 11px "Segoe UI", sans-serif';
      ctx.fillText('Kochi Maritime Command', tx + 12, ty + 4);

      // 3. Environmental Hazards (Reefs, Shoals, Sanctuary)
      if (showHazards) {
        for (const h of hazards) {
          const [hx, hy] = S(h.x, h.y);
          ctx.fillStyle = 'rgba(255, 26, 64, 0.12)';
          ctx.beginPath();
          ctx.arc(hx, hy, h.radiusKm * scale, 0, Math.PI * 2);
          ctx.fill();

          ctx.save();
          ctx.setLineDash([6, 5]);
          ctx.strokeStyle = '#ff1a40';
          ctx.lineWidth = 1.8;
          ctx.shadowColor = '#ff1a40';
          ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.arc(hx, hy, h.radiusKm * scale, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();

          // Pill backing for hazard label
          ctx.save();
          ctx.fillStyle = 'rgba(2, 8, 19, 0.75)';
          const textW = ctx.measureText(h.name).width;
          ctx.fillRect(hx - textW / 2 - 4, hy - 6, textW + 8, 14);
          ctx.fillStyle = '#ff8591';
          ctx.font = '700 10px "Segoe UI", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(h.name, hx, hy + 4);
          ctx.restore();
        }
      }

      // 4. Moving Storm Cell
      if (storm) {
        const [sx, sy] = S(storm.x, storm.y);

        // Outer gale aura
        const auraGrad = ctx.createRadialGradient(sx, sy, storm.radiusKm * scale * 0.7, sx, sy, storm.radiusKm * scale * 1.9);
        auraGrad.addColorStop(0, 'rgba(168, 85, 247, 0.35)');
        auraGrad.addColorStop(1, 'rgba(168, 85, 247, 0)');
        ctx.fillStyle = auraGrad;
        ctx.beginPath();
        ctx.arc(sx, sy, storm.radiusKm * scale * 1.9, 0, Math.PI * 2);
        ctx.fill();

        // Storm core
        const coreGrad = ctx.createRadialGradient(sx, sy, 0, sx, sy, storm.radiusKm * scale);
        coreGrad.addColorStop(0, 'rgba(109, 40, 217, 0.9)');
        coreGrad.addColorStop(1, 'rgba(147, 51, 234, 0.55)');
        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        ctx.arc(sx, sy, storm.radiusKm * scale, 0, Math.PI * 2);
        ctx.fill();

        // Animated Cyclone spiral arms
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#c084fc';
        ctx.shadowBlur = 8;
        const nowSec = performance.now() / 1000;
        for (let i = 0; i < 4; i++) {
          const a0 = nowSec * 0.9 + i * 1.57;
          ctx.beginPath();
          ctx.arc(sx, sy, storm.radiusKm * scale * (0.28 + 0.18 * i), a0, a0 + 1.8);
          ctx.stroke();
        }
        ctx.restore();

        ctx.strokeStyle = '#c084fc';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.arc(sx, sy, storm.radiusKm * scale, 0, Math.PI * 2);
        ctx.stroke();

        // 15-Minute Projected Storm Position
        const sVel = (storm.speedKmh / 60);
        const sAngle = bearingToAngle(storm.bearingDeg);
        const fx = storm.x + Math.cos(sAngle) * sVel * 15;
        const fy = storm.y + Math.sin(sAngle) * sVel * 15;
        const [fpx, fpy] = S(fx, fy);
        const fr = (storm.radiusKm + 0.25 * 15) * scale;

        if (storm.speedKmh > 0) {
          ctx.save();
          ctx.setLineDash([5, 5]);
          ctx.strokeStyle = 'rgba(192, 132, 252, 0.85)';
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.arc(fpx, fpy, fr, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(fpx, fpy);
          ctx.stroke();
          ctx.restore();

          ctx.fillStyle = '#e9d5ff';
          ctx.font = '700 10px "Segoe UI", sans-serif';
          ctx.fillText(`Storm in +15m (${Math.round(storm.speedKmh)} km/h)`, fpx - 40, fpy - fr - 6);
        }

        ctx.fillStyle = '#ffffff';
        ctx.font = '900 12px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('STORM CELL', sx, sy - 2);
        ctx.font = '600 10px "Segoe UI", sans-serif';
        ctx.fillStyle = '#e9d5ff';
        ctx.fillText(`r=${Math.round(storm.radiusKm)}km • ${storm.maxWindSpeedKts} kts`, sx, sy + 14);
        ctx.textAlign = 'left';
      }

      // 5. Vessel Trails with glowing fade
      if (showTrails) {
        for (const b of vessels) {
          if (!b.trail || b.trail.length < 2) continue;
          const isSel = b.id === selectedVesselId;
          ctx.strokeStyle = isSel ? 'rgba(0, 240, 255, 0.85)' : 'rgba(125, 211, 252, 0.35)';
          ctx.lineWidth = isSel ? 2.5 : 1.5;
          ctx.beginPath();
          b.trail.forEach((p, i) => {
            const [px, py] = S(p.x, p.y);
            i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
          });
          const [bx, by] = S(b.x, b.y);
          ctx.lineTo(bx, by);
          ctx.stroke();
        }
      }

      // 6. Vessel Projected Trajectories (5, 10, 15 min horizons)
      if (showPredictions) {
        for (const b of vessels) {
          const a = b.assessment;
          if (!a || !a.horizons || !Array.isArray(a.horizons) || a.horizons.length === 0) continue;
          const isSel = b.id === selectedVesselId;

          const sp = (b.effectiveSpeedKmh || b.speedKmh || 10) / 60;
          const heading = b.headingRad || 0;
          const vx = Math.cos(heading) * sp;
          const vy = Math.sin(heading) * sp;

          const repX = b.glitchActive && b.glitchOffset ? b.x + b.glitchOffset.x : b.x;
          const repY = b.glitchActive && b.glitchOffset ? b.y + b.glitchOffset.y : b.y;

          const pts = a.horizons.map((h) => S(repX + vx * h.minute, repY + vy * h.minute));

          ctx.save();
          ctx.globalAlpha = isSel ? 1 : 0.5;
          ctx.setLineDash([5, 4]);
          ctx.lineWidth = isSel ? 2.5 : 1.5;

          for (let i = 0; i < pts.length - 1; i++) {
            const r = a.horizons[i + 1]?.riskScore ?? 0;
            ctx.strokeStyle = r >= 0.8 ? '#ff1a40' : r >= 0.6 ? '#f97316' : r >= 0.35 ? '#f59e0b' : '#10b981';
            ctx.beginPath();
            ctx.moveTo(pts[i][0], pts[i][1]);
            ctx.lineTo(pts[i + 1][0], pts[i + 1][1]);
            ctx.stroke();
          }

          ctx.setLineDash([]);
          for (let i = 1; i < pts.length; i++) {
            const h = a.horizons[i];
            if (!h) continue;
            const col = h.riskScore >= 0.8 ? '#ff1a40' : h.riskScore >= 0.6 ? '#f97316' : h.riskScore >= 0.35 ? '#f59e0b' : '#10b981';
            ctx.fillStyle = col;
            ctx.strokeStyle = '#020813';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(pts[i][0], pts[i][1], isSel ? 4.5 : 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            if (isSel) {
              ctx.fillStyle = '#ffffff';
              ctx.font = '700 9px "Segoe UI", sans-serif';
              ctx.fillText(`+${h.minute}m`, pts[i][0] + 6, pts[i][1] - 4);
            }
          }
          ctx.restore();
        }
      }

      // 7. Recommended Safe Bearing Arrows
      if (showSafeArrows) {
        for (const b of vessels) {
          const a = b.assessment;
          if (!a || a.safeAngleRad == null || isNaN(a.safeAngleRad) || (a.rawRisk ?? 0) < 0.35) continue;
          if (b.id !== selectedVesselId && (a.rawRisk ?? 0) < 0.6) continue;

          const [bx, by] = S(b.x, b.y);
          const arrowLen = 7.5 * scale;
          const ax = bx + Math.cos(a.safeAngleRad) * arrowLen;
          const ay = by + Math.sin(a.safeAngleRad) * arrowLen;

          ctx.save();
          ctx.strokeStyle = '#00e5a3';
          ctx.fillStyle = '#00e5a3';
          ctx.lineWidth = b.id === selectedVesselId ? 3.5 : 2.2;
          ctx.shadowColor = '#00e5a3';
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.moveTo(bx, by);
          ctx.lineTo(ax, ay);
          ctx.stroke();

          // Arrowhead
          const tipAngle = a.safeAngleRad;
          ctx.beginPath();
          ctx.moveTo(ax, ay);
          ctx.lineTo(ax - 10 * Math.cos(tipAngle - 0.45), ay - 10 * Math.sin(tipAngle - 0.45));
          ctx.lineTo(ax - 10 * Math.cos(tipAngle + 0.45), ay - 10 * Math.sin(tipAngle + 0.45));
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }
      }

      // 8. Vessel Markers
      for (const b of vessels) {
        const a = b.assessment;
        const [bx, by] = S(b.x, b.y);
        const isSel = b.id === selectedVesselId;

        // Vivid Risk color
        const riskCol = a?.level === 'Critical'
          ? '#ff1a40'
          : a?.level === 'High'
          ? '#f97316'
          : a?.level === 'Medium'
          ? '#f59e0b'
          : '#10b981';

        // GPS Glitch ghost marker
        if (b.glitchActive && b.glitchOffset) {
          const [gx, gy] = S(b.x + b.glitchOffset.x, b.y + b.glitchOffset.y);
          ctx.save();
          ctx.setLineDash([3, 3]);
          ctx.strokeStyle = '#ff6b7a';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(bx, by);
          ctx.lineTo(gx, gy);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(gx, gy, 6, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }

        // Selected vessel pulsing cyber highlight ring
        if (isSel) {
          const pulseR = 15 + 3 * Math.sin(performance.now() / 220);
          ctx.save();
          ctx.strokeStyle = '#00f0ff';
          ctx.lineWidth = 2;
          ctx.shadowColor = '#00f0ff';
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(bx, by, pulseR, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }

        // Active distress emergency pulse
        if (b.activeDistress) {
          const alertR = 20 + 5 * Math.sin(performance.now() / 180);
          ctx.save();
          ctx.strokeStyle = '#ff1a40';
          ctx.lineWidth = 2.8;
          ctx.shadowColor = '#ff1a40';
          ctx.shadowBlur = 14;
          ctx.beginPath();
          ctx.arc(bx, by, alertR, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }

        // Ship hull shape rotated to heading
        ctx.save();
        ctx.translate(bx, by);
        ctx.rotate(b.headingRad || 0);
        ctx.beginPath();
        ctx.moveTo(11, 0); // Bow
        ctx.lineTo(-7, 6.5); // Port quarter
        ctx.lineTo(-4, 0); // Stern center
        ctx.lineTo(-7, -6.5); // Starboard quarter
        ctx.closePath();
        ctx.fillStyle = riskCol;
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.8;
        ctx.stroke();
        ctx.restore();

        // Communication signal status dot
        const commCol = b.commState === 'good' ? '#10b981' : b.commState === 'weak' ? '#f59e0b' : '#ff1a40';
        ctx.fillStyle = commCol;
        ctx.strokeStyle = '#020813';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(bx + 9, by - 9, 3.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Label with background card
        ctx.save();
        ctx.font = isSel ? '800 12px "Segoe UI", sans-serif' : '700 10px "Segoe UI", sans-serif';
        const nameText = b.id;
        ctx.fillStyle = isSel ? '#00f0ff' : '#ffffff';
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 4;
        ctx.fillText(nameText, bx + 12, by + 14);
        ctx.restore();
      }

      ctx.restore(); // end clip

      // Border frame with subtle cyan highlight
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.25)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(ox, oy, W * scale, H * scale);

      ctx.restore();
      animFrame = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animFrame);
  }, [vessels, storm, hazards, selectedVesselId, showPredictions, showTrails, showSafeArrows, showHazards, showRange]);

  // Pointer interactions (select vessel, drag storm, reroute)
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    const W = WORLD_BOUNDS.widthKm;
    const H = WORLD_BOUNDS.heightKm;
    const scale = Math.min(rect.width / W, rect.height / H);
    const ox = (rect.width - W * scale) / 2;
    const oy = (rect.height - H * scale) / 2;

    const worldX = (px - ox) / scale;
    const worldY = (py - oy) / scale;

    // Check if rerouting course
    if (reroutingActive) {
      updateWhatIf(selectedVesselId, {
        rerouteTargetX: worldX,
        rerouteTargetY: worldY,
      });
      setReroutingActive(false);
      return;
    }

    // Check if clicked near a vessel
    let closestVessel: VesselState | null = null;
    let minD = 22; // px threshold

    for (const b of vessels) {
      const bx = ox + b.x * scale;
      const by = oy + b.y * scale;
      const dist = Math.hypot(bx - px, by - py);
      if (dist < minD) {
        minD = dist;
        closestVessel = b;
      }
    }

    if (closestVessel) {
      setSelectedVesselId(closestVessel.id);
      return;
    }

    // Check if dragging storm
    if (storm && Math.hypot(worldX - storm.x, worldY - storm.y) <= storm.radiusKm) {
      draggingRef.current = { dx: storm.x - worldX, dy: storm.y - worldY };
      canvas.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!draggingRef.current || !storm) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    const W = WORLD_BOUNDS.widthKm;
    const H = WORLD_BOUNDS.heightKm;
    const scale = Math.min(rect.width / W, rect.height / H);
    const ox = (rect.width - W * scale) / 2;
    const oy = (rect.height - H * scale) / 2;

    const worldX = (px - ox) / scale;
    const worldY = (py - oy) / scale;

    const newX = Math.max(5, Math.min(115, worldX + draggingRef.current.dx));
    const newY = Math.max(5, Math.min(75, worldY + draggingRef.current.dy));

    updateStorm({ x: newX, y: newY });
  };

  const handlePointerUp = () => {
    draggingRef.current = null;
  };

  return (
    <div className="relative w-full h-full bg-ocean-950 flex flex-col overflow-hidden">
      {/* Map Action / Layer Bar */}
      <div className="absolute top-3 left-3 z-20 flex flex-wrap items-center gap-1.5 bg-ocean-950/85 backdrop-blur-xl border border-cyan-500/25 px-3 py-1.5 rounded-xl shadow-xl shadow-black/50 text-xs">
        <span className="font-extrabold text-cyan-300 flex items-center gap-1.5 mr-1 text-[11px] uppercase tracking-wider">
          <Layers className="w-3.5 h-3.5 text-pulse-cyan" />
          Layers
        </span>
        <button
          onClick={() => setShowPredictions(!showPredictions)}
          className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-all ${
            showPredictions
              ? 'bg-cyan-950/80 border-pulse-cyan text-pulse-cyan shadow-glow-cyan-sm'
              : 'border-ocean-800 text-ocean-400 hover:text-white'
          }`}
        >
          Predicted Tracks
        </button>
        <button
          onClick={() => setShowSafeArrows(!showSafeArrows)}
          className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-all ${
            showSafeArrows
              ? 'bg-emerald-950/80 border-pulse-teal text-pulse-teal'
              : 'border-ocean-800 text-ocean-400 hover:text-white'
          }`}
        >
          Safe Vectors
        </button>
        <button
          onClick={() => setShowHazards(!showHazards)}
          className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-all ${
            showHazards
              ? 'bg-rose-950/80 border-pulse-critical text-rose-300'
              : 'border-ocean-800 text-ocean-400 hover:text-white'
          }`}
        >
          Marine Hazards
        </button>
        <button
          onClick={() => setShowTrails(!showTrails)}
          className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-all ${
            showTrails
              ? 'bg-ocean-800 border-ocean-600 text-white'
              : 'border-ocean-800 text-ocean-400 hover:text-white'
          }`}
        >
          Vessel Trails
        </button>
      </div>

      {/* Reroute active banner */}
      {reroutingActive && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-20 bg-gradient-to-r from-cyan-500 to-pulse-cyan text-ocean-950 px-5 py-2 rounded-xl font-black shadow-2xl flex items-center gap-2 animate-bounce text-xs">
          <Compass className="w-4 h-4" />
          Click anywhere on the ocean to set a new course for {selectedVessel?.id} ({selectedVessel?.name}). Press Esc to cancel.
        </div>
      )}

      {/* Interactive Map Canvas */}
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={`w-full h-full flex-1 ${reroutingActive ? 'cursor-crosshair' : 'cursor-grab active:cursor-grabbing'}`}
      />

      {/* Floating Legend */}
      <div className="absolute bottom-3 left-3 z-20 bg-ocean-950/90 backdrop-blur-xl border border-cyan-500/20 px-3.5 py-2 rounded-xl text-xs shadow-xl flex items-center gap-4 text-ocean-200">
        <span className="font-extrabold text-white text-[11px] uppercase tracking-wider">Risk Level:</span>
        <span className="flex items-center gap-1.5 font-medium text-emerald-400">
          <span className="w-2.5 h-2.5 rounded-full bg-pulse-safe inline-block shadow-sm shadow-emerald-500/50" />
          Safe
        </span>
        <span className="flex items-center gap-1.5 font-medium text-amber-400">
          <span className="w-2.5 h-2.5 rounded-full bg-pulse-medium inline-block shadow-sm shadow-amber-500/50" />
          Medium
        </span>
        <span className="flex items-center gap-1.5 font-medium text-orange-400">
          <span className="w-2.5 h-2.5 rounded-full bg-pulse-high inline-block shadow-sm shadow-orange-500/50" />
          High
        </span>
        <span className="flex items-center gap-1.5 font-bold text-rose-400">
          <span className="w-2.5 h-2.5 rounded-full bg-pulse-critical inline-block shadow-sm shadow-rose-500/80 animate-pulse" />
          Critical
        </span>
        <span className="text-ocean-400 hidden sm:inline text-[11px]">| 1 square = 10 km • Drag storm to simulate what-if</span>
      </div>
    </div>
  );
};
