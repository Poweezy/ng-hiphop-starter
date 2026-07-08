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
        <div style={{ padding: '24px', textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'var(--font-condensed)', fontSize: '1.5rem', color: '#F87171' }}>
            Something went wrong
          </h2>
          <p style={{ color: 'var(--color-grey-blue)', marginTop: '8px' }}>
            {this.state.error.message}
          </p>
          <button
            onClick={this.reset}
            style={{
              marginTop: '16px',
              padding: '10px 24px',
              background: 'var(--gradient-green)',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontFamily: 'var(--font-condensed)',
              fontWeight: 700,
              letterSpacing: '0.08em',
            }}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
