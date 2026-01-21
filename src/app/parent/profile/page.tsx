"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowLeft, User, Phone, Mail, Users } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
  Avatar,
  Badge,
} from "@/components/ui";
import { getParentProfile, getParentChildren, type ParentProfile } from "@/lib/api/parent";

/**
 * Loading skeleton
 */
function ProfileSkeleton() {
  return (
    <div className="space-y-4 py-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10" />
        <Skeleton className="h-7 w-32" />
      </div>
      <Skeleton className="h-48" />
      <Skeleton className="h-32" />
    </div>
  );
}

/**
 * Parent Profile Page
 *
 * Shows parent's profile information:
 * - Name, phone, email
 * - Linked children
 */
export default function ParentProfilePage() {
  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: ["parent", "profile"],
    queryFn: getParentProfile,
  });

  const { data: children, isLoading: loadingChildren } = useQuery({
    queryKey: ["parent", "children"],
    queryFn: getParentChildren,
  });

  const isLoading = loadingProfile || loadingChildren;

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  return (
    <div className="space-y-4 py-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/parent"
          className="p-2 hover:bg-bg-app rounded-sm transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex items-center gap-2">
          <User className="h-6 w-6 text-primary-600" />
          <h1 className="text-xl font-semibold text-text-primary">My Profile</h1>
        </div>
      </div>

      {/* Profile Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Avatar
              src={profile?.photoUrl ?? undefined}
              fallback={profile?.firstName?.charAt(0) || "P"}
              alt={`${profile?.firstName} ${profile?.lastName}`}
              size="xl"
            />
            <div>
              <h2 className="text-xl font-semibold text-text-primary">
                {profile?.firstName} {profile?.lastName}
              </h2>
              <p className="text-sm text-text-muted">Parent Account</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary-100">
              <Phone className="h-4 w-4 text-primary-600" />
            </div>
            <div>
              <p className="text-xs text-text-muted">Phone</p>
              <p className="font-medium">{profile?.phone || "—"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary-100">
              <Mail className="h-4 w-4 text-primary-600" />
            </div>
            <div>
              <p className="text-xs text-text-muted">Email</p>
              <p className="font-medium">{profile?.email || "Not provided"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Linked Children */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            Linked Children ({children?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {children && children.length > 0 ? (
            <div className="space-y-3">
              {children.map((child) => (
                <Link
                  key={child.id}
                  href={`/parent/children/${child.id}`}
                  className="flex items-center gap-3 p-3 rounded-sm hover:bg-bg-app transition-colors"
                >
                  <Avatar
                    src={child.photoUrl ?? undefined}
                    fallback={child.firstName.charAt(0)}
                    alt={`${child.firstName} ${child.lastName}`}
                    size="md"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-text-primary">
                      {child.firstName} {child.lastName}
                    </p>
                    <p className="text-sm text-text-muted">
                      {child.batchName || "No batch assigned"}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge
                      variant={
                        child.enrollmentStatus === "active"
                          ? "success"
                          : "secondary"
                      }
                      className="text-xs"
                    >
                      {child.enrollmentStatus}
                    </Badge>
                    <span className="text-xs text-text-muted capitalize">
                      {child.relation}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-center py-4 text-text-muted">
              No children linked to your account
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
