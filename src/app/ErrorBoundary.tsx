import { Component, type ReactNode } from 'react';
import { ErrorState } from '../shared/components/ErrorState';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 'var(--screen-padding-top) var(--screen-padding-x)' }}>
          <ErrorState
            headline="Something went wrong"
            body={this.state.error.message || 'An unexpected error occurred.'}
            onRetry={() => this.setState({ error: null })}
          />
        </div>
      );
    }
    return this.props.children;
  }
}
