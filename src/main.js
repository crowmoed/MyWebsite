import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

// --- 1. CORE SETUP ---
const scene = new THREE.Scene()
const nightColor = 0x040812
scene.background = new THREE.Color(nightColor)
scene.fog = new THREE.FogExp2(0x0a1525, 0.008)

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 150)
camera.position.set(0, 25, 40)

const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#bg'),
  antialias: false, // Disabled for performance
  powerPreference: "high-performance"
})
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)) // Capped at 1.5
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.BasicShadowMap // Faster than PCFSoft

const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
controls.dampingFactor = 0.05
controls.maxPolarAngle = Math.PI / 2 - 0.1
controls.autoRotate = true
controls.autoRotateSpeed = 0.2

// --- 2. TEXTURE GENERATORS (Cached) ---
const textureCache = {}

function createSoftParticle() {
  if (textureCache.softParticle) return textureCache.softParticle
  
  const canvas = document.createElement('canvas')
  canvas.width = 32 // Reduced from 64
  canvas.height = 32
  const ctx = canvas.getContext('2d')
  const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16)
  gradient.addColorStop(0, 'rgba(255,255,255,1)')
  gradient.addColorStop(0.3, 'rgba(255,255,255,0.8)')
  gradient.addColorStop(0.6, 'rgba(255,255,255,0.3)')
  gradient.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 32, 32)
  
  textureCache.softParticle = new THREE.CanvasTexture(canvas)
  return textureCache.softParticle
}

function createSnowflakeTexture() {
  if (textureCache.snowflake) return textureCache.snowflake
  
  const canvas = document.createElement('canvas')
  canvas.width = 32 // Reduced from 64
  canvas.height = 32
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = 'rgba(0,0,0,0)'
  ctx.fillRect(0, 0, 32, 32)
  ctx.strokeStyle = 'rgba(255,255,255,0.9)'
  ctx.lineWidth = 1.5
  ctx.lineCap = 'round'
  
  ctx.translate(16, 16)
  for (let i = 0; i < 6; i++) {
    ctx.rotate(Math.PI / 3)
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(0, -12)
    ctx.moveTo(0, -5)
    ctx.lineTo(-3, -8)
    ctx.moveTo(0, -5)
    ctx.lineTo(3, -8)
    ctx.stroke()
  }
  
  textureCache.snowflake = new THREE.CanvasTexture(canvas)
  return textureCache.snowflake
}

function createSnowGroundTexture() {
  if (textureCache.snowGround) return textureCache.snowGround
  
  const canvas = document.createElement('canvas')
  canvas.width = 256 // Reduced from 512
  canvas.height = 256
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = '#e8f0ff'
  ctx.fillRect(0, 0, 256, 256)

  // Reduced noise iterations
  for (let i = 0; i < 5000; i++) { // Reduced from 30000
    const x = Math.random() * 256
    const y = Math.random() * 256
    const brightness = 200 + Math.random() * 55
    ctx.fillStyle = `rgba(${brightness}, ${brightness}, ${brightness + 5}, 0.6)`
    ctx.fillRect(x, y, 1, 1)
  }

  for (let i = 0; i < 100; i++) { // Reduced from 500
    const x = Math.random() * 256
    const y = Math.random() * 256
    const size = 2 + Math.random() * 4
    const darkness = 200 + Math.random() * 30
    ctx.fillStyle = `rgba(${darkness}, ${darkness}, ${darkness + 10}, 0.3)`
    ctx.beginPath()
    ctx.arc(x, y, size, 0, Math.PI * 2)
    ctx.fill()
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  textureCache.snowGround = texture
  return texture
}

// --- 3. LIGHTING SYSTEM ---
const ambientLight = new THREE.AmbientLight(0x4466aa, 0.35)
scene.add(ambientLight)

const moonLight = new THREE.DirectionalLight(0xaaccff, 0.7)
moonLight.position.set(100, 100, 50)
moonLight.castShadow = true
moonLight.shadow.mapSize.width = 1024 // Reduced from 2048
moonLight.shadow.mapSize.height = 1024
moonLight.shadow.camera.far = 300
moonLight.shadow.camera.left = -150
moonLight.shadow.camera.right = 150
moonLight.shadow.camera.top = 150
moonLight.shadow.camera.bottom = -150
moonLight.shadow.bias = -0.0005
scene.add(moonLight)

const rimLight = new THREE.DirectionalLight(0x223355, 0.25)
rimLight.position.set(-50, 30, -50)
scene.add(rimLight)

// --- 4. TERRAIN ENGINE ---
function getTerrainHeight(x, z) {
  return (Math.sin(x * 0.05) * 2) + (Math.cos(z * 0.05) * 2) + (Math.sin(x * 0.02 + z * 0.02) * 4)
}

const snowGroundTexture = createSnowGroundTexture()
const groundGeo = new THREE.PlaneGeometry(300, 300, 64, 64) // Reduced from 128
groundGeo.rotateX(-Math.PI / 2)

const uvs = groundGeo.attributes.uv
for (let i = 0; i < uvs.count; i++) {
  uvs.setXY(i, uvs.getX(i) * 20, uvs.getY(i) * 20)
}

const groundMat = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  roughness: 0.85,
  metalness: 0.05,
  map: snowGroundTexture
})

