import { Component, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback: ReactNode
  onError?: () => void
}

interface ErrorBoundaryState {
  hasError: boolean
}

/** Catches render/runtime errors from the 3D scene so a WebGL/driver failure can't crash the whole app. */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: unknown, info: unknown) {
    console.error('Solar System Explorer crashed:', error, info)
    this.props.onError?.()
  }

  render() {
    if (this.state.hasError) return this.props.fallback
    return this.props.children
  }
}
