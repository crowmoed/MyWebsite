import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js'

// --- 1. CORE SETUP ---
const scene = new THREE.Scene()
const nightColor = 0x050a14; 
scene.background = new THREE.Color(nightColor);
scene.fog = new THREE.Fog(0x0b1b2f, 18, 190);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
camera.position.set(0, 15, 40); 

const renderer = new THREE.WebGLRenderer({ 
    canvas: document.querySelector('#bg'),
    antialias: true,
    powerPreference: "high-performance"
})
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.05
renderer.outputColorSpace = THREE.SRGBColorSpace

const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
controls.dampingFactor = 0.05
controls.maxPolarAngle = Math.PI / 2 - 0.1;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.2;

// --- 2. TEXTURE GENERATORS ---
function createSoftParticle() {
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.3, 'rgba(255,255,255,0.8)');
    gradient.addColorStop(0.6, 'rgba(255,255,255,0.3)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0,0,64,64);
    return new THREE.CanvasTexture(canvas);
}

function createSnowflakeTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(0,0,0,0)';
    ctx.fillRect(0,0,64,64);
    
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    
    // Draw 6-pointed snowflake
    ctx.translate(32, 32);
    for(let i = 0; i < 6; i++) {
        ctx.rotate(Math.PI / 3);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -20);
        // Small branches
        ctx.moveTo(0, -8);
        ctx.lineTo(-5, -13);
        ctx.moveTo(0, -8);
        ctx.lineTo(5, -13);
        ctx.moveTo(0, -14);
        ctx.lineTo(-4, -18);
        ctx.moveTo(0, -14);
        ctx.lineTo(4, -18);
        ctx.stroke();
    }
    
    return new THREE.CanvasTexture(canvas);
}

function createSparkleTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 32; canvas.height = 32;
    const ctx = canvas.getContext('2d');
    
    // 4-point star sparkle
    const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.1, 'rgba(200,220,255,0.8)');
    gradient.addColorStop(0.5, 'rgba(150,180,255,0.2)');
    gradient.addColorStop(1, 'rgba(100,150,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0,0,32,32);
    
    return new THREE.CanvasTexture(canvas);
}

// --- 3. LIGHTING SYSTEM ---
const hemisphereLight = new THREE.HemisphereLight(0xb3c9ff, 0x0a1220, 0.6);
scene.add(hemisphereLight);

// Moon light
const moonLight = new THREE.DirectionalLight(0xc3dcff, 0.85); 
moonLight.position.set(90, 120, 60);
moonLight.castShadow = true;
moonLight.shadow.mapSize.width = 2048;
moonLight.shadow.mapSize.height = 2048;
moonLight.shadow.camera.far = 280;
moonLight.shadow.camera.left = -140;
moonLight.shadow.camera.right = 140;
moonLight.shadow.camera.top = 140;
moonLight.shadow.camera.bottom = -140;
moonLight.shadow.bias = -0.00045;
scene.add(moonLight);

// Cold rim light
const rimLight = new THREE.DirectionalLight(0x1a2c4a, 0.3);
rimLight.position.set(-50, 30, -50);
scene.add(rimLight);

// --- 4. TERRAIN ENGINE ---
function getTerrainHeight(x, z) {
    return (Math.sin(x * 0.05) * 2) + (Math.cos(z * 0.05) * 2) + (Math.sin(x * 0.02 + z * 0.02) * 4);
}

const groundGeo = new THREE.PlaneGeometry(300, 300, 128, 128);
groundGeo.rotateX(-Math.PI / 2);

const groundMat = new THREE.MeshStandardMaterial({ 
    color: 0xe8eeff, roughness: 0.75, metalness: 0.1 
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
ground.receiveShadow = false;
scene.add(ground);

// --- 5. PROCEDURAL FOREST ---
const treeCount = 280;
const forestSeed = 1429;
const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3d2817, roughness: 0.95 });
const foliageMat = new THREE.MeshStandardMaterial({ 
    color: 0x7e9f93, 
    roughness: 0.98,
    flatShading: true,
    vertexColors: true
});
const snowCapMat = new THREE.MeshStandardMaterial({ 
    color: 0xffffff, 
    roughness: 0.92,
    flatShading: true,
    vertexColors: true
});

