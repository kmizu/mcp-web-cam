export interface WebcamOptions {
  width?: number;
  height?: number;
  quality?: number;
  delay?: number;
  device?: string;
  output?: 'jpeg' | 'png' | 'bmp';
  callbackReturn?: 'location' | 'buffer' | 'base64';
  verbose?: boolean;
}

export interface CameraInfo {
  id: string;
  name: string;
  location?: string;
}

export interface CameraSettings {
  brightness?: number;
  contrast?: number;
  saturation?: number;
  hue?: number;
  gamma?: number;
  sharpness?: number;
  whiteBalance?: number;
  exposure?: number;
  gain?: number;
  focus?: number;
}

export interface CaptureResult {
  success: boolean;
  data?: string | Buffer;
  error?: string;
  timestamp: number;
  format?: string;
}

export interface RecordingOptions {
  duration?: number;
  fps?: number;
  format?: 'mp4' | 'avi' | 'mkv';
  codec?: string;
}