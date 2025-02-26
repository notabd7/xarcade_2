import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
// Add a global reference to access from console
window.arcadeCabinetInstance = null;
class ArcadeCabinet {
  constructor(container) {
    this.container = container;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.cabinet = null;
    this.screenMesh = null;
    this.gameTexture = null;
    this.gameCanvas = null;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.interactiveElements = {
      joystick: null,
      buttons: []
    };
    this.modelLoaded = false;
    this.positionLogger = null;
    this.lastLogTime = 0;
    this.logInterval = 1000; // Log every 1 second
    window.arcadeCabinetInstance = this;
    this.init();
  }

  init() {
    console.log('Initializing ArcadeCabinet');
    // Create scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    // Add lights with more dramatic lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambientLight);

    // Add more directional lights for better illumination
    const frontLight = new THREE.DirectionalLight(0x18cae6, 1.0); // Cyan-blue light from front
    frontLight.position.set(0, 0, 5);
    this.scene.add(frontLight);

    const topLight = new THREE.DirectionalLight(0xffffff, 0.8);
    topLight.position.set(0, 5, 0);
    this.scene.add(topLight);

    // Create camera with fixed position
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    
    // Initial camera position
    this.camera.position.set(8, 4, 2);
    this.camera.lookAt(0, 0, 0);

    // Create renderer
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true // Enable transparency
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.container.appendChild(this.renderer.domElement);

    // Enable orbit controls for interactive rotation
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.25;
    this.controls.screenSpacePanning = false;
    this.controls.maxPolarAngle = Math.PI;
    this.controls.update();

    // Add a loading indicator
    this.addLoadingIndicator();

    // Load the arcade cabinet model
    this.loadModel();

    // Handle window resize
    window.addEventListener('resize', this.onWindowResize.bind(this));
    
    // Add click event listener for interaction
    this.renderer.domElement.addEventListener('click', this.onClick.bind(this));

    // Create position logger display
    this.createPositionLogger();

    // Start animation loop
    this.animate();
    
    console.log('ArcadeCabinet initialization complete');
  }

