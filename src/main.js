import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

// --- 1. CORE SETUP ---
const scene = new THREE.Scene()
const nightColor = 0x050510; 
scene.background = new THREE.Color(nightColor);
scene.fog = new THREE.FogExp2(nightColor, 0.015);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
camera.position.set(0, 10, 30); 

const renderer = new THREE.WebGLRenderer({ 
    canvas: document.querySelector('#bg'),
    antialias: true,
    powerPreference: "high-performance"
})
renderer.setPixelRatio(window.devicePixelRatio)
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap

const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
controls.dampingFactor = 0.05
controls.maxPolarAngle = Math.PI / 2 - 0.1;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.5;

// --- 2. ASSET GENERATOR ---
function createParticleTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 32; canvas.height = 32;
    const context = canvas.getContext('2d');
    const gradient = context.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    context.fillStyle = gradient;
    context.fillRect(0,0,32,32);
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
}

// --- 3. LIGHTING SYSTEM ---
const ambientLight = new THREE.AmbientLight(0x202040, 0.4); 
scene.add(ambientLight);

// Moon
const moonLight = new THREE.DirectionalLight(0xaaccff, 0.5); 
moonLight.position.set(100, 100, 50);
moonLight.castShadow = true;
moonLight.shadow.mapSize.width = 2048;
moonLight.shadow.mapSize.height = 2048;
moonLight.shadow.bias = -0.0005;
scene.add(moonLight);

// --- 4. TERRAIN ENGINE ---
function getTerrainHeight(x, z) {
    return (Math.sin(x * 0.05) * 2) + (Math.cos(z * 0.05) * 2) + (Math.sin(x * 0.02 + z * 0.02) * 4);
}

const groundGeo = new THREE.PlaneGeometry(300, 300, 128, 128);
const groundMat = new THREE.MeshStandardMaterial({ 
    color: 0xffffff, roughness: 0.9, metalness: 0.1 
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
ground.receiveShadow = true;
scene.add(ground);

// --- 5. PROCEDURAL FOREST ---
const treeCount = 200;
const treeGeo = new THREE.ConeGeometry(2, 8, 5);
const treeMat = new THREE.MeshStandardMaterial({ color: 0x1a3322, roughness: 0.9 });
const trees = new THREE.InstancedMesh(treeGeo, treeMat, treeCount);
trees.castShadow = true;
trees.receiveShadow = true;

const dummy = new THREE.Object3D();
const _color = new THREE.Color();

for (let i = 0; i < treeCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 20 + Math.random() * 100; 
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const y = getTerrainHeight(x, z) - 5 + 4;

    dummy.position.set(x, y, z);
    const scale = Math.random() * 0.5 + 0.8; 
    dummy.scale.set(scale, scale * (Math.random() * 0.5 + 0.8), scale);
    dummy.updateMatrix();
    trees.setMatrixAt(i, dummy.matrix);
    trees.setColorAt(i, _color.setHex(Math.random() > 0.8 ? 0xffffff : 0x1a3322));
}
scene.add(trees);

// --- 6. THE CAMPFIRE (Centerpiece) ---

const fireGroup = new THREE.Group();

// A. The Logs
const logGeo = new THREE.CylinderGeometry(0.3, 0.3, 4, 6);
const logMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 1 }); 

const log1 = new THREE.Mesh(logGeo, logMat);
log1.rotation.z = Math.PI / 2;
log1.rotation.y = Math.PI / 4;
log1.position.y = 0.5;

const log2 = new THREE.Mesh(logGeo, logMat);
log2.rotation.z = Math.PI / 2;
log2.rotation.y = -Math.PI / 4;
log2.position.y = 0.5;

const log3 = new THREE.Mesh(logGeo, logMat);
log3.rotation.z = Math.PI / 2;
log3.rotation.y = Math.PI;
log3.position.y = 0.5;

fireGroup.add(log1, log2, log3);

// B. The Fire Light (Dimmer)
const fireLight = new THREE.PointLight(0xff6600, 0.8, 18); // Intensity lowered to 0.8
fireLight.position.set(0, 1.5, 0);
fireLight.castShadow = true;
fireLight.shadow.bias = -0.0001;
fireGroup.add(fireLight);

fireGroup.position.y = getTerrainHeight(0,0) - 5;
scene.add(fireGroup);


// C. Fire Particles (Low Intensity)
const fireCount = 200; 
const firePos = new Float32Array(fireCount * 3);
const fireColors = new Float32Array(fireCount * 3); 
const fireLife = []; 

for(let i=0; i<fireCount; i++) {
    const r = Math.random() * 0.3;
    const angle = Math.random() * Math.PI * 2;
    
    firePos[i*3] = Math.cos(angle) * r;
    firePos[i*3+1] = Math.random() * 2; 
    firePos[i*3+2] = Math.sin(angle) * r;

    fireLife.push({
        speed: 0.01 + Math.random() * 0.03, // Slower speed for calm fire
        angle: Math.random() * Math.PI * 2,
        wiggleSpeed: 1.5 + Math.random() * 2
    });

    fireColors[i*3] = 1;
    fireColors[i*3+1] = 1;
    fireColors[i*3+2] = 1;
}

