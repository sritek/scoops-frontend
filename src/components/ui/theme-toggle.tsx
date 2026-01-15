"use client";

import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Theme Toggle Component
 *
 * Displays current theme icon and cycles through themes on click.
 * Designed to be used inside a DropdownMenuItem.
 *
 * Theme cycle: system → light → dark → system
 */
export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  const cycleTheme = () => {
    if (theme === "system") {
      setTheme("light");
    } else if (theme === "light") {
      setTheme("dark");
    } else {
      setTheme("system");
    }
  };

  // Get the label based on current theme
  const getLabel = () => {
    if (!mounted) return "Theme";
    if (theme === "system") return "System theme";
    if (theme === "light") return "Light mode";
    return "Dark mode";
  };

  // Get the icon based on current theme
  const Icon = () => {
    if (!mounted) {
      return <Monitor className="mr-2 h-4 w-4" aria-hidden="true" />;
    }
    if (theme === "system") {
      return <Monitor className="mr-2 h-4 w-4" aria-hidden="true" />;
    }
    if (theme === "light") {
      return <Sun className="mr-2 h-4 w-4" aria-hidden="true" />;
    }
    return <Moon className="mr-2 h-4 w-4" aria-hidden="true" />;
  };

  return (
    <button
      type="button"
      onClick={cycleTheme}
      className={cn(
        "flex w-full items-center rounded-sm px-2 py-1.5 text-sm",
        "hover:bg-bg-app focus:bg-bg-app",
        "outline-none cursor-pointer"
      )}
    >
      <Icon />
      {getLabel()}
    </button>
  );
}

/**
 * Hook to get theme information for custom implementations
 */
export function useAppTheme() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return {
    theme,
    setTheme,
    resolvedTheme,
    mounted,
    isDark: mounted && resolvedTheme === "dark",
    isLight: mounted && resolvedTheme === "light",
    isSystem: mounted && theme === "system",
  };
}