const posAttribute = groundGeo.attributes.position
for (let i = 0; i < posAttribute.count; i++) {
  const x = posAttribute.getX(i)
  const z = posAttribute.getZ(i)
  const y = getTerrainHeight(x, z)
  posAttribute.setY(i, y - 5)
}
groundGeo.computeVertexNormals()

const ground = new THREE.Mesh(groundGeo, groundMat)
ground.receiveShadow = true
scene.add(ground)

// --- 5. OPTIMIZED TREE FOREST ---
const treeCount = 800 
const loader = new GLTFLoader()
const treeInstances = []

loader.load(
  '/tree.glb',
  (gltf) => {
    const treeModel = gltf.scene
    
    treeModel.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })
    
    for (let i = 0; i < treeCount; i++) {
      const treeClone = treeModel.clone()
      
      const angle = Math.random() * Math.PI * 2
      const radiusRandom = Math.random()
      const radius = radiusRandom < 0.2 ? 
        12 + Math.random() * 40 :
        52 + Math.random() * 100
      
      const x = Math.cos(angle) * radius
      const z = Math.sin(angle) * radius
      const y = getTerrainHeight(x, z) - 5
      
      const distanceFactor = -radius / 152
      const scale = (0.13 + Math.random() * 0.1) * (1.2 - distanceFactor * 0.4)
      const rotY = Math.random() * Math.PI * 2
      
      treeClone.position.set(x, y, z)
      treeClone.scale.setScalar(scale)
      treeClone.rotation.y = rotY
      
      scene.add(treeClone)
      treeInstances.push(treeClone)
    }
  }
)

// --- 6. OPTIMIZED SNOW SYSTEM ---
const softParticleTex = createSoftParticle()
const snowflakeTex = createSnowflakeTexture()

const wind = {
  baseX: 0.02,
  baseZ: 0.01,
  gustX: 0,
  gustZ: 0,
  gustStrength: 0,
  gustTime: 0,
  nextGust: 2
}

// MERGED LAYERS: Combined bg + main + dust into single system
const mergedSnowCount = 8000 // Reduced from 25000 total
const mergedSnowGeo = new THREE.BufferGeometry()
const mergedSnowPos = new Float32Array(mergedSnowCount * 3)
const mergedSnowSizes = new Float32Array(mergedSnowCount)
const mergedSnowData = []

for (let i = 0; i < mergedSnowCount; i++) {
  mergedSnowPos[i * 3] = (Math.random() - 0.5) * 100
  mergedSnowPos[i * 3 + 1] = Math.random() * 120 - 25
  mergedSnowPos[i * 3 + 2] = (Math.random() - 0.5) * 100
  
  const sizeVar = Math.random()
  mergedSnowSizes[i] = 0.2 + sizeVar * 0.4
  
  mergedSnowData.push({
    fallSpeed: 0.03 + Math.random() * 0.05,
    driftPhase: Math.random() * Math.PI * 2,
    driftFreq: 0.5 + Math.random() * 1.5,
    driftAmp: 0.015 + Math.random() * 0.025
  })
}

mergedSnowGeo.setAttribute('position', new THREE.BufferAttribute(mergedSnowPos, 3))
mergedSnowGeo.setAttribute('size', new THREE.BufferAttribute(mergedSnowSizes, 1))

const mergedSnowMat = new THREE.ShaderMaterial({
  uniforms: {
    uTexture: { value: softParticleTex },
    uTime: { value: 0 }
  },
  vertexShader: `
    attribute float size;
    varying float vAlpha;
    void main() {
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = size * (200.0 / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;
      float dist = length(mvPosition.xyz);
      vAlpha = smoothstep(150.0, 10.0, dist) * 0.7;
    }
  `,
  fragmentShader: `
    uniform sampler2D uTexture;
    varying float vAlpha;
    void main() {
      vec4 texColor = texture2D(uTexture, gl_PointCoord);
      gl_FragColor = vec4(1.0, 1.0, 1.0, texColor.a * vAlpha);
    }
  `,
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending
})

