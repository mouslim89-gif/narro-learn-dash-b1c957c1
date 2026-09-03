import { Component, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { useReadingProgressStore } from '@/stores/reading-progress';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return <ErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}

function ErrorFallback({ error }: { error?: Error }) {
  const darkMode = useReadingProgressStore((s) => s.darkMode);
  const isDark = darkMode ?? false;

  const handleReload = () => {
    window.location.href = '/';
  };

  return (
    <div className={`flex min-h-screen flex-col items-center justify-center px-6 ${isDark ? 'dark' : ''}`}>
      <div className="max-w-sm text-center">
        <h1 className="font-serif text-[32px] font-bold text-foreground">Something went wrong</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Tsundoku hit an unexpected problem. A report has been logged and you can safely restart the app.
        </p>
        {error && (
          <pre className="mt-4 max-h-32 overflow-auto rounded-lg bg-muted p-3 text-left text-[10px] text-muted-foreground">
            {error.message}
          </pre>
        )}
        <Button onClick={handleReload} className="mt-6 h-12 w-full rounded-full font-semibold">
          Restart Tsundoku
        </Button>
      </div>
    </div>
  );
}
