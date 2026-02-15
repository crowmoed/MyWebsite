


import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js'

// --- MOBILE DETECTION & PERFORMANCE SETTINGS ---
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;

const SETTINGS = isMobile ? {
  // Mobile: aggressive optimization
  bgSnowCount: 8000,
  mainSnowCount: 6000,
  closeSnowCount: 400,
  vortexCount: 150,
  sparkleCount: 200,
  wispCount: 300,
  dustCount: 5000,
  treeCount: 800, // Reduced from 1500
  groundSegments: 64,
  shadowMapSize: 1024,
  pixelRatio: 1,
  enableShadows: false,
  autoRotate: false,
  fogDensity: 0.02,
  textureSize: 32
} : {
  // Desktop: full quality
  bgSnowCount: 50000,
  mainSnowCount: 40000,
  closeSnowCount: 3000,
  vortexCount: 1000,
  sparkleCount: 1000,
  wispCount: 2000,
  dustCount: 30000,
  treeCount: 800, // Reduced from 1500 but better distributed
  groundSegments: 128,
  shadowMapSize: 4096,
  pixelRatio: Math.min(window.devicePixelRatio, 2),
  enableShadows: true,
  autoRotate: true,
  fogDensity: 0.008,
  textureSize: 32
};

// --- 1. CORE SETUP ---
const scene = new THREE.Scene()
const nightColor = 0x0a1428; // Lighter background color
scene.background = new THREE.Color(nightColor);
scene.fog = new THREE.FogExp2(0x0f1a30, isMobile ? 0.008 : 0.006); // Reduced fog density
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100000)
camera.position.set(0, 25, 40);
const renderer = new THREE.WebGLRenderer({
canvas: document.querySelector('#bg'),
antialias: !isMobile,
powerPreference: "high-performance"
})
renderer.setPixelRatio(SETTINGS.pixelRatio)
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.shadowMap.enabled = SETTINGS.enableShadows
if (SETTINGS.enableShadows) {
  renderer.shadowMap.type = THREE.VSMShadowMap
}
const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
controls.dampingFactor = 0.05
controls.maxPolarAngle = Math.PI / 2 - 0.1;
controls.autoRotate = SETTINGS.autoRotate;
controls.autoRotateSpeed = 0.2;
// --- 2. TEXTURE GENERATORS ---
function createSoftParticle() {
const canvas = document.createElement('canvas');
const size = SETTINGS.textureSize;
canvas.width = size; canvas.height = size;
const ctx = canvas.getContext('2d');
const gradient = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
gradient.addColorStop(0, 'rgba(255,255,255,1)');
gradient.addColorStop(0.3, 'rgba(255,255,255,0.8)');
gradient.addColorStop(0.6, 'rgba(255,255,255,0.3)');
gradient.addColorStop(1, 'rgba(255,255,255,0)');
ctx.fillStyle = gradient;
ctx.fillRect(0,0,size,size);
return new THREE.CanvasTexture(canvas);
}
function createSnowflakeTexture() {
const canvas = document.createElement('canvas');
const size = SETTINGS.textureSize;
canvas.width = size; canvas.height = size;
const ctx = canvas.getContext('2d');
ctx.fillStyle = 'rgba(0,0,0,0)';
ctx.fillRect(0,0,size,size);
ctx.strokeStyle = 'rgba(255,255,255,0.9)';
ctx.lineWidth = 2;
ctx.lineCap = 'round';
// Draw 6-pointed snowflake
ctx.translate(size/2, size/2);
const branchLength = size * 0.3;
for(let i = 0; i < 6; i++) {
ctx.rotate(Math.PI / 3);
ctx.beginPath();
ctx.moveTo(0, 0);
ctx.lineTo(0, -branchLength);
// Small branches
ctx.moveTo(0, -branchLength * 0.4);
ctx.lineTo(-branchLength * 0.25, -branchLength * 0.65);
ctx.moveTo(0, -branchLength * 0.4);
ctx.lineTo(branchLength * 0.25, -branchLength * 0.65);
ctx.moveTo(0, -branchLength * 0.7);
ctx.lineTo(-branchLength * 0.2, -branchLength * 0.9);
ctx.moveTo(0, -branchLength * 0.7);
ctx.lineTo(branchLength * 0.2, -branchLength * 0.9);
ctx.stroke();
}
return new THREE.CanvasTexture(canvas);
}
function createSparkleTexture() {
const canvas = document.createElement('canvas');
const size = SETTINGS.textureSize;
canvas.width = size; canvas.height = size;
const ctx = canvas.getContext('2d');
// 4-point star sparkle
const gradient = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
gradient.addColorStop(0, 'rgba(255,255,255,1)');
gradient.addColorStop(0.1, 'rgba(200,220,255,0.8)');
gradient.addColorStop(0.5, 'rgba(150,180,255,0.2)');
gradient.addColorStop(1, 'rgba(100,150,255,0)');
ctx.fillStyle = gradient;
ctx.fillRect(0,0,size,size);
return new THREE.CanvasTexture(canvas);
}

