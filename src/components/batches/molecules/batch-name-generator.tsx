"use client";

import { useState, useEffect, useCallback } from "react";
import { Sparkles, Pencil, RotateCcw } from "lucide-react";
import { Input, Button } from "@/components/ui";
import { useGenerateBatchName } from "@/lib/api/schedule";
import { cn } from "@/lib/utils/cn";

interface BatchNameGeneratorProps {
  academicLevel?: string;
  stream?: string;
  sessionName?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

/**
 * BatchNameGenerator - Auto-generates batch name with option to edit
 * 
 * - Auto-generates name based on academic level, stream, and session
 * - Shows the generated name in an input field
 * - Allows user to toggle edit mode and customize the name
 * - Regenerate button to get a fresh auto-generated name
 */
export function BatchNameGenerator({
  academicLevel,
  stream,
  sessionName,
  value,
  onChange,
  className,
}: BatchNameGeneratorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [hasManualEdit, setHasManualEdit] = useState(false);

  const { mutate: generateName, isPending } = useGenerateBatchName();

  // Generate name when dependencies change (and not manually editing)
  const handleGenerate = useCallback(() => {
    if (!academicLevel) return;

    generateName(
      {
        academicLevel,
        stream: stream || undefined,
        sessionName: sessionName || undefined,
      },
      {
        onSuccess: (generatedName) => {
          onChange(generatedName);
          setHasManualEdit(false);
        },
      }
    );
  }, [academicLevel, stream, sessionName, generateName, onChange]);

  // Auto-generate on mount or when dependencies change (if not manually edited)
  useEffect(() => {
    if (academicLevel && !hasManualEdit && !value) {
      handleGenerate();
    }
  }, [academicLevel, stream, sessionName, handleGenerate, hasManualEdit, value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setHasManualEdit(true);
  };

  const handleRegenerate = () => {
    setHasManualEdit(false);
    handleGenerate();
  };

  const toggleEdit = () => {
    setIsEditing(!isEditing);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Input
            value={value}
            onChange={handleInputChange}
            disabled={!isEditing || isPending}
            placeholder="Batch name will be generated..."
            className={cn(
              "pr-20",
              !isEditing && "bg-bg-app text-text-primary cursor-default"
            )}
          />
          {isPending && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Sparkles className="h-4 w-4 animate-pulse text-primary-600" />
            </div>
          )}
        </div>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={toggleEdit}
          className="shrink-0"
        >
          <Pencil className="h-4 w-4" />
          {isEditing ? "Done" : "Edit"}
        </Button>

        {(hasManualEdit || isEditing) && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRegenerate}
            disabled={isPending}
            className="shrink-0"
            title="Regenerate name"
          >
            <RotateCcw className={cn("h-4 w-4", isPending && "animate-spin")} />
          </Button>
        )}
      </div>

      {!isEditing && !isPending && (
        <p className="text-xs text-text-muted">
          <Sparkles className="inline h-3 w-3 mr-1" />
          Auto-generated. Click &quot;Edit&quot; to customize.
        </p>
      )}
    </div>
  );
}
