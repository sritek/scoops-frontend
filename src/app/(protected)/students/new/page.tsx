"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Plus, Trash2, AlertCircle } from "lucide-react";
import { useCreateStudent } from "@/lib/api/students";
import {
  studentFormSchema,
  defaultStudentFormValues,
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
} from "@/components/ui";

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
  const { mutate: createStudent, isPending, error: submitError } = useCreateStudent();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<StudentFormData>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: defaultStudentFormValues,
  });

  // Dynamic parent fields
  const { fields, append, remove } = useFieldArray({
    control,
    name: "parents",
  });

  const onSubmit = (data: StudentFormData) => {
    createStudent(data, {
      onSuccess: () => {
        router.push("/students");
      },
    });
  };

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
        {/* Student Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Student Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
                      value={field.value}
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
                <Input
                  id="dob"
                  type="date"
                  {...register("dob")}
                />
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
                      value={field.value}
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
              onClick={() => append(defaultParentValues)}
            >
              <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
              Add Parent
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.length === 0 ? (
              <p className="text-sm text-text-muted text-center py-4">
                No parents added yet. Click &quot;Add Parent&quot; to add guardian details.
              </p>
            ) : (
              fields.map((field, index) => (
                <ParentFieldGroup
                  key={field.id}
                  index={index}
                  register={register}
                  control={control}
                  errors={errors}
                  onRemove={() => remove(index)}
                  canRemove={fields.length > 0}
                />
              ))
            )}
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" asChild>
            <Link href="/students">Cancel</Link>
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Adding..." : "Add Student"}
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
}

function ParentFieldGroup({
  index,
  register,
  control,
  errors,
  onRemove,
  canRemove,
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
              <Select
                value={field.value}
                onValueChange={field.onChange}
              >
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
    </div>
  );
}
