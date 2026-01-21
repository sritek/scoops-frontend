"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  ArrowLeft,
  User,
  GraduationCap,
  MessageCircle,
  BookOpen,
} from "lucide-react";
import {
  Card,
  CardContent,
  Skeleton,
  Avatar,
  Badge,
  Button,
} from "@/components/ui";
import {
  getChildTeachers,
  getChildDetails,
  type Teacher,
} from "@/lib/api/parent";

/**
 * Teacher card component
 */
function TeacherCard({
  teacher,
  showClassTeacherBadge = false,
}: {
  teacher: Teacher;
  showClassTeacherBadge?: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Avatar
            src={teacher.photoUrl ?? undefined}
            fallback={`${teacher.firstName.charAt(0)}${teacher.lastName.charAt(
              0
            )}`}
            alt={`${teacher.firstName} ${teacher.lastName}`}
            size="lg"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-medium text-text-primary">
                {teacher.firstName} {teacher.lastName}
              </h3>
              {showClassTeacherBadge && (
                <Badge variant="default" className="text-xs">
                  Class Teacher
                </Badge>
              )}
            </div>
            {teacher.subjects.length > 0 && (
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                <BookOpen className="h-3.5 w-3.5 text-text-muted" />
                <span className="text-sm text-text-muted">
                  {teacher.subjects.join(", ")}
                </span>
              </div>
            )}
          </div>
          <Link
            href={`/parent/messages?staffId=${
              teacher.id
            }&staffName=${encodeURIComponent(
              `${teacher.firstName} ${teacher.lastName}`
            )}`}
          >
            <Button
              variant="secondary"
              size="sm"
              className="flex items-center gap-1.5"
            >
              <MessageCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Message</span>
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Loading skeleton
 */
function TeachersPageSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-6 w-40" />
      </div>
      <Skeleton className="h-24" />
      <Skeleton className="h-6 w-32 mt-4" />
      <div className="space-y-3">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
    </div>
  );
}

/**
 * Child Teachers Page
 *
 * Shows class teacher and subject teachers for the child's batch
 */
export default function ChildTeachersPage() {
  const params = useParams();
  const studentId = params.id as string;

  // Fetch child details for the name
  const { data: child } = useQuery({
    queryKey: ["parent", "children", studentId],
    queryFn: () => getChildDetails(studentId),
    enabled: !!studentId,
  });

  // Fetch teachers
  const {
    data: teachersData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["parent", "children", studentId, "teachers"],
    queryFn: () => getChildTeachers(studentId),
    enabled: !!studentId,
  });

  if (isLoading) {
    return <TeachersPageSkeleton />;
  }

  if (error) {
    return (
      <div className="py-8 text-center">
        <p className="text-error mb-2">Failed to load teachers</p>
        <p className="text-sm text-text-muted">
          {error instanceof Error ? error.message : "Please try again later"}
        </p>
      </div>
    );
  }

  const hasTeachers =
    teachersData?.classTeacher ||
    (teachersData?.subjectTeachers?.length ?? 0) > 0;

  return (
    <div className="space-y-6 py-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href={`/parent/children/${studentId}`}
          className="p-1.5 rounded-lg hover:bg-bg-muted transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-text-muted" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Teachers</h1>
          {child && (
            <p className="text-sm text-text-muted">
              {child.firstName} {child.lastName}&apos;s teachers
            </p>
          )}
        </div>
      </div>

      {!hasTeachers ? (
        <Card>
          <CardContent className="py-12 text-center">
            <GraduationCap className="h-12 w-12 mx-auto text-text-muted mb-3" />
            <p className="text-text-muted">No teachers assigned yet</p>
            <p className="text-sm text-text-muted mt-1">
              Teachers will appear here once the batch schedule is set up
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Class Teacher */}
          {teachersData?.classTeacher && (
            <section>
              <h2 className="text-sm font-medium text-text-muted uppercase tracking-wide mb-3 flex items-center gap-2">
                <User className="h-4 w-4" />
                Class Teacher
              </h2>
              <TeacherCard
                teacher={teachersData.classTeacher}
                showClassTeacherBadge
              />
            </section>
          )}

          {/* Subject Teachers */}
          {teachersData?.subjectTeachers &&
            teachersData.subjectTeachers.length > 0 && (
              <section>
                <h2 className="text-sm font-medium text-text-muted uppercase tracking-wide mb-3 flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Subject Teachers
                </h2>
                <div className="space-y-3">
                  {teachersData.subjectTeachers.map((teacher) => (
                    <TeacherCard key={teacher.id} teacher={teacher} />
                  ))}
                </div>
              </section>
            )}
        </>
      )}
    </div>
  );
}