  createPositionLogger() {
    // Create a div for displaying position information
    const loggerDiv = document.createElement('div');
    loggerDiv.style.position = 'absolute';
    loggerDiv.style.bottom = '10px';
    loggerDiv.style.left = '10px';
    loggerDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    loggerDiv.style.color = '#18cae6';
    loggerDiv.style.padding = '10px';
    loggerDiv.style.borderRadius = '5px';
    loggerDiv.style.fontFamily = 'monospace';
    loggerDiv.style.zIndex = '1000';
    this.container.appendChild(loggerDiv);
    this.positionLogger = loggerDiv;
  }

// Add this method to the ArcadeCabinet class
// Replace the second implementation of addRotationControls with this:
addRotationControls() {
    const controlsDiv = document.createElement('div');
    controlsDiv.style.position = 'absolute';
    controlsDiv.style.top = '10px';
    controlsDiv.style.right = '10px';
    controlsDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    controlsDiv.style.color = '#18cae6';
    controlsDiv.style.padding = '10px';
    controlsDiv.style.borderRadius = '5px';
    controlsDiv.style.fontFamily = 'monospace';
    controlsDiv.style.zIndex = '1000';
    
    controlsDiv.innerHTML = `
      <h3>Model Controls</h3>
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 5px; margin-bottom: 10px;">
        <div style="text-align: center; font-weight: bold;">X-Axis</div>
        <div style="text-align: center; font-weight: bold;">Y-Axis</div>
        <div style="text-align: center; font-weight: bold;">Z-Axis</div>
        
        <button id="rotateXPlus" style="padding: 5px; background: #18cae6; color: black; border: none; border-radius: 3px; cursor: pointer;">
          X +
        </button>
        <button id="rotateYPlus" style="padding: 5px; background: #18cae6; color: black; border: none; border-radius: 3px; cursor: pointer;">
          Y +
        </button>
        <button id="rotateZPlus" style="padding: 5px; background: #18cae6; color: black; border: none; border-radius: 3px; cursor: pointer;">
          Z +
        </button>
        
        <button id="rotateXMinus" style="padding: 5px; background: #18cae6; color: black; border: none; border-radius: 3px; cursor: pointer;">
          X -
        </button>
        <button id="rotateYMinus" style="padding: 5px; background: #18cae6; color: black; border: none; border-radius: 3px; cursor: pointer;">
          Y -
        </button>
        <button id="rotateZMinus" style="padding: 5px; background: #18cae6; color: black; border: none; border-radius: 3px; cursor: pointer;">
          Z -
        </button>
      </div>
      
      <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
        <button id="savePosition" style="padding: 5px; background: #18cae6; color: black; border: none; border-radius: 3px; cursor: pointer;">
          Save Position
        </button>
        <button id="resetPosition" style="padding: 5px; background: #18cae6; color: black; border: none; border-radius: 3px; cursor: pointer;">
          Reset Position
        </button>
      </div>
      
      <div style="margin-top: 10px;">
        <div style="font-weight: bold;">Rotation Amount:</div>
        <input type="range" id="rotationAmount" min="1" max="45" value="5" style="width: 100%;">
        <div style="display: flex; justify-content: space-between;">
          <span>1°</span>
          <span id="rotationValue">5°</span>
          <span>45°</span>
        </div>
      </div>
      
      <div style="margin-top: 10px; border-top: 1px solid #18cae6; padding-top: 10px;">
        <div style="font-weight: bold;">Keyboard Controls:</div>
        <div>Q/A: X-axis +/-</div>
        <div>W/S: Y-axis +/-</div>
        <div>E/D: Z-axis +/-</div>
      </div>
    `;
    
    this.container.appendChild(controlsDiv);
    
    // Add event listeners
    document.getElementById('savePosition').addEventListener('click', () => {
      this.debug('savePosition');
    });
    
    document.getElementById('resetPosition').addEventListener('click', () => {
      this.debug('reset');
    });
    
    const rotationSlider = document.getElementById('rotationAmount');
    const rotationValue = document.getElementById('rotationValue');
    
    rotationSlider.addEventListener('input', () => {
      rotationValue.textContent = `${rotationSlider.value}°`;
    });
    
    // Rotation controls
    const getRotationAmount = () => {
      return parseInt(rotationSlider.value) * (Math.PI / 180); // Convert to radians
    };
    
    document.getElementById('rotateXPlus').addEventListener('click', () => {
      if (this.cabinet) {
        this.cabinet.rotation.x += getRotationAmount();
        this.updatePositionLogger(true);
      }
    });
    
    document.getElementById('rotateXMinus').addEventListener('click', () => {
      if (this.cabinet) {
        this.cabinet.rotation.x -= getRotationAmount();
        this.updatePositionLogger(true);
      }
    });
    
    document.getElementById('rotateYPlus').addEventListener('click', () => {
      if (this.cabinet) {
        this.cabinet.rotation.y += getRotationAmount();
        this.updatePositionLogger(true);
      }
    });
    
    document.getElementById('rotateYMinus').addEventListener('click', () => {
      if (this.cabinet) {
        this.cabinet.rotation.y -= getRotationAmount();
        this.updatePositionLogger(true);
      }
    });
    
    document.getElementById('rotateZPlus').addEventListener('click', () => {
      if (this.cabinet) {
        this.cabinet.rotation.z += getRotationAmount();
        this.updatePositionLogger(true);
      }
    });
    
    document.getElementById('rotateZMinus').addEventListener('click', () => {
      if (this.cabinet) {
        this.cabinet.rotation.z -= getRotationAmount();
        this.updatePositionLogger(true);
      }
    });
    
    // Add keyboard controls for rotation
    window.addEventListener('keydown', (e) => {
      if (!this.cabinet) return;
      
      const amount = getRotationAmount();
      
      switch(e.key) {
        case 'q': // X-axis plus
          this.cabinet.rotation.x += amount;
          break;
        case 'a': // X-axis minus
          this.cabinet.rotation.x -= amount;
          break;
        case 'w': // Y-axis plus
          this.cabinet.rotation.y += amount;
          break;
        case 's': // Y-axis minus
          this.cabinet.rotation.y -= amount;
          break;
        case 'e': // Z-axis plus
          this.cabinet.rotation.z += amount;
          break;
        case 'd': // Z-axis minus
          this.cabinet.rotation.z -= amount;
          break;
      }
      
      if (['q', 'a', 'w', 's', 'e', 'd'].includes(e.key)) {
        this.updatePositionLogger(true);
        e.preventDefault();
      }
    });
  }
  
