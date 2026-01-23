import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "./card";
import { Skeleton } from "./table-skeleton";

/**
 * Reusable skeleton components for page loading states.
 * These match the actual component layouts to prevent layout shift.
 */

// ============================================
// CARD GRID SKELETON
// ============================================

export interface CardGridSkeletonProps {
  /** Number of skeleton cards to show */
  count?: number;
  /** Number of columns on desktop (default: 3) */
  columns?: 2 | 3 | 4;
  /** Additional className */
  className?: string;
}

/**
 * Skeleton for card grid layouts (fee components, scholarships, etc.)
 * Matches responsive grid behavior of actual card grids.
 */
export function CardGridSkeleton({
  count = 6,
  columns = 3,
  className,
}: CardGridSkeletonProps) {
  const gridCols = {
    2: "md:grid-cols-2",
    3: "md:grid-cols-2 lg:grid-cols-3",
    4: "md:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <div className={cn("grid gap-4", gridCols[columns], className)}>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardContent className="pt-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-full mt-2" />
              </div>
              <Skeleton className="h-8 w-8 rounded" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ============================================
// DETAIL PAGE HEADER SKELETON
// ============================================

export interface DetailPageHeaderSkeletonProps {
  /** Show back button placeholder */
  showBackButton?: boolean;
  /** Show avatar placeholder */
  showAvatar?: boolean;
  /** Number of badge placeholders */
  badgeCount?: number;
  /** Show action buttons area */
  showActions?: boolean;
  /** Additional className */
  className?: string;
}

/**
 * Skeleton for detail page headers with back button, title, badges, and actions.
 */
export function DetailPageHeaderSkeleton({
  showBackButton = true,
  showAvatar = false,
  badgeCount = 2,
  showActions = true,
  className,
}: DetailPageHeaderSkeletonProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
        className
      )}
    >
      <div className="flex items-start gap-4">
        {showBackButton && <Skeleton className="h-8 w-8 rounded" />}
        {showAvatar && <Skeleton className="h-16 w-16 rounded-full" />}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-48" />
            {Array.from({ length: badgeCount }).map((_, i) => (
              <Skeleton key={i} className="h-5 w-16 rounded-full" />
            ))}
          </div>
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      {showActions && (
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24 rounded" />
          <Skeleton className="h-9 w-24 rounded" />
        </div>
      )}
    </div>
  );
}

// ============================================
// CHART SKELETON
// ============================================

export interface ChartSkeletonProps {
  /** Chart height (default: 200px) */
  height?: number;
  /** Show card wrapper */
  withCard?: boolean;
  /** Card title placeholder width */
  titleWidth?: string;
  /** Additional className */
  className?: string;
}

/**
 * Skeleton for chart/graph sections.
 */
export function ChartSkeleton({
  height = 200,
  withCard = true,
  titleWidth = "w-40",
  className,
}: ChartSkeletonProps) {
  const content = (
    <>
      <CardHeader className="pb-2">
        <Skeleton className={cn("h-5", titleWidth)} />
      </CardHeader>
      <CardContent>
        <Skeleton
          className={cn("w-full rounded-lg", className)}
          style={{ height: `${height}px` }}
        />
      </CardContent>
    </>
  );

  if (withCard) {
    return <Card>{content}</Card>;
  }

  return <div>{content}</div>;
}

// ============================================
// LIST SKELETON
// ============================================

export interface ListSkeletonProps {
  /** Number of list items */
  count?: number;
  /** Show card wrapper */
  withCard?: boolean;
  /** Card title placeholder */
  title?: boolean;
  /** Additional className */
  className?: string;
}

/**
 * Skeleton for list sections (birthdays, pending items, etc.)
 */
export function ListSkeleton({
  count = 5,
  withCard = true,
  title = true,
  className,
}: ListSkeletonProps) {
  const content = (
    <>
      {title && (
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
      )}
      <CardContent className={cn(!title && "pt-4", className)}>
        <div className="space-y-3">
          {Array.from({ length: count }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-2 border-b border-border-subtle last:border-0"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </CardContent>
    </>
  );

  if (withCard) {
    return <Card>{content}</Card>;
  }

  return <div>{content}</div>;
}

// ============================================
// STAT CARDS GRID SKELETON
// ============================================

export interface StatCardsGridSkeletonProps {
  /** Number of stat cards */
  count?: number;
  /** Number of columns */
  columns?: 2 | 3 | 4;
  /** Additional className */
  className?: string;
}

/**
 * Skeleton for stat card grids (dashboard metrics).
 * Uses the same layout as StatCardSkeleton but in a grid.
 */
export function StatCardsGridSkeleton({
  count = 4,
  columns = 4,
  className,
}: StatCardsGridSkeletonProps) {
  const gridCols = {
    2: "grid-cols-2",
    3: "grid-cols-2 md:grid-cols-3",
    4: "grid-cols-2 md:grid-cols-4",
  };

  return (
    <div className={cn("grid gap-4", gridCols[columns], className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-border-subtle bg-bg-surface p-4"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-16" />
            </div>
            <Skeleton className="h-9 w-9 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================
// TABS SKELETON
// ============================================

export interface TabsSkeletonProps {
  /** Number of tab buttons */
  tabCount?: number;
  /** Content skeleton type */
  contentType?: "cards" | "list" | "table" | "custom";
  /** Custom content (when contentType is "custom") */
  children?: React.ReactNode;
  /** Additional className */
  className?: string;
}

/**
 * Skeleton for tabbed interfaces.
 */
export function TabsSkeleton({
  tabCount = 3,
  contentType = "cards",
  children,
  className,
}: TabsSkeletonProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {/* Tab buttons */}
      <div className="flex gap-2 border-b border-border-subtle pb-2">
        {Array.from({ length: tabCount }).map((_, i) => (
          <Skeleton
            key={i}
            className={cn("h-8 rounded", i === 0 ? "w-24" : "w-20")}
          />
        ))}
      </div>

      {/* Tab content */}
      <div className="pt-2">
        {contentType === "cards" && <CardGridSkeleton count={6} />}
        {contentType === "list" && <ListSkeleton count={5} withCard={false} title={false} />}
        {contentType === "table" && (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        )}
        {contentType === "custom" && children}
      </div>
    </div>
  );
}

// ============================================
// SECTION SKELETON
// ============================================

export interface SectionSkeletonProps {
  /** Section title placeholder */
  title?: boolean;
  /** Additional className */
  className?: string;
  /** Content */
  children: React.ReactNode;
}

/**
 * Wrapper skeleton for sections with optional title.
 */
export function SectionSkeleton({
  title = true,
  className,
  children,
}: SectionSkeletonProps) {
  return (
    <section className={cn("space-y-4", className)}>
      {title && <Skeleton className="h-5 w-48" />}
      {children}
    </section>
  );
}
