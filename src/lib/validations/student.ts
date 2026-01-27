import { z } from "zod";

/**
 * Parent relation enum values
 */
export const parentRelations = [
  "father",
  "mother",
  "guardian",
  "other",
] as const;
export type ParentRelation = (typeof parentRelations)[number];

/**
 * Student gender enum values
 */
export const studentGenders = ["male", "female", "other"] as const;
export type StudentGender = (typeof studentGenders)[number];

/**
 * Student category enum values
 */
export const studentCategories = [
  "gen",
  "sc",
  "st",
  "obc",
  "minority",
] as const;
export type StudentCategory = (typeof studentCategories)[number];

/**
 * Photo URL schema (Base64 data URL)
 */
const photoUrlSchema = z.string().nullable().optional();

/**
 * Parent input schema
 * Matches backend parentInputSchema
 */
export const parentInputSchema = z.object({
  firstName: z
    .string()
    .min(1, "First name is required")
    .max(255, "First name is too long"),
  lastName: z
    .string()
    .min(1, "Last name is required")
    .max(255, "Last name is too long"),
  phone: z
    .string()
    .min(10, "Phone must be at least 10 digits")
    .max(15, "Phone is too long")
    .regex(/^[0-9+\-\s]+$/, "Invalid phone number"),
  relation: z.enum(parentRelations),
  photoUrl: photoUrlSchema,
  isPrimaryContact: z.boolean(),
});

/**
 * Health data schema for student form
 * Matches backend updateStudentHealthSchema
 */
export const studentHealthSchema = z.object({
  // Basic Vitals
  bloodGroup: z
    .enum([
      "A_positive",
      "A_negative",
      "B_positive",
      "B_negative",
      "AB_positive",
      "AB_negative",
      "O_positive",
      "O_negative",
      "unknown",
    ])
    .optional()
    .nullable(),
  heightCm: z.union([z.number().positive(), z.null()]).optional(),
  weightKg: z.union([z.number().positive(), z.null()]).optional(),

  // Medical History
  allergies: z.string().max(500).optional().nullable(),
  chronicConditions: z.string().max(500).optional().nullable(),
  currentMedications: z.string().max(500).optional().nullable(),
  pastSurgeries: z.string().max(500).optional().nullable(),

  // Sensory
  visionLeft: z
    .enum([
      "normal",
      "corrected_with_glasses",
      "corrected_with_lenses",
      "impaired",
    ])
    .optional()
    .nullable(),
  visionRight: z
    .enum([
      "normal",
      "corrected_with_glasses",
      "corrected_with_lenses",
      "impaired",
    ])
    .optional()
    .nullable(),
  usesGlasses: z.boolean().optional(),
  hearingStatus: z
    .enum([
      "normal",
      "mild_impairment",
      "moderate_impairment",
      "severe_impairment",
    ])
    .optional()
    .nullable(),
  usesHearingAid: z.boolean().optional(),

  // Physical
  physicalDisability: z.string().max(500).optional().nullable(),
  mobilityAid: z.string().max(100).optional().nullable(),

  // Vaccinations
  vaccinationRecords: z.record(z.string(), z.string()).optional().nullable(),

  // Insurance
  hasInsurance: z.boolean().optional(),
  insuranceProvider: z.string().max(200).optional().nullable(),
  insurancePolicyNo: z.string().max(100).optional().nullable(),
  insuranceExpiry: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .nullable(),

  // Emergency
  emergencyMedicalNotes: z.string().max(1000).optional().nullable(),
  familyDoctorName: z.string().max(200).optional().nullable(),
  familyDoctorPhone: z.string().max(20).optional().nullable(),
  preferredHospital: z.string().max(200).optional().nullable(),

  // Checkup Tracking
  lastCheckupDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .nullable(),
  nextCheckupDue: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .nullable(),

  // Dietary
  dietaryRestrictions: z.string().max(500).optional().nullable(),
});

/**
 * Step 1: Student Information validation schema
 * Validates only required fields for step 1
 */
