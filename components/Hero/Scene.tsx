import RippleShader from 'components/Hero/shaders/RippleShader'
import Renderer from 'components/Renderer/Renderer'
import React from 'react'
import * as THREE from 'three'
import { WebGLRenderer, WebGLRenderTarget } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass'
import VolumetricLightCylinder from 'components/Hero/shaders/VolumetricLightCylinder'
import VolumetricLightScattering from 'components/Hero/shaders/VolumetricLightScattering'
import AdditiveShader from 'components/Hero/shaders/AdditiveShader'

type Ripple = {
  age: number
  position: THREE.Vector2
  color: THREE.Vector2
}

export class Scene extends React.Component {
  scene: THREE.Scene
  cube: THREE.Mesh
  camera: THREE.PerspectiveCamera
  material: THREE.MeshPhongMaterial
  modelContainer: THREE.Group
  backLight: THREE.PointLight

  rippleCanvas: HTMLCanvasElement
  rippleContext: CanvasRenderingContext2D
  rippleTexture: THREE.Texture
  ripples: Ripple[] = []
  RIPPLE_SPEED = 0.3
  RIPPLE_PEAK = 0.2
  linear: Function
  easeOutQuart: Function
  rippleWasRendering: Boolean = false

  finalComposer: EffectComposer
  clock: THREE.Clock = new THREE.Clock()

  DEFAULT_LAYER = 0
  OCCLUSION_LAYER = 1

  occlusionCamera: THREE.PerspectiveCamera
  occlusionRenderTarget: THREE.WebGLRenderTarget
  occlusionComposer: EffectComposer
  lightScatteringPass: ShaderPass
  lightGeometry: THREE.CylinderGeometry
  lightCone: THREE.Mesh
  lightConeTarget: THREE.Vector3
  lightCylinderMaterial: THREE.ShaderMaterial

  effectComposer: EffectComposer
  effectRenderTarget: WebGLRenderTarget

  initScene = (renderer, gl) => {
    this.scene = new THREE.Scene()

    this.camera = new THREE.PerspectiveCamera(20, 16 / 9, 0.1, 100)
    this.camera.position.z = 10

    this.rippleCanvas = document.createElement('canvas')
    this.rippleCanvas.width = window.innerWidth
    this.rippleCanvas.height = window.innerHeight

    this.rippleContext = this.rippleCanvas.getContext('2d')
    this.rippleTexture = new THREE.Texture(this.rippleCanvas)
    this.rippleTexture.minFilter = THREE.NearestFilter
    this.rippleTexture.magFilter = THREE.NearestFilter
    this.linear = (t) => t
    this.easeOutQuart = (t) => 1 - --t * t * t * t

    this.occlusionCamera = this.camera.clone()
    this.occlusionCamera.layers.set(this.OCCLUSION_LAYER)
    this.occlusionRenderTarget = new THREE.WebGLRenderTarget(
      window.innerWidth,
      window.innerHeight
    )
    this.occlusionComposer = new EffectComposer(
      renderer,
      this.occlusionRenderTarget
    )
    this.occlusionComposer.renderToScreen = false
    this.occlusionComposer.addPass(
      new RenderPass(this.scene, this.occlusionCamera)
    )
    this.lightScatteringPass = new ShaderPass(VolumetricLightScattering())
    this.lightScatteringPass.needsSwap = false
    this.occlusionComposer.addPass(this.lightScatteringPass)

    this.lightGeometry = new THREE.CylinderGeometry(3, 6, 15, 32, 6, true)
    this.lightGeometry.applyMatrix4(
      new THREE.Matrix4().makeTranslation(
        0,
        -this.lightGeometry.parameters.height / 2,
        0
      )
    )
    this.lightGeometry.applyMatrix4(
      new THREE.Matrix4().makeRotationX(-Math.PI / 2)
    )
    this.lightCylinderMaterial = new THREE.ShaderMaterial(
      VolumetricLightCylinder()
    )
    this.lightConeTarget = new THREE.Vector3(0, 0, -8)
    this.lightCone = new THREE.Mesh(
      this.lightGeometry,
      this.lightCylinderMaterial
    )
    this.lightCone.position.set(-5, 5, -8)
    this.lightCone.layers.set(this.OCCLUSION_LAYER)
    this.lightCylinderMaterial.uniforms.spotPosition.value = this.lightCone.position
    this.scene.add(this.lightCone)

    this.material = new THREE.MeshPhongMaterial({
      color: '#ffffff',
      specular: '#000000',
    })

    const loader = new GLTFLoader()
    this.modelContainer = new THREE.Group()
    this.modelContainer.layers.enable(this.OCCLUSION_LAYER)
    this.scene.add(this.modelContainer)

    loader.load(
      './VK.glb',
      (gltf) => {
        const gltfScene = gltf.scene
        gltfScene.scale.set(10, 10, 10)
        this.modelContainer.add(gltfScene)

        const occlusionScene = gltfScene.clone()
        const blackMaterial = new THREE.MeshBasicMaterial({
          color: new THREE.Color(0x000000),
        })

        occlusionScene.traverse((node) => {
          if (node.material) {
            node.material = blackMaterial
          }
          if (node.layers) {
            node.layers.set(this.OCCLUSION_LAYER)
          }
        })
        this.modelContainer.add(occlusionScene)
      },
      undefined,
      console.error
    )

    this.backLight = new THREE.PointLight('#00aaff', 1.0)
    this.backLight.position.set(-5, 5, -5)
    this.backLight.distance = 20
    const light2 = new THREE.PointLight('#00aaff', 1.0)
    light2.position.set(-5, 0, 5)
    light2.distance = 20
    const light3 = new THREE.PointLight('#ff00ff', 1.0)
    light3.position.set(5, 0, 0)
    light3.distance = 20

    this.backLight.layers.enable(this.OCCLUSION_LAYER)
    light2.layers.enable(this.OCCLUSION_LAYER)
    light3.layers.enable(this.OCCLUSION_LAYER)

    this.scene.add(this.backLight)
    this.scene.add(light2)
    this.scene.add(light3)

    const additivePass = new ShaderPass(AdditiveShader())
    additivePass.uniforms.tAdd.value = this.occlusionRenderTarget.texture

    const ripplePass = new ShaderPass(RippleShader())
    //@ts-ignore
    ripplePass.uniforms.tRipple.value = this.rippleTexture
    ripplePass.needsSwap = false

    this.effectRenderTarget = new WebGLRenderTarget(
      window.innerWidth,
      window.innerHeight
    )
    this.effectComposer = new EffectComposer(renderer, this.effectRenderTarget)
    this.effectComposer.renderToScreen = false
    this.effectComposer.addPass(additivePass)
    this.effectComposer.addPass(ripplePass)

    this.finalComposer = new EffectComposer(renderer)
    this.finalComposer.addPass(new RenderPass(this.scene, this.camera))
    this.finalComposer.addPass(additivePass)
    this.finalComposer.addPass(ripplePass)

    renderer.setClearColor('#000000')

    window.addEventListener('click', this.addRipple.bind(this))
    window.addEventListener('mousemove', this.mouseMove.bind(this))
  }

