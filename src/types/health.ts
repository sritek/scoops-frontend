/**
 * Student Health API Types
 */

export type BloodGroup =
  | "A_positive"
  | "A_negative"
  | "B_positive"
  | "B_negative"
  | "AB_positive"
  | "AB_negative"
  | "O_positive"
  | "O_negative"
  | "unknown";

export type VisionStatus =
  | "normal"
  | "corrected_with_glasses"
  | "corrected_with_lenses"
  | "impaired";

export type HearingStatus =
  | "normal"
  | "mild_impairment"
  | "moderate_impairment"
  | "severe_impairment";

/**
 * Student health record
 */
export interface StudentHealth {
  id: string;
  studentId: string;

  // Basic Vitals
  bloodGroup: BloodGroup | null;
  heightCm: number | null;
  weightKg: number | null;

  // Medical History
  allergies: string | null;
  chronicConditions: string | null;
  currentMedications: string | null;
  pastSurgeries: string | null;

  // Sensory
  visionLeft: VisionStatus | null;
  visionRight: VisionStatus | null;
  usesGlasses: boolean;
  hearingStatus: HearingStatus | null;
  usesHearingAid: boolean;

  // Physical
  physicalDisability: string | null;
  mobilityAid: string | null;

  // Vaccinations
  vaccinationRecords: Record<string, string> | null;

  // Insurance
  hasInsurance: boolean;
  insuranceProvider: string | null;
  insurancePolicyNo: string | null;
  insuranceExpiry: string | null;

  // Emergency
  emergencyMedicalNotes: string | null;
  familyDoctorName: string | null;
  familyDoctorPhone: string | null;
  preferredHospital: string | null;

  // Checkup Tracking
  lastCheckupDate: string | null;
  nextCheckupDue: string | null;

  // Dietary
  dietaryRestrictions: string | null;

  createdAt: string;
  updatedAt: string;
}

/**
 * Student health with student info
 */
export interface StudentHealthResponse {
  student: {
    id: string;
    fullName: string;
    dob: string | null;
    gender: string | null;
  };
  health: StudentHealth;
}

/**
 * Health checkup record
 */
export interface HealthCheckup {
  id: string;
  studentId: string;
  checkupDate: string;
  heightCm: number | null;
  weightKg: number | null;
  bmi: number | null;
  visionLeft: string | null;
  visionRight: string | null;
  bloodPressure: string | null;
  pulse: number | null;
  dentalStatus: string | null;
  findings: string | null;
  recommendations: string | null;
  conductedBy: string | null;
  createdAt: string;
}

/**
 * Health checkups response
 */
export interface HealthCheckupsResponse {
  student: {
    id: string;
    fullName: string;
  };
  checkups: HealthCheckup[];
}

/**
 * Update student health input
 */
export interface UpdateStudentHealthInput {
  bloodGroup?: BloodGroup | null;
  heightCm?: number | null;
  weightKg?: number | null;
  allergies?: string | null;
  chronicConditions?: string | null;
  currentMedications?: string | null;
  pastSurgeries?: string | null;
  visionLeft?: VisionStatus | null;
  visionRight?: VisionStatus | null;
  usesGlasses?: boolean;
  hearingStatus?: HearingStatus | null;
  usesHearingAid?: boolean;
  physicalDisability?: string | null;
  mobilityAid?: string | null;
  vaccinationRecords?: Record<string, string> | null;
  hasInsurance?: boolean;
  insuranceProvider?: string | null;
  insurancePolicyNo?: string | null;
  insuranceExpiry?: string | null;
  emergencyMedicalNotes?: string | null;
  familyDoctorName?: string | null;
  familyDoctorPhone?: string | null;
  preferredHospital?: string | null;
  lastCheckupDate?: string | null;
  nextCheckupDue?: string | null;
  dietaryRestrictions?: string | null;
}

/**
 * Create health checkup input
 */
export interface CreateHealthCheckupInput {
  checkupDate: string;
  heightCm?: number;
  weightKg?: number;
  visionLeft?: string;
  visionRight?: string;
  bloodPressure?: string;
  pulse?: number;
  dentalStatus?: string;
  findings?: string;
  recommendations?: string;
  conductedBy?: string;
}

/**
 * Get human-readable blood group label
 */
export function getBloodGroupLabel(group: BloodGroup | null): string {
  if (!group) return "Not specified";
  const labels: Record<BloodGroup, string> = {
    A_positive: "A+",
    A_negative: "A-",
    B_positive: "B+",
    B_negative: "B-",
    AB_positive: "AB+",
    AB_negative: "AB-",
    O_positive: "O+",
    O_negative: "O-",
    unknown: "Unknown",
  };
  return labels[group] || group;
}

/**
 * Get human-readable vision status label
 */
export function getVisionStatusLabel(status: VisionStatus | null): string {
  if (!status) return "Not assessed";
  const labels: Record<VisionStatus, string> = {
    normal: "Normal",
    corrected_with_glasses: "Corrected (Glasses)",
    corrected_with_lenses: "Corrected (Lenses)",
    impaired: "Impaired",
  };
  return labels[status] || status;
}

/**
 * Get human-readable hearing status label
 */
export function getHearingStatusLabel(status: HearingStatus | null): string {
  if (!status) return "Not assessed";
  const labels: Record<HearingStatus, string> = {
    normal: "Normal",
    mild_impairment: "Mild Impairment",
    moderate_impairment: "Moderate Impairment",
    severe_impairment: "Severe Impairment",
  };
  return labels[status] || status;
}

/**
 * Calculate BMI
 */
export function calculateBMI(heightCm: number | null, weightKg: number | null): number | null {
  if (!heightCm || !weightKg) return null;
  const heightM = heightCm / 100;
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
}

/**
 * Get BMI category
 */
export function getBMICategory(bmi: number | null): string {
  if (!bmi) return "N/A";
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal";
  if (bmi < 30) return "Overweight";
  return "Obese";
}
