"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  List,
  Grid3x3,
  PartyPopper,
  GraduationCap,
  Users,
  Flag,
  Clock,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
  Badge,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsList,
  TabsTrigger,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  Input,
  Label,
  Textarea,
} from "@/components/ui";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";

// ============================================================================
// Types
// ============================================================================

type AcademicEventType = "holiday" | "exam" | "ptm" | "event" | "deadline";

interface CalendarEvent {
  id: string;
  type: AcademicEventType;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string | null;
  isAllDay: boolean;
  batchId: string | null;
  batchName: string | null;
  isSchoolWide: boolean;
  createdBy: { id: string; name: string };
  createdAt: string;
}

interface CalendarResponse {
  events: CalendarEvent[];
  month: number;
  year: number;
}

interface Batch {
  id: string;
  name: string;
}

// Special value for "school-wide" selection (empty string not allowed by Radix Select)
const SCHOOL_WIDE_VALUE = "__school_wide__";

// ============================================================================
// API Functions
// ============================================================================

async function getCalendarEvents(
  month: number,
  year: number,
  batchId?: string,
  type?: string
): Promise<CalendarResponse> {
  const params = new URLSearchParams();
  params.set("month", month.toString());
  params.set("year", year.toString());
  if (batchId) params.set("batchId", batchId);
  if (type) params.set("type", type);
  return apiClient.get(`/calendar/events?${params.toString()}`);
}

async function createEvent(data: {
  batchId?: string | null;
  type: AcademicEventType;
  title: string;
  description?: string | null;
  startDate: string;
  endDate?: string | null;
  isAllDay?: boolean;
}): Promise<CalendarEvent> {
  return apiClient.post("/calendar/events", data);
}

async function updateEvent(
  id: string,
  data: Partial<{
    batchId: string | null;
    type: AcademicEventType;
    title: string;
    description: string | null;
    startDate: string;
    endDate: string | null;
    isAllDay: boolean;
  }>
): Promise<CalendarEvent> {
  return apiClient.put(`/calendar/events/${id}`, data);
}

async function deleteEvent(id: string): Promise<void> {
  return apiClient.delete(`/calendar/events/${id}`);
}

async function getBatches(): Promise<Batch[]> {
  const res: { data?: Batch[] } | Batch[] = await apiClient.get("/batches");
  if (Array.isArray(res)) {
    return res;
  }
  return res.data || [];
}

// ============================================================================
// Constants
// ============================================================================

const EVENT_TYPE_CONFIG: Record<
  AcademicEventType,
  { label: string; color: string; bgColor: string; icon: React.ElementType }
> = {
  holiday: {
    label: "Holiday",
    color: "text-red-700",
    bgColor: "bg-red-100",
    icon: PartyPopper,
  },
  exam: {
    label: "Exam",
    color: "text-purple-700",
    bgColor: "bg-purple-100",
    icon: GraduationCap,
  },
  ptm: {
    label: "PTM",
    color: "text-blue-700",
    bgColor: "bg-blue-100",
    icon: Users,
  },
  event: {
    label: "Event",
    color: "text-green-700",
    bgColor: "bg-green-100",
    icon: Flag,
  },
  deadline: {
    label: "Deadline",
    color: "text-orange-700",
    bgColor: "bg-orange-100",
    icon: Clock,
  },
};

const EVENT_TYPES: AcademicEventType[] = [
  "holiday",
  "exam",
  "ptm",
  "event",
  "deadline",
];

// ============================================================================
// Form Schema
// ============================================================================

const eventFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  type: z.enum(["holiday", "exam", "ptm", "event", "deadline"]),
  description: z.string().max(1000).optional(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
  batchId: z.string().optional(),
  isAllDay: z.boolean(),
});

type EventFormData = z.infer<typeof eventFormSchema>;

// ============================================================================
// Helper Functions
// ============================================================================

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month - 1, 1).getDay();
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

function getMonthName(month: number): string {
  return new Date(2024, month - 1, 1).toLocaleDateString("en-IN", {
    month: "long",
  });
}

// ============================================================================
// Event Form Dialog
// ============================================================================

