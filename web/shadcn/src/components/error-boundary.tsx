import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('App Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center p-4 bg-background">
          <Card className="w-full max-w-md">
            <CardContent className="p-8 text-center space-y-4">
              <AlertTriangle className="h-12 w-12 mx-auto text-amber-500" />
              <h2 className="text-lg font-semibold">页面出现异常</h2>
              <p className="text-sm text-muted-foreground">
                {this.state.error?.message || '发生了意外错误，请刷新页面重试'}
              </p>
              <Button onClick={() => window.location.reload()}>
                <RefreshCw className="h-4 w-4 mr-2" /> 刷新页面
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
