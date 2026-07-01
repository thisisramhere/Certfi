import React, { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

function ErrorBoundary({ children }: ErrorBoundaryProps) {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const handleError = useCallback((event: ErrorEvent) => {
    event.preventDefault();
    setHasError(true);
    setError(event.error || new Error('Unknown error'));
  }, []);

  useEffect(() => {
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, [handleError]);

  if (hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-6">
        <div className="text-center max-w-md mx-auto">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-neutral-800 mb-2">Something went wrong</h2>
          <p className="text-sm text-neutral-500 mb-6 leading-relaxed">
            An unexpected error occurred. Please try reloading the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-[#0F0F0F] text-white text-xs font-semibold px-5 py-3 rounded-lg hover:bg-neutral-800 transition-colors inline-flex items-center gap-2"
          >
            <RefreshCcw className="w-4 h-4" /> Reload Application
          </button>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}

export default ErrorBoundary;