export const studentInfoStepSchema = z.object({
  firstName: z
    .string()
    .min(1, "First name is required")
    .max(255, "First name is too long"),
  lastName: z
    .string()
    .min(1, "Last name is required")
    .max(255, "Last name is too long"),
  admissionYear: z
    .number()
    .int("Year must be a whole number")
    .min(2000, "Year must be 2000 or later")
    .max(2100, "Year must be 2100 or earlier"),
});

/**
 * Step 2: Parents validation schema
 * Validates parents only if they exist
 */
export const parentsStepSchema = z
  .object({
    parents: z.array(parentInputSchema).optional(),
  })
  .refine(
    (data) => {
      // If there are parents, exactly one must be the primary contact
      if (data.parents && data.parents.length > 0) {
        const primaryCount = data.parents.filter(
          (p) => p.isPrimaryContact,
        ).length;
        return primaryCount === 1;
      }
      return true; // No parents is valid
    },
    {
      message: "Please select exactly one parent as the primary contact",
      path: ["parents"],
    },
  );

/**
 * Student form schema
 * Matches backend createStudentSchema
 */
export const studentFormSchema = z
  .object({
    firstName: z
      .string()
      .min(1, "First name is required")
      .max(255, "First name is too long"),
    lastName: z
      .string()
      .min(1, "Last name is required")
      .max(255, "Last name is too long"),
    gender: z.enum(studentGenders, {
      error: "Gender is required",
    }),
    dob: z.string().min(1, "Date of birth is required"),
    category: z.enum(studentCategories).nullable().optional(),
    isCwsn: z.boolean(),
    photoUrl: photoUrlSchema,
    admissionYear: z
      .number()
      .int("Year must be a whole number")
      .min(2000, "Year must be 2000 or later")
      .max(2100, "Year must be 2100 or earlier"),
    batchId: z.uuid("Invalid batch").optional().or(z.literal("")),
    parents: z.array(parentInputSchema).optional(),
    health: studentHealthSchema.optional(),
  })
  .refine(
    (data) => {
      // If there are parents, exactly one must be the primary contact
      if (data.parents && data.parents.length > 0) {
        const primaryCount = data.parents.filter(
          (p) => p.isPrimaryContact,
        ).length;
        return primaryCount === 1;
      }
      return true; // No parents is valid
    },
    {
      message: "Please select exactly one parent as the primary contact",
      path: ["parents"],
    },
  );

/**
 * Type for student form data
 */
export type StudentFormData = z.infer<typeof studentFormSchema>;

/**
 * Type for parent input
 */
export type ParentInput = z.infer<typeof parentInputSchema>;

/**
 * Default values for health data
 */
export const defaultHealthValues: z.infer<typeof studentHealthSchema> = {
  bloodGroup: null,
  heightCm: null,
  weightKg: null,
  allergies: null,
  chronicConditions: null,
  currentMedications: null,
  pastSurgeries: null,
  visionLeft: null,
  visionRight: null,
  usesGlasses: false,
  hearingStatus: null,
  usesHearingAid: false,
  physicalDisability: null,
  mobilityAid: null,
  vaccinationRecords: null,
  hasInsurance: false,
  insuranceProvider: null,
  insurancePolicyNo: null,
  insuranceExpiry: null,
  emergencyMedicalNotes: null,
  familyDoctorName: null,
  familyDoctorPhone: null,
  preferredHospital: null,
  lastCheckupDate: null,
  nextCheckupDue: null,
  dietaryRestrictions: null,
};

/**
 * Default values for the form
 */
export const defaultStudentFormValues: Partial<StudentFormData> = {
  firstName: "",
  lastName: "",
  dob: "",
  category: null,
  isCwsn: false,
  photoUrl: null,
  admissionYear: new Date().getFullYear(),
  batchId: "",
  parents: [],
  health: defaultHealthValues,
};

/**
 * Default values for a new parent entry
 */
export const defaultParentValues: ParentInput = {
  firstName: "",
  lastName: "",
  phone: "",
  relation: "father",
  photoUrl: null,
  isPrimaryContact: false,
};
