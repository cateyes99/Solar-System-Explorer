import { useThree } from '@react-three/fiber'
import { labelBridge } from '../../utils/labelBridge'

/**
 * Publishes the live camera and canvas size to the DOM label overlay
 * (`LabelOverlay`), which projects body names onto the screen outside of the
 * React Three Fiber reconciler.
 */
export function LabelBridge() {
  const camera = useThree((state) => state.camera)
  const size = useThree((state) => state.size)

  labelBridge.camera = camera
  labelBridge.width = size.width
  labelBridge.height = size.height

  return null
}
