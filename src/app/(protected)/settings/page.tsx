"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Building,
  MessageSquare,
  Users,
  DollarSign,
  Save,
  Plus,
  Trash2,
  Edit,
  AlertCircle,
  Check,
  Globe,
  Phone,
  Mail,
  MapPin,
  X,
} from "lucide-react";
import {
  useOrganization,
  useUpdateOrganization,
  useMessageTemplates,
  useUpdateTemplate,
  useCreateTemplate,
  useDeleteTemplate,
} from "@/lib/api";
import type { MessageTemplate } from "@/lib/api";
import { usePermissions } from "@/lib/hooks";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import { cn } from "@/lib/utils";

const TEMPLATE_TYPES = [
  { value: "absent", label: "Absence Notification" },
  { value: "fee_due", label: "Fee Due Reminder" },
  { value: "fee_paid", label: "Fee Payment Confirmation" },
] as const;

const TIMEZONES = [
  { value: "Asia/Kolkata", label: "India (IST)" },
  { value: "UTC", label: "UTC" },
  { value: "Asia/Dubai", label: "Dubai (GST)" },
  { value: "Asia/Singapore", label: "Singapore (SGT)" },
] as const;

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "hi", label: "Hindi" },
  { value: "mr", label: "Marathi" },
  { value: "ta", label: "Tamil" },
] as const;

/**
 * Admin Settings Page
 *
 * Admin-only page for managing:
 * - Organization settings (name, logo, contact info)
 * - Message templates for notifications
 * - Quick links to user management and fee plans
 */
export default function SettingsPage() {
  const { can } = usePermissions();

  // Check permission
  if (!can("SETTINGS_MANAGE")) {
    redirect("/");
  }

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Settings</h1>
        <p className="text-sm text-text-muted">
          Manage your organization settings and preferences
        </p>
      </div>

      {/* Organization Settings */}
      <OrganizationSettings />

      {/* Message Templates */}
      <MessageTemplatesSection />

      {/* Quick Links */}
      <QuickLinksSection />
    </div>
  );
}

/**
 * Organization Settings Section
 */