const fireGeom = new THREE.BufferGeometry();
fireGeom.setAttribute('position', new THREE.BufferAttribute(firePos, 3));
fireGeom.setAttribute('color', new THREE.BufferAttribute(fireColors, 3)); 

const fireMaterial = new THREE.PointsMaterial({
    size: 0.5,
    vertexColors: true, 
    map: createParticleTexture(),
    transparent: true,
    opacity: 0.2, // Very low opacity for subtle effect
    blending: THREE.AdditiveBlending,
    depthWrite: false
});

const fireSystem = new THREE.Points(fireGeom, fireMaterial);
fireSystem.position.y = getTerrainHeight(0,0) - 4.5;
scene.add(fireSystem);


// --- 7. SNOW SYSTEM ---
const snowCount = 10000;
const snowGeo = new THREE.BufferGeometry();
const snowPos = new Float32Array(snowCount * 3);
const snowVel = []; 

for (let i = 0; i < snowCount; i++) {
    snowPos[i * 3] = (Math.random() - 0.5) * 300;     
    snowPos[i * 3 + 1] = (Math.random() - 0.5) * 200; 
    snowPos[i * 3 + 2] = (Math.random() - 0.5) * 300; 
    
    snowVel.push({
        y: Math.random() * 0.1 + 0.05, 
        x: Math.random() * 0.02 - 0.01, 
        z: Math.random() * 0.02 - 0.01
    });
}
snowGeo.setAttribute('position', new THREE.BufferAttribute(snowPos, 3));
const snowMaterial = new THREE.PointsMaterial({
    size: 0.4, 
    color: 0xffffff, 
    map: createParticleTexture(),
    transparent: true,
    opacity: 0.6,
    depthWrite: false,
    blending: THREE.AdditiveBlending
});
const snowSystem = new THREE.Points(snowGeo, snowMaterial);
scene.add(snowSystem);


// --- 8. ANIMATION LOOP ---
const clock = new THREE.Clock();

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
}
window.addEventListener('resize', onWindowResize, false)

const _tempColor = new THREE.Color(); 
const _cBase = new THREE.Color(0xff8800); // Duller Orange (not bright yellow)
const _cTop = new THREE.Color(0x330500);  // Dark Maroon/Black (fades out faster)

function animate() {
    requestAnimationFrame(animate)
    const time = clock.getElapsedTime();

    // 1. Flicker Fire Light (Calmer flicker)
    fireLight.intensity = Math.sin(time * 8) * 0.1 + Math.cos(time * 20) * 0.05 + 0.8; 
    fireLight.position.x = Math.sin(time * 15) * 0.03;
    
    // 2. Animate Fire Particles
    const fPos = fireSystem.geometry.attributes.position.array;
    const fCol = fireSystem.geometry.attributes.color.array;

    for(let i=0; i<fireCount; i++) {
        let y = fPos[i*3+1];
        
        y += fireLife[i].speed;
        
        const resetHeight = 2.0 + Math.sin(time + i) * 0.5; // Lower height

        if (y > resetHeight) {
            y = 0;
            const r = Math.random() * 0.3;
            const a = Math.random() * Math.PI * 2;
            fPos[i*3] = Math.cos(a) * r;
            fPos[i*3+2] = Math.sin(a) * r;
        }
        
        // Turbulence
        const wiggle = Math.sin(time * fireLife[i].wiggleSpeed + y * 2) * 0.01 * y;
        fPos[i*3] += wiggle; 
        fPos[i*3+2] += Math.cos(time * 3 + y) * 0.01 * y;

        fPos[i*3+1] = y;

        // Color Gradient: Orange -> Dark Maroon
        const lifeRatio = y / 2.0; 
        _tempColor.copy(_cBase).lerp(_cTop, lifeRatio);

        fCol[i*3] = _tempColor.r;
        fCol[i*3+1] = _tempColor.g;
        fCol[i*3+2] = _tempColor.b;
    }
    
    fireSystem.geometry.attributes.position.needsUpdate = true;
    fireSystem.geometry.attributes.color.needsUpdate = true; 

    // 3. Animate Snow
    const sPos = snowSystem.geometry.attributes.position.array;
    for(let i = 0; i < snowCount; i++) {
        sPos[i*3 + 1] -= snowVel[i].y;
        sPos[i*3] += Math.sin(time + sPos[i*3+1]) * 0.02; 
        
        if (sPos[i*3 + 1] < -20) {
            sPos[i*3 + 1] = 100;
            sPos[i*3] = (Math.random() - 0.5) * 300;
            sPos[i*3 + 2] = (Math.random() - 0.5) * 300;
        }
    }
    snowSystem.geometry.attributes.position.needsUpdate = true;
    
    controls.update()
    renderer.render(scene, camera)
}

animate()