function EventFormDialog({
  open,
  onClose,
  event,
  batches,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  event?: CalendarEvent | null;
  batches: Batch[];
  onSuccess: () => void;
}) {
  const queryClient = useQueryClient();
  const isEditing = !!event;

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<EventFormData>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: event?.title || "",
      type: event?.type || "event",
      description: event?.description || "",
      startDate: event?.startDate || "",
      endDate: event?.endDate || "",
      batchId: event?.batchId || "",
      isAllDay: event?.isAllDay ?? true,
    },
  });

  const createMutation = useMutation({
    mutationFn: createEvent,
    onSuccess: () => {
      toast.success("Event created successfully");
      queryClient.invalidateQueries({ queryKey: ["calendar"] });
      onSuccess();
      onClose();
    },
    onError: () => {
      toast.error("Failed to create event");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof updateEvent>[1];
    }) => updateEvent(id, data),
    onSuccess: () => {
      toast.success("Event updated successfully");
      queryClient.invalidateQueries({ queryKey: ["calendar"] });
      onSuccess();
      onClose();
    },
    onError: () => {
      toast.error("Failed to update event");
    },
  });

  const onSubmit = (data: EventFormData) => {
    const payload = {
      ...data,
      batchId: data.batchId || null,
      description: data.description || null,
      endDate: data.endDate || null,
    };

    if (isEditing && event) {
      updateMutation.mutate({ id: event.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  // Get the current batchId value for Select
  const currentBatchId = watch("batchId");
  const selectBatchValue = currentBatchId || SCHOOL_WIDE_VALUE;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Event" : "Add Event"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the event details below."
              : "Create a new calendar event."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              {...register("title")}
              placeholder="Event title"
            />
            {errors.title && (
              <p className="text-xs text-error">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Type *</Label>
            <Select
              value={watch("type")}
              onValueChange={(v) => setValue("type", v as AcademicEventType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {EVENT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    <span className="flex items-center gap-2">
                      <span
                        className={cn(
                          "w-2 h-2 rounded-full",
                          EVENT_TYPE_CONFIG[type].bgColor
                        )}
                      />
                      {EVENT_TYPE_CONFIG[type].label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date *</Label>
              <Input id="startDate" type="date" {...register("startDate")} />
              {errors.startDate && (
                <p className="text-xs text-error">{errors.startDate.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input id="endDate" type="date" {...register("endDate")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="batchId">Batch (leave empty for school-wide)</Label>
            <Select
              value={selectBatchValue}
              onValueChange={(v) =>
                setValue("batchId", v === SCHOOL_WIDE_VALUE ? "" : v)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="School-wide (all batches)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SCHOOL_WIDE_VALUE}>
                  School-wide (all batches)
                </SelectItem>
                {batches.map((batch) => (
                  <SelectItem key={batch.id} value={batch.id}>
                    {batch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Optional description"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : isEditing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Calendar Components
// ============================================================================

function CalendarDayCell({
  day,
  isToday,
  events,
  onSelectDay,
  isSelected,
}: {
  day: number;
  isToday: boolean;
  events: CalendarEvent[];
  onSelectDay: (day: number) => void;
  isSelected: boolean;
}) {
  const eventTypes = [...new Set(events.map((e) => e.type))];

  return (
    <button
      onClick={() => onSelectDay(day)}
      className={cn(
        "h-12 sm:h-16 w-full p-1 border-b border-r border-border-subtle text-left transition-colors",
        "hover:bg-bg-app focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-inset",
        isSelected && "bg-primary-50",
        isToday && "font-bold"
      )}
    >
      <span
        className={cn(
          "inline-flex items-center justify-center w-6 h-6 text-sm rounded-full",
          isToday && "bg-primary-600 text-white"
        )}
      >
        {day}
      </span>
      {events.length > 0 && (
        <div className="flex gap-0.5 mt-0.5 flex-wrap">
          {eventTypes.slice(0, 3).map((type) => {
            const config = EVENT_TYPE_CONFIG[type];
            return (
              <span
                key={type}
                className={cn("w-1.5 h-1.5 rounded-full", config.bgColor)}
              />
            );
          })}
          {eventTypes.length > 3 && (
            <span className="text-xs text-text-muted">
              +{eventTypes.length - 3}
            </span>
          )}
        </div>
      )}
    </button>
  );
}

function EventCard({
  event,
  onEdit,
  onDelete,
}: {
  event: CalendarEvent;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const config = EVENT_TYPE_CONFIG[event.type];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "p-3 rounded-lg border border-border-subtle",
        config.bgColor
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn("p-2 rounded-lg bg-white/50", config.color)}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className={cn("font-medium text-sm truncate", config.color)}>
              {event.title}
            </h4>
            <Badge variant="default" className="text-xs shrink-0">
              {config.label}
            </Badge>
          </div>
          <p className="text-xs text-text-muted">
            {formatDate(event.startDate)}
            {event.endDate && event.endDate !== event.startDate && (
              <> - {formatDate(event.endDate)}</>
            )}
          </p>
          {event.description && (
            <p className="text-xs text-text-muted mt-1 line-clamp-2">
              {event.description}
            </p>
          )}
          <div className="flex items-center gap-2 mt-1">
            {event.batchName && !event.isSchoolWide && (
              <Badge variant="default" className="text-xs">
                {event.batchName}
              </Badge>
            )}
            {event.isSchoolWide && (
              <Badge variant="default" className="text-xs">
                School-wide
              </Badge>
            )}
          </div>
        </div>
        <div className="flex gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onEdit}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-error hover:text-error"
            onClick={onDelete}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function CalendarGridView({
  events,
  month,
  year,
  selectedDay,
  onSelectDay,
}: {
  events: CalendarEvent[];
  month: number;
  year: number;
  selectedDay: number | null;
  onSelectDay: (day: number) => void;
}) {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const today = new Date();
  const isCurrentMonth =
    today.getMonth() + 1 === month && today.getFullYear() === year;

  const eventsByDay = useMemo(() => {
    const map: Record<number, CalendarEvent[]> = {};
    events.forEach((event) => {
      const startDate = new Date(event.startDate);
      const endDate = event.endDate ? new Date(event.endDate) : startDate;

      for (
        let d = new Date(startDate);
        d <= endDate;
        d.setDate(d.getDate() + 1)
      ) {
        if (d.getMonth() + 1 === month && d.getFullYear() === year) {
          const day = d.getDate();
          if (!map[day]) map[day] = [];
          map[day].push(event);
        }
      }
    });
    return map;
  }, [events, month, year]);

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="border border-border-subtle rounded-lg overflow-hidden">
      <div className="grid grid-cols-7 bg-bg-app">
        {dayNames.map((name) => (
          <div
            key={name}
            className="p-2 text-center text-xs font-medium text-text-muted border-b border-border-subtle"
          >
            {name}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {Array.from({ length: firstDay }).map((_, i) => (
          <div
            key={`empty-${i}`}
            className="h-12 sm:h-16 border-b border-r border-border-subtle bg-bg-app/50"
          />
        ))}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          return (
            <CalendarDayCell
              key={day}
              day={day}
              isToday={isCurrentMonth && today.getDate() === day}
              events={eventsByDay[day] || []}
              onSelectDay={onSelectDay}
              isSelected={selectedDay === day}
            />
          );
        })}
      </div>
    </div>
  );
}

function EventsListView({
  events,
  onEdit,
  onDelete,
}: {
  events: CalendarEvent[];
  onEdit: (event: CalendarEvent) => void;
  onDelete: (event: CalendarEvent) => void;
}) {
  // Move useMemo before early return to follow React hooks rules
  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    events.forEach((event) => {
      const date = event.startDate;
      if (!map[date]) map[date] = [];
      map[date].push(event);
    });
    return map;
  }, [events]);

  const sortedDates = Object.keys(eventsByDate).sort();

  if (events.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-text-muted" />
          <p className="text-text-muted">No events this month</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {sortedDates.map((date) => (
        <div key={date}>
          <h3 className="text-sm font-medium text-text-muted mb-2">
            {new Date(date).toLocaleDateString("en-IN", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </h3>
          <div className="space-y-2">
            {eventsByDate[date].map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onEdit={() => onEdit(event)}
                onDelete={() => onDelete(event)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function SelectedDayEvents({
  events,
  day,
  month,
  year,
  onClose,
  onEdit,
  onDelete,
  onAddEvent,
}: {
  events: CalendarEvent[];
  day: number;
  month: number;
  year: number;
  onClose: () => void;
  onEdit: (event: CalendarEvent) => void;
  onDelete: (event: CalendarEvent) => void;
  onAddEvent: () => void;
}) {
  const dateStr = new Date(year, month - 1, day).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <Card className="mt-4">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{dateStr}</CardTitle>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={onAddEvent}>
              <Plus className="h-4 w-4 mr-1" />
              Add Event
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="text-text-muted text-sm py-4 text-center">
            No events on this day
          </p>
        ) : (
          <div className="space-y-2">
            {events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onEdit={() => onEdit(event)}
                onDelete={() => onDelete(event)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Main Page
// ============================================================================

export default function StaffCalendarPage() {
  const queryClient = useQueryClient();
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [batchFilter, setBatchFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [deleteConfirmEvent, setDeleteConfirmEvent] =
    useState<CalendarEvent | null>(null);

  // Fetch calendar events
  const { data, isLoading, error } = useQuery({
    queryKey: ["calendar", "events", month, year, batchFilter, typeFilter],
    queryFn: () =>
      getCalendarEvents(
        month,
        year,
        batchFilter !== "all" ? batchFilter : undefined,
        typeFilter !== "all" ? typeFilter : undefined
      ),
  });

  // Fetch batches for filter and form
  const { data: batches = [] } = useQuery({
    queryKey: ["batches"],
    queryFn: getBatches,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteEvent,
    onSuccess: () => {
      toast.success("Event deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["calendar"] });
      setDeleteConfirmEvent(null);
    },
    onError: () => {
      toast.error("Failed to delete event");
    },
  });

  const prevMonth = () => {
    setSelectedDay(null);
    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    setSelectedDay(null);
    if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const goToToday = () => {
    setSelectedDay(null);
    setMonth(today.getMonth() + 1);
    setYear(today.getFullYear());
  };

  const handleAddEvent = () => {
    setEditingEvent(null);
    setDialogOpen(true);
  };

  const handleEditEvent = (event: CalendarEvent) => {
    setEditingEvent(event);
    setDialogOpen(true);
  };

  const handleDeleteEvent = (event: CalendarEvent) => {
    setDeleteConfirmEvent(event);
  };

  const confirmDelete = () => {
    if (deleteConfirmEvent) {
      deleteMutation.mutate(deleteConfirmEvent.id);
    }
  };

  const selectedDayEvents = useMemo(() => {
    if (!selectedDay || !data?.events) return [];
    return data.events.filter((event) => {
      const startDate = new Date(event.startDate);
      const endDate = event.endDate ? new Date(event.endDate) : startDate;
      const checkDate = new Date(year, month - 1, selectedDay);
      return checkDate >= startDate && checkDate <= endDate;
    });
  }, [data?.events, selectedDay, year, month]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary flex items-center gap-2">
            <CalendarIcon className="h-6 w-6" />
            Academic Calendar
          </h1>
          <p className="text-text-muted mt-1">
            Manage holidays, events, PTMs, and deadlines
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={goToToday}>
            Today
          </Button>
          <Button onClick={handleAddEvent}>
            <Plus className="h-4 w-4 mr-2" />
            Add Event
          </Button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="icon" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-lg font-medium min-w-[180px] text-center">
            {getMonthName(month)} {year}
          </span>
          <Button variant="secondary" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={batchFilter} onValueChange={setBatchFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Batches" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Batches</SelectItem>
              {batches.map((batch) => (
                <SelectItem key={batch.id} value={batch.id}>
                  {batch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {EVENT_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {EVENT_TYPE_CONFIG[type].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Tabs
            value={viewMode}
            onValueChange={(v) => setViewMode(v as "calendar" | "list")}
          >
            <TabsList className="h-9">
              <TabsTrigger value="calendar" className="px-3">
                <Grid3x3 className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="list" className="px-3">
                <List className="h-4 w-4" />
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {Object.entries(EVENT_TYPE_CONFIG).map(([type, config]) => (
          <div key={type} className="flex items-center gap-1.5">
            <span className={cn("w-3 h-3 rounded-full", config.bgColor)} />
            <span className="text-sm text-text-muted">{config.label}</span>
          </div>
        ))}
      </div>

      {/* Loading */}
      {isLoading && <Skeleton className="h-[400px] w-full" />}

      {/* Error */}
      {error && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-error">Failed to load calendar</p>
          </CardContent>
        </Card>
      )}

      {/* Calendar Content */}
      {!isLoading && !error && data && (
        <>
          {viewMode === "calendar" ? (
            <>
              <CalendarGridView
                events={data.events}
                month={month}
                year={year}
                selectedDay={selectedDay}
                onSelectDay={setSelectedDay}
              />
              {selectedDay !== null && (
                <SelectedDayEvents
                  events={selectedDayEvents}
                  day={selectedDay}
                  month={month}
                  year={year}
                  onClose={() => setSelectedDay(null)}
                  onEdit={handleEditEvent}
                  onDelete={handleDeleteEvent}
                  onAddEvent={handleAddEvent}
                />
              )}
            </>
          ) : (
            <EventsListView
              events={data.events}
              onEdit={handleEditEvent}
              onDelete={handleDeleteEvent}
            />
          )}
        </>
      )}

      {/* Event Form Dialog */}
      <EventFormDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditingEvent(null);
        }}
        event={editingEvent}
        batches={batches}
        onSuccess={() => {}}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteConfirmEvent}
        onOpenChange={() => setDeleteConfirmEvent(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Event</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deleteConfirmEvent?.title}
              &quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setDeleteConfirmEvent(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
