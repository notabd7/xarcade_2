import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
// Removed OrbitControls as we don't need interactive rotation anymore

// Add a global reference to access from console
window.arcadeCabinetInstance = null;

class ArcadeCabinet {
  constructor(container) {
    this.container = container;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
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
    window.arcadeCabinetInstance = this;
    this.init();
  }


  init() {
    console.log('Initializing ArcadeCabinet');
    // Create scene
    this.scene = new THREE.Scene();
    this.selectedGameIndex = 0;
    this.scene.background = new THREE.Color(0x000000);

    // Add lights with more dramatic lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambientLight);

    // Add more directional lights for better illumination
    const frontLight = new THREE.DirectionalLight(0x18cae6, 1.0); // Cyan-blue light from front
    frontLight.position.set(0, 0, 5);
    this.scene.add(frontLight);
    document.addEventListener('keydown', this.handleKeyPress.bind(this));
  
  // Add scroll event for game selection
    document.addEventListener('wheel', this.handleScroll.bind(this));
    const topLight = new THREE.DirectionalLight(0xffffff, 0.8);
    topLight.position.set(0, 5, 0);
    this.scene.add(topLight);

    // Create camera with fixed position
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    
    // Use the exact camera position from the metrics
    this.camera.position.set(1.25/1.15, 0.46/1.15, 1.25/1.15);
    
    // Set camera rotation (need to convert degrees to radians)
    const degToRad = Math.PI / 180;
    this.camera.rotation.set(
      -14.04 * degToRad,
      44.13 * degToRad,
      9.87 * degToRad
    );
    this.camera.lookAt(0, 0, 0); // Still look at center

    // Create renderer
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true // Enable transparency
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.container.appendChild(this.renderer.domElement);

    // Add a loading indicator
    this.addLoadingIndicator();

    // Load the arcade cabinet model
    this.loadModel();

    // Handle window resize
    window.addEventListener('resize', this.onWindowResize.bind(this));
    
    // Add click event listener for interaction
    this.renderer.domElement.addEventListener('click', this.onClick.bind(this));

    // Start animation loop
    this.animate();
    
    console.log('ArcadeCabinet initialization complete');
  }
  handleKeyPress(event) {
    switch(event.key) {
      case 'ArrowUp':
        this.selectedGameIndex = Math.max(0, this.selectedGameIndex - 1);
        this.createGameMenu();
        break;
      case 'ArrowDown':
        this.selectedGameIndex = Math.min(4, this.selectedGameIndex + 1);
        this.createGameMenu();
        break;
      case 'Enter':
        const selectedGame = this.createGameMenu();
        if (selectedGame.available) {
          this.loadGame(selectedGame.id);
        }
        break;
    }
  }
  
  // Add method to handle scroll
  handleScroll(event) {
    if (event.deltaY > 0) {
      // Scroll down
      this.selectedGameIndex = Math.min(4, this.selectedGameIndex + 1);
    } else {
      // Scroll up
      this.selectedGameIndex = Math.max(0, this.selectedGameIndex - 1);
    }
    this.createGameMenu();
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
    
    // Apply the fixed position and rotation from metrics
    this.applyFixedPositionAndRotation(cabinetGroup);
    
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
    
    // Center the model at the origin first
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
    
    // Apply the fixed position and rotation from metrics
    this.applyFixedPositionAndRotation(object);
    
    // Find interactive elements
    this.identifyInteractiveElements(object);
    
    
    
    this.modelLoaded = true;
    console.log('Model loaded and positioned successfully');
  }
  