  // Update the updatePositionLogger method to force updates
  updatePositionLogger(force = false) {
    if (!this.positionLogger || !this.cabinet) return;
    
    const currentTime = Date.now();
    if (!force && currentTime - this.lastLogTime < this.logInterval) return;
    
    this.lastLogTime = currentTime;
    
    const cameraPos = this.camera.position;
    const cameraRot = new THREE.Euler().setFromQuaternion(this.camera.quaternion);
    const modelRot = this.cabinet.rotation;
    const modelPos = this.cabinet.position;
    
    // Format position and rotation data
    const posInfo = {
      camera: {
        position: {
          x: cameraPos.x.toFixed(2),
          y: cameraPos.y.toFixed(2),
          z: cameraPos.z.toFixed(2)
        },
        rotation: {
          x: THREE.MathUtils.radToDeg(cameraRot.x).toFixed(2),
          y: THREE.MathUtils.radToDeg(cameraRot.y).toFixed(2),
          z: THREE.MathUtils.radToDeg(cameraRot.z).toFixed(2)
        }
      },
      model: {
        position: {
          x: modelPos.x.toFixed(2),
          y: modelPos.y.toFixed(2),
          z: modelPos.z.toFixed(2)
        },
        rotation: {
          x: THREE.MathUtils.radToDeg(modelRot.x).toFixed(2),
          y: THREE.MathUtils.radToDeg(modelRot.y).toFixed(2),
          z: THREE.MathUtils.radToDeg(modelRot.z).toFixed(2)
        }
      }
    };
    
    // Update the display
    this.positionLogger.innerHTML = `
      <h3>Position Data</h3>
      <p>Camera Position: x=${posInfo.camera.position.x}, y=${posInfo.camera.position.y}, z=${posInfo.camera.position.z}</p>
      <p>Camera Rotation: x=${posInfo.camera.rotation.x}°, y=${posInfo.camera.rotation.y}°, z=${posInfo.camera.rotation.z}°</p>
      <p>Model Position: x=${posInfo.model.position.x}, y=${posInfo.model.position.y}, z=${posInfo.model.position.z}</p>
      <p>Model Rotation: x=${posInfo.model.rotation.x}°, y=${posInfo.model.rotation.y}°, z=${posInfo.model.rotation.z}°</p>
    `;
    
    // Also log to console if forced
    if (force) {
      console.log('Position Data:', posInfo);
    }
  }
  addLoadingIndicator() {
    // Create a simple loading text as a placeholder
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = '24px Arial';
    ctx.fillStyle = '#18cae6';
    ctx.textAlign = 'center';
    ctx.fillText('Loading 3D Model...', canvas.width/2, canvas.height/2);
    
    // Create a plane with this canvas as texture
    const texture = new THREE.CanvasTexture(canvas);
    const geometry = new THREE.PlaneGeometry(2, 1);
    const material = new THREE.MeshBasicMaterial({ 
      map: texture,
      transparent: true 
    });
    const loadingPlane = new THREE.Mesh(geometry, material);
    this.scene.add(loadingPlane);
    
    // Store reference to remove it later
    this.loadingIndicator = loadingPlane;
  }

