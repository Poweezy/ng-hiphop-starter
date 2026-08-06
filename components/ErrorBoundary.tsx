'use client';

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface State {
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: any) {
    console.error('ErrorBoundary caught:', error, info);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.reset);
      }

      return (
        <div className="error-boundary">
          <h2 className="error-boundary-title">Something went wrong</h2>
          <p className="error-boundary-message">{this.state.error.message}</p>
          <button onClick={this.reset} className="error-boundary-btn">
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
