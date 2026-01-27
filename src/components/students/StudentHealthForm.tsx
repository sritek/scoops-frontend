"use client";

import {
  Controller,
  Control,
  UseFormRegister,
  FieldErrors,
} from "react-hook-form";
import type { StudentFormData } from "@/lib/validations/student";
import { FormField } from "@/components/forms";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Input,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Checkbox,
  Textarea,
  Label,
} from "@/components/ui";
import {
  Activity,
  AlertTriangle,
  Eye,
  Ear,
  Shield,
  Calendar,
  UtensilsCrossed,
} from "lucide-react";
import type { BloodGroup, VisionStatus, HearingStatus } from "@/types/health";

interface StudentHealthFormProps {
  control: Control<StudentFormData>;
  register: UseFormRegister<StudentFormData>;
  errors: FieldErrors<StudentFormData>;
}

/**
 * Blood group options
 */
const bloodGroups: BloodGroup[] = [
  "A_positive",
  "A_negative",
  "B_positive",
  "B_negative",
  "AB_positive",
  "AB_negative",
  "O_positive",
  "O_negative",
  "unknown",
];

/**
 * Vision status options
 */
const visionStatuses: VisionStatus[] = [
  "normal",
  "corrected_with_glasses",
  "corrected_with_lenses",
  "impaired",
];

/**
 * Hearing status options
 */
const hearingStatuses: HearingStatus[] = [
  "normal",
  "mild_impairment",
  "moderate_impairment",
  "severe_impairment",
];

/**
 * Get human-readable blood group label
 */
function getBloodGroupLabel(group: BloodGroup): string {
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
  return labels[group];
}

/**
 * Get human-readable vision status label
 */
function getVisionStatusLabel(status: VisionStatus): string {
  const labels: Record<VisionStatus, string> = {
    normal: "Normal",
    corrected_with_glasses: "Corrected (Glasses)",
    corrected_with_lenses: "Corrected (Lenses)",
    impaired: "Impaired",
  };
  return labels[status];
}

/**
 * Get human-readable hearing status label
 */
function getHearingStatusLabel(status: HearingStatus): string {
  const labels: Record<HearingStatus, string> = {
    normal: "Normal",
    mild_impairment: "Mild Impairment",
    moderate_impairment: "Moderate Impairment",
    severe_impairment: "Severe Impairment",
  };
  return labels[status];
}

/**
 * Student Health Form Component
 *
 * Comprehensive health data form with all fields organized in sections.
 * Used in both create and edit student flows.
 */
