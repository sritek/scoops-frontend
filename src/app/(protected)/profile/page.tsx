"use client";

import { useState } from "react";
import Link from "next/link";
import {
  User,
  Phone,
  Mail,
  Building,
  Calendar,
  Key,
  Shield,
  MapPin,
  Save,
  AlertCircle,
  Check,
} from "lucide-react";
import { useProfile, useUpdateProfile } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  Button,
  Input,
  Label,
  Badge,
  PhotoUpload,
  Skeleton,
} from "@/components/ui";
import { cn } from "@/lib/utils";

/**
 * User Profile Page
 *
 * Displays and allows editing of the logged-in user's profile:
 * - Personal information (name, phone, email)
 * - Profile photo
 * - Role and branch information (read-only)
 * - Quick link to change password
 */
export default function ProfilePage() {
  const { data: profile, isLoading, error } = useProfile();
  const updateProfile = useUpdateProfile();
  const { refreshUser } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    photoUrl: null as string | null,
  });
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Initialize form data when profile loads
  const handleEdit = () => {
    if (profile) {
      setFormData({
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        phone: profile.phone || "",
        email: profile.email || "",
        photoUrl: profile.photoUrl || null,
      });
    }
    setIsEditing(true);
    setSuccessMessage(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setSuccessMessage(null);
  };

  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync({
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        email: formData.email || null,
        photoUrl: formData.photoUrl,
      });
      // Refresh user data in auth context to update header avatar
      await refreshUser();
      setIsEditing(false);
      setSuccessMessage("Profile updated successfully!");
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Failed to update profile:", err);
    }
  };

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  if (error || !profile) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-text-primary">My Profile</h1>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-3 py-8">
            <AlertCircle className="h-5 w-5 text-error" />
            <p className="text-sm text-error">
              Failed to load profile. Please try again later.
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
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">
            My Profile
          </h1>
          <p className="text-sm text-text-muted">
            Manage your personal information and preferences
          </p>
        </div>
        {!isEditing && (
          <Button onClick={handleEdit}>
            <User className="mr-2 h-4 w-4" aria-hidden="true" />
            Edit Profile
          </Button>
        )}
      </div>

      {/* Success message */}
      {successMessage && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700">
          <Check className="h-4 w-4" />
          <span className="text-sm">{successMessage}</span>
        </div>
      )}

      {/* Error message */}
      {updateProfile.error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-error">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">
            {updateProfile.error instanceof Error
              ? updateProfile.error.message
              : "Failed to update profile"}
          </span>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Photo Card */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Profile Photo</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            {isEditing ? (
              <PhotoUpload
                value={formData.photoUrl}
                onChange={(value) =>
                  setFormData({ ...formData, photoUrl: value })
                }
                size="lg"
                label="Profile photo"
              />
            ) : (
              <div
                className={cn(
                  "h-32 w-32 rounded-full overflow-hidden",
                  "bg-primary-100 flex items-center justify-center"
                )}
              >
                {profile.photoUrl ? (
                  <img
                    src={profile.photoUrl}
                    alt={profile.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User className="h-12 w-12 text-primary-600" />
                )}
              </div>
            )}
            <div className="text-center">
              <p className="font-medium text-text-primary">{profile.name}</p>
              <Badge variant="info" className="mt-1 capitalize">
                {profile.role}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Personal Information Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5 text-text-muted" aria-hidden="true" />
              Personal Information
            </CardTitle>
            <CardDescription>
              {isEditing
                ? "Update your personal details"
                : "Your personal details as registered in the system"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) =>
                        setFormData({ ...formData, firstName: e.target.value })
                      }
                      placeholder="Enter first name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) =>
                        setFormData({ ...formData, lastName: e.target.value })
                      }
                      placeholder="Enter last name"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="Enter phone number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email (Optional)</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="Enter email address"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleSave}
                    disabled={updateProfile.isPending}
                  >
                    <Save className="mr-2 h-4 w-4" aria-hidden="true" />
                    {updateProfile.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={handleCancel}
                    disabled={updateProfile.isPending}
                  >
                    Cancel
                  </Button>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <InfoRow
                  icon={<User className="h-4 w-4" />}
                  label="Full Name"
                  value={profile.name}
                />
                <InfoRow
                  icon={<Phone className="h-4 w-4" />}
                  label="Phone"
                  value={profile.phone || "—"}
                />
                <InfoRow
                  icon={<Mail className="h-4 w-4" />}
                  label="Email"
                  value={profile.email || "—"}
                />
                <InfoRow
                  icon={<Calendar className="h-4 w-4" />}
                  label="Member Since"
                  value={
                    profile.createdAt
                      ? new Date(profile.createdAt).toLocaleDateString(
                          "en-IN",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )
                      : "—"
                  }
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Organization Info Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building
                className="h-5 w-5 text-text-muted"
                aria-hidden="true"
              />
              Organization Details
            </CardTitle>
            <CardDescription>Your role and branch assignment</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoRow
              icon={<Building className="h-4 w-4" />}
              label="Organization"
              value={profile.organizationName || "—"}
            />
            <InfoRow
              icon={<MapPin className="h-4 w-4" />}
              label="Branch"
              value={profile.branchName || "—"}
            />
            <InfoRow
              icon={<Shield className="h-4 w-4" />}
              label="Role"
              value={
                <Badge variant="info" className="capitalize">
                  {profile.role}
                </Badge>
              }
            />
            {profile.employeeId && (
              <InfoRow
                icon={<User className="h-4 w-4" />}
                label="Employee ID"
                value={
                  <code className="bg-bg-app px-2 py-0.5 rounded text-sm">
                    {profile.employeeId}
                  </code>
                }
              />
            )}
          </CardContent>
        </Card>

        {/* Security Card */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Key className="h-5 w-5 text-text-muted" aria-hidden="true" />
              Security
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-text-muted mb-4">
              Manage your account security settings
            </p>
            <Button variant="secondary" asChild className="w-full">
              <Link href="/change-password">
                <Key className="mr-2 h-4 w-4" aria-hidden="true" />
                Change Password
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/**
 * Info row component for displaying label-value pairs with icons
 */
function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="text-text-muted">{icon}</div>
      <div className="flex-1">
        <p className="text-xs text-text-muted">{label}</p>
        <p className="text-sm font-medium text-text-primary">{value}</p>
      </div>
    </div>
  );
}

/**
 * Skeleton loading state
 */
function ProfileSkeleton() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64 mt-2" />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <Skeleton className="h-32 w-32 rounded-full" />
            <Skeleton className="h-4 w-24" />
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3 py-2">
                <Skeleton className="h-4 w-4" />
                <div className="flex-1">
                  <Skeleton className="h-3 w-16 mb-1" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