  // Add this method to your ArcadeCabinet class
  debug(action, value) {
    switch(action) {
      case 'rotateX':
        if (this.cabinet) {
          this.cabinet.rotation.x = value;
          console.log(`Cabinet rotated to X: ${value} radians (${value * 180/Math.PI}°)`);
        }
        break;
      case 'rotateY':
        if (this.cabinet) {
          this.cabinet.rotation.y = value;
          console.log(`Cabinet rotated to Y: ${value} radians (${value * 180/Math.PI}°)`);
        }
        break;
      case 'rotateZ':
        if (this.cabinet) {
          this.cabinet.rotation.z = value;
          console.log(`Cabinet rotated to Z: ${value} radians (${value * 180/Math.PI}°)`);
        }
        break;
      case 'cameraX':
        this.camera.position.x = value;
        console.log(`Camera X position: ${value}`);
        break;
      case 'cameraY':
        this.camera.position.y = value;
        console.log(`Camera Y position: ${value}`);
        break;
      case 'cameraZ':
        this.camera.position.z = value;
        console.log(`Camera Z position: ${value}`);
        break;
      case 'log':
        console.log('Cabinet rotation:', this.cabinet ? {
          x: this.cabinet.rotation.x,
          y: this.cabinet.rotation.y,
          z: this.cabinet.rotation.z
        } : 'No cabinet loaded');
        console.log('Camera position:', {
          x: this.camera.position.x,
          y: this.camera.position.y,
          z: this.camera.position.z
        });
        break;
      case 'reset':
        if (this.cabinet) {
          this.cabinet.rotation.set(0, 0, 0);
        }
        this.camera.position.set(8, 4, 2);
        this.camera.lookAt(0, 0, 0);
        console.log('Reset camera and cabinet rotation');
        break;
      case 'savePosition':
        const data = {
          camera: {
            position: {
              x: this.camera.position.x,
              y: this.camera.position.y,
              z: this.camera.position.z
            },
            rotation: {
              x: this.camera.rotation.x,
              y: this.camera.rotation.y,
              z: this.camera.rotation.z
            }
          },
          model: {
            position: {
              x: this.cabinet ? this.cabinet.position.x : null,
              y: this.cabinet ? this.cabinet.position.y : null,
              z: this.cabinet ? this.cabinet.position.z : null
            },
            rotation: {
              x: this.cabinet ? this.cabinet.rotation.x : null,
              y: this.cabinet ? this.cabinet.rotation.y : null,
              z: this.cabinet ? this.cabinet.rotation.z : null
            }
          }
        };
        console.log('SAVED POSITION:', data);
        alert('Position saved to console. Check developer tools console log.');
        break;
    }
    
    // Make the camera look at the center of the cabinet or origin
    if (this.cabinet) {
      const box = new THREE.Box3().setFromObject(this.cabinet);
      const center = box.getCenter(new THREE.Vector3());
      this.camera.lookAt(center);
    } else {
      this.camera.lookAt(0, 0, 0);
    }
  }

  loadModel() {
    console.log('Starting model loading sequence');
    
    // Try loading STL first
    console.log('Attempting to load STL model');
    const stlLoader = new STLLoader();
    stlLoader.load('/models/stl.stl', 
      (geometry) => {
        // STL only contains geometry, so we need to create a mesh
        const material = new THREE.MeshStandardMaterial({ 
          color: 0x0088ff,
          metalness: 0.5,
          roughness: 0.5
        });
        const mesh = new THREE.Mesh(geometry, material);
        this.handleLoadedModel(mesh);
      }, 
      (xhr) => {
        console.log('STL loading progress: ' + (xhr.loaded / xhr.total * 100) + '%');
      },
      (error) => {
        console.log('STL loading failed, trying FBX...', error);
        
        // Try loading FBX
        console.log('Attempting to load FBX model');
        const fbxLoader = new FBXLoader();
        fbxLoader.load('/models/fbx.fbx', 
          (object) => {
            this.handleLoadedModel(object);
          }, 
          (xhr) => {
            console.log('FBX loading progress: ' + (xhr.loaded / xhr.total * 100) + '%');
          },
          (error) => {
            console.log('FBX loading failed, trying OBJ...', error);
            
            // Try loading OBJ
            console.log('Attempting to load OBJ model');
            const objLoader = new OBJLoader();
            objLoader.load('/models/obj.obj', 
              (object) => {
                this.handleLoadedModel(object);
              }, 
              (xhr) => {
                console.log('OBJ loading progress: ' + (xhr.loaded / xhr.total * 100) + '%');
              },
              (error) => {
                console.error('All model loading attempts failed:', error);
                // Create fallback arcade cabinet
                this.createFallbackCabinet();
              }
            );
          }
        );
      }
    );
  }