const upVector = new THREE.Vector3(0, 1, 0);
const tempQuaternion = new THREE.Quaternion();
const tempMatrix = new THREE.Matrix4();
const tempPosition = new THREE.Vector3();
const tempScale = new THREE.Vector3();
const tempDirection = new THREE.Vector3();

const mulberry32 = (seed) => () => {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const trunkGeometries = [];
const foliageGeometries = [];
const snowGeometries = [];

const createColoredGeometry = (geometry, color) => {
    const count = geometry.attributes.position.count;
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
    }
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geometry;
};

const createBranchGeometry = (length, radiusTop, radiusBottom, position, direction) => {
    const branchGeo = new THREE.CylinderGeometry(radiusTop, radiusBottom, length, 6);
    branchGeo.translate(0, length * 0.5, 0);
    tempQuaternion.setFromUnitVectors(upVector, direction.clone().normalize());
    tempMatrix.compose(position, tempQuaternion, tempScale.set(1, 1, 1));
    branchGeo.applyMatrix4(tempMatrix);
    return branchGeo;
};

for (let i = 0; i < treeCount; i++) {
    const rng = mulberry32(forestSeed + i * 97);
    const angle = rng() * Math.PI * 2;
    const radius = 12 + rng() * 130; 
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const y = getTerrainHeight(x, z) - 5;

    const scale = 0.55 + rng() * 0.6;
    const heightScale = 0.9 + rng() * 0.5;
    const trunkHeight = 6.5 * scale * heightScale;
    const trunkBaseRadius = 0.7 * scale;
    const trunkTopRadius = 0.18 * scale;
    const trunkGeo = new THREE.CylinderGeometry(trunkTopRadius, trunkBaseRadius, trunkHeight, 7);
    trunkGeo.translate(0, trunkHeight * 0.5, 0);

    const branchGeos = [trunkGeo];
    const foliageClusters = [];
    const snowClusters = [];

    const levels = 3 + Math.floor(rng() * 2);
    let branchStartHeight = trunkHeight * 0.35;
    let branchLength = trunkHeight * 0.35;
    let branchRadius = trunkBaseRadius * 0.35;

    for (let level = 0; level < levels; level++) {
        const branches = 2 + Math.floor(rng() * 2);
        for (let b = 0; b < branches; b++) {
            const yaw = rng() * Math.PI * 2;
            const pitch = 0.35 + rng() * 0.35;
            tempDirection.set(
                Math.cos(yaw) * Math.cos(pitch),
                Math.sin(pitch),
                Math.sin(yaw) * Math.cos(pitch)
            );
            tempPosition.set(0, branchStartHeight + rng() * (trunkHeight * 0.15), 0);
            const length = branchLength * (0.7 + rng() * 0.4);
            const branchGeo = createBranchGeometry(
                length,
                branchRadius * 0.5,
                branchRadius,
                tempPosition,
                tempDirection
            );
            branchGeos.push(branchGeo);

            const clusterCount = 2 + Math.floor(rng() * 3);
            for (let c = 0; c < clusterCount; c++) {
                const clusterRadius = 0.9 + rng() * 1.4;
                const clusterGeo = new THREE.IcosahedronGeometry(clusterRadius, 1);
                const clusterOffset = tempDirection.clone().multiplyScalar(length * (0.75 + rng() * 0.3));
                clusterOffset.y += (rng() - 0.5) * 0.6;
                clusterOffset.x += (rng() - 0.5) * 0.8;
                clusterOffset.z += (rng() - 0.5) * 0.8;
                clusterGeo.translate(
                    tempPosition.x + clusterOffset.x,
                    tempPosition.y + clusterOffset.y,
                    tempPosition.z + clusterOffset.z
                );
                foliageClusters.push(clusterGeo);

                const snowScale = 0.7 + rng() * 0.2;
                const snowGeo = new THREE.IcosahedronGeometry(clusterRadius * snowScale, 0);
                snowGeo.translate(
                    tempPosition.x + clusterOffset.x * 0.85,
                    tempPosition.y + clusterOffset.y + clusterRadius * 0.55,
                    tempPosition.z + clusterOffset.z * 0.85
                );
                snowClusters.push(snowGeo);
            }

            if (tempDirection.y > 0.55) {
                const accentCount = 1 + Math.floor(rng() * 2);
                for (let a = 0; a < accentCount; a++) {
                    const accentRadius = branchRadius * (0.9 + rng() * 0.6);
                    const accentGeo = new THREE.IcosahedronGeometry(accentRadius * 0.7, 0);
                    const accentOffset = tempDirection.clone().multiplyScalar(length * (0.5 + rng() * 0.4));
                    accentOffset.y += accentRadius * 0.6;
                    accentOffset.x += (rng() - 0.5) * 0.3;
                    accentOffset.z += (rng() - 0.5) * 0.3;
                    accentGeo.translate(
                        tempPosition.x + accentOffset.x,
                        tempPosition.y + accentOffset.y,
                        tempPosition.z + accentOffset.z
                    );
                    snowClusters.push(accentGeo);
                }
            }
        }
        branchStartHeight += trunkHeight * 0.2;
        branchLength *= 0.7;
        branchRadius *= 0.65;
    }

    const mergedTrunk = BufferGeometryUtils.mergeGeometries(branchGeos, false);
    const mergedFoliage = BufferGeometryUtils.mergeGeometries(foliageClusters, false);
    const mergedSnow = BufferGeometryUtils.mergeGeometries(snowClusters, false);

    tempMatrix.makeTranslation(x, y, z);
    mergedTrunk.applyMatrix4(tempMatrix);
    mergedFoliage.applyMatrix4(tempMatrix);
    mergedSnow.applyMatrix4(tempMatrix);

    trunkGeometries.push(mergedTrunk);

    const foliageTint = new THREE.Color().setHSL(
        0.35 + rng() * 0.04,
        0.18 + rng() * 0.12,
        0.48 + rng() * 0.12
    );
    foliageGeometries.push(createColoredGeometry(mergedFoliage, foliageTint));

    const snowTint = new THREE.Color().setHSL(0.58, 0.12, 0.9 + rng() * 0.06);
    snowGeometries.push(createColoredGeometry(mergedSnow, snowTint));
}