  mouseMove(e) {
    this.lightCone.position.x = 5 * ((e.clientX / window.innerWidth) * 2 - 1)
    this.backLight.position.x = this.lightCone.position.x
  }

  onResize = (renderer: WebGLRenderer, gl, { width, height }) => {
    this.occlusionComposer.setSize(
      window.innerWidth * 0.5,
      window.innerHeight * 0.5
    )

    this.rippleCanvas.width = width
    this.rippleCanvas.height = height
    renderer.setSize(window.innerWidth, window.innerHeight)
    this.camera.aspect = width / height
    this.occlusionCamera.aspect = this.camera.aspect
    this.occlusionCamera.updateProjectionMatrix()
    this.camera.updateProjectionMatrix()
  }

  addRipple(event) {
    this.ripples.push({
      age: 0,
      position: new THREE.Vector2(event.clientX, event.clientY),
      color: new THREE.Vector2(
        (event.clientX / window.innerWidth) * 255,
        (event.clientY / window.innerHeight) * 255
      ),
    })
  }

  renderRipples(delta) {
    if (this.ripples.length) {
      this.rippleWasRendering = true

      this.rippleContext.fillStyle = 'rgb(128, 128, 0)'
      this.rippleContext.fillRect(
        0,
        0,
        this.rippleCanvas.width,
        this.rippleCanvas.height
      )

      this.ripples.forEach((ripple, i) => {
        ripple.age += delta * this.RIPPLE_SPEED

        if (ripple.age > 1) {
          this.ripples.splice(i, 1)
          return
        }

        const size = this.rippleCanvas.height * this.easeOutQuart(ripple.age)

        const alpha =
          ripple.age < this.RIPPLE_PEAK
            ? this.easeOutQuart(ripple.age / this.RIPPLE_PEAK)
            : 1 -
              this.linear(
                (ripple.age - this.RIPPLE_PEAK) / (1 - this.RIPPLE_PEAK)
              )

        let grd = this.rippleContext.createRadialGradient(
          ripple.position.x,
          ripple.position.y,
          size * 0.25,
          ripple.position.x,
          ripple.position.y,
          size
        )

        grd.addColorStop(1, `rgba(128, 128, 0, 0.5)`)
        grd.addColorStop(
          0.8,
          `rgba(${ripple.color.x}, ${ripple.color.y}, ${16 * alpha}, ${alpha})`
        )
        grd.addColorStop(0, `rgba(0, 0, 0, 0)`)

        this.rippleContext.beginPath()
        this.rippleContext.fillStyle = grd
        this.rippleContext.arc(
          ripple.position.x,
          ripple.position.y,
          size,
          0,
          Math.PI * 2
        )
        this.rippleContext.fill()
      })

      this.rippleTexture.needsUpdate = true
    } else if (this.rippleWasRendering) {
      this.rippleContext.fillStyle = 'rgb(128, 128, 0)'
      this.rippleContext.fillRect(
        0,
        0,
        this.rippleCanvas.width,
        this.rippleCanvas.height
      )

      this.rippleWasRendering = false
      this.rippleTexture.needsUpdate = true
    }
  }

  renderScene = (renderer: WebGLRenderer, gl) => {
    const delta = this.clock.getDelta()
    if (this.modelContainer) {
      this.modelContainer.rotation.y += delta * 0.5
    }

    this.lightCone.lookAt(this.lightConeTarget)
    this.lightCylinderMaterial.uniforms.spotPosition.value = this.lightCone.position
    const lightConePosition = this.lightCone.position.clone()
    const vector = lightConePosition.project(this.occlusionCamera)
    this.lightScatteringPass.uniforms.lightPosition.value.set(
      (vector.x + 1) / 2,
      (vector.y + 1) / 2
    )

    renderer.setRenderTarget(this.occlusionRenderTarget)
    this.occlusionComposer.render()

    renderer.setRenderTarget(this.effectRenderTarget)
    this.effectComposer.render()

    renderer.setRenderTarget(null)
    this.finalComposer.render()

    this.renderRipples(delta)
  }

  render() {
    return (
      <Renderer
        onResize={this.onResize}
        initScene={this.initScene}
        renderScene={this.renderScene}
      />
    )
  }
}