const mergedSnowSystem = new THREE.Points(mergedSnowGeo, mergedSnowMat)
scene.add(mergedSnowSystem)

// Close-up flakes - Reduced count
const closeSnowCount = 1000 
const closeSnowGeo = new THREE.BufferGeometry()
const closeSnowPos = new Float32Array(closeSnowCount * 3)
const closeSnowSizes = new Float32Array(closeSnowCount)
const closeSnowRotations = new Float32Array(closeSnowCount)
const closeSnowData = []

for (let i = 0; i < closeSnowCount; i++) {
  closeSnowPos[i * 3] = (Math.random() - 0.5) * 30
  closeSnowPos[i * 3 + 1] = Math.random() * 50 - 10
  closeSnowPos[i * 3 + 2] = (Math.random() - 0.5) * 30
  closeSnowSizes[i] = 0.8 + Math.random() * 1.2
  closeSnowRotations[i] = Math.random() * Math.PI * 2
  
  closeSnowData.push({
    fallSpeed: 0.02 + Math.random() * 0.03,
    tumbleSpeed: (Math.random() - 0.5) * 0.05,
    swayPhase: Math.random() * Math.PI * 2,
    swayFreq: 0.5 + Math.random() * 0.5,
    swayAmp: 0.05 + Math.random() * 0.1,
    zWobble: Math.random() * Math.PI * 2
  })
}

closeSnowGeo.setAttribute('position', new THREE.BufferAttribute(closeSnowPos, 3))
closeSnowGeo.setAttribute('size', new THREE.BufferAttribute(closeSnowSizes, 1))
closeSnowGeo.setAttribute('rotation', new THREE.BufferAttribute(closeSnowRotations, 1))

const closeSnowMat = new THREE.ShaderMaterial({
  uniforms: {
    uTexture: { value: snowflakeTex },
    uTime: { value: 0 }
  },
  vertexShader: `
    attribute float size;
    attribute float rotation;
    varying float vRotation;
    varying float vAlpha;
    void main() {
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = size * (150.0 / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;
      vRotation = rotation;
      float dist = length(mvPosition.xyz);
      vAlpha = smoothstep(60.0, 5.0, dist) * 0.7;
    }
  `,
  fragmentShader: `
    uniform sampler2D uTexture;
    varying float vRotation;
    varying float vAlpha;
    void main() {
      vec2 center = gl_PointCoord - 0.5;
      float c = cos(vRotation);
      float s = sin(vRotation);
      vec2 rotated = vec2(c * center.x - s * center.y, s * center.x + c * center.y) + 0.5;
      vec4 texColor = texture2D(uTexture, rotated);
      gl_FragColor = vec4(1.0, 1.0, 1.0, texColor.a * vAlpha);
    }
  `,
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending
})

const closeSnowSystem = new THREE.Points(closeSnowGeo, closeSnowMat)
scene.add(closeSnowSystem)

// Vortex - Reduced count
const vortexCount = 300 // Reduced from 1000
const vortexGeo = new THREE.BufferGeometry()
const vortexPos = new Float32Array(vortexCount * 3)
const vortexData = []

for (let i = 0; i < vortexCount; i++) {
  const angle = Math.random() * Math.PI * 2
  const radius = 5 + Math.random() * 60
  const height = Math.random() * 80 - 10
  
  vortexPos[i * 3] = Math.cos(angle) * radius
  vortexPos[i * 3 + 1] = height
  vortexPos[i * 3 + 2] = Math.sin(angle) * radius
  
  vortexData.push({
    angle: angle,
    radius: radius,
    baseHeight: height,
    orbitSpeed: (0.1 + Math.random() * 0.2) * (Math.random() > 0.5 ? 1 : -1),
    verticalSpeed: 0.02 + Math.random() * 0.03,
    radiusOscillation: Math.random() * Math.PI * 2,
    radiusOscSpeed: 0.5 + Math.random() * 0.5
  })
}

vortexGeo.setAttribute('position', new THREE.BufferAttribute(vortexPos, 3))

const vortexMat = new THREE.PointsMaterial({
  size: 0.35,
  color: 0xffffff,
  map: softParticleTex,
  transparent: true,
  opacity: 0.4,
  depthWrite: false,
  blending: THREE.AdditiveBlending
})

const vortexSystem = new THREE.Points(vortexGeo, vortexMat)
scene.add(vortexSystem)

const clock = new THREE.Clock()
let frameCount = 0

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
}
window.addEventListener('resize', onWindowResize, false)

