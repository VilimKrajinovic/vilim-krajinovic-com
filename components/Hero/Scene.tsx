import React, { useState, ReactPropTypes, Component } from 'react'

import * as THREE from 'three'
import Renderer from 'components/Renderer/Renderer'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

export class Scene extends React.Component {
  scene: THREE.Scene
  cube: THREE.Mesh
  camera: THREE.PerspectiveCamera
  material: THREE.MeshPhongMaterial
  modelContainer: THREE.Group

  onResize = (renderer, gl, { width, height }) => {
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
  }

  initScene = (renderer, gl) => {
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

    this.camera = new THREE.PerspectiveCamera(75, 16 / 9, 0.1, 1000)
    this.camera.position.z = 4
    renderer.setClearColor('#000000')
  }

  renderScene = (renderer, gl) => {
    if (this.modelContainer) {
      this.modelContainer.rotation.y += 0.001
    }
    renderer.render(this.scene, this.camera)
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
