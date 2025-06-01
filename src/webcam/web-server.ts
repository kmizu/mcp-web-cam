import express from 'express';
import cors from 'cors';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import open from 'open';
import { WebcamController } from './controller.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class CameraWebServer {
  private app: express.Application;
  private server: any;
  private port: number = 0;
  private webcamController: WebcamController;
  private selectedCamera: string | null = null;

  constructor(webcamController: WebcamController) {
    this.webcamController = webcamController;
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.static(path.join(__dirname, '../../public')));
  }

  private setupRoutes() {
    // Get list of cameras
    this.app.get('/api/cameras', async (req, res) => {
      try {
        const cameras = await this.webcamController.listCameras();
        res.json({ 
          cameras,
          selectedCamera: this.selectedCamera || (cameras.length > 0 ? cameras[0].id : null)
        });
      } catch (error) {
        res.status(500).json({ error: 'Failed to list cameras' });
      }
    });

    // Set selected camera
    this.app.post('/api/camera/select', (req, res) => {
      const { cameraId } = req.body;
      if (cameraId) {
        this.selectedCamera = cameraId;
        this.webcamController.setSelectedCamera(cameraId);
        res.json({ success: true, selectedCamera: cameraId });
      } else {
        res.status(400).json({ error: 'Camera ID required' });
      }
    });

    // Get camera preview frame
    this.app.get('/api/camera/preview/:cameraId', async (req, res) => {
      try {
        const { cameraId } = req.params;
        const result = await this.webcamController.capturePhoto({
          device: cameraId,
          width: 640,
          height: 480,
          quality: 70,
          output: 'jpeg',
          callbackReturn: 'buffer'
        });

        if (result.success && result.data) {
          res.set('Content-Type', 'image/jpeg');
          res.send(result.data);
        } else {
          res.status(500).json({ error: result.error || 'Failed to capture preview' });
        }
      } catch (error) {
        res.status(500).json({ error: 'Failed to capture preview' });
      }
    });

    // Serve the HTML page
    this.app.get('/', async (req, res) => {
      const htmlPath = path.join(__dirname, '../../public/index.html');
      try {
        const html = await fs.readFile(htmlPath, 'utf-8');
        res.send(html);
      } catch {
        // If public/index.html doesn't exist, serve inline HTML
        res.send(this.getInlineHTML());
      }
    });
  }

  private getInlineHTML(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Camera Selection - MCP Web Cam</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #1a1a1a;
      color: #fff;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .container {
      max-width: 1200px;
      width: 90%;
      padding: 2rem;
    }
    
    h1 {
      text-align: center;
      margin-bottom: 2rem;
      font-size: 2.5rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    
    .camera-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 2rem;
      margin-top: 2rem;
    }
    
    .camera-card {
      background: #2a2a2a;
      border-radius: 12px;
      overflow: hidden;
      transition: all 0.3s ease;
      cursor: pointer;
      border: 2px solid transparent;
    }
    
    .camera-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    }
    
    .camera-card.selected {
      border-color: #667eea;
      box-shadow: 0 0 20px rgba(102, 126, 234, 0.4);
    }
    
    .camera-preview {
      width: 100%;
      height: 240px;
      background: #1a1a1a;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow: hidden;
    }
    
    .camera-preview img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    .camera-preview video {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    .camera-preview .loading {
      position: absolute;
      width: 50px;
      height: 50px;
      border: 3px solid #333;
      border-top-color: #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    .camera-info {
      padding: 1.5rem;
    }
    
    .camera-name {
      font-size: 1.2rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
    }
    
    .camera-id {
      color: #888;
      font-size: 0.9rem;
      font-family: monospace;
    }
    
    .select-button {
      width: 100%;
      padding: 0.75rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.3s ease;
      margin-top: 1rem;
    }
    
    .select-button:hover {
      opacity: 0.9;
    }
    
    .select-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    .status {
      text-align: center;
      margin-top: 2rem;
      padding: 1rem;
      background: #2a2a2a;
      border-radius: 8px;
      color: #888;
    }
    
    .error {
      color: #ff6b6b;
      text-align: center;
      margin-top: 2rem;
      padding: 1rem;
      background: rgba(255, 107, 107, 0.1);
      border-radius: 8px;
    }
    
    .no-cameras {
      text-align: center;
      color: #888;
      font-size: 1.2rem;
      margin-top: 3rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Select Camera</h1>
    <div id="status" class="status">Loading cameras...</div>
    <div id="camera-grid" class="camera-grid"></div>
  </div>

  <script>
    let selectedCamera = null;
    let cameras = [];
    let useWebRTC = true;

    async function loadCameras() {
      try {
        const response = await fetch('/api/cameras');
        const data = await response.json();
        cameras = data.cameras;
        selectedCamera = data.selectedCamera;
        
        if (cameras.length === 0) {
          document.getElementById('camera-grid').innerHTML = 
            '<div class="no-cameras">No cameras found. Please check your camera connections.</div>';
          document.getElementById('status').style.display = 'none';
          return;
        }
        
        // Try to get WebRTC cameras for better preview
        if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
          try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            
            // Match system cameras with WebRTC devices
            cameras = cameras.map((camera, index) => ({
              ...camera,
              deviceId: videoDevices[index]?.deviceId || null
            }));
          } catch (e) {
            console.log('WebRTC not available, using snapshot mode');
            useWebRTC = false;
          }
        }
        
        renderCameras();
        document.getElementById('status').textContent = 
          \`Found \${cameras.length} camera(s). Click on a camera to select it.\`;
      } catch (error) {
        document.getElementById('status').className = 'error';
        document.getElementById('status').textContent = 'Failed to load cameras: ' + error.message;
      }
    }

    function renderCameras() {
      const grid = document.getElementById('camera-grid');
      grid.innerHTML = cameras.map((camera, index) => \`
        <div class="camera-card \${camera.id === selectedCamera ? 'selected' : ''}" 
             data-camera-id="\${camera.id}"
             onclick="selectCamera('\${camera.id}')">
          <div class="camera-preview" id="preview-\${index}">
            <div class="loading"></div>
          </div>
          <div class="camera-info">
            <div class="camera-name">\${camera.name}</div>
            <div class="camera-id">\${camera.id}</div>
            <button class="select-button" \${camera.id === selectedCamera ? 'disabled' : ''}>
              \${camera.id === selectedCamera ? 'Selected' : 'Select This Camera'}
            </button>
          </div>
        </div>
      \`).join('');
      
      // Start previews
      cameras.forEach((camera, index) => {
        if (useWebRTC && camera.deviceId) {
          startWebRTCPreview(camera.deviceId, index);
        } else {
          startSnapshotPreview(camera.id, index);
        }
      });
    }

    async function startWebRTCPreview(deviceId, index) {
      const previewEl = document.getElementById(\`preview-\${index}\`);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: { exact: deviceId } }
        });
        
        const video = document.createElement('video');
        video.srcObject = stream;
        video.autoplay = true;
        video.muted = true;
        previewEl.innerHTML = '';
        previewEl.appendChild(video);
      } catch (error) {
        console.error('WebRTC preview failed:', error);
        // Fallback to snapshot
        startSnapshotPreview(cameras[index].id, index);
      }
    }

    async function startSnapshotPreview(cameraId, index) {
      const previewEl = document.getElementById(\`preview-\${index}\`);
      
      async function updatePreview() {
        try {
          const img = new Image();
          img.onload = () => {
            previewEl.innerHTML = '';
            previewEl.appendChild(img);
          };
          img.onerror = () => {
            previewEl.innerHTML = '<div style="padding: 20px; text-align: center; color: #888;">Camera preview unavailable</div>';
          };
          img.src = \`/api/camera/preview/\${encodeURIComponent(cameraId)}?t=\${Date.now()}\`;
        } catch (error) {
          console.error('Preview failed:', error);
        }
      }
      
      updatePreview();
      // Update every 2 seconds
      setInterval(updatePreview, 2000);
    }

    async function selectCamera(cameraId) {
      try {
        const response = await fetch('/api/camera/select', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cameraId })
        });
        
        if (response.ok) {
          selectedCamera = cameraId;
          renderCameras();
          document.getElementById('status').textContent = 'Camera selected successfully!';
          
          // Close window after a short delay
          setTimeout(() => {
            window.close();
          }, 1500);
        } else {
          throw new Error('Failed to select camera');
        }
      } catch (error) {
        document.getElementById('status').className = 'error';
        document.getElementById('status').textContent = 'Failed to select camera: ' + error.message;
      }
    }

    // Load cameras on page load
    loadCameras();
  </script>
</body>
</html>`;
  }

  async start(): Promise<number> {
    return new Promise((resolve) => {
      this.server = this.app.listen(0, () => {
        const address = this.server.address();
        this.port = typeof address === 'object' ? address.port : 0;
        console.error(`Camera selection server running on http://localhost:${this.port}`);
        resolve(this.port);
      });
    });
  }

  async stop() {
    if (this.server) {
      this.server.close();
    }
  }

  async openBrowser() {
    if (this.port) {
      await open(`http://localhost:${this.port}`);
    }
  }

  getSelectedCamera(): string | null {
    return this.selectedCamera;
  }
}