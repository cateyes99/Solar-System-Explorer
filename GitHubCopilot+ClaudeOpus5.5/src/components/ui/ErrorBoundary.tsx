import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  fallback: (error: Error) => ReactNode
  children: ReactNode
}

interface State {
  error: Error | null
}

/** Keeps a 3D failure from taking down the rest of the app. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('3D scene failed:', error, info.componentStack)
  }

  render() {
    if (this.state.error) return this.props.fallback(this.state.error)
    return this.props.children
  }
}
