import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback: ReactNode
}

interface State {
  hasError: boolean
}

/**
 * Keeps a WebGL / render failure from taking down the whole React tree —
 * the polished 2D fallback renders instead.
 */
export class SceneErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false }

  public static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  public componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('3D scene failed to render:', error, info)
  }

  public render(): ReactNode {
    return this.state.hasError ? this.props.fallback : this.props.children
  }
}
