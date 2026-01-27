"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  Plus,
  Trash2,
  AlertCircle,
  CreditCard,
  Award,
  X,
  User,
  Users,
  Heart,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useCreateStudent } from "@/lib/api/students";
import {
  studentFormSchema,
  defaultStudentFormValues,
  defaultParentValues,
  defaultHealthValues,
  parentRelations,
  studentGenders,
  studentCategories,
  type StudentFormData,
} from "@/lib/validations/student";
import { FormField } from "@/components/forms";
import { StudentHealthForm, StudentFormStepper } from "@/components/students";
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Checkbox,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  PhotoUpload,
  Label,
  Badge,
} from "@/components/ui";
import {
  useBatches,
  useBatchFeeStructureByBatch,
  useAllScholarships,
} from "@/lib/api";
import { useCurrentSession } from "@/lib/api/sessions";
import {
  formatScholarshipValue,
  getScholarshipBasisLabel,
} from "@/types/scholarship";
import type { Scholarship } from "@/types/scholarship";
import { toast } from "sonner";

/**
 * Add Student Page
 *
 * Single-column form with:
 * - Student information fields
 * - Dynamic parent/guardian section
 * - Inline validation
 * - Accessible labels and errors
 */
export default function AddStudentPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [applyBatchFees, setApplyBatchFees] = useState(false);
  const [selectedScholarships, setSelectedScholarships] = useState<
    Scholarship[]
  >([]);

  const { data: batchesData } = useBatches({ limit: 100 });
  const batches = batchesData?.data ?? [];
  const { data: currentSession } = useCurrentSession();
  const { data: allScholarships } = useAllScholarships();
  const {
    mutate: createStudent,
    isPending,
    error: submitError,
  } = useCreateStudent();

  const {
    register,
    handleSubmit,
    control,
    getValues,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = useForm<StudentFormData>({
    resolver: zodResolver(studentFormSchema),
    mode: "onTouched",
    reValidateMode: "onChange",
    defaultValues: {
      ...defaultStudentFormValues,
    },
  });

  // Step definitions
  const steps = [
    { id: 1, label: "Student Info", icon: <User className="h-4 w-4" /> },
    { id: 2, label: "Parents", icon: <Users className="h-4 w-4" /> },
    { id: 3, label: "Fees", icon: <CreditCard className="h-4 w-4" /> },
    { id: 4, label: "Health", icon: <Heart className="h-4 w-4" /> },
  ];

  // Get fields to validate for each step
  const getStepFields = (step: number): (keyof StudentFormData)[] => {
    switch (step) {
      case 1:
        return ["firstName", "lastName", "gender", "dob", "admissionYear"];
      case 2:
        return ["parents"];
      case 3:
        return []; // No validation needed
      case 4:
        return []; // No validation needed
      default:
        return [];
    }
  };

  // Validate current step
  const validateStep = async (step: number): Promise<boolean> => {
    const fields = getStepFields(step);
    if (fields.length === 0) return true; // No validation needed for optional steps

    const result = await trigger(fields);
    return result;
  };

  // Handle next step
  const handleNext = async (e?: React.MouseEvent<HTMLButtonElement>) => {
    // e?.preventDefault(); // Prevent any default behavior
    // e?.stopPropagation(); // Stop event bubbling

    const isValid = await validateStep(currentStep);

    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
    }
  };

  // Handle previous step
  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  // Watch batchId to check for fee structure availability
  const selectedBatchId = watch("batchId");

  // Fetch batch fee structure for the selected batch
  const { data: batchFeeStructure } = useBatchFeeStructureByBatch(
    selectedBatchId ?? null,
    currentSession?.id ?? null,
  );

  const hasBatchFeeStructure = !!batchFeeStructure;

  // Filter available scholarships (exclude already selected)
  const availableScholarships =
    allScholarships?.filter(
      (s) => s.isActive && !selectedScholarships.some((sel) => sel.id === s.id),
    ) ?? [];

  const handleAddScholarship = (scholarship: Scholarship) => {
    setSelectedScholarships((prev) => [...prev, scholarship]);
  };

  const handleRemoveScholarship = (scholarshipId: string) => {
    setSelectedScholarships((prev) =>
      prev.filter((s) => s.id !== scholarshipId),
    );
  };

  // Dynamic parent fields
  const { fields, append, remove } = useFieldArray({
    control,
    name: "parents",
  });

  // Handle setting primary contact (radio behavior - only one can be selected)
  const handleSetPrimaryContact = (selectedIndex: number) => {
    const currentParents = getValues("parents") || [];
    currentParents.forEach((_, idx) => {
      setValue(`parents.${idx}.isPrimaryContact`, idx === selectedIndex);
    });
  };

  // Add parent with auto-select first as primary contact
  const handleAddParent = () => {
    const currentParents = getValues("parents") || [];
    const isFirstParent = currentParents.length === 0;
    append({
      ...defaultParentValues,
      isPrimaryContact: isFirstParent, // Auto-select first parent as primary
    });
  };

  const onSubmit = (data: StudentFormData) => {
    // Prepare payload with all data for transactional creation
    const payload = {
      ...data,
      // Include health data if provided and has actual values
      health:
        data.health &&
        Object.values(data.health).some(
          (v) => v !== undefined && v !== null && v !== "",
        )
          ? data.health
          : undefined,
      // Include batch fee structure if selected
      batchFeeStructureId:
        applyBatchFees && batchFeeStructure ? batchFeeStructure.id : undefined,
      // Include scholarship IDs if any selected
      scholarshipIds:
        selectedScholarships.length > 0
          ? selectedScholarships.map((s) => s.id)
          : undefined,
      // Include session ID if fees or scholarships are provided
      sessionId:
        (applyBatchFees && batchFeeStructure) || selectedScholarships.length > 0
          ? currentSession?.id
          : undefined,
    };

    // Remove undefined values
    const cleanPayload = Object.fromEntries(
      Object.entries(payload).filter(([, v]) => v !== undefined),
    ) as unknown as Parameters<typeof createStudent>[0];

    console.log("cleanPayload", cleanPayload);

    createStudent(cleanPayload, {
      onSuccess: () => {
        toast.success("Student created successfully");
        router.push("/students");
      },
      onError: (error) => {
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to create student. Please try again.",
        );
      },
    });
  };

  console.log("watch()", watch());

  console.log("errors", errors);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/students">
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-semibold text-text-primary">
            Add Student
          </h1>
          <p className="text-sm text-text-muted">
            Add a new student to your branch
          </p>
        </div>
      </div>

      {/* Submit Error */}
      {submitError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertCircle className="h-5 w-5 text-error" />
            <p className="text-sm text-error">
              {submitError instanceof Error
                ? submitError.message
                : "Failed to add student. Please try again."}
            </p>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Step Indicator */}
        <Card>
          <CardContent className="pt-6">
            <StudentFormStepper currentStep={currentStep} steps={steps} />
          </CardContent>
        </Card>

        {/* Step 1: Student Information */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Student Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Photo */}
              <div className="flex flex-col items-center sm:items-start gap-2 pb-4 border-b border-border-subtle">
                <Label>Student Photo</Label>
                <Controller
                  name="photoUrl"
                  control={control}
                  render={({ field }) => (
                    <PhotoUpload
                      value={field.value}
                      onChange={field.onChange}
                      size="md"
                      label="Student photo"
                    />
                  )}
                />
              </div>

              {/* Name row */}
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  id="firstName"
                  label="First Name"
                  required
                  error={errors.firstName?.message}
                >
                  <Input
                    id="firstName"
                    placeholder="Enter first name"
                    {...register("firstName")}
                  />
                </FormField>

                <FormField
                  id="lastName"
                  label="Last Name"
                  required
                  error={errors.lastName?.message}
                >
                  <Input
                    id="lastName"
                    placeholder="Enter last name"
                    {...register("lastName")}
                  />
                </FormField>
              </div>

              {/* Gender and DOB */}
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  id="gender"
                  label="Gender"
                  required
                  error={errors.gender?.message}
                >
                  <Controller
                    name="gender"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value ?? ""}
                        onValueChange={(value) => {
                          field.onChange(value);
                          trigger("gender");
                        }}
                      >
                        <SelectTrigger id="gender" value="__select__">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          {studentGenders.map((gender) => (
                            <SelectItem key={gender} value={gender}>
                              {gender.charAt(0).toUpperCase() + gender.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </FormField>

                <FormField
                  id="dob"
                  label="Date of Birth"
                  required
                  error={errors.dob?.message}
                >
                  <Input id="dob" type="date" {...register("dob")} />
                </FormField>
              </div>

              {/* Category and Admission Year */}
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  id="category"
                  label="Category"
                  error={errors.category?.message}
                >
                  <Controller
                    name="category"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value ?? ""}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger id="category" value="__select__">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {studentCategories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category.toUpperCase()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </FormField>

                <FormField
                  id="admissionYear"
                  label="Admission Year"
                  required
                  error={errors.admissionYear?.message}
                >
                  <Input
                    id="admissionYear"
                    type="number"
                    placeholder="e.g., 2024"
                    {...register("admissionYear", { valueAsNumber: true })}
                  />
                </FormField>
              </div>

              {/* Batch Selection */}
              <FormField
                id="batchId"
                label="Batch"
                error={errors.batchId?.message}
              >
                <Controller
                  name="batchId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value ?? ""}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger id="batchId">
                        <SelectValue placeholder="Select batch" />
                      </SelectTrigger>
                      <SelectContent>
                        {batches.map((batch) => (
                          <SelectItem key={batch.id} value={batch.id}>
                            {batch.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormField>

              {/* CWSN checkbox */}
              <div className="flex items-center gap-3">
                <Controller
                  name="isCwsn"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="isCwsn"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
                <label
                  htmlFor="isCwsn"
                  className="text-sm font-medium text-text-primary cursor-pointer"
                >
                  Child With Special Needs (CWSN)
                </label>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Parent / Guardian */}
        {currentStep === 2 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Parent / Guardian</CardTitle>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleAddParent}
              >
                <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
                Add Parent
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {fields.length === 0 ? (
                <p className="text-sm text-text-muted text-center py-4">
                  No parents added yet. Click &quot;Add Parent&quot; to add
                  guardian details.
                </p>
              ) : (
                <>
                  {fields.map((field, index) => (
                    <ParentFieldGroup
                      key={field.id}
                      index={index}
                      register={register}
                      control={control}
                      errors={errors}
                      onRemove={() => remove(index)}
                      canRemove={fields.length > 0}
                      onSetPrimaryContact={handleSetPrimaryContact}
                    />
                  ))}
                  {/* Validation error for primary contact */}
                  {errors.parents?.message && (
                    <p className="text-sm text-error mt-2">
                      {errors.parents.message}
                    </p>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 3: Fees & Scholarships */}
        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-text-muted" />
                Fees & Scholarships
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-text-muted">
                Optionally apply fee structure and scholarships to the student.
                These can also be configured later from the student detail page.
              </p>

              {/* Apply Batch Fee Structure */}
              <div className="p-4 rounded-lg border border-border-subtle space-y-3">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="applyBatchFees"
                    checked={applyBatchFees}
                    onCheckedChange={(checked) =>
                      setApplyBatchFees(checked === true)
                    }
                    disabled={!selectedBatchId || !hasBatchFeeStructure}
                  />
                  <label
                    htmlFor="applyBatchFees"
                    className="text-sm font-medium text-text-primary cursor-pointer flex-1"
                  >
                    Apply batch fee structure
                  </label>
                  {hasBatchFeeStructure && (
                    <Badge variant="success">
                      ₹{batchFeeStructure.totalAmount.toLocaleString()}
                    </Badge>
                  )}
                </div>
                {!selectedBatchId ? (
                  <p className="text-sm text-text-muted">
                    Select a batch first to apply fee structure
                  </p>
                ) : !hasBatchFeeStructure ? (
                  <p className="text-sm text-warning">
                    No fee structure defined for this batch
                  </p>
                ) : (
                  <p className="text-sm text-text-muted">
                    Fee structure: {batchFeeStructure.name}
                  </p>
                )}
              </div>

              {/* Scholarships Selection */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-text-muted" />
                  Scholarships (Optional)
                </Label>

                {/* Selected Scholarships */}
                {selectedScholarships.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedScholarships.map((scholarship) => (
                      <Badge
                        key={scholarship.id}
                        variant="default"
                        className="flex items-center gap-1 pr-1"
                      >
                        {scholarship.name}
                        <span className="text-success ml-1">
                          ({formatScholarshipValue(scholarship)})
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            handleRemoveScholarship(scholarship.id)
                          }
                          className="ml-1 p-0.5 hover:bg-surface-hover rounded"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Add Scholarship Dropdown */}
                {availableScholarships.length > 0 && (
                  <Select
                    onValueChange={(id) => {
                      const scholarship = availableScholarships.find(
                        (s) => s.id === id,
                      );
                      if (scholarship) handleAddScholarship(scholarship);
                    }}
                    value=""
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Add a scholarship..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableScholarships.map((scholarship) => (
                        <SelectItem key={scholarship.id} value={scholarship.id}>
                          <div className="flex items-center justify-between gap-4">
                            <span>{scholarship.name}</span>
                            <span className="text-sm text-text-muted">
                              {getScholarshipBasisLabel(scholarship.basis)} -{" "}
                              {formatScholarshipValue(scholarship)}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {(!allScholarships || allScholarships.length === 0) && (
                  <p className="text-sm text-text-muted">
                    No scholarships available
                  </p>
                )}
              </div>

              <p className="text-xs text-text-muted">
                Note: Installments can be generated from the student&apos;s Fees
                tab after creation.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Health Information */}
        {currentStep === 4 && (
          <StudentHealthForm
            control={control}
            register={register}
            errors={errors}
          />
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between gap-3 pt-4 border-t border-border-subtle">
          <Button type="button" variant="secondary" asChild>
            <Link href="/students">Cancel</Link>
          </Button>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={handlePrevious}
              disabled={currentStep === 1}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>

            {currentStep < 4 ? (
              <Button key="next-button" type="button" onClick={handleNext}>
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button key="submit-button" type="submit" disabled={isPending}>
                {isPending ? "Adding..." : "Add Student"}
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}

/**
 * Parent field group component
 */
interface ParentFieldGroupProps {
  index: number;
  register: ReturnType<typeof useForm<StudentFormData>>["register"];
  control: ReturnType<typeof useForm<StudentFormData>>["control"];
  errors: ReturnType<typeof useForm<StudentFormData>>["formState"]["errors"];
  onRemove: () => void;
  canRemove: boolean;
  onSetPrimaryContact: (index: number) => void;
}

function ParentFieldGroup({
  index,
  register,
  control,
  errors,
  onRemove,
  canRemove,
  onSetPrimaryContact,
}: ParentFieldGroupProps) {
  const parentErrors = errors.parents?.[index];

  return (
    <div className="rounded-lg border border-border-subtle p-4 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-text-muted">
          Parent {index + 1}
        </span>
        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="text-error hover:text-error hover:bg-red-50"
          >
            <Trash2 className="mr-1 h-4 w-4" aria-hidden="true" />
            Remove
          </Button>
        )}
      </div>

      {/* Photo */}
      <div className="flex justify-center pb-2">
        <Controller
          name={`parents.${index}.photoUrl`}
          control={control}
          render={({ field }) => (
            <PhotoUpload
              value={field.value}
              onChange={field.onChange}
              size="sm"
              label={`Parent ${index + 1} photo`}
            />
          )}
        />
      </div>

      {/* Name row */}
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          id={`parents.${index}.firstName`}
          label="First Name"
          required
          error={parentErrors?.firstName?.message}
        >
          <Input
            id={`parents.${index}.firstName`}
            placeholder="Enter first name"
            {...register(`parents.${index}.firstName`)}
          />
        </FormField>

        <FormField
          id={`parents.${index}.lastName`}
          label="Last Name"
          required
          error={parentErrors?.lastName?.message}
        >
          <Input
            id={`parents.${index}.lastName`}
            placeholder="Enter last name"
            {...register(`parents.${index}.lastName`)}
          />
        </FormField>
      </div>

      {/* Phone and Relation */}
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          id={`parents.${index}.phone`}
          label="Phone"
          required
          error={parentErrors?.phone?.message}
        >
          <Input
            id={`parents.${index}.phone`}
            type="tel"
            placeholder="Enter phone number"
            {...register(`parents.${index}.phone`)}
          />
        </FormField>

        <FormField
          id={`parents.${index}.relation`}
          label="Relation"
          required
          error={parentErrors?.relation?.message}
        >
          <Controller
            name={`parents.${index}.relation`}
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id={`parents.${index}.relation`}>
                  <SelectValue placeholder="Select relation" />
                </SelectTrigger>
                <SelectContent>
                  {parentRelations.map((relation) => (
                    <SelectItem key={relation} value={relation}>
                      {relation.charAt(0).toUpperCase() + relation.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </FormField>
      </div>

      {/* Primary Contact */}
      <div className="flex items-center gap-2 pt-2 border-t border-border-subtle">
        <Controller
          name={`parents.${index}.isPrimaryContact`}
          control={control}
          render={({ field }) => (
            <Checkbox
              id={`parents.${index}.isPrimaryContact`}
              checked={field.value}
              onCheckedChange={(checked) => {
                if (checked) {
                  // Radio behavior: selecting this one deselects others
                  onSetPrimaryContact(index);
                }
                // Note: We don't allow unchecking directly - user must select another parent
                // This ensures exactly one primary contact is always selected
              }}
            />
          )}
        />
        <label
          htmlFor={`parents.${index}.isPrimaryContact`}
          className="text-sm text-text-primary cursor-pointer"
        >
          Primary contact for messages
        </label>
      </div>
    </div>
  );
}
