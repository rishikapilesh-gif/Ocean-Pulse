export const APP_NAME = 'Ocean Pulse';
export const APP_TAGLINE = 'See the risk. Prioritize the fleet. Protect lives.';

export const ROLES = {
  ADMIN: 'ADMIN',
  SHORE_OPERATOR: 'SHORE_OPERATOR',
  SUPERVISOR: 'SUPERVISOR',
  FISHERMAN: 'FISHERMAN',
  DEMO_VIEWER: 'DEMO_VIEWER',
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];

export const WORLD_BOUNDS = {
  widthKm: 120,
  heightKm: 80,
  gridStepKm: 10,
  // Coordinates mapping: roughly southwest coast of India (e.g. Kerala / Arabian Sea coast)
  originLat: 9.50,
  originLng: 75.80,
  kmPerDegreeLat: 111.0,
  kmPerDegreeLng: 109.5,
};

export const TOWER_COORDS = {
  x: 15.5,
  y: 40.0,
  name: 'Kochi Maritime Command & Control',
};

export const VESSEL_EQUIPMENT_PROFILES = {
  basic: {
    label: 'Basic Canoe / Artisanal',
    comms: 'Mobile Phone (Cellular)',
    rangeKm: 40,
    hasWeatherReceiver: false,
    hasCompass: false,
    hasEngineSensor: false,
  },
  standard: {
    label: 'Standard Motorized Trawler',
    comms: 'VHF Marine Radio',
    rangeKm: 90,
    hasWeatherReceiver: true,
    hasCompass: true,
    hasEngineSensor: false,
  },
  advanced: {
    label: 'Deep-Sea Multiday Vessel',
    comms: 'Satellite Messenger (DAT / NavIC / Inmarsat)',
    rangeKm: 400,
    hasWeatherReceiver: true,
    hasCompass: true,
    hasEngineSensor: true,
  },
} as const;

export type VesselEquipmentType = keyof typeof VESSEL_EQUIPMENT_PROFILES;

export const DEFAULT_HAZARDS = [
  { id: 'HAZ-01', name: 'Rocky Reef & Submerged Shoal', x: 45, y: 63, r: 7, severity: 'HIGH' },
  { id: 'HAZ-02', name: 'Restricted Marine Sanctuary / Shipping Lane', x: 72, y: 9, r: 8, severity: 'CRITICAL' },
  { id: 'HAZ-03', name: 'Shallow Sandbank Bar', x: 29, y: 21, r: 6, severity: 'MEDIUM' },
];

export const INCIDENT_TYPES = {
  MANUAL_SOS: 'MANUAL_SOS',
  MEDICAL_EMERGENCY: 'MEDICAL_EMERGENCY',
  CAPSIZE_OR_SINKING: 'CAPSIZE_OR_SINKING',
  FIRE_OR_ENGINE: 'FIRE_OR_ENGINE',
  SEVERE_WEATHER: 'SEVERE_WEATHER',
  COMMUNICATION_LOSS: 'COMMUNICATION_LOSS',
  MISSING_TELEMETRY: 'MISSING_TELEMETRY',
  EQUIPMENT_FAILURE: 'EQUIPMENT_FAILURE',
  PERSON_OVERBOARD: 'PERSON_OVERBOARD',
  OTHER: 'OTHER',
} as const;

export type IncidentType = (typeof INCIDENT_TYPES)[keyof typeof INCIDENT_TYPES];

export const INCIDENT_STATUSES = {
  RECEIVED: 'RECEIVED',
  ACKNOWLEDGED: 'ACKNOWLEDGED',
  ASSESSED: 'ASSESSED',
  ASSIGNED: 'ASSIGNED',
  ACTION_IN_PROGRESS: 'ACTION_IN_PROGRESS',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED',
} as const;

export type IncidentStatus = (typeof INCIDENT_STATUSES)[keyof typeof INCIDENT_STATUSES];