const mergedTrunks = BufferGeometryUtils.mergeGeometries(trunkGeometries, false);
const mergedFoliage = BufferGeometryUtils.mergeGeometries(foliageGeometries, false);
const mergedSnow = BufferGeometryUtils.mergeGeometries(snowGeometries, false);

const trunks = new THREE.Mesh(mergedTrunks, trunkMat);
const foliage = new THREE.Mesh(mergedFoliage, foliageMat);
const snowCaps = new THREE.Mesh(mergedSnow, snowCapMat);

trunks.castShadow = true;
trunks.receiveShadow = true;
foliage.castShadow = true;
foliage.receiveShadow = true;
snowCaps.castShadow = true;
snowCaps.receiveShadow = true;

scene.add(trunks);
scene.add(foliage);
scene.add(snowCaps);


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

// ---- LAYER 1: Dense Background Snow (far, small, many) ----
const bgSnowCount = 50000;
const bgSnowGeo = new THREE.BufferGeometry();
const bgSnowPos = new Float32Array(bgSnowCount * 3);
const bgSnowData = [];

for (let i = 0; i < bgSnowCount; i++) {
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
const mainSnowCount = 40000;
const mainSnowGeo = new THREE.BufferGeometry();
const mainSnowPos = new Float32Array(mainSnowCount * 3);
const mainSnowSizes = new Float32Array(mainSnowCount);
const mainSnowData = [];

for (let i = 0; i < mainSnowCount; i++) {
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
const closeSnowCount = 3000;
const closeSnowGeo = new THREE.BufferGeometry();
const closeSnowPos = new Float32Array(closeSnowCount * 3);
const closeSnowSizes = new Float32Array(closeSnowCount);
const closeSnowRotations = new Float32Array(closeSnowCount);
const closeSnowData = [];

for (let i = 0; i < closeSnowCount; i++) {
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
const vortexCount = 8000;
const vortexGeo = new THREE.BufferGeometry();
const vortexPos = new Float32Array(vortexCount * 3);
const vortexData = [];

for (let i = 0; i < vortexCount; i++) {
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
const sparkleCount = 5000;
const sparkleGeo = new THREE.BufferGeometry();
const sparklePos = new Float32Array(sparkleCount * 3);
const sparkleSizes = new Float32Array(sparkleCount);
const sparkleData = [];

for (let i = 0; i < sparkleCount; i++) {
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
const wispCount = 2000;
const wispGeo = new THREE.BufferGeometry();
const wispPos = new Float32Array(wispCount * 3);
const wispData = [];

for (let i = 0; i < wispCount; i++) {
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
const dustCount = 30000;
const dustGeo = new THREE.BufferGeometry();
const dustPos = new Float32Array(dustCount * 3);
const dustData = [];

for (let i = 0; i < dustCount; i++) {
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
    
    const windX = wind.baseX + wind.gustX * wind.gustStrength;
    const windZ = wind.baseZ + wind.gustZ * wind.gustStrength;
    
    // Update shader uniforms
    mainSnowMat.uniforms.uTime.value = time;
    closeSnowMat.uniforms.uTime.value = time;
    sparkleMat.uniforms.uTime.value = time;
    
    // ---- Background snow ----
    const bgPos = bgSnowSystem.geometry.attributes.position.array;
    for (let i = 0; i < bgSnowCount; i++) {
        const d = bgSnowData[i];
        bgPos[i*3] += windX * 0.5 + Math.sin(time * d.driftFreq + d.driftPhase) * d.driftAmp;
        bgPos[i*3 + 1] -= d.fallSpeed;
        bgPos[i*3 + 2] += windZ * 0.5 + Math.cos(time * d.driftFreq + d.driftPhase) * d.driftAmp * 0.5;
        
        if (bgPos[i*3+1] < -25) {
            bgPos[i*3+1] = 125;
            bgPos[i*3] = (Math.random() - 0.5) * 350;
            bgPos[i*3+2] = (Math.random() - 0.5) * 350;
        }
        // Wrap horizontally
        if (bgPos[i*3] > 175) bgPos[i*3] -= 350;
        if (bgPos[i*3] < -175) bgPos[i*3] += 350;
        if (bgPos[i*3+2] > 175) bgPos[i*3+2] -= 350;
        if (bgPos[i*3+2] < -175) bgPos[i*3+2] += 350;
    }
    bgSnowSystem.geometry.attributes.position.needsUpdate = true;
    
    // ---- Main snow ----
    const mainPos = mainSnowSystem.geometry.attributes.position.array;
    for (let i = 0; i < mainSnowCount; i++) {
        const d = mainSnowData[i];
        const wobble = Math.sin(time * d.wobbleFreq + d.wobblePhase) * d.wobbleAmp;
        const spiral = Math.sin(time * 0.5 + d.spiralPhase) * d.spiralRadius;
        
        mainPos[i*3] += windX + wobble + spiral;
        mainPos[i*3 + 1] -= d.fallSpeed;
        mainPos[i*3 + 2] += windZ + Math.cos(time * d.wobbleFreq + d.wobblePhase) * d.wobbleAmp * 0.7;
        
        if (mainPos[i*3+1] < -20) {
            mainPos[i*3+1] = 100;
            mainPos[i*3] = (Math.random() - 0.5) * 250;
            mainPos[i*3+2] = (Math.random() - 0.5) * 250;
        }
        if (mainPos[i*3] > 125) mainPos[i*3] -= 250;
        if (mainPos[i*3] < -125) mainPos[i*3] += 250;
        if (mainPos[i*3+2] > 125) mainPos[i*3+2] -= 250;
        if (mainPos[i*3+2] < -125) mainPos[i*3+2] += 250;
    }
    mainSnowSystem.geometry.attributes.position.needsUpdate = true;
    
    // ---- Close-up flakes ----
    const closePos = closeSnowSystem.geometry.attributes.position.array;
    const closeRot = closeSnowSystem.geometry.attributes.rotation.array;
    for (let i = 0; i < closeSnowCount; i++) {
        const d = closeSnowData[i];
        const sway = Math.sin(time * d.swayFreq + d.swayPhase) * d.swayAmp;
        
        closePos[i*3] += windX * 1.5 + sway;
        closePos[i*3 + 1] -= d.fallSpeed;
        closePos[i*3 + 2] += windZ * 1.5 + Math.sin(time * 0.7 + d.zWobble) * d.swayAmp * 0.5;
        
        closeRot[i] += d.tumbleSpeed;
        
        if (closePos[i*3+1] < -10) {
            closePos[i*3+1] = 50;
            closePos[i*3] = (Math.random() - 0.5) * 80;
            closePos[i*3+2] = (Math.random() - 0.5) * 80;
        }
        if (closePos[i*3] > 40) closePos[i*3] -= 80;
        if (closePos[i*3] < -40) closePos[i*3] += 80;
        if (closePos[i*3+2] > 40) closePos[i*3+2] -= 80;
        if (closePos[i*3+2] < -40) closePos[i*3+2] += 80;
    }
    closeSnowSystem.geometry.attributes.position.needsUpdate = true;
    closeSnowSystem.geometry.attributes.rotation.needsUpdate = true;
    
    // ---- Vortex particles ----
    const vortexPosArr = vortexSystem.geometry.attributes.position.array;
    for (let i = 0; i < vortexCount; i++) {
        const d = vortexData[i];
        d.angle += d.orbitSpeed * 0.01;
        const radiusNow = d.radius + Math.sin(time * d.radiusOscSpeed + d.radiusOscillation) * 5;
        
        vortexPosArr[i*3] = Math.cos(d.angle) * radiusNow + windX * 20;
        vortexPosArr[i*3 + 1] -= d.verticalSpeed;
        vortexPosArr[i*3 + 2] = Math.sin(d.angle) * radiusNow + windZ * 20;
        
        if (vortexPosArr[i*3+1] < -10) {
            vortexPosArr[i*3+1] = 70;
            d.radius = 5 + Math.random() * 60;
        }
    }
    vortexSystem.geometry.attributes.position.needsUpdate = true;
    
    // ---- Blowing wisps ----
    const wispPosArr = wispSystem.geometry.attributes.position.array;
    for (let i = 0; i < wispCount; i++) {
        const d = wispData[i];
        wispPosArr[i*3] += d.speed * (1 + wind.gustStrength);
        wispPosArr[i*3 + 1] += Math.sin(time * 2 + d.yWobble) * d.yAmp;
        wispPosArr[i*3 + 2] += windZ * 2;
        
        if (wispPosArr[i*3] > 150) {
            wispPosArr[i*3] = -150;
            wispPosArr[i*3 + 1] = Math.random() * 30 - 5;
            wispPosArr[i*3 + 2] = (Math.random() - 0.5) * 300;
        }
    }
    wispSystem.geometry.attributes.position.needsUpdate = true;
    
    // ---- Ambient dust ----
    const dustPosArr = dustSystem.geometry.attributes.position.array;
    for (let i = 0; i < dustCount; i++) {
        const d = dustData[i];
        dustPosArr[i*3] += windX * 0.3 + Math.sin(time * d.floatFreq + d.floatPhase) * d.floatAmp;
        dustPosArr[i*3 + 1] += Math.cos(time * d.floatFreq * 0.5 + d.floatPhase) * d.floatAmp;
        dustPosArr[i*3 + 2] += windZ * 0.3;
        
        if (dustPosArr[i*3] > 100) dustPosArr[i*3] -= 200;
        if (dustPosArr[i*3] < -100) dustPosArr[i*3] += 200;
        if (dustPosArr[i*3+2] > 100) dustPosArr[i*3+2] -= 200;
        if (dustPosArr[i*3+2] < -100) dustPosArr[i*3+2] += 200;
    }
    dustSystem.geometry.attributes.position.needsUpdate = true;
    
    controls.update();
    renderer.render(scene, camera);
}

animate();