function OrganizationSettings() {
  const { data: org, isLoading, error } = useOrganization();
  const updateOrg = useUpdateOrganization();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "school" as "school" | "coaching",
    language: "en",
    timezone: "Asia/Kolkata",
    udiseCode: "",
    logoUrl: null as string | null,
    phone: "",
    email: "",
    address: "",
  });
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Initialize form when org loads
  useEffect(() => {
    if (org && !isEditing) {
      setFormData({
        name: org.name || "",
        type: org.type || "school",
        language: org.language || "en",
        timezone: org.timezone || "Asia/Kolkata",
        udiseCode: org.udiseCode || "",
        logoUrl: org.logoUrl || null,
        phone: org.phone || "",
        email: org.email || "",
        address: org.address || "",
      });
    }
  }, [org, isEditing]);

  const handleEdit = () => {
    setIsEditing(true);
    setSuccessMessage(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (org) {
      setFormData({
        name: org.name || "",
        type: org.type || "school",
        language: org.language || "en",
        timezone: org.timezone || "Asia/Kolkata",
        udiseCode: org.udiseCode || "",
        logoUrl: org.logoUrl || null,
        phone: org.phone || "",
        email: org.email || "",
        address: org.address || "",
      });
    }
  };

  const handleSave = async () => {
    try {
      await updateOrg.mutateAsync({
        name: formData.name,
        type: formData.type,
        language: formData.language,
        timezone: formData.timezone,
        udiseCode: formData.udiseCode || null,
        logoUrl: formData.logoUrl,
        phone: formData.phone || null,
        email: formData.email || null,
        address: formData.address || null,
      });
      setIsEditing(false);
      setSuccessMessage("Organization settings updated successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Failed to update organization:", err);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="flex items-center gap-3 py-8">
          <AlertCircle className="h-5 w-5 text-error" />
          <p className="text-sm text-error">
            Failed to load organization settings.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building className="h-5 w-5 text-text-muted" aria-hidden="true" />
              Organization Settings
            </CardTitle>
            <CardDescription>
              Manage your organization's profile and contact information
            </CardDescription>
          </div>
          {!isEditing && (
            <Button variant="secondary" size="sm" onClick={handleEdit}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Success/Error messages */}
        {successMessage && (
          <div className="flex items-center gap-2 p-3 mb-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700">
            <Check className="h-4 w-4" />
            <span className="text-sm">{successMessage}</span>
          </div>
        )}
        {updateOrg.error && (
          <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 border border-red-200 rounded-lg text-error">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">Failed to update organization</span>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-3">
          {/* Logo */}
          <div className="flex flex-col items-center gap-4 p-4 bg-bg-app rounded-lg">
            <Label className="text-sm font-medium">Organization Logo</Label>
            {isEditing ? (
              <PhotoUpload
                value={formData.logoUrl}
                onChange={(value) =>
                  setFormData({ ...formData, logoUrl: value })
                }
                size="lg"
                shape="rounded"
                label="Organization logo"
              />
            ) : (
              <div
                className={cn(
                  "h-24 w-24 rounded-lg overflow-hidden",
                  "bg-primary-100 flex items-center justify-center"
                )}
              >
                {org?.logoUrl ? (
                  <img
                    src={org.logoUrl}
                    alt={org.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Building className="h-10 w-10 text-primary-600" />
                )}
              </div>
            )}
          </div>

          {/* Form fields */}
          <div className="md:col-span-2 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="orgName">Organization Name</Label>
                {isEditing ? (
                  <Input
                    id="orgName"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Enter organization name"
                  />
                ) : (
                  <p className="text-sm font-medium py-2">{org?.name || "—"}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="orgType">Type</Label>
                {isEditing ? (
                  <Select
                    value={formData.type}
                    onValueChange={(value: "school" | "coaching") =>
                      setFormData({ ...formData, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="school">School</SelectItem>
                      <SelectItem value="coaching">Coaching</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm font-medium py-2 capitalize">
                    {org?.type || "—"}
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="timezone">
                  <Globe className="inline h-3.5 w-3.5 mr-1" />
                  Timezone
                </Label>
                {isEditing ? (
                  <Select
                    value={formData.timezone}
                    onValueChange={(value) =>
                      setFormData({ ...formData, timezone: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEZONES.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm font-medium py-2">{org?.timezone || "—"}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                {isEditing ? (
                  <Select
                    value={formData.language}
                    onValueChange={(value) =>
                      setFormData({ ...formData, language: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((lang) => (
                        <SelectItem key={lang.value} value={lang.value}>
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm font-medium py-2">
                    {LANGUAGES.find((l) => l.value === org?.language)?.label ||
                      org?.language ||
                      "—"}
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">
                  <Phone className="inline h-3.5 w-3.5 mr-1" />
                  Contact Phone
                </Label>
                {isEditing ? (
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="Enter phone number"
                  />
                ) : (
                  <p className="text-sm font-medium py-2">{org?.phone || "—"}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">
                  <Mail className="inline h-3.5 w-3.5 mr-1" />
                  Contact Email
                </Label>
                {isEditing ? (
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="Enter email address"
                  />
                ) : (
                  <p className="text-sm font-medium py-2">{org?.email || "—"}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">
                <MapPin className="inline h-3.5 w-3.5 mr-1" />
                Address
              </Label>
              {isEditing ? (
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  placeholder="Enter address"
                />
              ) : (
                <p className="text-sm font-medium py-2">{org?.address || "—"}</p>
              )}
            </div>

            {isEditing && (
              <div className="flex gap-3 pt-4">
                <Button onClick={handleSave} disabled={updateOrg.isPending}>
                  <Save className="mr-2 h-4 w-4" />
                  {updateOrg.isPending ? "Saving..." : "Save Changes"}
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleCancel}
                  disabled={updateOrg.isPending}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Message Templates Section
 */
function MessageTemplatesSection() {
  const { data: templates, isLoading, error } = useMessageTemplates();
  const updateTemplate = useUpdateTemplate();
  const createTemplate = useCreateTemplate();
  const deleteTemplate = useDeleteTemplate();

  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(
    null
  );
  const [isCreating, setIsCreating] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    type: "absent" as "absent" | "fee_due" | "fee_paid",
    name: "",
    content: "",
    isActive: true,
  });

  const handleSaveEdit = async () => {
    if (!editingTemplate) return;
    try {
      await updateTemplate.mutateAsync({
        id: editingTemplate.id,
        name: editingTemplate.name || undefined,
        content: editingTemplate.content,
        isActive: editingTemplate.isActive,
      });
      setEditingTemplate(null);
    } catch (err) {
      console.error("Failed to update template:", err);
    }
  };

  const handleCreate = async () => {
    try {
      await createTemplate.mutateAsync({
        type: newTemplate.type,
        name: newTemplate.name,
        content: newTemplate.content,
        isActive: newTemplate.isActive,
      });
      setIsCreating(false);
      setNewTemplate({
        type: "absent",
        name: "",
        content: "",
        isActive: true,
      });
    } catch (err) {
      console.error("Failed to create template:", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;
    try {
      await deleteTemplate.mutateAsync(id);
    } catch (err) {
      console.error("Failed to delete template:", err);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MessageSquare
                className="h-5 w-5 text-text-muted"
                aria-hidden="true"
              />
              Notification Templates
            </CardTitle>
            <CardDescription>
              Customize messages sent to parents for attendance and fee notifications
            </CardDescription>
          </div>
          <Button size="sm" onClick={() => setIsCreating(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Template
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 border border-red-200 rounded-lg text-error">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">Failed to load templates</span>
          </div>
        )}

        {templates && templates.length === 0 ? (
          <div className="text-center py-8 text-text-muted">
            <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p>No templates configured yet.</p>
            <p className="text-sm">Create your first notification template.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {templates?.map((template) => (
              <div
                key={template.id}
                className="flex items-start justify-between p-4 bg-bg-app rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="info" className="text-xs">
                      {TEMPLATE_TYPES.find((t) => t.value === template.type)
                        ?.label || template.type}
                    </Badge>
                    {!template.isActive && (
                      <Badge variant="default" className="text-xs">
                        Inactive
                      </Badge>
                    )}
                  </div>
                  <p className="font-medium text-sm">
                    {template.name || "Unnamed Template"}
                  </p>
                  <p className="text-sm text-text-muted truncate mt-1">
                    {template.content}
                  </p>
                </div>
                <div className="flex gap-2 ml-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingTemplate(template)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(template.id)}
                    className="text-error hover:text-error"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog
          open={!!editingTemplate}
          onOpenChange={() => setEditingTemplate(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Template</DialogTitle>
              <DialogDescription>
                Update the notification template content
              </DialogDescription>
            </DialogHeader>
            {editingTemplate && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={editingTemplate.name || ""}
                    onChange={(e) =>
                      setEditingTemplate({
                        ...editingTemplate,
                        name: e.target.value,
                      })
                    }
                    placeholder="Template name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Content</Label>
                  <textarea
                    value={editingTemplate.content}
                    onChange={(e) =>
                      setEditingTemplate({
                        ...editingTemplate,
                        content: e.target.value,
                      })
                    }
                    className={cn(
                      "w-full min-h-[100px] px-3 py-2 text-sm",
                      "border border-border-subtle rounded-md",
                      "focus:outline-none focus:ring-2 focus:ring-ring"
                    )}
                    placeholder="Enter notification message..."
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={editingTemplate.isActive}
                    onChange={(e) =>
                      setEditingTemplate({
                        ...editingTemplate,
                        isActive: e.target.checked,
                      })
                    }
                    className="rounded border-border-subtle"
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="secondary" onClick={() => setEditingTemplate(null)}>
                Cancel
              </Button>
              <Button
                onClick={handleSaveEdit}
                disabled={updateTemplate.isPending}
              >
                {updateTemplate.isPending ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create Dialog */}
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Template</DialogTitle>
              <DialogDescription>
                Create a new notification template
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={newTemplate.type}
                  onValueChange={(value: "absent" | "fee_due" | "fee_paid") =>
                    setNewTemplate({ ...newTemplate, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TEMPLATE_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={newTemplate.name}
                  onChange={(e) =>
                    setNewTemplate({ ...newTemplate, name: e.target.value })
                  }
                  placeholder="Template name"
                />
              </div>
              <div className="space-y-2">
                <Label>Content</Label>
                <textarea
                  value={newTemplate.content}
                  onChange={(e) =>
                    setNewTemplate({ ...newTemplate, content: e.target.value })
                  }
                  className={cn(
                    "w-full min-h-[100px] px-3 py-2 text-sm",
                    "border border-border-subtle rounded-md",
                    "focus:outline-none focus:ring-2 focus:ring-ring"
                  )}
                  placeholder="Enter notification message..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="secondary" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={
                  createTemplate.isPending ||
                  !newTemplate.name ||
                  !newTemplate.content
                }
              >
                {createTemplate.isPending ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

/**
 * Quick Links Section
 */
function QuickLinksSection() {
  const links = [
    {
      title: "User Management",
      description: "Manage users, roles, and permissions",
      icon: Users,
      href: "/users",
    },
    {
      title: "Fee Plans",
      description: "Configure fee plans and pricing",
      icon: DollarSign,
      href: "/fees",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Quick Links</CardTitle>
        <CardDescription>
          Quick access to commonly used admin features
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-4 p-4",
                "bg-bg-app rounded-lg",
                "hover:bg-primary-50 transition-colors",
                "group"
              )}
            >
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center",
                  "rounded-lg bg-primary-100",
                  "group-hover:bg-primary-200 transition-colors"
                )}
              >
                <link.icon className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <p className="font-medium text-text-primary">{link.title}</p>
                <p className="text-sm text-text-muted">{link.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
