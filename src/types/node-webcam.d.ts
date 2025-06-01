declare module 'node-webcam' {
  interface WebcamOptions {
    width?: number;
    height?: number;
    quality?: number;
    delay?: number;
    saveShots?: boolean;
    output?: 'jpeg' | 'png' | 'bmp';
    device?: string | boolean;
    callbackReturn?: 'location' | 'buffer' | 'base64';
    verbose?: boolean;
  }

  interface Webcam {
    capture(filename: string, callback: (err: any, data: any) => void): void;
  }

  interface NodeWebcam {
    create(options?: WebcamOptions): Webcam;
  }

  const NodeWebcam: NodeWebcam;
  export = NodeWebcam;
}