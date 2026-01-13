export {
  employeeIdSchema,
  passwordSchema,
  newPasswordSchema,
  loginFormSchema,
  changePasswordFormSchema,
  type LoginFormData,
  type ChangePasswordFormData,
} from "./auth";

export {
  parentRelations,
  studentGenders,
  studentCategories,
  parentInputSchema,
  studentFormSchema,
  defaultStudentFormValues,
  defaultParentValues,
  type ParentRelation,
  type StudentGender,
  type StudentCategory,
  type StudentFormData,
  type ParentInput,
} from "./student";

export {
  academicLevels,
  batchStreams,
  academicLevelLabels,
  streamLabels,
  batchFormSchema,
  defaultBatchFormValues,
  type AcademicLevel,
  type BatchStream,
  type BatchFormData,
} from "./batch";
