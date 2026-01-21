"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Skeleton,
  Button,
  Input,
  Label,
} from "@/components/ui";
import {
  Heart,
  Eye,
  Ear,
  Activity,
  Pill,
  Shield,
  AlertTriangle,
  Stethoscope,
  Plus,
  Calendar,
} from "lucide-react";
import { useStudentHealth, useHealthCheckups, useUpdateStudentHealth } from "@/lib/api";
import { usePermissions } from "@/lib/hooks";
import {
  getBloodGroupLabel,
  getVisionStatusLabel,
  getHearingStatusLabel,
  calculateBMI,
  getBMICategory,
} from "@/types/health";

interface StudentHealthTabProps {
  studentId: string;
}

/**
 * Student Health Tab Component
 *
 * Displays:
 * - Health profile
 * - Vision/Hearing status
 * - Medical history
 * - Checkup history
 */
export function StudentHealthTab({ studentId }: StudentHealthTabProps) {
  const { data: healthData, isLoading: healthLoading } = useStudentHealth(studentId);
  const { data: checkupsData, isLoading: checkupsLoading } = useHealthCheckups(studentId);
  const { mutate: updateHealth, isPending: isUpdating } = useUpdateStudentHealth();
  const { can } = usePermissions();
  const [isEditing, setIsEditing] = useState(false);

  const canEdit = can("STUDENT_EDIT");
  const isLoading = healthLoading || checkupsLoading;

  if (isLoading) {
    return <HealthTabSkeleton />;
  }

  const health = healthData?.health;
  const checkups = checkupsData?.checkups || [];
  const bmi = health ? calculateBMI(health.heightCm, health.weightKg) : null;

  return (
    <div className="space-y-6">
      {/* Vitals Summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <VitalCard
          label="Blood Group"
          value={getBloodGroupLabel(health?.bloodGroup || null)}
          icon={<Activity className="h-4 w-4" />}
          highlight={!!health?.bloodGroup}
        />
        <VitalCard
          label="Height"
          value={health?.heightCm ? `${health.heightCm} cm` : "Not recorded"}
          icon={<Activity className="h-4 w-4" />}
        />
        <VitalCard
          label="Weight"
          value={health?.weightKg ? `${health.weightKg} kg` : "Not recorded"}
          icon={<Activity className="h-4 w-4" />}
        />
        <VitalCard
          label="BMI"
          value={bmi ? `${bmi} (${getBMICategory(bmi)})` : "N/A"}
          icon={<Activity className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Vision & Hearing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Eye className="h-5 w-5 text-text-muted" />
              Vision & Hearing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <InfoItem
                label="Vision (Left)"
                value={getVisionStatusLabel(health?.visionLeft || null)}
              />
              <InfoItem
                label="Vision (Right)"
                value={getVisionStatusLabel(health?.visionRight || null)}
              />
            </div>
            <InfoItem
              label="Uses Glasses"
              value={health?.usesGlasses ? "Yes" : "No"}
            />
            <InfoItem
              label="Hearing Status"
              value={getHearingStatusLabel(health?.hearingStatus || null)}
            />
            <InfoItem
              label="Uses Hearing Aid"
              value={health?.usesHearingAid ? "Yes" : "No"}
            />
          </CardContent>
        </Card>

        {/* Medical Conditions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="h-5 w-5 text-text-muted" />
              Medical Conditions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoItem
              label="Allergies"
              value={health?.allergies || "None reported"}
              multiline
            />
            <InfoItem
              label="Chronic Conditions"
              value={health?.chronicConditions || "None reported"}
              multiline
            />
            <InfoItem
              label="Current Medications"
              value={health?.currentMedications || "None"}
              multiline
            />
            <InfoItem
              label="Dietary Restrictions"
              value={health?.dietaryRestrictions || "None"}
              multiline
            />
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
            <InfoItem
              label="Family Doctor"
              value={health?.familyDoctorName || "Not specified"}
            />
            <InfoItem
              label="Doctor Phone"
              value={health?.familyDoctorPhone || "Not specified"}
            />
            <InfoItem
              label="Preferred Hospital"
              value={health?.preferredHospital || "Not specified"}
            />
            <InfoItem
              label="Emergency Notes"
              value={health?.emergencyMedicalNotes || "None"}
              multiline
            />
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
            <InfoItem
              label="Has Insurance"
              value={health?.hasInsurance ? "Yes" : "No"}
            />
            {health?.hasInsurance && (
              <>
                <InfoItem
                  label="Provider"
                  value={health.insuranceProvider || "Not specified"}
                />
                <InfoItem
                  label="Policy Number"
                  value={health.insurancePolicyNo || "Not specified"}
                />
                <InfoItem
                  label="Expiry Date"
                  value={
                    health.insuranceExpiry
                      ? formatDate(health.insuranceExpiry)
                      : "Not specified"
                  }
                />
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Checkup History */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Stethoscope className="h-5 w-5 text-text-muted" />
            Checkup History
          </CardTitle>
          {canEdit && (
            <Button variant="secondary" size="sm" disabled>
              <Plus className="mr-2 h-4 w-4" />
              Add Checkup
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {checkups.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface-elevated">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-text-muted">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-text-muted">
                      Height / Weight
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-text-muted">
                      BMI
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-text-muted">
                      BP / Pulse
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-text-muted">
                      Conducted By
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {checkups.map((checkup) => (
                    <tr key={checkup.id} className="hover:bg-surface-hover">
                      <td className="px-4 py-3">
                        {formatDate(checkup.checkupDate)}
                      </td>
                      <td className="px-4 py-3">
                        {checkup.heightCm && checkup.weightKg
                          ? `${checkup.heightCm} cm / ${checkup.weightKg} kg`
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {checkup.bmi ? (
                          <Badge
                            variant={
                              checkup.bmi < 18.5 || checkup.bmi >= 25
                                ? "warning"
                                : "success"
                            }
                          >
                            {checkup.bmi}
                          </Badge>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {checkup.bloodPressure || checkup.pulse
                          ? `${checkup.bloodPressure || "—"} / ${checkup.pulse || "—"} bpm`
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {checkup.conductedBy || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-text-muted">
              <Stethoscope className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p>No checkup records available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Last Checkup Info */}
      {health?.lastCheckupDate && (
        <div className="flex items-center justify-between p-4 rounded-lg bg-surface-elevated border border-border-subtle">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-text-muted" />
            <div>
              <p className="text-sm text-text-muted">Last Checkup</p>
              <p className="font-medium">{formatDate(health.lastCheckupDate)}</p>
            </div>
          </div>
          {health.nextCheckupDue && (
            <div className="text-right">
              <p className="text-sm text-text-muted">Next Due</p>
              <p className="font-medium">{formatDate(health.nextCheckupDue)}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function VitalCard({
  label,
  value,
  icon,
  highlight,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <Card className={highlight ? "border-primary-500" : ""}>
      <CardContent className="pt-4">
        <div className="flex items-center gap-2 text-text-muted text-sm mb-1">
          {icon}
          <span>{label}</span>
        </div>
        <p className="text-xl font-semibold text-text-primary">{value}</p>
      </CardContent>
    </Card>
  );
}

function InfoItem({
  label,
  value,
  multiline,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <div className={multiline ? "" : "flex justify-between items-center"}>
      <span className="text-text-muted text-sm">{label}</span>
      <span
        className={`font-medium text-text-primary ${
          multiline ? "block mt-1" : ""
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function HealthTabSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="pt-4">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-6 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent className="space-y-3">
              {[1, 2, 3].map((j) => (
                <Skeleton key={j} className="h-6 w-full" />
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