export function StudentHealthForm({
  control,
  register,
  errors,
}: StudentHealthFormProps) {
  const healthErrors = errors.health;

  return (
    <div className="space-y-6">
      {/* Basic Vitals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="h-5 w-5 text-text-muted" />
            Basic Vitals
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <FormField
              id="health.bloodGroup"
              label="Blood Group"
              error={healthErrors?.bloodGroup?.message}
            >
              <Controller
                name="health.bloodGroup"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value ?? "__none__"}
                    onValueChange={(value) =>
                      field.onChange(value === "__none__" ? null : value)
                    }
                  >
                    <SelectTrigger id="health.bloodGroup">
                      <SelectValue placeholder="Select blood group" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Not specified</SelectItem>
                      {bloodGroups.map((group) => (
                        <SelectItem key={group} value={group}>
                          {getBloodGroupLabel(group)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>

            <FormField
              id="health.heightCm"
              label="Height (cm)"
              error={healthErrors?.heightCm?.message}
            >
              <Input
                id="health.heightCm"
                type="number"
                placeholder="e.g., 150"
                {...register("health.heightCm", {
                  setValueAs: (v) =>
                    !v || isNaN(Number(v)) ? null : Number(v),
                })}
              />
            </FormField>

            <FormField
              id="health.weightKg"
              label="Weight (kg)"
              error={healthErrors?.weightKg?.message}
            >
              <Input
                id="health.weightKg"
                type="number"
                placeholder="e.g., 45"
                {...register("health.weightKg", {
                  setValueAs: (v) =>
                    !v || isNaN(Number(v)) ? null : Number(v),
                })}
              />
            </FormField>
          </div>
        </CardContent>
      </Card>

      {/* Medical History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="h-5 w-5 text-text-muted" />
            Medical History
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            id="health.allergies"
            label="Allergies"
            error={healthErrors?.allergies?.message}
          >
            <Textarea
              id="health.allergies"
              placeholder="List any known allergies..."
              rows={3}
              {...register("health.allergies")}
            />
          </FormField>

          <FormField
            id="health.chronicConditions"
            label="Chronic Conditions"
            error={healthErrors?.chronicConditions?.message}
          >
            <Textarea
              id="health.chronicConditions"
              placeholder="List any chronic medical conditions..."
              rows={3}
              {...register("health.chronicConditions")}
            />
          </FormField>

          <FormField
            id="health.currentMedications"
            label="Current Medications"
            error={healthErrors?.currentMedications?.message}
          >
            <Textarea
              id="health.currentMedications"
              placeholder="List current medications..."
              rows={3}
              {...register("health.currentMedications")}
            />
          </FormField>

          <FormField
            id="health.pastSurgeries"
            label="Past Surgeries"
            error={healthErrors?.pastSurgeries?.message}
          >
            <Textarea
              id="health.pastSurgeries"
              placeholder="List any past surgeries..."
              rows={3}
              {...register("health.pastSurgeries")}
            />
          </FormField>
        </CardContent>
      </Card>

      {/* Vision & Hearing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Eye className="h-5 w-5 text-text-muted" />
            Vision & Hearing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              id="health.visionLeft"
              label="Vision (Left Eye)"
              error={healthErrors?.visionLeft?.message}
            >
              <Controller
                name="health.visionLeft"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value ?? "__none__"}
                    onValueChange={(value) =>
                      field.onChange(value === "__none__" ? null : value)
                    }
                  >
                    <SelectTrigger id="health.visionLeft">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Not assessed</SelectItem>
                      {visionStatuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {getVisionStatusLabel(status)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>

            <FormField
              id="health.visionRight"
              label="Vision (Right Eye)"
              error={healthErrors?.visionRight?.message}
            >
              <Controller
                name="health.visionRight"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value ?? "__none__"}
                    onValueChange={(value) =>
                      field.onChange(value === "__none__" ? null : value)
                    }
                  >
                    <SelectTrigger id="health.visionRight">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Not assessed</SelectItem>
                      {visionStatuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {getVisionStatusLabel(status)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>
          </div>

          <div className="flex items-center gap-3">
            <Controller
              name="health.usesGlasses"
              control={control}
              render={({ field }) => (
                <Checkbox
                  id="health.usesGlasses"
                  checked={field.value ?? false}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <Label htmlFor="health.usesGlasses" className="cursor-pointer">
              Uses glasses
            </Label>
          </div>

          <FormField
            id="health.hearingStatus"
            label="Hearing Status"
            error={healthErrors?.hearingStatus?.message}
          >
            <Controller
              name="health.hearingStatus"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value ?? "__none__"}
                  onValueChange={(value) =>
                    field.onChange(value === "__none__" ? null : value)
                  }
                >
                  <SelectTrigger id="health.hearingStatus">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Not assessed</SelectItem>
                    {hearingStatuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {getHearingStatusLabel(status)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>

          <div className="flex items-center gap-3">
            <Controller
              name="health.usesHearingAid"
              control={control}
              render={({ field }) => (
                <Checkbox
                  id="health.usesHearingAid"
                  checked={field.value ?? false}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <Label htmlFor="health.usesHearingAid" className="cursor-pointer">
              Uses hearing aid
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Physical */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Physical</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            id="health.physicalDisability"
            label="Physical Disability"
            error={healthErrors?.physicalDisability?.message}
          >
            <Textarea
              id="health.physicalDisability"
              placeholder="Describe any physical disabilities..."
              rows={3}
              {...register("health.physicalDisability")}
            />
          </FormField>

          <FormField
            id="health.mobilityAid"
            label="Mobility Aid"
            error={healthErrors?.mobilityAid?.message}
          >
            <Input
              id="health.mobilityAid"
              placeholder="e.g., Wheelchair, Crutches"
              {...register("health.mobilityAid")}
            />
          </FormField>
        </CardContent>
      </Card>

      {/* Emergency Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5 text-text-muted" />
            Emergency Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              id="health.familyDoctorName"
              label="Family Doctor Name"
              error={healthErrors?.familyDoctorName?.message}
            >
              <Input
                id="health.familyDoctorName"
                placeholder="Doctor name"
                {...register("health.familyDoctorName")}
              />
            </FormField>

            <FormField
              id="health.familyDoctorPhone"
              label="Doctor Phone"
              error={healthErrors?.familyDoctorPhone?.message}
            >
              <Input
                id="health.familyDoctorPhone"
                type="tel"
                placeholder="Phone number"
                {...register("health.familyDoctorPhone")}
              />
            </FormField>
          </div>

          <FormField
            id="health.preferredHospital"
            label="Preferred Hospital"
            error={healthErrors?.preferredHospital?.message}
          >
            <Input
              id="health.preferredHospital"
              placeholder="Hospital name"
              {...register("health.preferredHospital")}
            />
          </FormField>

          <FormField
            id="health.emergencyMedicalNotes"
            label="Emergency Medical Notes"
            error={healthErrors?.emergencyMedicalNotes?.message}
          >
            <Textarea
              id="health.emergencyMedicalNotes"
              placeholder="Important medical information for emergencies..."
              rows={4}
              {...register("health.emergencyMedicalNotes")}
            />
          </FormField>
        </CardContent>
      </Card>

      {/* Insurance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5 text-text-muted" />
            Insurance Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Controller
              name="health.hasInsurance"
              control={control}
              render={({ field }) => (
                <Checkbox
                  id="health.hasInsurance"
                  checked={field.value ?? false}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <Label htmlFor="health.hasInsurance" className="cursor-pointer">
              Has insurance
            </Label>
          </div>

          <Controller
            name="health.hasInsurance"
            control={control}
            render={({ field: { value } }) =>
              value ? (
                <div className="space-y-4 pl-7">
                  <FormField
                    id="health.insuranceProvider"
                    label="Insurance Provider"
                    error={healthErrors?.insuranceProvider?.message}
                  >
                    <Input
                      id="health.insuranceProvider"
                      placeholder="Provider name"
                      {...register("health.insuranceProvider")}
                    />
                  </FormField>

                  <FormField
                    id="health.insurancePolicyNo"
                    label="Policy Number"
                    error={healthErrors?.insurancePolicyNo?.message}
                  >
                    <Input
                      id="health.insurancePolicyNo"
                      placeholder="Policy number"
                      {...register("health.insurancePolicyNo")}
                    />
                  </FormField>

                  <FormField
                    id="health.insuranceExpiry"
                    label="Expiry Date"
                    error={healthErrors?.insuranceExpiry?.message}
                  >
                    <Input
                      id="health.insuranceExpiry"
                      type="date"
                      {...register("health.insuranceExpiry")}
                    />
                  </FormField>
                </div>
              ) : (
                <div className="space-y-4 pl-7">
                  <p>No insurance details provided</p>
                </div>
              )
            }
          />
        </CardContent>
      </Card>

      {/* Dietary & Checkups */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <UtensilsCrossed className="h-5 w-5 text-text-muted" />
            Dietary & Checkups
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            id="health.dietaryRestrictions"
            label="Dietary Restrictions"
            error={healthErrors?.dietaryRestrictions?.message}
          >
            <Textarea
              id="health.dietaryRestrictions"
              placeholder="List any dietary restrictions or special requirements..."
              rows={3}
              {...register("health.dietaryRestrictions")}
            />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              id="health.lastCheckupDate"
              label="Last Checkup Date"
              error={healthErrors?.lastCheckupDate?.message}
            >
              <Input
                id="health.lastCheckupDate"
                type="date"
                {...register("health.lastCheckupDate")}
              />
            </FormField>

            <FormField
              id="health.nextCheckupDue"
              label="Next Checkup Due"
              error={healthErrors?.nextCheckupDue?.message}
            >
              <Input
                id="health.nextCheckupDue"
                type="date"
                {...register("health.nextCheckupDue")}
              />
            </FormField>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
