import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

class ArcadeCabinet {
  constructor(container) {
    this.container = container;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    //this.controls = null;
    this.cabinet = null;
    this.screenMesh = null;
    this.gameTexture = null;
    this.gameCanvas = null;
    this.joystick = null;
    this.buttons = [];
    
    this.init();
  }

  init() {
    // Create scene, camera, renderer
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);
    
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.19, 1000);
    this.camera.position.set(0, 0.7, 2.2); // Moved closer to screen
    
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.container.appendChild(this.renderer.domElement);
    
    // Add controls for easy manipulation during development
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    
    // Add lights
    this.addLights();
    
    // Create the arcade cabinet
    this.createCabinet();
    
    // Handle window resize
    window.addEventListener('resize', this.onWindowResize.bind(this));
    
    // Start animation loop
    this.animate();
  }
  
  addLights() {
    // Ambient light for general illumination
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambientLight);
    
    // Add key light from the front
    const frontLight = new THREE.DirectionalLight(0xff00ff, 1.0); // Magenta light
    frontLight.position.set(0, 0, 5);
    this.scene.add(frontLight);
    
    // Add fill light from the top
    const topLight = new THREE.DirectionalLight(0x00ffff, 0.8); // Cyan light
    topLight.position.set(0, 5, 0);
    this.scene.add(topLight);
    
    // Add rim light from behind
    const backLight = new THREE.DirectionalLight(0xffffff, 0.5);
    backLight.position.set(0, 2, -5);
    this.scene.add(backLight);
  }
  
  createCabinet() {
    // Group to hold all cabinet parts
    this.cabinet = new THREE.Group();
    
    // Create the main cabinet body
    this.createCabinetBody();
    
    // Create the screen
    this.createScreen();
    
    // Create the control panel
    this.createControlPanel();
    
    // Add the cabinet to the scene
    this.scene.add(this.cabinet);
    this.cabinet.position.y = -1.6;
  }
  
  createCabinetBody() {
    // Main cabinet body - use a slightly tapered shape for realism
    const bodyGeometry = new THREE.BoxGeometry(1.2, 2, 0.8);
    const bodyMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x220022, // Dark purple
      specular: 0xff00ff, // Magenta highlights
      shininess: 30
    });
    
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 1; // Position at center of body height
    this.cabinet.add(body);
    
    // Add decorative side panels
    const sidePanelGeometry = new THREE.PlaneGeometry(0.85, 1.8);
    const sidePanelMaterial = new THREE.MeshPhongMaterial({
      color: 0xff00ff, // Magenta
      emissive: 0x330033, // Slight glow
      shininess: 50
    });
    
    // Left panel
    const leftPanel = new THREE.Mesh(sidePanelGeometry, sidePanelMaterial);
    leftPanel.position.set(-0.6, 1, 0.01);
    leftPanel.rotation.y = Math.PI / 2;
    this.cabinet.add(leftPanel);
    
    // Right panel
    const rightPanel = new THREE.Mesh(sidePanelGeometry, sidePanelMaterial);
    rightPanel.position.set(0.6, 1, 0.01);
    rightPanel.rotation.y = -Math.PI / 2;
    this.cabinet.add(rightPanel);
    
    // Cabinet top
    const topGeometry = new THREE.BoxGeometry(1.2, 0.1, 0.8);
    const top = new THREE.Mesh(topGeometry, bodyMaterial);
    top.position.y = 2.05;
    this.cabinet.add(top);
    
    // Create marquee (arcade sign)
    this.createMarquee();
  }
  
  createMarquee() {
    // Marquee box
    const marqueeGeometry = new THREE.BoxGeometry(1.2, 0.3, 0.2);
    const marqueeMaterial = new THREE.MeshPhongMaterial({
      color: 0x220022,
      specular: 0xff00ff,
      shininess: 30
    });
    
    const marquee = new THREE.Mesh(marqueeGeometry, marqueeMaterial);
    marquee.position.y = 2.25;
    marquee.position.z = 0.3;
    this.cabinet.add(marquee);
    
    // Marquee display (XARCADE sign)
    const marqueeFrontGeometry = new THREE.PlaneGeometry(1.1, 0.25);
    
    // Create canvas for the marquee texture
    const marqueeCanvas = document.createElement('canvas');
    marqueeCanvas.width = 512;
    marqueeCanvas.height = 128;
    const ctx = marqueeCanvas.getContext('2d');
    
    // Fill with dark background
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, marqueeCanvas.width, marqueeCanvas.height);
    
    // Add gradient for the text
    const gradient = ctx.createLinearGradient(0, 0, 0, marqueeCanvas.height);
    gradient.addColorStop(0, '#ff00ff'); // Magenta
    gradient.addColorStop(0.5, '#ff77ff'); // Light magenta
    gradient.addColorStop(1, '#ff00ff'); // Magenta
    
    ctx.fillStyle = gradient;
    ctx.font = 'bold 72px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#ff00ff';
    ctx.shadowBlur = 15;
    ctx.fillText('XARCADE', marqueeCanvas.width/2, marqueeCanvas.height/2);
    
    const marqueeTexture = new THREE.CanvasTexture(marqueeCanvas);
    const marqueeFrontMaterial = new THREE.MeshBasicMaterial({
      map: marqueeTexture,
      emissive: 0xff00ff,
      emissiveIntensity: 0.5
    });
    
    const marqueeFront = new THREE.Mesh(marqueeFrontGeometry, marqueeFrontMaterial);
    marqueeFront.position.y = 2.25;
    marqueeFront.position.z = 0.41;
    this.cabinet.add(marqueeFront);
  }
  
  createScreen() {
    // Screen bezel
    const bezelGeometry = new THREE.BoxGeometry(1, 0.8, 0.05);
    const bezelMaterial = new THREE.MeshPhongMaterial({
      color: 0x000000,
      specular: 0x444444,
      shininess: 30
    });
    
    const bezel = new THREE.Mesh(bezelGeometry, bezelMaterial);
    bezel.position.y = 1.4;
    bezel.position.z = 0.4;
    this.cabinet.add(bezel);
    
    // Actual screen
    const screenGeometry = new THREE.PlaneGeometry(0.9, 0.7);
    
    // Create canvas for the screen
    const screenCanvas = document.createElement('canvas');
    screenCanvas.width = 512;
    screenCanvas.height = 384;
    const ctx = screenCanvas.getContext('2d');
    
    // Fill with black background
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, screenCanvas.width, screenCanvas.height);
    
    // Create neon text
    ctx.font = 'bold 48px "Press Start 2P", Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Shadow for glow effect
    ctx.shadowColor = '#ff00ff';
    ctx.shadowBlur = 15;
    
    // Main text
    ctx.fillStyle = '#ff00ff';
    ctx.fillText('XARCADE', screenCanvas.width/2, screenCanvas.height/2 - 30);
    
    // Subtitle
    ctx.font = 'bold 20px Arial';
    ctx.fillStyle = '#00ffff';
    ctx.shadowColor = '#00ffff';
    ctx.fillText('INSERT COIN', screenCanvas.width/2, screenCanvas.height/2 + 40);
    
    // Draw a border
    ctx.strokeStyle = '#ff00ff';
    ctx.lineWidth = 5;
    ctx.strokeRect(10, 10, screenCanvas.width - 20, screenCanvas.height - 20);
    
    this.gameTexture = new THREE.CanvasTexture(screenCanvas);
    this.gameCanvas = screenCanvas;
    
    const screenMaterial = new THREE.MeshBasicMaterial({
      map: this.gameTexture
    });
    
    this.screenMesh = new THREE.Mesh(screenGeometry, screenMaterial);
    this.screenMesh.position.y = 1.4;
    this.screenMesh.position.z = 0.43; // Slightly in front of bezel
    this.cabinet.add(this.screenMesh);
  }
  
  createControlPanel() {
    // Control panel base
    const panelGeometry = new THREE.BoxGeometry(1.2, 0.1, 0.4);
    const panelMaterial = new THREE.MeshPhongMaterial({
      color: 0x220022,
      specular: 0xff00ff,
      shininess: 30
    });
    
    const panel = new THREE.Mesh(panelGeometry, panelMaterial);
    panel.position.y = 0.75;
    panel.position.z = 0.2;
    panel.rotation.x = -Math.PI / 6; // Angle the panel
    this.cabinet.add(panel);
    
    // Joystick base
    const joystickBaseGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.02, 16);
    const joystickBaseMaterial = new THREE.MeshPhongMaterial({
      color: 0x000000,
      specular: 0x444444,
      shininess: 30
    });
    
    const joystickBase = new THREE.Mesh(joystickBaseGeometry, joystickBaseMaterial);
    joystickBase.position.y = 0.81;
    joystickBase.position.x = -0.3;
    joystickBase.position.z = 0.2;
    joystickBase.rotation.x = -Math.PI / 6;
    this.cabinet.add(joystickBase);
    
    // Joystick stick
    const joystickGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.1, 8);
    const joystickMaterial = new THREE.MeshPhongMaterial({
      color: 0xff0000, // Red joystick
      specular: 0xffffff,
      shininess: 80
    });
    
    const joystick = new THREE.Mesh(joystickGeometry, joystickMaterial);
    joystick.position.y = 0.87;
    joystick.position.x = -0.3;
    joystick.position.z = 0.2;
    joystick.rotation.x = -Math.PI / 6;
    this.cabinet.add(joystick);
    this.joystick = joystick;
    
    // Buttons
    this.createButtons();
  }
  
  createButtons() {
    const buttonGeometry = new THREE.CylinderGeometry(0.04, 0.04, 0.02, 16);
    const buttonColors = [
      0xff0000, // Red
      0x00ff00, // Green
      0x0000ff, // Blue
      0xffff00, // Yellow
      0xff00ff, // Magenta
      0x00ffff  // Cyan
    ];
    
    const buttonPositions = [
      { x: 0.15, y: 0.81, z: 0.2 },
      { x: 0.30, y: 0.81, z: 0.2 },
      { x: 0.15, y: 0.81, z: 0.3 },
      { x: 0.30, y: 0.81, z: 0.3 },
      { x: -0.15, y: 0.81, z: 0.3 },
      { x: -0.3, y: 0.81, z: 0.3 }
    ];
    
    buttonPositions.forEach((pos, index) => {
      const buttonMaterial = new THREE.MeshPhongMaterial({
        color: buttonColors[index % buttonColors.length],
        specular: 0xffffff,
        shininess: 80
      });
      
      const button = new THREE.Mesh(buttonGeometry, buttonMaterial);
      button.position.set(pos.x, pos.y, pos.z);
      button.rotation.x = -Math.PI / 6; // Same angle as control panel
      this.cabinet.add(button);
      this.buttons.push(button);
    });
  }
  
  updateScreen(text) {
    if (!this.gameCanvas || !this.gameTexture) return;
    
    const ctx = this.gameCanvas.getContext('2d');
    
    // Clear the canvas
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, this.gameCanvas.width, this.gameCanvas.height);
    
    // Create neon text
    ctx.font = 'bold 48px "Press Start 2P", Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Shadow for glow effect
    ctx.shadowColor = '#ff00ff';
    ctx.shadowBlur = 15;
    
    // Main text
    ctx.fillStyle = '#ff00ff';
    ctx.fillText(text, this.gameCanvas.width/2, this.gameCanvas.height/2 - 30);
    
    // Subtitle
    ctx.font = 'bold 20px Arial';
    ctx.fillStyle = '#00ffff';
    ctx.shadowColor = '#00ffff';
    ctx.fillText('INSERT COIN', this.gameCanvas.width/2, this.gameCanvas.height/2 + 40);
    
    // Draw a border
    ctx.strokeStyle = '#ff00ff';
    ctx.lineWidth = 5;
    ctx.strokeRect(10, 10, this.gameCanvas.width - 20, this.gameCanvas.height - 20);
    
    // Update the texture
    this.gameTexture.needsUpdate = true;
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
    
    
    
    // Update controls
    if (this.controls) {
      this.controls.update();
    }
    
    this.renderer.render(this.scene, this.camera);
  }
}

export default ArcadeCabinet;