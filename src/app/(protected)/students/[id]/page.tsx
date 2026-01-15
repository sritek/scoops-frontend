"use client";

import { use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Edit,
  Phone,
  Calendar,
  User,
  GraduationCap,
  AlertCircle,
} from "lucide-react";
import { useStudent } from "@/lib/api/students";
import { usePermissions } from "@/lib/hooks";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Skeleton,
  Avatar,
} from "@/components/ui";

/**
 * Student Detail Page
 *
 * Displays comprehensive student information including:
 * - Personal details
 * - Parent/guardian contacts
 * - Batch assignment
 * - Status
 */
export default function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: student, isLoading, error } = useStudent(id);
  const { can } = usePermissions();

  const canEditStudent = can("STUDENT_EDIT");

  if (isLoading) {
    return <StudentDetailSkeleton />;
  }

  if (error || !student) {
    return (
      <div className="space-y-6">
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
              {error ? "Failed to load student details." : "Student not found."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/students">
              <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
              Back
            </Link>
          </Button>
          <Avatar
            src={student.photoUrl}
            fallback={student.firstName?.charAt(0)}
            alt={student.fullName}
            size="xl"
          />
          <div>
            <h1 className="text-xl font-semibold text-text-primary">
              {student.fullName}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={student.status === "active" ? "success" : "default"}>
                {student.status}
              </Badge>
              {student.batchName && (
                <Badge variant="info">{student.batchName}</Badge>
              )}
            </div>
          </div>
        </div>

        {canEditStudent && (
          <Button asChild>
            <Link href={`/students/${id}/edit`}>
              <Edit className="mr-2 h-4 w-4" aria-hidden="true" />
              Edit Student
            </Link>
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5 text-text-muted" aria-hidden="true" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoRow label="Full Name" value={student.fullName} />
            <InfoRow
              label="Gender"
              value={student.gender ? capitalize(student.gender) : "—"}
            />
            <InfoRow
              label="Date of Birth"
              value={student.dob ? formatDate(student.dob) : "—"}
            />
            <InfoRow
              label="Category"
              value={student.category ? student.category.toUpperCase() : "—"}
            />
            <InfoRow
              label="CWSN"
              value={student.isCwsn ? "Yes" : "No"}
            />
          </CardContent>
        </Card>

        {/* Academic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <GraduationCap className="h-5 w-5 text-text-muted" aria-hidden="true" />
              Academic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoRow label="Admission Year" value={String(student.admissionYear)} />
            <InfoRow label="Batch" value={student.batchName || "Not assigned"} />
            <InfoRow
              label="Enrolled On"
              value={formatDate(student.createdAt)}
            />
            <InfoRow
              label="Last Updated"
              value={formatDate(student.updatedAt)}
            />
          </CardContent>
        </Card>

        {/* Parent/Guardian Information */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Phone className="h-5 w-5 text-text-muted" aria-hidden="true" />
              Parent / Guardian
            </CardTitle>
          </CardHeader>
          <CardContent>
            {student.parents && student.parents.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {student.parents.map((parent) => (
                  <div
                    key={parent.id}
                    className="rounded-lg border border-border-subtle p-4"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar
                        src={parent.photoUrl}
                        fallback={parent.firstName?.charAt(0)}
                        alt={parent.fullName}
                        size="md"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{parent.fullName}</p>
                        <Badge variant="default" className="capitalize text-xs mt-0.5">
                          {parent.relation}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-text-muted">
                      <Phone className="h-4 w-4" aria-hidden="true" />
                      <a
                        href={`tel:${parent.phone}`}
                        className="hover:text-primary-600"
                      >
                        {parent.phone}
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-text-muted text-center py-4">
                No parent/guardian information available
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/**
 * Info row component for displaying label-value pairs
 */
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-1">
      <span className="text-text-muted">{label}</span>
      <span className="font-medium text-text-primary">{value}</span>
    </div>
  );
}

/**
 * Skeleton loading state
 */
function StudentDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-9 w-20" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-5 w-32" />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/**
 * Capitalize first letter
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Format date string
 */
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
