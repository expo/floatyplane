import * as THREE from 'three';
import Assets from '../Assets';

// Making a sprite involves three steps which are outlined below. You probably
// would want to combine them into a utility function with defaults pertinent
// to your game.

// 1: Geometry
// This defines the local shape of the object. In this case the geometry
// will simply be a 1x1 plane facing the camera.

// 2: Material
// This defines how the surface of the shape is painted. In this case we
// want to paint a texture loaded from an asset and also tint it.
// Nearest-neighbor filtering with `THREE.NearestFilter` is nice for
// pixel art styles.

// 3: Mesh
// A mesh is a node in THREE's scenegraph and refers to a geometry and a
// material to draw itself. It can be translated and rotated as any other
// scenegraph node.

// Creates a single pillar and returns the mesh
const loadImageMaterial = (assetName, THREEView) => {
  const texture = THREEView.textureFromAsset(Assets[assetName]);
  texture.minFilter = texture.magFilter = THREE.NearestFilter;
  texture.needsUpdate = true;
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true, // Use the image's alpha channel for alpha.
  });
  return material;
};

export const createPillar = THREEView => {
  const geometry = new THREE.PlaneBufferGeometry(1, 5);
  const material = loadImageMaterial('pipe-top', THREEView);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.x = 2.5;
  return mesh;
};

// Creates a new plane and returns the mesh
export const createPlane = THREEView => {
  const planeGeo = new THREE.PlaneBufferGeometry(0.75, 0.75);
  const material = loadImageMaterial('player-sprite', THREEView);
  const planeMesh = new THREE.Mesh(planeGeo, material);
  return planeMesh;
};

// Creates the start graphic and returns the mesh
export const createStart = THREEView => {
  const startGeo = new THREE.PlaneBufferGeometry(4, 1.5);
  const material = loadImageMaterial('start-screen', THREEView);
  const startMesh = new THREE.Mesh(startGeo, material);
  startMesh.position.y = 2;
  return startMesh;
};

// Creates the game background and returns the mesh
export const createBackground = (width, height) => {
  const blueBackground = new THREE.BoxGeometry(width, height, 0);
  const blueBackgroundTexture = new THREE.MeshBasicMaterial({
    color: 0x35b3c6,
  });
  const meshBG = new THREE.Mesh(blueBackground, blueBackgroundTexture);
  meshBG.position.z = -40; // This puts this sprite behind our previous one.
  meshBG.rotation.z = Math.PI;
  return meshBG;
};