  // New method to apply the fixed position and rotation
// Replace the applyFixedPositionAndRotation method with this centered version
// Replace the applyFixedPositionAndRotation method with this fully centered version
applyFixedPositionAndRotation(model) {
    if (!model) return;
    
    // Set rotation based on the metrics (converting degrees to radians)
    const degToRad = Math.PI / 180;
    model.rotation.set(
      -85.00 * degToRad,
      5.00 * degToRad,
      -50.00 * degToRad
    );
    
    // Calculate the model's bounding box after rotation is applied
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    
    // Position the model - shift left to center under the XARCADE logo
    model.position.set(
      -0.16,           // Shift left (-x direction) to center under logo
      -1.75,          // Keep vertical position
      0               // Keep depth position
    );
    
    console.log('Applied adjusted position and rotation to model');
  }
  
  // Add new method to change model colors
  applyArcadeColors(object) {
    // Define materials with your requested colors
    const arcadeMaterial = new THREE.MeshPhongMaterial({
      color: 0x800080, // Purple
      specular: 0x222222,
      shininess: 30,
      emissive: 0x200020, // Slight emissive purple glow
    });
    
    // Define joystick materials
    const joystickBaseMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x444444, // Grey for base
      shininess: 40 
    });
    
    const joystickStickMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x222222, // Black for stick
      shininess: 30 
    });
    
    const joystickTopMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xff0000, // Red for top
      emissive: 0x330000,
      shininess: 60 
    });
    
    // Define button materials with different colors
    const buttonMaterials = [
      new THREE.MeshPhongMaterial({ 
        color: 0xff0000, // Red
        emissive: 0x330000,
        shininess: 50 
      }),
      new THREE.MeshPhongMaterial({ 
        color: 0xffff00, // Yellow
        emissive: 0x333300,
        shininess: 50 
      }),
      new THREE.MeshPhongMaterial({ 
        color: 0x0000ff, // Blue
        emissive: 0x000033,
        shininess: 50 
      })
    ];
    
    // Apply materials based on mesh names or positions
    object.traverse((child) => {
      if (child.isMesh) {
        // By default, apply the arcade purple material
        child.material = arcadeMaterial.clone();
        
        // Use name to identify specific parts for different colors
        const name = (child.name || '').toLowerCase();
        
        if (name.includes('joystick')) {
          if (name.includes('base')) {
            child.material = joystickBaseMaterial.clone();
          } else if (name.includes('top')) {
            child.material = joystickTopMaterial.clone();
          } else {
            child.material = joystickStickMaterial.clone();
          }
        }
        else if (name.includes('button') || name.includes('btn')) {
          // Assign button colors sequentially
          const buttonIndex = this.interactiveElements.buttons.length % buttonMaterials.length;
          child.material = buttonMaterials[buttonIndex].clone();
          this.interactiveElements.buttons.push(child);
        }
        else if (name.includes('screen')) {
          // For screen, use a black material
          child.material = new THREE.MeshBasicMaterial({ 
            color: 0x000000
          });
          this.screenMesh = child;
        }
        
        // Enable shadows
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }
  createGameMenu() {
    const games = [
      { id: 'endersgame', name: 'Enders Game', available: true },
      { id: 'cosmicchase', name: 'Cosmic Chase', available: false },
      { id: 'cyberbattle', name: 'Cyber Battle', available: false },
      { id: 'pixelwarfare', name: 'Pixel Warfare', available: false },
      { id: 'neonrider', name: 'Neon Rider', available: false }
    ];
  
    // Create canvas for the game menu
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 384;
    const ctx = canvas.getContext('2d');
    
    // Draw background with a subtle gradient for more arcade feel
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#000000');
    gradient.addColorStop(1, '#111111');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw a border/bezel around the screen
    ctx.strokeStyle = '#ff00ff';
    ctx.lineWidth = 4;
    ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);
    
    // Draw header with glow effect
    ctx.shadowColor = '#ff00ff';
    ctx.shadowBlur = 15;
    ctx.font = 'bold 24px "Press Start 2P", Arial, monospace';
    ctx.fillStyle = '#ff00ff'; // Purple
    ctx.textAlign = 'center';
    ctx.fillText('XARCADE', canvas.width/2, 40);
    ctx.fillText('Choose a Game!', canvas.width/2, 80);
    ctx.shadowBlur = 0;
    
    // Draw game list
    ctx.font = '16px "Press Start 2P", Arial, monospace';
    
    games.forEach((game, index) => {
      const yPos = 140 + (index * 45);
      
      // Highlight selected game
      if (index === this.selectedGameIndex) {
        ctx.fillStyle = '#ff00ff'; // Purple for selected
        
        // Draw selection indicator
        ctx.fillText('>', 120, yPos);
        ctx.fillText('<', canvas.width - 120, yPos);
      } else {
        ctx.fillStyle = game.available ? '#888888' : '#444444';
      }
      
      // Draw game name
      ctx.fillText(game.name, canvas.width/2, yPos);
      
      // Draw availability
      const status = game.available ? 'Ready' : 'Coming Soon';
      ctx.font = '10px "Press Start 2P", Arial, monospace';
      ctx.fillText(status, canvas.width/2, yPos + 20);
      ctx.font = '16px "Press Start 2P", Arial, monospace';
    });
    
    // Draw instructions
    ctx.font = '10px "Press Start 2P", Arial, monospace';
    ctx.fillStyle = '#ff00ff';
    ctx.fillText('UP/DOWN to select, ENTER to play', canvas.width/2, 340);
    
    // Create or update the texture
    if (!this.gameTexture) {
      this.gameTexture = new THREE.CanvasTexture(canvas);
      
      if (this.screenMesh) {
        if (Array.isArray(this.screenMesh.material)) {
          this.screenMesh.material[0].map = this.gameTexture;
          this.screenMesh.material[0].needsUpdate = true;
        } else {
          this.screenMesh.material.map = this.gameTexture;
          this.screenMesh.material.needsUpdate = true;
        }
      }
    } else {
      this.gameTexture.image = canvas;
      this.gameTexture.needsUpdate = true;
    }
    
    return games[this.selectedGameIndex];
  }
  
  
  identifyInteractiveElements(object) {
    console.log('Searching for interactive elements...');
    
    // Create a flag to track if we found the screen
    let screenFound = false;
    
    object.traverse((child) => {
      if (child.isMesh) {
        console.log('Found mesh:', child.name);
        
        // Look for naming patterns that might indicate screen, joystick, buttons
        if (child.name.toLowerCase().includes('screen') || 
            child.name.toLowerCase().includes('display') ||
            child.name.toLowerCase().includes('monitor')) {
          this.setupScreen(child);
          screenFound = true;
        } 
        else if (child.name.toLowerCase().includes('joystick')) {
          this.interactiveElements.joystick = child;
        }
        else if (child.name.toLowerCase().includes('button') || 
                 child.name.toLowerCase().includes('btn')) {
          this.interactiveElements.buttons.push(child);
        }
      }
    });
    
    // If we couldn't identify the screen by name, look for flat rectangular surfaces
    if (!screenFound) {
      this.guessScreenMesh(object);
    }
    
    // Create game menu once screen is set up
    if (this.screenMesh) {
      this.createGameMenu();
    }
    
    console.log('Interactive elements found:', this.interactiveElements);
  }
  
  guessScreenMesh(object) {
    console.log('Attempting to guess which mesh is the screen...');
    let potentialScreens = [];
    
    object.traverse((child) => {
      if (child.isMesh) {
        // Check if this mesh could be a screen (flat rectangular surface)
        const geometry = child.geometry;
        
        // For PlaneGeometry
        if (geometry.type === 'PlaneGeometry' || geometry.type === 'PlaneBufferGeometry') {
          potentialScreens.push({mesh: child, score: 10});
        } 
        // For BoxGeometry with one dimension much smaller than others (like a flat panel)
        else if (geometry.type === 'BoxGeometry' || geometry.type === 'BoxBufferGeometry') {
          const params = geometry.parameters;
          // If one dimension is significantly smaller, it might be a screen
          if (params && (
            (params.depth && params.depth < params.width * 0.2 && params.depth < params.height * 0.2) ||
            (params.width && params.width < params.depth * 0.2 && params.width < params.height * 0.2) ||
            (params.height && params.height < params.width * 0.2 && params.height < params.depth * 0.2)
          )) {
            potentialScreens.push({mesh: child, score: 8});
          } else {
            potentialScreens.push({mesh: child, score: 5});
          }
        }
      }
    });
    
    console.log('Potential screens found:', potentialScreens.length);
    
    if (potentialScreens.length > 0) {
      // Sort by score (highest first)
      potentialScreens.sort((a, b) => b.score - a.score);
      this.setupScreen(potentialScreens[0].mesh);
    } else {
      // If we still can't find a screen, create one
      this.createVirtualScreen();
    }
}
setupScreen(mesh) {
    console.log('Setting up screen mesh:', mesh);
    this.screenMesh = mesh;
    
    // Create game texture if it doesn't exist
    if (!this.gameTexture) {
      this.createGameTexture();
    }
    
    // Create a specific material for the screen with emissive properties
    const screenMaterial = new THREE.MeshBasicMaterial({
      map: this.gameTexture,
      emissive: 0x222222,
      emissiveIntensity: 0.5
    });
    
    // Apply the material to the screen mesh
    this.screenMesh.material = screenMaterial;
    this.screenMesh.material.needsUpdate = true;
    
    // Make screen slightly forward-facing
    if (this.cabinet) {
      const box = new THREE.Box3().setFromObject(this.cabinet);
      const cabinetDepth = box.max.z - box.min.z;
      // Move screen slightly forward to avoid z-fighting
      this.screenMesh.position.z += 0.001;
    }
    
    // Create initial game menu
    this.createGameMenu();
  }
  
  createVirtualScreen() {
    console.log('Creating virtual screen');
    
    // Create a plane geometry for the screen
    const geometry = new THREE.PlaneGeometry(0.5, 0.4);
    const material = new THREE.MeshBasicMaterial({ 
      color: 0x000000,
      emissive: 0x222222,
      emissiveIntensity: 0.5
    });
    
    this.screenMesh = new THREE.Mesh(geometry, material);
    
    // Position depends on if we have a cabinet or not
    if (this.cabinet) {
      // Position relative to cabinet
      const box = new THREE.Box3().setFromObject(this.cabinet);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      
      this.screenMesh.position.set(
        center.x,
        center.y + size.y * 0.25, // Position at upper portion of cabinet
        center.z + size.z * 0.4   // Front of cabinet but not too far out
      );
      this.cabinet.add(this.screenMesh);
    } else {
      // Position in world if no cabinet
      this.screenMesh.position.set(0, 0.2, 0.01);
      this.scene.add(this.screenMesh);
    }
    
    // Set up the game texture
    this.createGameTexture();
    this.screenMesh.material.map = this.gameTexture;
    
    // Create initial game menu
    this.createGameMenu();
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
    ctx.fillText('XARCADE', this.gameCanvas.width/2, this.gameCanvas.height/2 + 40);
    
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
  loadGame(gameId) {
    if (gameId === 'endersgame') {
      // Render loading message
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 384;
      const ctx = canvas.getContext('2d');
      
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.font = '20px "Press Start 2P", monospace';
      ctx.fillStyle = '#ff00ff';
      ctx.textAlign = 'center';
      ctx.fillText('Loading Enders Game...', canvas.width/2, canvas.height/2);
      
      this.gameTexture.image = canvas;
      this.gameTexture.needsUpdate = true;
      
      // Load the aesteroids game
      setTimeout(() => {
        // Create an iframe to load the game
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = '/aesteroids/index.html';
        iframe.onload = () => {
          try {
            const gameCanvas = iframe.contentDocument.getElementById('gameCanvas');
            if (gameCanvas) {
              this.connectGame(gameCanvas);
            }
          } catch (error) {
            console.error('Error loading game:', error);
          }
        };
        document.body.appendChild(iframe);
      }, 1500);
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