export const ASSISTANCE_CATEGORIES = {
  DRINKING_WATER: 'DRINKING_WATER',
  FOOD: 'FOOD',
  MEDICAL: 'MEDICAL',
  FUEL: 'FUEL',
  MECHANICAL: 'MECHANICAL',
  COMMUNICATION: 'COMMUNICATION',
  WEATHER_INFO: 'WEATHER_INFO',
  EMERGENCY_RESCUE: 'EMERGENCY_RESCUE',
  OTHER: 'OTHER',
} as const;

export type AssistanceCategory = (typeof ASSISTANCE_CATEGORIES)[keyof typeof ASSISTANCE_CATEGORIES];

export const REQUEST_STATUSES = {
  PENDING: 'PENDING',
  ACKNOWLEDGED: 'ACKNOWLEDGED',
  DISPATCHED: 'DISPATCHED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

export type RequestStatus = (typeof REQUEST_STATUSES)[keyof typeof REQUEST_STATUSES];

export const RISK_LEVELS = {
  SAFE: 'Safe',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical',
  UNKNOWN: 'Unknown',
} as const;

export type RiskLevel = (typeof RISK_LEVELS)[keyof typeof RISK_LEVELS];

export const WARNING_ADVICE = {
  SAFE: 'SAFE',
  CAUTION: 'CAUTION',
  DANGER: 'DANGER',
} as const;

export type WarningAdvice = (typeof WARNING_ADVICE)[keyof typeof WARNING_ADVICE];

export const COMMS_STATES = {
  GOOD: 'good',
  WEAK: 'weak',
  LOST: 'lost',
} as const;

export type CommsState = (typeof COMMS_STATES)[keyof typeof COMMS_STATES];

export const TRANSLATIONS = {
  en: {
    code: 'en-IN',
    name: 'English',
    advice: {
      SAFE: 'Safe. Continue your journey carefully.',
      CAUTION: 'Caution. Conditions are changing. Move toward the safer direction.',
      DANGER: 'Danger ahead. Turn to the safe direction now and return to shore.',
    },
    emergencyLabels: {
      MANUAL_SOS: 'Immediate Danger / Distress (SOS)',
      MEDICAL_EMERGENCY: 'Medical Emergency',
      CAPSIZE_OR_SINKING: 'Capsize / Sinking Concern',
      FIRE_OR_ENGINE: 'Fire / Engine Breakdown',
      SEVERE_WEATHER: 'Trapped in Severe Weather / High Waves',
      COMMUNICATION_LOSS: 'Navigation / Radio Failure',
      MISSING_TELEMETRY: 'Missing Telemetry',
      EQUIPMENT_FAILURE: 'Hull or Steering Failure',
      PERSON_OVERBOARD: 'Person Overboard',
      OTHER: 'Other Emergency',
    },
    assistanceLabels: {
      DRINKING_WATER: 'Drinking Water',
      FOOD: 'Rations / Food',
      MEDICAL: 'First Aid / Medicine',
      FUEL: 'Diesel / Fuel Top-up',
      MECHANICAL: 'Towing / Mechanical Help',
      COMMUNICATION: 'Radio / Shore Relay',
      WEATHER_INFO: 'Weather Forecast',
      EMERGENCY_RESCUE: 'Urgent Evacuation',
      OTHER: 'General Support',
    },
  },
  ml: {
    code: 'ml-IN',
    name: 'മലയാളം (Malayalam)',
    advice: {
      SAFE: 'സുരക്ഷിതം. ശ്രദ്ധയോടെ യാത്ര തുടരുക.',
      CAUTION: 'ജാഗ്രത! സാഹചര്യം മാറുന്നു. സുരക്ഷിതമായ ദിശയിലേക്ക് നീങ്ങുക.',
      DANGER: 'അപകടം! മുന്നിൽ അപകടകരമായ കാലാവസ്ഥ. ഉടൻ സുരക്ഷിത ദിശയിലേക്ക് തിരിയുക.',
    },
    emergencyLabels: {
      MANUAL_SOS: 'അടിയന്തര അപകടം (SOS)',
      MEDICAL_EMERGENCY: 'ചികിത്സാ അടിയന്തരാവസ്ഥ',
      CAPSIZE_OR_SINKING: 'ബോട്ട് മറിയൽ ഭീഷണി',
      FIRE_OR_ENGINE: 'തീപിടുത്തം / എഞ്ചിൻ തകരാർ',
      SEVERE_WEATHER: 'അതിതീവ്ര കാലാവസ്ഥ',
      COMMUNICATION_LOSS: 'വാർത്താവിനിമയ തകരാർ',
      MISSING_TELEMETRY: 'ടെലിമെട്രി ലഭ്യമല്ല',
      EQUIPMENT_FAILURE: 'ഉപകരണ തകരാർ',
      PERSON_OVERBOARD: 'ആൾ കടലിൽ വീണു',
      OTHER: 'മറ്റ് അടിയന്തരാവസ്ഥ',
    },
    assistanceLabels: {
      DRINKING_WATER: 'കുടിവെള്ളം',
      FOOD: 'ഭക്ഷണം',
      MEDICAL: 'പ്രാഥമിക ചികിത്സ / മരുന്ന്',
      FUEL: 'ഡീസൽ / ഇന്ധനം',
      MECHANICAL: 'മെക്കാനിക്കൽ സഹായം / ടോവിംഗ്',
      COMMUNICATION: 'വാർത്താവിനിമയ സഹായം',
      WEATHER_INFO: 'കാലാവസ്ഥാ വിവരം',
      EMERGENCY_RESCUE: 'രക്ഷാപ്രവർത്തനം',
      OTHER: 'മറ്റ് സഹായം',
    },
  },
  ta: {
    code: 'ta-IN',
    name: 'தமிழ் (Tamil)',
    advice: {
      SAFE: 'பாதுகாப்பானது. கவனமாகப் பயணத்தைத் தொடருங்கள்.',
      CAUTION: 'எச்சரிக்கை! நிலைமை மாறுகிறது. பாதுகாப்பான திசைக்குச் செல்லுங்கள்.',
      DANGER: 'ஆபத்து! முன்னால் ஆபத்தான வானிலை. உடனே பாதுகாப்பான திசையில் திரும்புங்கள்.',
    },
    emergencyLabels: {
      MANUAL_SOS: 'அவசர ஆபத்து (SOS)',
      MEDICAL_EMERGENCY: 'மருத்துவ அவசரம்',
      CAPSIZE_OR_SINKING: 'படகு கவிழும் ஆபத்து',
      FIRE_OR_ENGINE: 'தீ / எஞ்சின் பழுது',
      SEVERE_WEATHER: 'கடுமையான புயல் வானிலை',
      COMMUNICATION_LOSS: 'தொடர்பு இழப்பு',
      MISSING_TELEMETRY: 'டெலிமெட்ரி கிடைக்கவில்லை',
      EQUIPMENT_FAILURE: 'கருவி பழுது',
      PERSON_OVERBOARD: 'ஆள் கடலில் விழுந்தார்',
      OTHER: 'பிற அவசர நிலை',
    },
    assistanceLabels: {
      DRINKING_WATER: 'குடிநீர்',
      FOOD: 'உணவு',
      MEDICAL: 'மருத்துவ உதவி',
      FUEL: 'எரிபொருள் / டீசல்',
      MECHANICAL: 'இயந்திர பழுது நீக்கம்',
      COMMUNICATION: 'தகவல் தொடர்பு உதவி',
      WEATHER_INFO: 'வானிலை தகவல்',
      EMERGENCY_RESCUE: 'மீட்புப் பணி',
      OTHER: 'இதர உதவி',
    },
  },
  hi: {
    code: 'hi-IN',
    name: 'हिन्दी (Hindi)',
    advice: {
      SAFE: 'सुरक्षित। सावधानी से यात्रा जारी रखें।',
      CAUTION: 'सावधान! हालात बदल रहे हैं। सुरक्षित दिशा की ओर बढ़ें।',
      DANGER: 'खतरा! आगे खतरनाक मौसम है। तुरंत सुरक्षित दिशा में मुड़ें।',
    },
    emergencyLabels: {
      MANUAL_SOS: 'तत्काल संकट (SOS)',
      MEDICAL_EMERGENCY: 'चिकित्सा आपातकाल',
      CAPSIZE_OR_SINKING: 'नाव पलटने की आशंका',
      FIRE_OR_ENGINE: 'आग / इंजन खराबी',
      SEVERE_WEATHER: 'भीषण चक्रवात या तूफ़ान',
      COMMUNICATION_LOSS: 'संचार विफलता',
      MISSING_TELEMETRY: 'टेलीमेट्री उपलब्ध नहीं',
      EQUIPMENT_FAILURE: 'उपकरण विफलता',
      PERSON_OVERBOARD: 'व्यक्ति समुद्र में गिरा',
      OTHER: 'अन्य आपातकाल',
    },
    assistanceLabels: {
      DRINKING_WATER: 'पीने का पानी',
      FOOD: 'राशन / भोजन',
      MEDICAL: 'दवा / प्राथमिक चिकित्सा',
      FUEL: 'डीजल / ईंधन',
      MECHANICAL: 'टोइंग / इंजन मरम्मत',
      COMMUNICATION: 'रेडियो संपर्क',
      WEATHER_INFO: 'मौसम जानकारी',
      EMERGENCY_RESCUE: 'तत्काल बचाव',
      OTHER: 'अन्य सहायता',
    },
  },
} as const;

export type SupportedLanguage = keyof typeof TRANSLATIONS;

export const INITIAL_FLEET = [
  { id: 'B01', name: 'Sagar Kanya', type: 'standard' as VesselEquipmentType, x: 70, y: 30, bearing: 90, speedKmh: 14, regNo: 'IND-KL-07-MM-1021', master: 'Antony Joseph' },
  { id: 'B02', name: 'Matsya Jyoti', type: 'standard' as VesselEquipmentType, x: 52, y: 45, bearing: 60, speedKmh: 12, regNo: 'IND-KL-07-MM-1044', master: 'K. Velayudhan' },
  { id: 'B03', name: 'Kadal Rani', type: 'basic' as VesselEquipmentType, x: 38, y: 21, bearing: 270, speedKmh: 9, regNo: 'IND-KL-07-CT-2019', master: 'Muhammed Basheer' },
  { id: 'B04', name: 'Samudra Ratna', type: 'advanced' as VesselEquipmentType, x: 32, y: 66, bearing: 120, speedKmh: 8, regNo: 'IND-KL-07-MS-3310', master: 'G. Chandran' },
  { id: 'B05', name: 'Jal Tara', type: 'standard' as VesselEquipmentType, x: 95, y: 55, bearing: 330, speedKmh: 13, regNo: 'IND-KL-07-MM-1088', master: 'Rajan Pillai' },
  { id: 'B06', name: 'Neelam', type: 'advanced' as VesselEquipmentType, x: 105, y: 12, bearing: 250, speedKmh: 12, regNo: 'IND-KL-07-MS-3422', master: 'Devadasan M.' },
  { id: 'B07', name: 'Varuna', type: 'standard' as VesselEquipmentType, x: 75, y: 52, bearing: 0, speedKmh: 15, regNo: 'IND-KL-07-MM-1120', master: 'P. Xavier' },
  { id: 'B08', name: 'Meenavan', type: 'basic' as VesselEquipmentType, x: 28, y: 38, bearing: 90, speedKmh: 8, regNo: 'IND-KL-07-CT-2081', master: 'Suresh Kumar' },
  { id: 'B09', name: 'Sagarika', type: 'advanced' as VesselEquipmentType, x: 104, y: 36, bearing: 180, speedKmh: 11, regNo: 'IND-KL-07-MS-3501', master: 'M. Sebastian' },
  { id: 'B10', name: 'Ponnu', type: 'basic' as VesselEquipmentType, x: 62, y: 11, bearing: 100, speedKmh: 10, regNo: 'IND-KL-07-CT-2105', master: 'Anandhan K.' },
];