  createFallbackCabinet() {
    console.log('Creating fallback arcade cabinet');
    
    // Create a simple cabinet shape
    const cabinetGroup = new THREE.Group();
    
    // Cabinet body
    const bodyGeom = new THREE.BoxGeometry(1, 1.8, 0.8);
    const bodyMat = new THREE.MeshPhongMaterial({ color: 0x2277aa });
    const cabinet = new THREE.Mesh(bodyGeom, bodyMat);
    cabinet.position.y = 0.9;
    cabinetGroup.add(cabinet);
    
    // Screen
    const screenGeom = new THREE.PlaneGeometry(0.6, 0.45);
    const screenMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    this.screenMesh = new THREE.Mesh(screenGeom, screenMat);
    this.screenMesh.position.set(0, 1.3, 0.41);
    cabinetGroup.add(this.screenMesh);
    
    // Control panel
    const panelGeom = new THREE.BoxGeometry(0.8, 0.2, 0.3);
    const panelMat = new THREE.MeshPhongMaterial({ color: 0x333333 });
    const panel = new THREE.Mesh(panelGeom, panelMat);
    panel.position.set(0, 0.7, 0.3);
    panel.rotation.x = -Math.PI / 6;
    cabinetGroup.add(panel);
    
    // Joystick
    const joystickBase = new THREE.CylinderGeometry(0.08, 0.08, 0.05, 16);
    const joystickMat = new THREE.MeshPhongMaterial({ color: 0x111111 });
    const joystickBaseMesh = new THREE.Mesh(joystickBase, joystickMat);
    joystickBaseMesh.position.set(-0.2, 0.77, 0.35);
    joystickBaseMesh.rotation.x = -Math.PI / 6;
    cabinetGroup.add(joystickBaseMesh);
    
    const joystickStick = new THREE.CylinderGeometry(0.02, 0.02, 0.1, 8);
    const joystickStickMesh = new THREE.Mesh(joystickStick, joystickMat);
    joystickStickMesh.position.set(-0.2, 0.85, 0.35);
    joystickStickMesh.rotation.x = -Math.PI / 6;
    cabinetGroup.add(joystickStickMesh);
    this.interactiveElements.joystick = joystickStickMesh;
    
    // Buttons
    const buttonGeom = new THREE.CylinderGeometry(0.04, 0.04, 0.02, 16);
    const redMat = new THREE.MeshPhongMaterial({ color: 0xff0000 });
    const blueMat = new THREE.MeshPhongMaterial({ color: 0x0000ff });
    
    const button1 = new THREE.Mesh(buttonGeom, redMat);
    button1.position.set(0.1, 0.77, 0.35);
    button1.rotation.x = -Math.PI / 6;
    cabinetGroup.add(button1);
    this.interactiveElements.buttons.push(button1);
    
    const button2 = new THREE.Mesh(buttonGeom, blueMat);
    button2.position.set(0.25, 0.77, 0.35);
    button2.rotation.x = -Math.PI / 6;
    cabinetGroup.add(button2);
    this.interactiveElements.buttons.push(button2);
    
    // Remove loading indicator and add cabinet
    if (this.loadingIndicator) {
      this.scene.remove(this.loadingIndicator);
    }
    
    this.scene.add(cabinetGroup);
    this.cabinet = cabinetGroup;
    
    // Create the game texture
    this.createGameTexture();
    this.screenMesh.material.map = this.gameTexture;
    this.screenMesh.material.needsUpdate = true;
    
    this.modelLoaded = true;
    console.log('Fallback cabinet created successfully');
  }

