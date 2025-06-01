import NodeWebcam from 'node-webcam';
import { promises as fs } from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import sharp from 'sharp';
import { 
  WebcamOptions, 
  CameraInfo, 
  CameraSettings, 
  CaptureResult,
  RecordingOptions 
} from './types';

const execAsync = promisify(exec);

export class WebcamController {
  private webcam: any;
  private isRecording: boolean = false;
  private recordingProcess: any = null;
  private capturesDir: string;
  private recordingsDir: string;
  private selectedCamera: string | null = null;
  private preferencesFile: string;

  constructor() {
    this.capturesDir = path.join(process.cwd(), 'captures');
    this.recordingsDir = path.join(process.cwd(), 'recordings');
    this.preferencesFile = path.join(process.cwd(), '.camera-preferences.json');
    this.initDirectories();
    this.loadPreferences();
  }

  private async initDirectories() {
    await fs.mkdir(this.capturesDir, { recursive: true });
    await fs.mkdir(this.recordingsDir, { recursive: true });
  }

  private async loadPreferences() {
    try {
      const data = await fs.readFile(this.preferencesFile, 'utf-8');
      const prefs = JSON.parse(data);
      this.selectedCamera = prefs.selectedCamera || null;
    } catch {
      // No preferences file yet
    }
  }

  private async savePreferences() {
    try {
      await fs.writeFile(this.preferencesFile, JSON.stringify({
        selectedCamera: this.selectedCamera
      }, null, 2));
    } catch (error) {
      console.error('Failed to save preferences:', error);
    }
  }

  setSelectedCamera(cameraId: string) {
    this.selectedCamera = cameraId;
    this.savePreferences();
  }

  getSelectedCamera(): string | null {
    return this.selectedCamera;
  }

  async listCameras(): Promise<CameraInfo[]> {
    try {
      // Linux: v4l2-ctl --list-devices
      // Windows: wmic path Win32_PnPEntity where "caption like '%camera%'" get caption,deviceid
      // macOS: system_profiler SPCameraDataType
      
      const platform = process.platform;
      let cameras: CameraInfo[] = [];

      if (platform === 'linux') {
        try {
          const { stdout } = await execAsync('v4l2-ctl --list-devices');
          const devices = stdout.split('\n').filter(line => line.includes('/dev/video'));
          cameras = devices.map((device, index) => ({
            id: device.trim(),
            name: `Camera ${index}`,
            location: device.trim()
          }));
        } catch {
          // Fallback if v4l2-ctl is not available
          cameras = [{
            id: '/dev/video0',
            name: 'Default Camera',
            location: '/dev/video0'
          }];
        }
      } else if (platform === 'win32') {
        cameras = [{
          id: '0',
          name: 'Default Camera',
          location: 'Windows Default Camera'
        }];
      } else if (platform === 'darwin') {
        cameras = [{
          id: '0',
          name: 'Default Camera',
          location: 'macOS Default Camera'
        }];
      }

      return cameras;
    } catch (error) {
      console.error('Error listing cameras:', error);
      return [];
    }
  }

