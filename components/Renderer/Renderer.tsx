import React from 'react'
import ReactResizeDetector from 'react-resize-detector'
import style from './Renderer.module.scss'
import * as THREE from 'three'

type Props = {
  initScene: Function
  onResize: Function
  renderScene: Function
}
class Renderer extends React.Component<Props> {
  canvas: HTMLCanvasElement
  renderer: THREE.WebGLRenderer
  gl: WebGLRenderingContext
  frameId: number

  static defaultProps = {
    initScene: () => {},
    onResize: () => {},
    renderScene: () => {},
  }

  componentDidMount = () => {
    this.canvas = document.getElementById('canvas') as HTMLCanvasElement
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
    })
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.gl = this.renderer.context
    this.props.initScene(this.renderer, this.gl)
    this.frameId = requestAnimationFrame(this.handleAnimationFrame)
  }

  componentWillUnmount = () => {
    cancelAnimationFrame(this.frameId)
  }

  handleResize = (width: number, height: number) => {
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
