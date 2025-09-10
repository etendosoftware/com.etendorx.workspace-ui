import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { logger } from "@/utils/logger";

interface ProcessDefaultsErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  processId?: string;
}

interface ProcessDefaultsErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorId: string | null;
}

/**
 * Error boundary specifically for process defaults functionality
 * Provides graceful error handling and recovery options
 */
export class ProcessDefaultsErrorBoundary extends Component<
  ProcessDefaultsErrorBoundaryProps,
  ProcessDefaultsErrorBoundaryState
> {
  constructor(props: ProcessDefaultsErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ProcessDefaultsErrorBoundaryState> {
    const errorId = `defaults_error_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { processId, onError } = this.props;
    const { errorId } = this.state;

    // Log error with context
    logger.error("ProcessDefaultsErrorBoundary: Error caught", {
      errorId,
      processId,
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: Date.now(),
    });

    // Call custom error handler if provided
    if (onError) {
      onError(error, errorInfo);
    }

    // Report error to monitoring service if available
    this.reportError(error, errorInfo);
  }

  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    const { processId } = this.props;
    const { errorId } = this.state;

    // This could integrate with error reporting services like Sentry
    const errorReport = {
      errorId,
      processId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      context: "ProcessDefaults",
    };

    // Log error report for now
    logger.error("Error report generated:", errorReport);
  };

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorId: null,
    });
  };

  render() {
    const { hasError, error, errorId } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback;
      }

      // Default error UI
      return (
        <div className="process-defaults-error-boundary">
          <div className="p-4 border border-red-200 rounded-lg bg-red-50">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-800">Process Defaults Error</h3>
                <p className="mt-1 text-sm text-red-700">
                  Failed to load default values for this process. You can continue without defaults or try again.
                </p>
                {errorId && <p className="mt-1 text-xs text-red-600">Error ID: {errorId}</p>}
                {process.env.NODE_ENV === "development" && error && (
                  <details className="mt-2">
                    <summary className="text-xs text-red-600 cursor-pointer">Error Details (Development)</summary>
                    <pre className="mt-1 text-xs text-red-600 whitespace-pre-wrap">
                      {error.message}
                      {error.stack && `\n\n${error.stack}`}
                    </pre>
                  </details>
                )}
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={this.handleRetry}
                className="text-sm bg-red-100 text-red-800 px-3 py-1 rounded hover:bg-red-200 transition-colors">
                Try Again
              </button>
              <button
                type="button"
                onClick={() => {
                  // Continue without defaults
                  this.setState({
                    hasError: false,
                    error: null,
                    errorId: null,
                  });
                }}
                className="text-sm bg-gray-100 text-gray-800 px-3 py-1 rounded hover:bg-gray-200 transition-colors">
                Continue Without Defaults
              </button>
            </div>
          </div>
        </div>
      );
    }

    return children;
  }
}

// Hook for using error boundary functionality
export const useProcessDefaultsErrorHandler = (processId?: string) => {
  const handleError = React.useCallback(
    (error: Error, errorInfo: ErrorInfo) => {
      logger.error("Process defaults error handled by hook", {
        processId,
        error: error.message,
        componentStack: errorInfo.componentStack,
      });
    },
    [processId]
  );

  return {
    handleError,
    ErrorBoundary: React.useCallback(
      ({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) => (
        <ProcessDefaultsErrorBoundary
          processId={processId}
          onError={handleError}
          fallback={fallback}
          data-testid="ProcessDefaultsErrorBoundary__967814">
          {children}
        </ProcessDefaultsErrorBoundary>
      ),
      [processId, handleError]
    ),
  };
};