function updateWind(time, delta) {
  wind.gustTime += delta
  if (wind.gustTime > wind.nextGust) {
    wind.gustTime = 0
    wind.nextGust = 3 + Math.random() * 5
    wind.gustStrength = 0.5 + Math.random() * 1.5
    wind.gustX = (Math.random() - 0.5) * 0.15
    wind.gustZ = (Math.random() - 0.5) * 0.15
  }
  wind.gustStrength *= 0.98
  wind.baseX = Math.sin(time * 0.1) * 0.02 + 0.01
  wind.baseZ = Math.cos(time * 0.15) * 0.015
}

function animate() {
  requestAnimationFrame(animate)
  
  const time = clock.getElapsedTime()
  const delta = clock.getDelta()
  frameCount++
  
  updateWind(time, delta)
  
  const windX = wind.baseX + wind.gustX * wind.gustStrength
  const windZ = wind.baseZ + wind.gustZ * wind.gustStrength
  
  mergedSnowMat.uniforms.uTime.value = time
  closeSnowMat.uniforms.uTime.value = time
  
  // Merged snow update
  const mergedPos = mergedSnowSystem.geometry.attributes.position.array
  for (let i = 0; i < mergedSnowCount; i++) {
    const d = mergedSnowData[i]
    const drift = Math.sin(time * d.driftFreq + d.driftPhase) * d.driftAmp
    
    mergedPos[i * 3] += windX * 0.7 + drift
    mergedPos[i * 3 + 1] -= d.fallSpeed
    mergedPos[i * 3 + 2] += windZ * 0.7 + Math.cos(time * d.driftFreq + d.driftPhase) * d.driftAmp * 0.5
    
    if (mergedPos[i * 3 + 1] < -25) {
      mergedPos[i * 3 + 1] = 95
      mergedPos[i * 3] = (Math.random() - 0.5) * 300
      mergedPos[i * 3 + 2] = (Math.random() - 0.5) * 300
    }
    
    if (mergedPos[i * 3] > 150) mergedPos[i * 3] -= 300
    if (mergedPos[i * 3] < -150) mergedPos[i * 3] += 300
    if (mergedPos[i * 3 + 2] > 150) mergedPos[i * 3 + 2] -= 300
    if (mergedPos[i * 3 + 2] < -150) mergedPos[i * 3 + 2] += 300
  }
  mergedSnowSystem.geometry.attributes.position.needsUpdate = true
  
  // Close-up flakes update
  const closePos = closeSnowSystem.geometry.attributes.position.array
  const closeRot = closeSnowSystem.geometry.attributes.rotation.array
  for (let i = 0; i < closeSnowCount; i++) {
    const d = closeSnowData[i]
    const sway = Math.sin(time * d.swayFreq + d.swayPhase) * d.swayAmp
    
    closePos[i * 3] += windX * 1.5 + sway
    closePos[i * 3 + 1] -= d.fallSpeed
    closePos[i * 3 + 2] += windZ * 1.5 + Math.sin(time * 0.7 + d.zWobble) * d.swayAmp * 0.5
    closeRot[i] += d.tumbleSpeed
    
    if (closePos[i * 3 + 1] < -10) {
      closePos[i * 3 + 1] = 40
      closePos[i * 3] = (Math.random() - 0.5) * 60
      closePos[i * 3 + 2] = (Math.random() - 0.5) * 60
    }
    
    if (closePos[i * 3] > 30) closePos[i * 3] -= 60
    if (closePos[i * 3] < -30) closePos[i * 3] += 60
    if (closePos[i * 3 + 2] > 30) closePos[i * 3 + 2] -= 60
    if (closePos[i * 3 + 2] < -30) closePos[i * 3 + 2] += 60
  }
  closeSnowSystem.geometry.attributes.position.needsUpdate = true
  closeSnowSystem.geometry.attributes.rotation.needsUpdate = true
  
  // Vortex update (every other frame)
  if (frameCount % 2 === 0) {
    const vortexPosArr = vortexSystem.geometry.attributes.position.array
    for (let i = 0; i < vortexCount; i++) {
      const d = vortexData[i]
      d.angle += d.orbitSpeed * 0.01
      const radiusNow = d.radius + Math.sin(time * d.radiusOscSpeed + d.radiusOscillation) * 5
      
      vortexPosArr[i * 3] = Math.cos(d.angle) * radiusNow + windX * 20
      vortexPosArr[i * 3 + 1] -= d.verticalSpeed
      vortexPosArr[i * 3 + 2] = Math.sin(d.angle) * radiusNow + windZ * 20
      
      if (vortexPosArr[i * 3 + 1] < -10) {
        vortexPosArr[i * 3 + 1] = 70
        d.radius = 5 + Math.random() * 60
      }
    }
    vortexSystem.geometry.attributes.position.needsUpdate = true
  }
  
  controls.update()
  renderer.render(scene, camera)
}

animate()