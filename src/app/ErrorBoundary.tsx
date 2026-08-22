import { Component, type ReactNode } from 'react';

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
        <div style={{ padding: 32, fontFamily: 'sans-serif' }}>
          <h1>Κάτι πήγε στραβά</h1>
          <p>{this.state.error.message}</p>
          <button onClick={() => this.setState({ error: null })}>Δοκίμασε ξανά</button>
        </div>
      );
    }
    return this.props.children;
  }
}