  async capturePhoto(options: WebcamOptions = {}): Promise<CaptureResult> {
    const defaults: WebcamOptions = {
      width: 1280,
      height: 720,
      quality: 85,
      output: 'jpeg',
      callbackReturn: 'buffer',
      verbose: false
    };

    const opts = { ...defaults, ...options };
    
    // Use selected camera if no device specified
    if (!opts.device && this.selectedCamera) {
      opts.device = this.selectedCamera;
    }
    
    const timestamp = Date.now();
    const filename = `capture_${timestamp}.${opts.output}`;
    const filepath = path.join(this.capturesDir, filename);

    try {
      this.webcam = NodeWebcam.create(opts);
      
      return new Promise((resolve) => {
        this.webcam.capture(filepath, async (err: any, data: any) => {
          if (err) {
            resolve({
              success: false,
              error: err.message,
              timestamp
            });
            return;
          }

          // Read the file and optionally convert format
          const buffer = await fs.readFile(filepath);
          
          if (opts.callbackReturn === 'base64') {
            const base64 = buffer.toString('base64');
            resolve({
              success: true,
              data: base64,
              timestamp,
              format: opts.output
            });
          } else if (opts.callbackReturn === 'buffer') {
            resolve({
              success: true,
              data: buffer,
              timestamp,
              format: opts.output
            });
          } else {
            resolve({
              success: true,
              data: filepath,
              timestamp,
              format: opts.output
            });
          }
        });
      });
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        timestamp
      };
    }
  }

  async startRecording(options: RecordingOptions = {}): Promise<{ success: boolean; filename?: string; error?: string }> {
    if (this.isRecording) {
      return { success: false, error: 'Already recording' };
    }

    const defaults: RecordingOptions = {
      duration: 30,
      fps: 30,
      format: 'mp4',
      codec: 'libx264'
    };

    const opts = { ...defaults, ...options };
    const timestamp = Date.now();
    const filename = `recording_${timestamp}.${opts.format}`;
    const filepath = path.join(this.recordingsDir, filename);

    try {
      const platform = process.platform;
      let command: string;

      if (platform === 'linux') {
        // Using ffmpeg with v4l2
        const device = this.selectedCamera || '/dev/video0';
        command = `ffmpeg -f v4l2 -framerate ${opts.fps} -video_size 1280x720 -i ${device} -c:v ${opts.codec} -t ${opts.duration} "${filepath}"`;
      } else if (platform === 'win32') {
        // Windows DirectShow
        command = `ffmpeg -f dshow -i video="Default Camera" -c:v ${opts.codec} -t ${opts.duration} "${filepath}"`;
      } else if (platform === 'darwin') {
        // macOS AVFoundation
        command = `ffmpeg -f avfoundation -framerate ${opts.fps} -i "0" -c:v ${opts.codec} -t ${opts.duration} "${filepath}"`;
      } else {
        return { success: false, error: 'Unsupported platform' };
      }

      this.recordingProcess = exec(command, (error) => {
        this.isRecording = false;
        this.recordingProcess = null;
        if (error) {
          console.error('Recording error:', error);
        }
      });

      this.isRecording = true;
      return { success: true, filename };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async stopRecording(): Promise<{ success: boolean; error?: string }> {
    if (!this.isRecording || !this.recordingProcess) {
      return { success: false, error: 'Not recording' };
    }

    try {
      this.recordingProcess.kill('SIGINT');
      this.isRecording = false;
      this.recordingProcess = null;
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getCameraSettings(device?: string): Promise<CameraSettings | null> {
    try {
      const platform = process.platform;
      
      if (platform === 'linux') {
        const devicePath = device || this.selectedCamera || '/dev/video0';
        const { stdout } = await execAsync(`v4l2-ctl -d ${devicePath} --list-ctrls`);
        
        const settings: CameraSettings = {};
        const lines = stdout.split('\n');
        
        for (const line of lines) {
          if (line.includes('brightness')) {
            const match = line.match(/value=(\d+)/);
            if (match) settings.brightness = parseInt(match[1]);
          }
          if (line.includes('contrast')) {
            const match = line.match(/value=(\d+)/);
            if (match) settings.contrast = parseInt(match[1]);
          }
          if (line.includes('saturation')) {
            const match = line.match(/value=(\d+)/);
            if (match) settings.saturation = parseInt(match[1]);
          }
        }
        
        return settings;
      }
      
      // For other platforms, return default values
      return {
        brightness: 50,
        contrast: 50,
        saturation: 50,
        hue: 0,
        gamma: 100,
        sharpness: 50,
        whiteBalance: 5000,
        exposure: 0,
        gain: 50,
        focus: 50
      };
    } catch (error) {
      console.error('Error getting camera settings:', error);
      return null;
    }
  }

  async setCameraSettings(settings: CameraSettings, device?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const platform = process.platform;
      
      if (platform === 'linux') {
        const devicePath = device || this.selectedCamera || '/dev/video0';
        const commands: string[] = [];
        
        if (settings.brightness !== undefined) {
          commands.push(`v4l2-ctl -d ${devicePath} --set-ctrl=brightness=${settings.brightness}`);
        }
        if (settings.contrast !== undefined) {
          commands.push(`v4l2-ctl -d ${devicePath} --set-ctrl=contrast=${settings.contrast}`);
        }
        if (settings.saturation !== undefined) {
          commands.push(`v4l2-ctl -d ${devicePath} --set-ctrl=saturation=${settings.saturation}`);
        }
        
        for (const cmd of commands) {
          await execAsync(cmd);
        }
        
        return { success: true };
      }
      
      return { success: false, error: 'Platform not fully supported for camera settings' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async processImage(imagePath: string, operations: any): Promise<Buffer> {
    let image = sharp(imagePath);
    
    if (operations.resize) {
      image = image.resize(operations.resize.width, operations.resize.height);
    }
    
    if (operations.rotate) {
      image = image.rotate(operations.rotate);
    }
    
    if (operations.flip) {
      image = image.flip();
    }
    
    if (operations.flop) {
      image = image.flop();
    }
    
    if (operations.grayscale) {
      image = image.grayscale();
    }
    
    if (operations.blur) {
      image = image.blur(operations.blur);
    }
    
    return image.toBuffer();
  }
}