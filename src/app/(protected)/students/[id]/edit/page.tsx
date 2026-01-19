"use client";

import { use, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Plus, Trash2, AlertCircle } from "lucide-react";
import { useStudent, useUpdateStudent } from "@/lib/api/students";
import { useBatches } from "@/lib/api/batches";
import {
  studentFormSchema,
  defaultParentValues,
  parentRelations,
  studentGenders,
  studentCategories,
  type StudentFormData,
} from "@/lib/validations/student";
import { FormField } from "@/components/forms";
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
  Skeleton,
  PhotoUpload,
  Label,
} from "@/components/ui";

/**
 * Edit Student Page
 *
 * Reuses form components from the new student page.
 * Pre-populates form with existing student data.
 */
export default function EditStudentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const {
    data: student,
    isLoading: isLoadingStudent,
    error: studentError,
  } = useStudent(id);
  const { data: batchesData } = useBatches({ limit: 100 });
  const batches = batchesData?.data ?? [];

  const {
    mutate: updateStudent,
    isPending,
    error: submitError,
  } = useUpdateStudent();

  const initialValues = useMemo(
    () =>
      ({
        firstName: student?.firstName || "",
        lastName: student?.lastName || "",
        gender: student?.gender || undefined,
        dob: student?.dob ? student?.dob.split("T")[0] : undefined,
        category: student?.category || undefined,
        isCwsn: student?.isCwsn || false,
        photoUrl: student?.photoUrl || null,
        admissionYear: student?.admissionYear || new Date().getFullYear(),
        batchId: student?.batchId || undefined,
        parents:
          student?.parents?.map((p) => ({
            firstName: p.firstName,
            lastName: p.lastName,
            phone: p.phone,
            relation: p.relation,
            photoUrl: p.photoUrl || null,
            isPrimaryContact: p.isPrimaryContact || false,
          })) || [],
      } satisfies StudentFormData),
    [student]
  );

  const {
    register,
    handleSubmit,
    control,
    reset,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<StudentFormData>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: initialValues,
  });

  // Dynamic parent fields
  const { fields, append, remove } = useFieldArray({
    control,
    name: "parents",
  });

  useEffect(() => {
    reset(initialValues);
  }, [initialValues, reset]);

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
    updateStudent(
      { id, data },
      {
        onSuccess: () => {
          router.push(`/students/${id}`);
        },
      }
    );
  };

  if (isLoadingStudent) {
    return <EditStudentSkeleton />;
  }

  if (studentError || !student) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/students">
              <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
              Back
            </Link>
          </Button>
        </div>

        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-3 py-8">
            <AlertCircle className="h-5 w-5 text-error" />
            <p className="text-sm text-error">
              {studentError ? "Failed to load student." : "Student not found."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/students/${id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-semibold text-text-primary">
            Edit Student
          </h1>
          <p className="text-sm text-text-muted">
            Update {student.fullName}&apos;s information
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
                : "Failed to update student. Please try again."}
            </p>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Student Information */}
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
                error={errors.gender?.message}
              >
                <Controller
                  name="gender"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value ?? ""}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger id="gender">
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
                      <SelectTrigger id="category">
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

        {/* Parent / Guardian Section */}
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

        {/* Form Actions */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" asChild>
            <Link href={`/students/${id}`}>Cancel</Link>
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : "Save Changes"}
          </Button>
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

/**
 * Skeleton loading state
 */
function EditStudentSkeleton() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-9 w-20" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}
