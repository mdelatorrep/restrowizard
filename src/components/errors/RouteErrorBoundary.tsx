import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface State {
  error: Error | null;
}

interface Props {
  children: React.ReactNode;
  /** Optional custom fallback render */
  fallback?: (error: Error, reset: () => void) => React.ReactNode;
  /** Optional context label for telemetry */
  label?: string;
}

/**
 * Route-level error boundary. Catches render errors in child trees so a broken
 * module doesn't take down the whole shell. Use around routes or large widgets.
 */
export class RouteErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error(`[RouteErrorBoundary${this.props.label ? `:${this.props.label}` : ""}]`, error, info);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback(this.state.error, this.reset);
      return (
        <div className="min-h-[50vh] flex items-center justify-center p-6">
          <div className="max-w-md w-full rounded-2xl border bg-card p-6 text-center space-y-4">
            <div className="mx-auto h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <div className="space-y-1">
              <h2 className="font-headline text-lg font-semibold">Algo salió mal</h2>
              <p className="text-sm text-muted-foreground">
                No pudimos cargar esta sección. Intenta de nuevo o vuelve más tarde.
              </p>
            </div>
            <div className="flex justify-center gap-2">
              <Button onClick={this.reset} variant="default">
                <RefreshCw className="h-4 w-4 mr-2" /> Reintentar
              </Button>
              <Button onClick={() => window.location.assign("/")} variant="outline">
                Ir al inicio
              </Button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
