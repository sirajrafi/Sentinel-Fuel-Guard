export interface Citizen {
  mykad: string;
  name: string;
  eligible: boolean;
  vehicleType: string;
  vehiclePlate: string;
}

export interface Transaction {
  id: string;
  mykad: string;
  vehiclePlate: string;
  stationName: string;
  distanceFromPrev: number;
  timestamp: Date;
  liters: number;
}

export enum FraudRuleType {
  IMPOSSIBLE_SPEED = 'IMPOSSIBLE_SPEED',
  HIGH_FREQUENCY = 'HIGH_FREQUENCY',
  LOW_DISTANCE = 'LOW_DISTANCE',
  VEHICLE_MISMATCH = 'VEHICLE_MISMATCH',
  AI_DETECTED = 'AI_DETECTED',
}

export interface FraudAlert {
  id: string;
  mykad: string;
  ruleType: FraudRuleType;
  description: string;
  severity: 'low' | 'medium' | 'high';
  involvedTransactionIds: string[];
}

export const MOCK_CITIZENS: Record<string, Citizen> = {
  "900101081234": { mykad: "900101081234", name: "Ali Bin Abu", eligible: true, vehicleType: "Sedan (1.5L)", vehiclePlate: "ABC 1234" },
  "850202061111": { mykad: "850202061111", name: "Siti Nurhaliza", eligible: false, vehicleType: "Luxury SUV (3.0L)", vehiclePlate: "VV 8888" },
  "990101105555": { mykad: "990101105555", name: "Chong Wei", eligible: true, vehicleType: "Motorcycle", vehiclePlate: "WYY 999" },
};