import React, { useState, ReactPropTypes, Component } from 'react'

import * as THREE from 'three'
import Renderer from 'components/Renderer/Renderer'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass'

import RippleShader from 'components/Hero/RippleShader'

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

  onResize = (renderer, gl, { width, height }) => {
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
  }

  addRipple(event) {
    console.log(this.ripples)
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

        console.log(this.easeOutQuart)
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

  initScene = (renderer, gl) => {
    this.rippleCanvas = document.createElement('canvas')
    this.rippleCanvas.width = window.innerWidth
    this.rippleCanvas.height = window.innerHeight

    this.rippleContext = this.rippleCanvas.getContext('2d')
    this.rippleTexture = new THREE.Texture(this.rippleCanvas)
    this.rippleTexture.minFilter = THREE.NearestFilter
    this.rippleTexture.magFilter = THREE.NearestFilter

    window.addEventListener('click', this.addRipple.bind(this))

    this.linear = (t) => t
    this.easeOutQuart = (t) => 1 - --t * t * t * t

    this.material = new THREE.MeshPhongMaterial({
      color: '#ffffff',
      specular: '#000000',
    })
    this.scene = new THREE.Scene()

    const loader = new GLTFLoader()
    this.modelContainer = new THREE.Group()
    this.scene.add(this.modelContainer)

    loader.load(
      './VK.glb',
      (gltf) => {
        this.modelContainer.add(gltf.scene)
        this.modelContainer.scale.set(10, 10, 10)
        // this.model.rotateX(90)
      },
      undefined,
      console.error
    )

    const light1 = new THREE.PointLight('#00aaff', 1.0)
    light1.position.set(-5, 5, -5)
    light1.distance = 20
    const light2 = new THREE.PointLight('#00aaff', 1.0)
    light2.position.set(-5, 0, 5)
    light2.distance = 20
    const light3 = new THREE.PointLight('#ff00ff', 1.0)
    light3.position.set(5, 0, 0)
    light3.distance = 20

    this.scene.add(light1)
    this.scene.add(light2)
    this.scene.add(light3)

    this.camera = new THREE.PerspectiveCamera(20, 16 / 9, 0.1, 20)
    this.camera.position.z = 10

    this.finalComposer = new EffectComposer(renderer)
    this.finalComposer.addPass(new RenderPass(this.scene, this.camera))

    const ripplePass = new ShaderPass(RippleShader())
    //@ts-ignore
    ripplePass.uniforms.tRipple.value = this.rippleTexture
    ripplePass.needsSwap = false
    this.finalComposer.addPass(ripplePass)

    renderer.setClearColor('#000000')
  }

  renderScene = (renderer, gl) => {
    const delta = this.clock.getDelta()
    if (this.modelContainer) {
      this.modelContainer.rotation.y += 0.001
    }

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