function createSnowGroundTexture() {
const canvas = document.createElement('canvas');
const size = isMobile ? 256 : 512;
canvas.width = size;
canvas.height = size;
const ctx = canvas.getContext('2d');

// Base snow color - slightly off-white
ctx.fillStyle = '#e8f0ff';
ctx.fillRect(0, 0, size, size);

// Add heavy grain/noise for snow texture
const grainCount = isMobile ? 8000 : 30000;
for (let i = 0; i < grainCount; i++) {
  const x = Math.random() * size;
  const y = Math.random() * size;
  const brightness = 200 + Math.random() * 55;
  const alpha = 0.5 + Math.random() * 0.5;
  ctx.fillStyle = `rgba(${brightness}, ${brightness}, ${brightness + 5}, ${alpha})`;
  ctx.fillRect(x, y, 1, 1);
}

// Add darker spots for depth variation
const spotCount = isMobile ? 150 : 500;
for (let i = 0; i < spotCount; i++) {
  const x = Math.random() * size;
  const y = Math.random() * size;
  const spotSize = 2 + Math.random() * 6;
  const darkness = 180 + Math.random() * 40;
  ctx.fillStyle = `rgba(${darkness}, ${darkness}, ${darkness + 10}, 0.3)`;
  ctx.beginPath();
  ctx.arc(x, y, spotSize, 0, Math.PI * 2);
  ctx.fill();
}

// Add bright sparkle spots
const sparkleCount = isMobile ? 100 : 400;
for (let i = 0; i < sparkleCount; i++) {
  const x = Math.random() * size;
  const y = Math.random() * size;
  const sparkleSize = 1 + Math.random() * 2;
  ctx.fillStyle = `rgba(255, 255, 255, ${0.7 + Math.random() * 0.3})`;
  ctx.fillRect(x, y, sparkleSize, sparkleSize);
}

// Add footprint-like indentations
if (!isMobile) {
  for (let i = 0; i < 100; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const indentSize = 3 + Math.random() * 8;
    ctx.fillStyle = 'rgba(200, 210, 220, 0.4)';
    ctx.beginPath();
    ctx.ellipse(x, y, indentSize, indentSize * 0.6, Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
}

const texture = new THREE.CanvasTexture(canvas);
texture.wrapS = THREE.RepeatWrapping;
texture.wrapT = THREE.RepeatWrapping;
return texture;
}
// --- 3. LIGHTING SYSTEM ---
// Ambient light
const ambientLight = new THREE.AmbientLight(0x5577aa, isMobile ? 0.4 : 0.3);
scene.add(ambientLight);

// Hemisphere light for sky/ground lighting
const hemiLight = new THREE.HemisphereLight(0x6688aa, 0x223344, 0.3);
hemiLight.position.set(0, 50, 0);
scene.add(hemiLight);

// Moon light - main directional light
const moonLight = new THREE.DirectionalLight(0xaaccee, isMobile ? 0.7 : 0.6);
moonLight.position.set(50, 80, 80);
moonLight.castShadow = SETTINGS.enableShadows;
if (SETTINGS.enableShadows) {
  moonLight.shadow.mapSize.width = SETTINGS.shadowMapSize;
  moonLight.shadow.mapSize.height = SETTINGS.shadowMapSize;
  moonLight.shadow.camera.far = 300;
  moonLight.shadow.camera.left = -150;
  moonLight.shadow.camera.right = 150;
  moonLight.shadow.camera.top = 150;
  moonLight.shadow.camera.bottom = -150;
  moonLight.shadow.bias = -0.0005;
  moonLight.shadow.radius = 2;
}
scene.add(moonLight);

// Point light for local illumination
const pointLight = new THREE.PointLight(0xffffff, 0.5, 100);
pointLight.position.set(0, 30, 40);
scene.add(pointLight);

// Rim light
const rimLight = new THREE.DirectionalLight(0x3355aa, 0.3);
rimLight.position.set(-30, 30, -30);
scene.add(rimLight);
// --- 4. TERRAIN ENGINE ---
function getTerrainHeight(x, z) {
return (Math.sin(x * 0.05) * 2) + (Math.cos(z * 0.05) * 2) + (Math.sin(x * 0.02 + z * 0.02) * 4);
}

// Create snow texture first
const snowGroundTexture = createSnowGroundTexture();

const groundGeo = new THREE.PlaneGeometry(700, 700, SETTINGS.groundSegments, SETTINGS.groundSegments);
groundGeo.rotateX(-Math.PI / 2);

// Ensure UV coordinates are set correctly
const uvs = groundGeo.attributes.uv;
for (let i = 0; i < uvs.count; i++) {
  uvs.setXY(i, uvs.getX(i) * 20, uvs.getY(i) * 20);
}

const groundMat = new THREE.MeshStandardMaterial({
color: 0xffffff,
roughness: 0.85, 
metalness: 0.05,
map: snowGroundTexture
});
const posAttribute = groundGeo.attributes.position;
for (let i = 0; i < posAttribute.count; i++) {
const x = posAttribute.getX(i);
const z = posAttribute.getZ(i);
const y = getTerrainHeight(x, z);
posAttribute.setY(i, y - 5);
}
groundGeo.computeVertexNormals();
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.receiveShadow = SETTINGS.enableShadows;
scene.add(ground);
// --- 5. OPTIMIZED TREE FOREST WITH SPATIAL PARTITIONING ---
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const loader = new GLTFLoader();
const treeInstances = [];
const treeData = []; // Store tree metadata
let treeModel = null; // Reference to original model

// Frustum for culling
const frustum = new THREE.Frustum();
const cameraViewProjectionMatrix = new THREE.Matrix4();

// Optimized culling settings
const CULLING_DISTANCE = isMobile ? 120 : 200; // Reduced max render distance
const FRUSTUM_MARGIN = isMobile ? 10 : 20; // Reduced margin
const FRUSTUM_CHECK_INTERVAL = isMobile ? 4 : 3; // Check less frequently
const GRID_CELL_SIZE = 50; // Size of spatial grid cells
let frameCount = 0;

// Spatial grid for faster lookups
const spatialGrid = new Map();

// Helper to get grid key from position
function getGridKey(x, z) {
  const gridX = Math.floor(x / GRID_CELL_SIZE);
  const gridZ = Math.floor(z / GRID_CELL_SIZE);
  return `${gridX},${gridZ}`;
}

// Get nearby grid cells based on camera position
function getNearbyGridKeys(camX, camZ, radius) {
  const keys = new Set();
  const cellRadius = Math.ceil(radius / GRID_CELL_SIZE);
  const centerX = Math.floor(camX / GRID_CELL_SIZE);
  const centerZ = Math.floor(camZ / GRID_CELL_SIZE);
  
  for (let x = centerX - cellRadius; x <= centerX + cellRadius; x++) {
    for (let z = centerZ - cellRadius; z <= centerZ + cellRadius; z++) {
      keys.add(`${x},${z}`);
    }
  }
  return keys;
}

// Generate tree positions with better distribution
function generateTreePositions() {
  treeData.length = 0;
  spatialGrid.clear();

  for (let i = 0; i < SETTINGS.treeCount; i++) {
    const angle = Math.random() * Math.PI * 2;

    // Better distribution: more trees in distance for populated background
    const radiusRandom = Math.random();
    let radius;
    
    if (radiusRandom < 0.15) {
      // Close ring (15%)
      radius = 20 + Math.random() * 60;
    } else if (radiusRandom < 0.45) {
      // Mid ring (30%)
      radius = 72 + Math.random() * 100;
    } else {
      // Far ring (55%) - extended to fill background
      radius = 172 + Math.random() * 280; // Extended from 200 to 280 for better bg coverage
    }

    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const y = getTerrainHeight(x, z) - 5;

    // Scale based on distance - much larger trees for denser look
    const distanceFactor = radius / 452;
    const scale = (5.15 + Math.random() * 0.2) * (1 + distanceFactor * 1.8); // Increased from 0.13-0.23 to 0.25-0.45 base

    const rotY = Math.random() * Math.PI * 2;

    const tree = {
      x, y, z,
      scale,
      rotY,
      radius,
      mesh: null,
      inView: false,
      gridKey: getGridKey(x, z)
    };
    
    treeData.push(tree);
    
    // Add to spatial grid
    if (!spatialGrid.has(tree.gridKey)) {
      spatialGrid.set(tree.gridKey, []);
    }
    spatialGrid.get(tree.gridKey).push(tree);
  }
}

// Create a tree mesh instance
function createTreeInstance(data) {
  if (!treeModel || data.mesh) return;
  
  const treeClone = treeModel.clone();
  treeClone.position.set(data.x, data.y, data.z);
  treeClone.scale.setScalar(data.scale);
  treeClone.rotation.y = data.rotY;
  
  scene.add(treeClone);
  data.mesh = treeClone;
  treeInstances.push(treeClone);
}

// Remove a tree mesh instance
function removeTreeInstance(data) {
  if (!data.mesh) return;
  
  scene.remove(data.mesh);
  const index = treeInstances.indexOf(data.mesh);
  if (index > -1) {
    treeInstances.splice(index, 1);
  }
  data.mesh = null;
}

// Optimized visibility check using spatial partitioning
function updateTreeVisibility() {
  // Update frustum
  camera.updateMatrixWorld();
  cameraViewProjectionMatrix.multiplyMatrices(
    camera.projectionMatrix,
    camera.matrixWorldInverse
  );
  frustum.setFromProjectionMatrix(cameraViewProjectionMatrix);
  
  const camPos = camera.position;
  
  // Get only nearby grid cells to check (for optimization)
  const nearbyKeys = getNearbyGridKeys(camPos.x, camPos.z, CULLING_DISTANCE + FRUSTUM_MARGIN);
  
  // Check all trees - prioritize nearby ones using spatial grid
  // First, quickly process nearby trees using spatial grid
  nearbyKeys.forEach(key => {
    const treesInCell = spatialGrid.get(key);
    if (!treesInCell) return;
    
    for (const data of treesInCell) {
      // Distance check
      const dx = data.x - camPos.x;
      const dz = data.z - camPos.z;
      const distanceSq = dx * dx + dz * dz;
      
      // Frustum check with margin
      const expandedBoundingSphere = new THREE.Sphere(
        new THREE.Vector3(data.x, data.y + 5, data.z),
        data.scale * 10 + FRUSTUM_MARGIN
      );
      
      const isInFrustum = frustum.intersectsSphere(expandedBoundingSphere);
      
      // Keep trees if they're in frustum, regardless of distance (for background)
      // Only cull if too close and out of frustum
      if (isInFrustum && !data.mesh) {
        createTreeInstance(data);
        data.inView = true;
      } else if (!isInFrustum && data.mesh && distanceSq < CULLING_DISTANCE * CULLING_DISTANCE) {
        // Only remove if close enough to have been checked AND not in frustum
        removeTreeInstance(data);
        data.inView = false;
      }
    }
  });
  
  // Second pass: check far trees that aren't in nearby grid cells but might be visible
  // This keeps the background populated
  for (let i = 0; i < treeData.length; i++) {
    const data = treeData[i];
    
    // Skip if already processed in nearby cells
    if (nearbyKeys.has(data.gridKey)) continue;
    
    // Check if far tree is in frustum
    const expandedBoundingSphere = new THREE.Sphere(
      new THREE.Vector3(data.x, data.y + 5, data.z),
      data.scale * 10 + FRUSTUM_MARGIN
    );
    
    const isInFrustum = frustum.intersectsSphere(expandedBoundingSphere);
    
    if (isInFrustum && !data.mesh) {
      // Far tree is visible, create it for background
      createTreeInstance(data);
      data.inView = true;
    } else if (!isInFrustum && data.mesh) {
      // Far tree not visible, remove it
      removeTreeInstance(data);
      data.inView = false;
    }
  }
}

// Load tree model
loader.load(
  '/pine_tree_low_poly.glb',
  (gltf) => {
    treeModel = gltf.scene;
    
    // Optimize tree model materials
    treeModel.traverse((child) => {
      if (child.isMesh) {
        // Setup shadows
        if (SETTINGS.enableShadows) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
        
        // Optimize materials
        // if (child.material) {
        //   child.material.side = THREE.FrontSide; // Only render front faces
        //   child.material.flatShading = false;
        // }
      }
    });
    
    // Generate positions with better distribution
    generateTreePositions();
    
    // Do initial visibility check
    updateTreeVisibility();
  },
  undefined,
  (error) => {
    console.error('Error loading tree model:', error);
  }
);

// ============================================
// --- 6. ULTIMATE SNOW SYSTEM ---
// ============================================
const softParticleTex = createSoftParticle();
const snowflakeTex = createSnowflakeTexture();
const sparkleTex = createSparkleTexture();
// Global wind state
const wind = {
baseX: 0.02,
baseZ: 0.01,
gustX: 0,
gustZ: 0,
gustStrength: 0,
gustTime: 0,
nextGust: 2
};

// Mouse tracking for snow attraction
// At the top with your mouse object
const mouse = {
  x: 0,
  y: 0,
  normalizedX: 0,
  normalizedZ: 0,
  isMoving: false,
  lastMoveTime: 0,
  onScreen: false  // Add this
};

if (!isMobile) {
  const setStopped = () => {
    mouse.isMoving = false;
    mouse.onScreen = false;
  };

  window.addEventListener('mousemove', (event) => {
    const buffer = 5;
    const isAtEdge = 
      event.clientX <= buffer || 
      event.clientX >= (window.innerWidth - buffer) || 
      event.clientY <= buffer || 
      event.clientY >= (window.innerHeight - buffer);

    if (isAtEdge) {
      setStopped();
      return; 
    }

    mouse.onScreen = true;
    mouse.isMoving = true;
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    mouse.normalizedX = mouse.x * 0.25;
    mouse.normalizedZ = -mouse.y * 0.25;
    mouse.lastMoveTime = Date.now();
  });

  window.addEventListener('mouseout', (e) => {
    if (!e.relatedTarget || e.relatedTarget.nodeName === "HTML") {
      setStopped();
    }
  });

  window.addEventListener('blur', setStopped);
}


// ---- LAYER 1: Dense Background Snow (far, small, many) ----
const bgSnowGeo = new THREE.BufferGeometry();
const bgSnowPos = new Float32Array(SETTINGS.bgSnowCount * 3);
const bgSnowData = [];
for (let i = 0; i < SETTINGS.bgSnowCount; i++) {
bgSnowPos[i * 3] = (Math.random() - 0.5) * 350;
bgSnowPos[i * 3 + 1] = Math.random() * 150 - 25;
bgSnowPos[i * 3 + 2] = (Math.random() - 0.5) * 350;
bgSnowData.push({
fallSpeed: 0.03 + Math.random() * 0.04,
driftPhase: Math.random() * Math.PI * 2,
driftFreq: 0.3 + Math.random() * 0.4,
driftAmp: 0.01 + Math.random() * 0.02
});
}
bgSnowGeo.setAttribute('position', new THREE.BufferAttribute(bgSnowPos, 3));
const bgSnowMat = new THREE.PointsMaterial({
size: 0.25,
color: 0xc8d4e8,
map: softParticleTex,
transparent: true,
opacity: 0.5,
depthWrite: false,
blending: THREE.AdditiveBlending
});
const bgSnowSystem = new THREE.Points(bgSnowGeo, bgSnowMat);
scene.add(bgSnowSystem);
// ---- LAYER 2: Main Snowfall (medium distance, varied sizes) ----
const mainSnowGeo = new THREE.BufferGeometry();
const mainSnowPos = new Float32Array(SETTINGS.mainSnowCount * 3);
const mainSnowSizes = new Float32Array(SETTINGS.mainSnowCount);
const mainSnowData = [];
for (let i = 0; i < SETTINGS.mainSnowCount; i++) {
mainSnowPos[i * 3] = (Math.random() - 0.5) * 250;
mainSnowPos[i * 3 + 1] = Math.random() * 120 - 20;
mainSnowPos[i * 3 + 2] = (Math.random() - 0.5) * 250;
const sizeVar = Math.random();
mainSnowSizes[i] = 0.3 + sizeVar * 0.5;
mainSnowData.push({
fallSpeed: 0.04 + Math.random() * 0.06,
wobblePhase: Math.random() * Math.PI * 2,
wobbleFreq: 1 + Math.random() * 2,
wobbleAmp: 0.02 + Math.random() * 0.03,
spiralPhase: Math.random() * Math.PI * 2,
spiralRadius: Math.random() * 0.03,
size: mainSnowSizes[i]
});
}
mainSnowGeo.setAttribute('position', new THREE.BufferAttribute(mainSnowPos, 3));
mainSnowGeo.setAttribute('size', new THREE.BufferAttribute(mainSnowSizes, 1));
const mainSnowMat = new THREE.ShaderMaterial({
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
// Fade based on distance
float dist = length(mvPosition.xyz);
vAlpha = smoothstep(150.0, 20.0, dist) * 0.8;
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
});
const mainSnowSystem = new THREE.Points(mainSnowGeo, mainSnowMat);
scene.add(mainSnowSystem);
// ---- LAYER 3: Close-up Large Flakes (near camera, detailed) ----
const closeSnowGeo = new THREE.BufferGeometry();
const closeSnowPos = new Float32Array(SETTINGS.closeSnowCount * 3);
const closeSnowSizes = new Float32Array(SETTINGS.closeSnowCount);
const closeSnowRotations = new Float32Array(SETTINGS.closeSnowCount);
const closeSnowData = [];
for (let i = 0; i < SETTINGS.closeSnowCount; i++) {
closeSnowPos[i * 3] = (Math.random() - 0.5) * 80;
closeSnowPos[i * 3 + 1] = Math.random() * 60 - 10;
closeSnowPos[i * 3 + 2] = (Math.random() - 0.5) * 80;
closeSnowSizes[i] = 0.8 + Math.random() * 1.2;
closeSnowRotations[i] = Math.random() * Math.PI * 2;
closeSnowData.push({
fallSpeed: 0.02 + Math.random() * 0.03,
tumbleSpeed: (Math.random() - 0.5) * 0.05,
swayPhase: Math.random() * Math.PI * 2,
swayFreq: 0.5 + Math.random() * 0.5,
swayAmp: 0.05 + Math.random() * 0.1,
zWobble: Math.random() * Math.PI * 2
});
}
closeSnowGeo.setAttribute('position', new THREE.BufferAttribute(closeSnowPos, 3));
closeSnowGeo.setAttribute('size', new THREE.BufferAttribute(closeSnowSizes, 1));
closeSnowGeo.setAttribute('rotation', new THREE.BufferAttribute(closeSnowRotations, 1));
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
});
const closeSnowSystem = new THREE.Points(closeSnowGeo, closeSnowMat);
scene.add(closeSnowSystem);
// ---- LAYER 4: Swirling Vortex Particles ----
const vortexGeo = new THREE.BufferGeometry();
const vortexPos = new Float32Array(SETTINGS.vortexCount * 3);
const vortexData = [];
for (let i = 0; i < SETTINGS.vortexCount; i++) {
const angle = Math.random() * Math.PI * 2;
const radius = 5 + Math.random() * 60;
const height = Math.random() * 80 - 10;
vortexPos[i * 3] = Math.cos(angle) * radius;
vortexPos[i * 3 + 1] = height;
vortexPos[i * 3 + 2] = Math.sin(angle) * radius;
vortexData.push({
angle: angle,
radius: radius,
baseHeight: height,
orbitSpeed: (0.1 + Math.random() * 0.2) * (Math.random() > 0.5 ? 1 : -1),
verticalSpeed: 0.02 + Math.random() * 0.03,
radiusOscillation: Math.random() * Math.PI * 2,
radiusOscSpeed: 0.5 + Math.random() * 0.5
});
}
vortexGeo.setAttribute('position', new THREE.BufferAttribute(vortexPos, 3));
const vortexMat = new THREE.PointsMaterial({
size: 0.35,
color: 0xffffff,
map: softParticleTex,
transparent: true,
opacity: 0.4,
depthWrite: false,
blending: THREE.AdditiveBlending
});
const vortexSystem = new THREE.Points(vortexGeo, vortexMat);
scene.add(vortexSystem);
// ---- LAYER 5: Ground Frost Sparkles ----
const sparkleGeo = new THREE.BufferGeometry();
const sparklePos = new Float32Array(SETTINGS.sparkleCount * 3);
const sparkleSizes = new Float32Array(SETTINGS.sparkleCount);
const sparkleData = [];
for (let i = 0; i < SETTINGS.sparkleCount; i++) {
const x = (Math.random() - 0.5) * 200;
const z = (Math.random() - 0.5) * 200;
const y = getTerrainHeight(x, z) - 4.8;
sparklePos[i * 3] = x;
sparklePos[i * 3 + 1] = y;
sparklePos[i * 3 + 2] = z;
sparkleSizes[i] = 0.1 + Math.random() * 0.3;
sparkleData.push({
twinklePhase: Math.random() * Math.PI * 2,
twinkleFreq: 2 + Math.random() * 4,
baseSize: sparkleSizes[i]
});
}
sparkleGeo.setAttribute('position', new THREE.BufferAttribute(sparklePos, 3));
sparkleGeo.setAttribute('size', new THREE.BufferAttribute(sparkleSizes, 1));
const sparkleMat = new THREE.ShaderMaterial({
uniforms: {
uTexture: { value: sparkleTex },
uTime: { value: 0 }
},
vertexShader: `
attribute float size;
uniform float uTime;
varying float vAlpha;
void main() {
vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
// Twinkle effect
float twinkle = sin(uTime * 3.0 + position.x * 0.5 + position.z * 0.5) * 0.5 + 0.5;
gl_PointSize = size * twinkle * (80.0 / -mvPosition.z);
gl_Position = projectionMatrix * mvPosition;
float dist = length(mvPosition.xyz);
vAlpha = smoothstep(100.0, 10.0, dist) * twinkle * 0.8;
}
`,
fragmentShader: `
uniform sampler2D uTexture;
varying float vAlpha;
void main() {
vec4 texColor = texture2D(uTexture, gl_PointCoord);
gl_FragColor = vec4(0.9, 0.95, 1.0, texColor.a * vAlpha);
}
`,
transparent: true,
depthWrite: false,
blending: THREE.AdditiveBlending
});
const sparkleSystem = new THREE.Points(sparkleGeo, sparkleMat);
scene.add(sparkleSystem);
// ---- LAYER 6: Blowing Snow Wisps (horizontal streaks) ----
const wispGeo = new THREE.BufferGeometry();
const wispPos = new Float32Array(SETTINGS.wispCount * 3);
const wispData = [];
for (let i = 0; i < SETTINGS.wispCount; i++) {
wispPos[i * 3] = (Math.random() - 0.5) * 300;
wispPos[i * 3 + 1] = Math.random() * 30 - 5;
wispPos[i * 3 + 2] = (Math.random() - 0.5) * 300;
wispData.push({
speed: 0.3 + Math.random() * 0.5,
yWobble: Math.random() * Math.PI * 2,
yAmp: 0.05 + Math.random() * 0.1
});
}
wispGeo.setAttribute('position', new THREE.BufferAttribute(wispPos, 3));
const wispMat = new THREE.PointsMaterial({
size: 0.6,
color: 0xddeeff,
map: softParticleTex,
transparent: true,
opacity: 0.25,
depthWrite: false,
blending: THREE.AdditiveBlending
});
const wispSystem = new THREE.Points(wispGeo, wispMat);
scene.add(wispSystem);
// ---- LAYER 7: Snow Dust (ultra fine ambient particles) ----
const dustGeo = new THREE.BufferGeometry();
const dustPos = new Float32Array(SETTINGS.dustCount * 3);
const dustData = [];
for (let i = 0; i < SETTINGS.dustCount; i++) {
dustPos[i * 3] = (Math.random() - 0.5) * 200;
dustPos[i * 3 + 1] = Math.random() * 100 - 10;
dustPos[i * 3 + 2] = (Math.random() - 0.5) * 200;
dustData.push({
floatPhase: Math.random() * Math.PI * 2,
floatFreq: 0.2 + Math.random() * 0.3,
floatAmp: 0.005 + Math.random() * 0.01
});
}
dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
const dustMat = new THREE.PointsMaterial({
size: 0.15,
color: 0x8899bb,
map: softParticleTex,
transparent: true,
opacity: 0.3,
depthWrite: false,
blending: THREE.AdditiveBlending
});
const dustSystem = new THREE.Points(dustGeo, dustMat);
scene.add(dustSystem);
// --- 7. ANIMATION LOOP ---
const clock = new THREE.Clock();

