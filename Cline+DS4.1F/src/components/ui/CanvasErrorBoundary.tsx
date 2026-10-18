import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { Fallback2D } from './Fallback2D'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

/**
 * Keeps a WebGL failure from taking the whole page down.
 *
 * If anything inside the canvas throws — a lost context, a driver problem, an
 * unsupported extension — we catch it here and show the 2D Solar System instead,
 * with the rest of the interface still perfectly usable.
 */
export class CanvasErrorBoundary extends Component<Props, State> {
  override state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    if (import.meta.env.DEV) {
      window.console.warn('The 3D scene failed and the 2D fallback took over.', error, info)
    }
  }

  override render(): ReactNode {
    if (this.state.error) {
      return <Fallback2D reason={this.state.error.message} />
    }
    return this.props.children
  }
}