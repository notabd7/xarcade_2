import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

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

    this.init();
  }

  init() {
    // Create scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7);
    this.scene.add(directionalLight);

    // Create camera
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.camera.position.set(0, 1.2, 2.2);

    // Create renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.container.appendChild(this.renderer.domElement);

    // Add orbit controls for development
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;

    // Load the arcade cabinet model
    this.loadModel();

    // Handle window resize
    window.addEventListener('resize', this.onWindowResize.bind(this));
    
    // Add click event listener for interaction
    this.renderer.domElement.addEventListener('click', this.onClick.bind(this));

    // Start animation loop
    this.animate();
  }

  loadModel() {
    // Try loading FBX first (usually most complete format)
    const fbxLoader = new FBXLoader();
    fbxLoader.load('/models/fbx.fbx', (object) => {
      this.handleLoadedModel(object);
    }, undefined, (error) => {
      console.log('FBX loading failed, trying OBJ...');
      
      // If FBX fails, try OBJ
      const objLoader = new OBJLoader();
      objLoader.load('/models/obj.obj', (object) => {
        this.handleLoadedModel(object);
      }, undefined, (error) => {
        console.error('Failed to load model:', error);
      });
    });
  }

  handleLoadedModel(object) {
    // Scale and position the cabinet model
    object.scale.set(0.5, 0.5, 0.5);
    object.position.set(0, 0, 0);
    
    // Store reference to the cabinet
    this.cabinet = object;
    
    // Add the cabinet to the scene
    this.scene.add(object);
    
    // Find interactive elements like screen, joystick, buttons
    this.identifyInteractiveElements(object);
    
    // Position camera to best view the cabinet
    this.positionCamera();
    
    console.log('Model loaded successfully!');
    console.log('Model structure:', object);
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
      this.screenMesh.material.map = this.gameTexture;
      this.screenMesh.material.needsUpdate = true;
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
    this.screenMesh.position.set(0, 1.2, 0.01); // Position it on the cabinet
    
    if (this.cabinet) {
      this.cabinet.add(this.screenMesh);
    } else {
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
    ctx.fillStyle = 'green';
    ctx.textAlign = 'center';
    ctx.fillText('Game Loading...', this.gameCanvas.width/2, this.gameCanvas.height/2);
    
    // Create a texture from the canvas
    this.gameTexture = new THREE.CanvasTexture(this.gameCanvas);
  }
  
  positionCamera() {
    if (!this.cabinet) return;
    
    // Get the bounding box of the cabinet
    const boundingBox = new THREE.Box3().setFromObject(this.cabinet);
    const center = boundingBox.getCenter(new THREE.Vector3());
    const size = boundingBox.getSize(new THREE.Vector3());
    
    // Position camera to see the whole cabinet
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = this.camera.fov * (Math.PI / 180);
    const cameraDistance = maxDim / (2 * Math.tan(fov / 2));
    
    // Set the camera position
    this.camera.position.set(center.x, center.y, center.z + cameraDistance * 1.5);
    this.camera.lookAt(center);
    
    // Update the orbit controls target
    this.controls.target.copy(center);
    this.controls.update();
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

  onWindowResize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));
    
    if (this.controls) {
      this.controls.update();
    }
    
    this.renderer.render(this.scene, this.camera);
  }
  
  // Function to connect a game to the arcade cabinet
  connectGame(gameCanvas) {
    // Use the game's canvas as the texture for our screen
    if (gameCanvas && this.gameTexture) {
      this.updateGameDisplay(gameCanvas);
    }
  }
}

export default ArcadeCabinet;