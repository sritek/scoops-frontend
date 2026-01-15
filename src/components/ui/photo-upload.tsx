"use client";

import { useState, useRef, useCallback, type ChangeEvent } from "react";
import { Camera, X, Upload, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

export interface PhotoUploadProps {
  /** Current photo URL (Base64 or external URL) */
  value?: string | null;
  /** Callback when photo changes */
  onChange: (value: string | null) => void;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Size of the photo preview */
  size?: "sm" | "md" | "lg";
  /** Shape of the photo preview */
  shape?: "circle" | "rounded";
  /** Label for accessibility */
  label?: string;
  /** Maximum file size in KB (default 500KB) */
  maxSizeKB?: number;
  /** Error message to display */
  error?: string;
  /** Class name for the container */
  className?: string;
}

const sizeClasses = {
  sm: "h-16 w-16",
  md: "h-24 w-24",
  lg: "h-32 w-32",
};

const iconSizes = {
  sm: "h-6 w-6",
  md: "h-8 w-8",
  lg: "h-12 w-12",
};

/**
 * Resize and compress an image to fit within maxWidth/maxHeight
 * Returns a Base64 data URL
 */
async function resizeImage(
  file: File,
  maxWidth: number = 200,
  maxHeight: number = 200,
  quality: number = 0.85
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      // Calculate new dimensions maintaining aspect ratio
      let { width, height } = img;
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      // Create canvas and draw resized image
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }

      // Use white background for transparency
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to JPEG for better compression
      const dataUrl = canvas.toDataURL("image/jpeg", quality);
      resolve(dataUrl);
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * PhotoUpload Component
 *
 * A reusable photo upload component that:
 * - Accepts image files (jpg, png, webp)
 * - Resizes to max 200x200
 * - Converts to Base64
 * - Provides preview and remove functionality
 */
export function PhotoUpload({
  value,
  onChange,
  disabled = false,
  size = "md",
  shape = "circle",
  label = "Photo",
  maxSizeKB = 500,
  error,
  className,
}: PhotoUploadProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const displayError = error || localError;

  const handleFileChange = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Reset input
      if (inputRef.current) {
        inputRef.current.value = "";
      }

      // Validate file type
      if (!file.type.match(/^image\/(jpeg|jpg|png|webp)$/)) {
        setLocalError("Please select a JPEG, PNG, or WebP image");
        return;
      }

      // Validate initial file size (before compression)
      if (file.size > 5 * 1024 * 1024) {
        setLocalError("Image must be less than 5MB");
        return;
      }

      setLocalError(null);
      setIsLoading(true);

      try {
        // Resize and compress the image
        const dataUrl = await resizeImage(file);

        // Validate compressed size
        const base64Length = dataUrl.length;
        const sizeKB = Math.round((base64Length * 3) / 4 / 1024);
        if (sizeKB > maxSizeKB) {
          setLocalError(`Compressed image is ${sizeKB}KB, max is ${maxSizeKB}KB`);
          setIsLoading(false);
          return;
        }

        onChange(dataUrl);
      } catch (err) {
        console.error("Failed to process image:", err);
        setLocalError("Failed to process image");
      } finally {
        setIsLoading(false);
      }
    },
    [onChange, maxSizeKB]
  );

  const handleRemove = useCallback(() => {
    onChange(null);
    setLocalError(null);
  }, [onChange]);

  const handleClick = useCallback(() => {
    if (!disabled && inputRef.current) {
      inputRef.current.click();
    }
  }, [disabled]);

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileChange}
        disabled={disabled}
        className="hidden"
        aria-label={label}
      />

      {/* Photo preview / placeholder */}
      <div className="relative">
        <button
          type="button"
          onClick={handleClick}
          disabled={disabled}
          className={cn(
            "relative overflow-hidden",
            "bg-bg-app border-2 border-dashed border-border-subtle",
            "hover:border-primary-400 hover:bg-primary-50",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            "transition-colors",
            shape === "circle" ? "rounded-full" : "rounded-lg",
            sizeClasses[size],
            disabled && "opacity-50 cursor-not-allowed hover:border-border-subtle hover:bg-bg-app"
          )}
          aria-label={value ? `Change ${label}` : `Upload ${label}`}
        >
          {value ? (
            // Show photo preview
            <img
              src={value}
              alt={label}
              className="h-full w-full object-cover"
            />
          ) : (
            // Show placeholder
            <div className="flex h-full w-full items-center justify-center">
              {isLoading ? (
                <div className="animate-spin">
                  <Upload className={cn(iconSizes[size], "text-text-muted")} />
                </div>
              ) : (
                <User className={cn(iconSizes[size], "text-text-muted")} />
              )}
            </div>
          )}

          {/* Hover overlay */}
          {!disabled && (
            <div
              className={cn(
                "absolute inset-0 flex items-center justify-center",
                "bg-black/40 opacity-0 hover:opacity-100",
                "transition-opacity",
                shape === "circle" ? "rounded-full" : "rounded-lg"
              )}
            >
              <Camera className="h-6 w-6 text-white" />
            </div>
          )}
        </button>

        {/* Remove button */}
        {value && !disabled && (
          <button
            type="button"
            onClick={handleRemove}
            className={cn(
              "absolute -top-1 -right-1",
              "flex h-6 w-6 items-center justify-center",
              "rounded-full bg-error text-white",
              "hover:bg-red-600",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              "transition-colors"
            )}
            aria-label={`Remove ${label}`}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Upload button text */}
      {!value && !disabled && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleClick}
          disabled={isLoading}
          className="text-xs"
        >
          {isLoading ? "Processing..." : "Upload photo"}
        </Button>
      )}

      {/* Error message */}
      {displayError && (
        <p className="text-xs text-error text-center max-w-[150px]">
          {displayError}
        </p>
      )}
    </div>
  );
}

/**
 * Avatar display component (read-only)
 * For displaying photos without upload functionality
 */
export interface AvatarProps {
  /** Photo URL or Base64 */
  src?: string | null;
  /** Fallback text (usually initials) */
  fallback?: string;
  /** Alt text */
  alt?: string;
  /** Size of the avatar */
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  /** Shape of the avatar */
  shape?: "circle" | "rounded";
  /** Class name for the container */
  className?: string;
}

const avatarSizeClasses = {
  xs: "h-6 w-6 text-xs",
  sm: "h-8 w-8 text-sm",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-16 w-16 text-lg",
};

export function Avatar({
  src,
  fallback,
  alt = "Avatar",
  size = "md",
  shape = "circle",
  className,
}: AvatarProps) {
  const initials = fallback?.slice(0, 2).toUpperCase() || "?";

  return (
    <div
      className={cn(
        "relative overflow-hidden flex items-center justify-center",
        "bg-primary-100 text-primary-600 font-medium",
        shape === "circle" ? "rounded-full" : "rounded-lg",
        avatarSizeClasses[size],
        className
      )}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
        />
      ) : (
        <span aria-hidden="true">{initials}</span>
      )}
    </div>
  );
}
