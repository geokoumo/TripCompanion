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

  componentDidCatch(error: Error) {
    // The real error (which can be a raw Postgres/Zod message naming
    // internal tables, columns, or schema shape) is for the console, not
    // the screen — showing it to the user would be both confusing and a
    // information-leakage risk. ErrorState always gets a generic message.
    console.error('[ErrorBoundary]', error);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 'var(--screen-padding-top) var(--screen-padding-x)' }}>
          <ErrorState
            headline="Something went wrong"
            body="An unexpected error occurred. Try again, and if it keeps happening, restart the app."
            onRetry={() => this.setState({ error: null })}
          />
        </div>
      );
    }
    return this.props.children;
  }
}