function onWindowResize() {
camera.aspect = window.innerWidth / window.innerHeight;
camera.updateProjectionMatrix();
renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', onWindowResize, false);
function updateWind(time, delta) {
// Wind gusts
wind.gustTime += delta;
if (wind.gustTime > wind.nextGust) {
wind.gustTime = 0;
wind.nextGust = 3 + Math.random() * 5;
wind.gustStrength = 0.5 + Math.random() * 1.5;
wind.gustX = (Math.random() - 0.5) * 0.15;
wind.gustZ = (Math.random() - 0.5) * 0.15;
}
// Decay gust
wind.gustStrength *= 0.98;
// Base wind oscillation
wind.baseX = Math.sin(time * 0.1) * 0.02 + 0.01;
wind.baseZ = Math.cos(time * 0.15) * 0.015;
}

function animate() {
  requestAnimationFrame(animate);
  const time = clock.getElapsedTime();
  const delta = clock.getDelta();
  
  updateWind(time, delta);
  
  // Update tree visibility based on frustum (not every frame for performance)
  frameCount++;
  if (frameCount % FRUSTUM_CHECK_INTERVAL === 0 && treeModel) {
    updateTreeVisibility();
  }
  
  // Check if mouse stopped moving (after 100ms of no movement)
  if (!isMobile && Date.now() - mouse.lastMoveTime > 100) {
    mouse.isMoving = false;
  }
  
  // Combine wind and mouse attraction
  const windX = wind.baseX + wind.gustX * wind.gustStrength;
  const windZ = wind.baseZ + wind.gustZ * wind.gustStrength;
  
  // Mouse attraction force (disabled on mobile)
  const mouseForceX = isMobile ? 0 : (mouse.isMoving ? mouse.normalizedX * 1.2 : mouse.normalizedX * 0.6);
  const mouseForceZ = isMobile ? 0 : (mouse.isMoving ? mouse.normalizedZ * 1.2 : mouse.normalizedZ * 0.6);
  
  // Camera sway based on mouse position (disabled on mobile)
    if (!isMobile && mouse.onScreen) {
    const targetCameraX = mouse.x * 12;
    const targetCameraY = 25 + (mouse.y * 6);
    const fixedZ = 40; // Maintain the same distance as mobile

    // Smoothly interpolate position
    camera.position.x += (targetCameraX - camera.position.x) * 0.05;
    camera.position.y += (targetCameraY - camera.position.y) * 0.03;
    camera.position.z += (fixedZ - camera.position.z) * 0.05;

    // CRITICAL: Re-center the focus so it doesn't "drift" away
    camera.lookAt(0, 12.5, 0); 
    
    } else if (!isMobile) {

    }
    if (isMobile){
      // Slow auto-rotation for mobile
      const mobileRotationSpeed = 0.0006;
      const centerX = 0;
      const centerY = 12.5;
      const centerZ = 0;
      
      // Calculate current angle and distance
      const radius = Math.sqrt(camera.position.x ** 2 + camera.position.z ** 2);
      const currentAngle = Math.atan2(camera.position.z, camera.position.x);
      const newAngle = currentAngle + mobileRotationSpeed;
      
      // Update camera position in orbit
      camera.position.x = Math.cos(newAngle) * radius;
      camera.position.z = Math.sin(newAngle) * radius;
      camera.lookAt(centerX, centerY, centerZ);
    }
  
  // Update shared uniforms once
  const timeUniform = { value: time };
  mainSnowMat.uniforms.uTime = timeUniform;
  closeSnowMat.uniforms.uTime = timeUniform;
  sparkleMat.uniforms.uTime = timeUniform;
  
  // Background snow
  const bgPos = bgSnowSystem.geometry.attributes.position.array;
  for (let i = 0, idx = 0; i < SETTINGS.bgSnowCount; i++, idx += 3) {
    const d = bgSnowData[i];
    const drift = Math.sin(time * d.driftFreq + d.driftPhase) * d.driftAmp;
    
    bgPos[idx] += windX * 0.5 + drift + mouseForceX * 0.4;
    bgPos[idx + 1] -= d.fallSpeed;
    bgPos[idx + 2] += windZ * 0.5 + Math.cos(time * d.driftFreq + d.driftPhase) * d.driftAmp * 0.5 + mouseForceZ * 0.4;
    
    if (bgPos[idx + 1] < -25) {
      bgPos[idx + 1] = 125;
      bgPos[idx] = (Math.random() - 0.5) * 350;
      bgPos[idx + 2] = (Math.random() - 0.5) * 350;
    }
    
    if (bgPos[idx] > 175) bgPos[idx] -= 350;
    else if (bgPos[idx] < -175) bgPos[idx] += 350;
    if (bgPos[idx + 2] > 175) bgPos[idx + 2] -= 350;
    else if (bgPos[idx + 2] < -175) bgPos[idx + 2] += 350;
  }
  bgSnowSystem.geometry.attributes.position.needsUpdate = true;
  
  // Main snow
  const mainPos = mainSnowSystem.geometry.attributes.position.array;
  for (let i = 0, idx = 0; i < SETTINGS.mainSnowCount; i++, idx += 3) {
    const d = mainSnowData[i];
    const wobbleTime = time * d.wobbleFreq + d.wobblePhase;
    const wobble = Math.sin(wobbleTime) * d.wobbleAmp;
    const spiral = Math.sin(time * 0.5 + d.spiralPhase) * d.spiralRadius;
    
    mainPos[idx] += windX + wobble + spiral + mouseForceX * 0.8;
    mainPos[idx + 1] -= d.fallSpeed;
    mainPos[idx + 2] += windZ + Math.cos(wobbleTime) * d.wobbleAmp * 0.7 + mouseForceZ * 0.8;
    
    if (mainPos[idx + 1] < -20) {
      mainPos[idx + 1] = 100;
      mainPos[idx] = (Math.random() - 0.5) * 250;
      mainPos[idx + 2] = (Math.random() - 0.5) * 250;
    }
    
    if (mainPos[idx] > 125) mainPos[idx] -= 250;
    else if (mainPos[idx] < -125) mainPos[idx] += 250;
    if (mainPos[idx + 2] > 125) mainPos[idx + 2] -= 250;
    else if (mainPos[idx + 2] < -125) mainPos[idx + 2] += 250;
  }
  mainSnowSystem.geometry.attributes.position.needsUpdate = true;
  
  // Close-up flakes
  const closePos = closeSnowSystem.geometry.attributes.position.array;
  const closeRot = closeSnowSystem.geometry.attributes.rotation.array;
  for (let i = 0, idx = 0; i < SETTINGS.closeSnowCount; i++, idx += 3) {
    const d = closeSnowData[i];
    const sway = Math.sin(time * d.swayFreq + d.swayPhase) * d.swayAmp;
    
    closePos[idx] += windX * 1.5 + sway + mouseForceX * 1.8;
    closePos[idx + 1] -= d.fallSpeed;
    closePos[idx + 2] += windZ * 1.5 + Math.sin(time * 0.7 + d.zWobble) * d.swayAmp * 0.5 + mouseForceZ * 1.8;
    closeRot[i] += d.tumbleSpeed;
    
    if (closePos[idx + 1] < -10) {
      closePos[idx + 1] = 50;
      closePos[idx] = (Math.random() - 0.5) * 80;
      closePos[idx + 2] = (Math.random() - 0.5) * 80;
    }
    
    if (closePos[idx] > 40) closePos[idx] -= 80;
    else if (closePos[idx] < -40) closePos[idx] += 80;
    if (closePos[idx + 2] > 40) closePos[idx + 2] -= 80;
    else if (closePos[idx + 2] < -40) closePos[idx + 2] += 80;
  }
  closeSnowSystem.geometry.attributes.position.needsUpdate = true;
  closeSnowSystem.geometry.attributes.rotation.needsUpdate = true;
  
  // Vortex particles
  const vortexPosArr = vortexSystem.geometry.attributes.position.array;
  const orbitDelta = 0.01;
  for (let i = 0, idx = 0; i < SETTINGS.vortexCount; i++, idx += 3) {
    const d = vortexData[i];
    d.angle += d.orbitSpeed * orbitDelta;
    const radiusNow = d.radius + Math.sin(time * d.radiusOscSpeed + d.radiusOscillation) * 5;
    
    vortexPosArr[idx] = Math.cos(d.angle) * radiusNow + windX * 20 + mouseForceX * 20;
    vortexPosArr[idx + 1] -= d.verticalSpeed;
    vortexPosArr[idx + 2] = Math.sin(d.angle) * radiusNow + windZ * 20 + mouseForceZ * 20;
    
    if (vortexPosArr[idx + 1] < -10) {
      vortexPosArr[idx + 1] = 70;
      d.radius = 5 + Math.random() * 60;
    }
  }
  vortexSystem.geometry.attributes.position.needsUpdate = true;
  
  // Blowing wisps
  const wispPosArr = wispSystem.geometry.attributes.position.array;
  const gustMult = 1 + wind.gustStrength;
  for (let i = 0, idx = 0; i < SETTINGS.wispCount; i++, idx += 3) {
    const d = wispData[i];
    
    wispPosArr[idx] += d.speed * gustMult + mouseForceX * 2.5;
    wispPosArr[idx + 1] += Math.sin(time * 2 + d.yWobble) * d.yAmp;
    wispPosArr[idx + 2] += windZ * 2 + mouseForceZ * 2.5;
    
    if (wispPosArr[idx] > 150) {
      wispPosArr[idx] = -150;
      wispPosArr[idx + 1] = Math.random() * 30 - 5;
      wispPosArr[idx + 2] = (Math.random() - 0.5) * 300;
    }
  }
  wispSystem.geometry.attributes.position.needsUpdate = true;
  
  // Ambient dust
  const dustPosArr = dustSystem.geometry.attributes.position.array;
  const windXDust = windX * 0.3 + mouseForceX * 0.8;
  const windZDust = windZ * 0.3 + mouseForceZ * 0.8;
  for (let i = 0, idx = 0; i < SETTINGS.dustCount; i++, idx += 3) {
    const d = dustData[i];
    const floatTime = time * d.floatFreq + d.floatPhase;
    
    dustPosArr[idx] += windXDust + Math.sin(floatTime) * d.floatAmp;
    dustPosArr[idx + 1] += Math.cos(floatTime * 0.5) * d.floatAmp;
    dustPosArr[idx + 2] += windZDust;
    
    if (dustPosArr[idx] > 100) dustPosArr[idx] -= 200;
    else if (dustPosArr[idx] < -100) dustPosArr[idx] += 200;
    if (dustPosArr[idx + 2] > 100) dustPosArr[idx + 2] -= 200;
    else if (dustPosArr[idx + 2] < -100) dustPosArr[idx + 2] += 200;
  }
  dustSystem.geometry.attributes.position.needsUpdate = true;
  
  controls.update();
  renderer.render(scene, camera);
}
animate();