import Link from "next/link";
import { Home, IceCream } from "lucide-react";

/**
 * Custom 404 Not Found Page
 * 
 * Shows a fun message when users land on a page that doesn't exist.
 * Includes navigation back to home.
 */
export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg-app px-4">
      {/* Animated ice cream icon */}
      <div className="relative mb-8">
        <div className="animate-bounce">
          <IceCream 
            className="h-24 w-24 text-primary-600" 
            strokeWidth={1.5}
            aria-hidden="true" 
          />
        </div>
        {/* Melting drip effect */}
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3 h-6 bg-primary-600 rounded-full opacity-60 animate-pulse" />
      </div>

      {/* 404 text */}
      <h1 className="text-8xl font-bold text-primary-600 mb-4">
        404
      </h1>

      {/* Funny message */}
      <h2 className="text-2xl font-semibold text-text-primary mb-2 text-center">
        Oops! This scoop melted away
      </h2>
      
      <p className="text-text-muted text-center max-w-md mb-2">
        Looks like someone took a bite out of this page before you got here. 
        Either that, or our digital ice cream truck took a wrong turn.
      </p>

      <p className="text-sm text-text-muted italic mb-8">
        🍦 Error flavor: Page Not Found with extra sprinkles of confusion
      </p>

      {/* Back to home button */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
      >
        <Home className="h-5 w-5" aria-hidden="true" />
        Back to Dashboard
      </Link>

      {/* Fun footer */}
      <p className="mt-12 text-xs text-text-muted">
        Pro tip: Check the URL, or just blame the intern.
      </p>
    </div>
  );
}
