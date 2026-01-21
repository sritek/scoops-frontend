"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
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
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui";
import {
  getParentCalendar,
  type CalendarEvent,
  type AcademicEventType,
} from "@/lib/api/parent";

/**
 * Event type configuration
 */
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

/**
 * Get days in month
 */
function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * Get first day of month (0 = Sunday, 1 = Monday, etc.)
 */
function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month - 1, 1).getDay();
}

/**
 * Format date for display
 */
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

/**
 * Get month name
 */
function getMonthName(month: number): string {
  return new Date(2024, month - 1, 1).toLocaleDateString("en-IN", {
    month: "long",
  });
}

/**
 * Calendar Day Cell
 */
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
  // Group events by type for dot indicators
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
            <span className="text-xs text-text-muted">+{eventTypes.length - 3}</span>
          )}
        </div>
      )}
    </button>
  );
}

/**
 * Event Card
 */
function EventCard({ event }: { event: CalendarEvent }) {
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
            <Badge variant="outline" className="text-xs shrink-0">
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
          {event.batchName && !event.isSchoolWide && (
            <Badge variant="secondary" className="text-xs mt-1">
              {event.batchName}
            </Badge>
          )}
          {event.isSchoolWide && (
            <Badge variant="secondary" className="text-xs mt-1">
              School-wide
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Calendar Grid View
 */
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

  // Create day-to-events map
  const eventsByDay = useMemo(() => {
    const map: Record<number, CalendarEvent[]> = {};
    events.forEach((event) => {
      const startDate = new Date(event.startDate);
      const endDate = event.endDate ? new Date(event.endDate) : startDate;

      // Add event to all days it spans
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        if (d.getMonth() + 1 === month && d.getFullYear() === year) {
          const day = d.getDate();
          if (!map[day]) map[day] = [];
          map[day].push(event);
        }
      }
    });
    return map;
  }, [events, month, year]);

  // Day names
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="border border-border-subtle rounded-lg overflow-hidden">
      {/* Header row */}
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

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {/* Empty cells for days before the 1st */}
        {Array.from({ length: firstDay }).map((_, i) => (
          <div
            key={`empty-${i}`}
            className="h-12 sm:h-16 border-b border-r border-border-subtle bg-bg-app/50"
          />
        ))}

        {/* Day cells */}
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

/**
 * Events List View
 */
function EventsListView({ events }: { events: CalendarEvent[] }) {
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

  // Group events by date
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
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Selected Day Events
 */
function SelectedDayEvents({
  events,
  day,
  month,
  year,
  onClose,
}: {
  events: CalendarEvent[];
  day: number;
  month: number;
  year: number;
  onClose: () => void;
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
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
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
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Parent Calendar Page
 */
export default function ParentCalendarPage() {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [childFilter, setChildFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  // Fetch calendar data
  const { data, isLoading, error } = useQuery({
    queryKey: ["parent", "calendar", month, year, childFilter],
    queryFn: () =>
      getParentCalendar(month, year, childFilter !== "all" ? childFilter : undefined),
  });

  // Navigate to previous month
  const prevMonth = () => {
    setSelectedDay(null);
    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  };

  // Navigate to next month
  const nextMonth = () => {
    setSelectedDay(null);
    if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  // Go to today
  const goToToday = () => {
    setSelectedDay(null);
    setMonth(today.getMonth() + 1);
    setYear(today.getFullYear());
  };

  // Get events for selected day
  const selectedDayEvents = useMemo(() => {
    if (!selectedDay || !data?.events) return [];
    return data.events.filter((event) => {
      const startDate = new Date(event.startDate);
      const endDate = event.endDate ? new Date(event.endDate) : startDate;
      const checkDate = new Date(year, month - 1, selectedDay);
      return checkDate >= startDate && checkDate <= endDate;
    });
  }, [data?.events, selectedDay, month, year]);

  return (
    <div className="space-y-4 py-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-text-primary flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          Calendar
        </h1>
        <Button variant="outline" size="sm" onClick={goToToday}>
          Today
        </Button>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        {/* Month Navigation */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-lg font-medium min-w-[160px] text-center">
            {getMonthName(month)} {year}
          </span>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          {/* Child Filter */}
          {data?.children && data.children.length > 1 && (
            <Select value={childFilter} onValueChange={setChildFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Children" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Children</SelectItem>
                {data.children.map((child) => (
                  <SelectItem key={child.id} value={child.id}>
                    {child.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* View Toggle */}
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "calendar" | "list")}>
            <TabsList className="h-9">
              <TabsTrigger value="calendar" className="px-2">
                <Grid3x3 className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="list" className="px-2">
                <List className="h-4 w-4" />
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Event Type Legend */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(EVENT_TYPE_CONFIG).map(([type, config]) => (
          <div key={type} className="flex items-center gap-1">
            <span className={cn("w-2.5 h-2.5 rounded-full", config.bgColor)} />
            <span className="text-xs text-text-muted">{config.label}</span>
          </div>
        ))}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-[400px] w-full" />
        </div>
      )}

      {/* Error State */}
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
                />
              )}
            </>
          ) : (
            <EventsListView events={data.events} />
          )}
        </>
      )}
    </div>
  );
}