  handleLoadedModel(object) {
    console.log('Model loaded successfully!');
    
    // Remove loading indicator
    if (this.loadingIndicator) {
      this.scene.remove(this.loadingIndicator);
    }
    
    // Scale the model first
    const initialBox = new THREE.Box3().setFromObject(object);
    const initialSize = initialBox.getSize(new THREE.Vector3());
    const maxDim = Math.max(initialSize.x, initialSize.y, initialSize.z);
    const scale = 2.5 / maxDim;
    
    object.scale.set(scale, scale, scale);
    
    // Start with default rotation - no fixed rotation initially to allow free rotation
    // object.rotation.x = Math.PI/2; // Commented out to allow free rotation

    // Recalculate bounding box after scaling
    const box = new THREE.Box3().setFromObject(object);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    
    // Log the model dimensions for debugging
    console.log('Initial model dimensions:', {
      width: size.x,
      height: size.y,
      depth: size.z
    });
    
    // Center the model at the origin
    object.position.x = -center.x;
    object.position.y = -center.y;
    object.position.z = -center.z;
    
    // Now position it correctly on the "ground"
    object.position.y += size.y / 2; // Put the bottom at y=0
    
    // Store reference to the cabinet
    this.cabinet = object;
    
    // Apply arcade colors
    this.applyArcadeColors(object);
    
    // Add the cabinet to the scene
    this.scene.add(object);
    
    // Set initial camera position for better view
    this.positionCameraForModel();
    
    // Find interactive elements
    this.identifyInteractiveElements(object);
    
    // Add XARCADE logo
    this.addXarcadeLogo(object);
    
    // Add rotation controls UI
    this.addRotationControls();
    
    this.modelLoaded = true;
    console.log('Model loaded and positioned successfully');
  }
  

  
  // Position the camera based on the loaded model
  positionCameraForModel() {
    if (!this.cabinet) return;
    
    // Get the bounding box of the cabinet
    const box = new THREE.Box3().setFromObject(this.cabinet);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    
    // Set camera to initially view the model from a good angle
    const maxDim = Math.max(size.x, size.y, size.z);
    this.camera.position.set(
      center.x + maxDim * 2, 
      center.y + maxDim * 0.5, 
      center.z + maxDim * 2
    );
    
    this.camera.lookAt(center);
    
    // Update orbit controls to center on the model
    if (this.controls) {
      this.controls.target.copy(center);
      this.controls.update();
    }
    
    console.log('Initial camera positioned at:', this.camera.position);
  }

