import ReactResizeDetector from 'react-resize-detector'
import style from './Renderer.module.scss'
import * as THREE from 'three'

type Props = {
  initScene: Function
  onResize: Function
  renderScene: Function
}
class Renderer extends React.Component<Props> {
  canvas
  renderer: THREE.WebGLRenderer
  gl
  frameId
  static defaultProps = {
    initScene: () => {},
    onResize: () => {},
    renderScene: () => {},
  }

  componentDidMount = () => {
    this.canvas = document.getElementById('canvas')
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
    })
    this.gl = this.renderer.context
    this.props.initScene(this.renderer, this.gl)
    this.frameId = requestAnimationFrame(this.handleAnimationFrame)
  }

  componentWillUnmount = () => {
    cancelAnimationFrame(this.frameId)
  }

  handleResize = (width, height) => {
    this.renderer.setSize(width, height)
    this.props.onResize(this.renderer, this.gl, { width, height })
  }

  handleAnimationFrame = () => {
    this.props.renderScene(this.renderer, this.gl)
    this.frameId = window.requestAnimationFrame(this.handleAnimationFrame)
  }

  render = () => {
    return (
      <>
        <canvas id={'canvas'} className={style.canvas} />
        <ReactResizeDetector
          onResize={this.handleResize}
          handleWidth={true}
          handleHeight={true}
        />
      </>
    )
  }
}

export default Renderer
