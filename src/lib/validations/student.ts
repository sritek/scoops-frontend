import { z } from "zod";

/**
 * Parent relation enum values
 */
export const parentRelations = ["father", "mother", "guardian", "other"] as const;
export type ParentRelation = (typeof parentRelations)[number];

/**
 * Student gender enum values
 */
export const studentGenders = ["male", "female", "other"] as const;
export type StudentGender = (typeof studentGenders)[number];

/**
 * Student category enum values
 */
export const studentCategories = ["gen", "sc", "st", "obc", "minority"] as const;
export type StudentCategory = (typeof studentCategories)[number];

/**
 * Photo URL schema (Base64 data URL)
 */
const photoUrlSchema = z
  .string()
  .nullable()
  .optional();

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
});

/**
 * Student form schema
 * Matches backend createStudentSchema
 */
export const studentFormSchema = z.object({
  firstName: z
    .string()
    .min(1, "First name is required")
    .max(255, "First name is too long"),
  lastName: z
    .string()
    .min(1, "Last name is required")
    .max(255, "Last name is too long"),
  gender: z.enum(studentGenders).optional(),
  dob: z.string().optional(),
  category: z.enum(studentCategories).optional(),
  isCwsn: z.boolean().optional(),
  photoUrl: photoUrlSchema,
  admissionYear: z
    .number()
    .int("Year must be a whole number")
    .min(2000, "Year must be 2000 or later")
    .max(2100, "Year must be 2100 or earlier"),
  batchId: z.string().uuid("Invalid batch").optional().or(z.literal("")),
  parents: z.array(parentInputSchema).optional(),
});

/**
 * Type for student form data
 */
export type StudentFormData = z.infer<typeof studentFormSchema>;

/**
 * Type for parent input
 */
export type ParentInput = z.infer<typeof parentInputSchema>;

/**
 * Default values for the form
 */
export const defaultStudentFormValues: StudentFormData = {
  firstName: "",
  lastName: "",
  gender: undefined,
  dob: undefined,
  category: undefined,
  isCwsn: false,
  photoUrl: null,
  admissionYear: new Date().getFullYear(),
  batchId: "",
  parents: [],
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
};