  // Add new method to change model colors
  applyArcadeColors(object) {
    // Define a material with nice arcade blue color
    const arcadeMaterial = new THREE.MeshPhongMaterial({
      color: 0x0077cc, // Deep blue
      specular: 0x111111,
      shininess: 30,
      emissive: 0x001133, // Slight emissive glow
    });
    
    // Define button materials with different colors
    const buttonMaterials = {
      red: new THREE.MeshPhongMaterial({ 
        color: 0xff0000, 
        emissive: 0x330000,
        shininess: 50 
      }),
      blue: new THREE.MeshPhongMaterial({ 
        color: 0x0000ff, 
        emissive: 0x000033,
        shininess: 50 
      }),
      yellow: new THREE.MeshPhongMaterial({ 
        color: 0xffff00, 
        emissive: 0x333300,
        shininess: 50 
      })
    };
    
    // Apply materials based on mesh names or positions
    object.traverse((child) => {
      if (child.isMesh) {
        // By default, apply the arcade blue material
        child.material = arcadeMaterial.clone();
        
        // Use name to identify specific parts for different colors
        const name = child.name.toLowerCase();
        
        if (name.includes('button') || name.includes('btn')) {
          // Randomly assign button colors
          const colors = Object.values(buttonMaterials);
          const randomColor = colors[Math.floor(Math.random() * colors.length)];
          child.material = randomColor.clone();
        }
        else if (name.includes('screen')) {
          // For screen, use a black material
          child.material = new THREE.MeshBasicMaterial({ 
            color: 0x000000,
            emissive: 0x000000
          });
        }
        
        // Enable shadows
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }

  // Add method to create XARCADE logo on the cabinet
  addXarcadeLogo(object) {
    // Create a canvas for the logo texture
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    
    // Draw gradient background
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    gradient.addColorStop(0, '#004466');
    gradient.addColorStop(0.5, '#18cae6');
    gradient.addColorStop(1, '#004466');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw text
    ctx.font = 'bold 72px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Outer glow/shadow
    ctx.fillStyle = '#000033';
    ctx.fillText('XARCADE', canvas.width/2 + 4, canvas.height/2 + 4);
    
    // Main text
    ctx.fillStyle = '#ffffff';
    ctx.fillText('XARCADE', canvas.width/2, canvas.height/2);
    
    // Create texture and material
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true
    });
    
    // Create a plane for the logo
    const geometry = new THREE.PlaneGeometry(1, 0.25);
    const logoMesh = new THREE.Mesh(geometry, material);
    
    // Position it on top of the cabinet
    const box = new THREE.Box3().setFromObject(object);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    
    logoMesh.position.set(center.x, box.max.y + 0.15, center.z);
    logoMesh.rotation.x = -0.2; // Tilt slightly for better visibility
    
    // Add to the scene
    this.scene.add(logoMesh);
  }

  identifyInteractiveElements(object) {
    // This function will inspect the loaded model structure
    // to find the screen, joystick, and buttons
    
    console.log('Searching for interactive elements...');
    
    object.traverse((child) => {
      // Log all mesh names to help identify parts
      if (child.isMesh) {
        console.log('Found mesh:', child.name);
        
        // Look for naming patterns that might indicate screen, joystick, buttons
        if (child.name.toLowerCase().includes('screen')) {
          this.setupScreen(child);
        } 
        else if (child.name.toLowerCase().includes('joystick')) {
          this.interactiveElements.joystick = child;
        }
        else if (child.name.toLowerCase().includes('button')) {
          this.interactiveElements.buttons.push(child);
        }
      }
    });
    
    // If we couldn't identify the screen by name, we can try to identify it
    // by geometry (typically a flat rectangular surface)
    if (!this.screenMesh) {
      this.guessScreenMesh(object);
    }
    
    // Log what we found
    console.log('Interactive elements found:', this.interactiveElements);
  }
  
  guessScreenMesh(object) {
    // If screen wasn't found by name, try to guess which mesh is the screen
    // based on geometry - looking for flat, rectangular surfaces
    let potentialScreens = [];
    
    object.traverse((child) => {
      if (child.isMesh) {
        // Check if this mesh could be a screen (flat rectangular surface)
        const geometry = child.geometry;
        if (geometry.type === 'PlaneGeometry' || geometry.type === 'PlaneBufferGeometry') {
          potentialScreens.push(child);
        } else if (geometry.type === 'BoxGeometry' || geometry.type === 'BoxBufferGeometry') {
          // Also consider flat boxes
          potentialScreens.push(child);
        }
      }
    });
    
    console.log('Potential screens found:', potentialScreens);
    
    if (potentialScreens.length > 0) {
      // For now, just use the first potential screen
      this.setupScreen(potentialScreens[0]);
    } else {
      // If we still can't find a screen, create one
      this.createVirtualScreen();
    }
  }
  
  setupScreen(mesh) {
    console.log('Setting up screen mesh:', mesh);
    this.screenMesh = mesh;
    
    // Create a dynamic texture for the game display
    this.createGameTexture();
    
    // Apply the texture to the screen mesh
    if (this.screenMesh.material) {
      // If the mesh already has a material, we modify it
      if (Array.isArray(this.screenMesh.material)) {
        // If it's a multi-material, apply to the first one
        this.screenMesh.material[0].map = this.gameTexture;
        this.screenMesh.material[0].needsUpdate = true;
      } else {
        this.screenMesh.material.map = this.gameTexture;
        this.screenMesh.material.needsUpdate = true;
      }
    } else {
      // If not, we create a new material
      this.screenMesh.material = new THREE.MeshBasicMaterial({
        map: this.gameTexture
      });
    }
  }
  

  
  createVirtualScreen() {
    console.log('Creating virtual screen');
    
    // Create a plane geometry for the screen
    const geometry = new THREE.PlaneGeometry(0.4, 0.3);
    const material = new THREE.MeshBasicMaterial({ color: 0x000000 });
    
    this.screenMesh = new THREE.Mesh(geometry, material);
    
    // Position depends on if we have a cabinet or not
    if (this.cabinet) {
      // Position relative to cabinet
      const box = new THREE.Box3().setFromObject(this.cabinet);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      
      this.screenMesh.position.set(
        center.x,
        center.y + size.y * 0.1, // Slightly above center
        center.z + size.z * 0.5  // Front of cabinet
      );
      this.cabinet.add(this.screenMesh);
    } else {
      // Position in world if no cabinet
      this.screenMesh.position.set(0, 1.2, 0.01);
      this.scene.add(this.screenMesh);
    }
    
    // Set up the game texture
    this.createGameTexture();
    this.screenMesh.material.map = this.gameTexture;
  }
  
  createGameTexture() {
    // Create an offscreen canvas for the game
    this.gameCanvas = document.createElement('canvas');
    this.gameCanvas.width = 512;
    this.gameCanvas.height = 384;
    
    // Get the canvas context and draw something
    const ctx = this.gameCanvas.getContext('2d');
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, this.gameCanvas.width, this.gameCanvas.height);
    ctx.font = '20px Arial';
    ctx.fillStyle = '#18cae6';
    ctx.textAlign = 'center';
    ctx.fillText('Game Loading...', this.gameCanvas.width/2, this.gameCanvas.height/2);
    ctx.font = '16px Arial';
    ctx.fillText('Click a game below to play', this.gameCanvas.width/2, this.gameCanvas.height/2 + 40);
    
    // Create a texture from the canvas
    this.gameTexture = new THREE.CanvasTexture(this.gameCanvas);
  }
  
  onClick(event) {
    // Calculate mouse position in normalized device coordinates
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    // Perform raycasting to detect interaction with cabinet elements
    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    // Check for joystick interaction
    if (this.interactiveElements.joystick) {
      const intersects = this.raycaster.intersectObject(this.interactiveElements.joystick, true);
      if (intersects.length > 0) {
        console.log('Joystick clicked!');
        // Here you would trigger input for the game
      }
    }
    
    // Check for button interactions
    const buttonIntersects = this.raycaster.intersectObjects(this.interactiveElements.buttons, true);
    if (buttonIntersects.length > 0) {
      console.log('Button clicked:', buttonIntersects[0].object.name);
      // Here you would trigger input for the game
    }
  }

  updateGameDisplay(gameCanvas) {
    // Update the game texture when the game renders
    if (this.gameTexture && gameCanvas) {
      this.gameTexture.image = gameCanvas;
      this.gameTexture.needsUpdate = true;
    }
  }

  // New method to update the screen with game information
  updateGameInfo(lives, score, level) {
    if (!this.screenMesh) return;
    
    // Create a canvas for the game info
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 384;
    const ctx = canvas.getContext('2d');
    
    // Draw background
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw game info
    ctx.font = '24px "Press Start 2P", monospace';
    ctx.fillStyle = '#18cae6'; // Cyan color
    ctx.textAlign = 'left';
    ctx.fillText(`LIVES: ${lives}`, 20, 40);
    ctx.fillText(`SCORE: ${score}`, 20, 80);
    ctx.fillText(`LEVEL: ${level}`, 20, 120);
    
    // Create or update texture
    if (!this.gameTexture) {
      this.gameTexture = new THREE.CanvasTexture(canvas);
      this.screenMesh.material.map = this.gameTexture;
    } else {
      this.gameTexture.image = canvas;
      this.gameTexture.needsUpdate = true;
    }
    
    this.screenMesh.material.needsUpdate = true;
  }

  onWindowResize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));
    
    // Update position logger
    this.updatePositionLogger();
    
    // Update orbit controls
    if (this.controls) {
      this.controls.update();
    }
    
    this.renderer.render(this.scene, this.camera);
  }
  
  // Function to connect a game to the arcade cabinet
  connectGame(gameCanvas) {
    console.log('Connecting game to arcade cabinet');
    // Use the game's canvas as the texture for our screen
    if (gameCanvas && this.gameTexture) {
      this.updateGameDisplay(gameCanvas);
    }
  }
}

export default ArcadeCabinet;