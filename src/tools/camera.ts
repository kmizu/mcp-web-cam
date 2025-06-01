import { z } from 'zod';
import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { WebcamController } from '../webcam/controller';

export const listCamerasTool: Tool = {
  name: 'list_cameras',
  description: 'List all available camera devices',
  inputSchema: {
    type: 'object',
    properties: {}
  }
};

const GetCameraSettingsArgsSchema = z.object({
  device: z.string().optional()
});

export const getCameraSettingsTool: Tool = {
  name: 'get_camera_settings',
  description: 'Get current camera settings',
  inputSchema: {
    type: 'object',
    properties: {
      device: {
        type: 'string',
        description: 'Camera device ID (optional)',
        optional: true
      }
    }
  }
};

const SetCameraSettingsArgsSchema = z.object({
  device: z.string().optional(),
  brightness: z.number().min(0).max(100).optional(),
  contrast: z.number().min(0).max(100).optional(),
  saturation: z.number().min(0).max(100).optional(),
  hue: z.number().min(-180).max(180).optional(),
  gamma: z.number().min(1).max(500).optional(),
  sharpness: z.number().min(0).max(100).optional(),
  whiteBalance: z.number().min(2000).max(10000).optional(),
  exposure: z.number().min(-10).max(10).optional(),
  gain: z.number().min(0).max(100).optional(),
  focus: z.number().min(0).max(100).optional()
});

export const setCameraSettingsTool: Tool = {
  name: 'set_camera_settings',
  description: 'Adjust camera settings like brightness, contrast, etc.',
  inputSchema: {
    type: 'object',
    properties: {
      device: {
        type: 'string',
        description: 'Camera device ID (optional)',
        optional: true
      },
      brightness: {
        type: 'number',
        description: 'Brightness level (0-100)',
        minimum: 0,
        maximum: 100,
        optional: true
      },
      contrast: {
        type: 'number',
        description: 'Contrast level (0-100)',
        minimum: 0,
        maximum: 100,
        optional: true
      },
      saturation: {
        type: 'number',
        description: 'Saturation level (0-100)',
        minimum: 0,
        maximum: 100,
        optional: true
      },
      hue: {
        type: 'number',
        description: 'Hue adjustment (-180 to 180)',
        minimum: -180,
        maximum: 180,
        optional: true
      },
      gamma: {
        type: 'number',
        description: 'Gamma correction (1-500)',
        minimum: 1,
        maximum: 500,
        optional: true
      },
      sharpness: {
        type: 'number',
        description: 'Sharpness level (0-100)',
        minimum: 0,
        maximum: 100,
        optional: true
      },
      whiteBalance: {
        type: 'number',
        description: 'White balance in Kelvin (2000-10000)',
        minimum: 2000,
        maximum: 10000,
        optional: true
      },
      exposure: {
        type: 'number',
        description: 'Exposure compensation (-10 to 10)',
        minimum: -10,
        maximum: 10,
        optional: true
      },
      gain: {
        type: 'number',
        description: 'Gain level (0-100)',
        minimum: 0,
        maximum: 100,
        optional: true
      },
      focus: {
        type: 'number',
        description: 'Focus level (0-100, 0=auto)',
        minimum: 0,
        maximum: 100,
        optional: true
      }
    }
  }
};

export async function listCameras(args: unknown, webcamController: WebcamController) {
  const cameras = await webcamController.listCameras();

  if (cameras.length === 0) {
    return {
      content: [
        {
          type: 'text',
          text: 'No cameras found. Make sure you have a webcam connected and proper drivers installed.'
        }
      ]
    };
  }

  const cameraList = cameras.map(camera => 
    `• ID: ${camera.id}, Name: ${camera.name}, Location: ${camera.location}`
  ).join('\n');

  return {
    content: [
      {
        type: 'text',
        text: `Found ${cameras.length} camera(s):\n${cameraList}`
      }
    ]
  };
}

export async function getCameraSettings(args: unknown, webcamController: WebcamController) {
  const parsed = GetCameraSettingsArgsSchema.parse(args);
  
  const settings = await webcamController.getCameraSettings(parsed.device);

  if (!settings) {
    return {
      content: [
        {
          type: 'text',
          text: 'Failed to retrieve camera settings. The camera may not support this feature or may not be accessible.'
        }
      ]
    };
  }

  const settingsText = Object.entries(settings)
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n');

  return {
    content: [
      {
        type: 'text',
        text: `Current camera settings:\n${settingsText}`
      }
    ]
  };
}

export async function setCameraSettings(args: unknown, webcamController: WebcamController) {
  const parsed = SetCameraSettingsArgsSchema.parse(args);
  
  const { device, ...settings } = parsed;
  
  if (Object.keys(settings).length === 0) {
    return {
      content: [
        {
          type: 'text',
          text: 'No settings provided to change.'
        }
      ]
    };
  }

  const result = await webcamController.setCameraSettings(settings, device);

  if (!result.success) {
    return {
      content: [
        {
          type: 'text',
          text: `Failed to update camera settings: ${result.error}`
        }
      ]
    };
  }

  const changedSettings = Object.entries(settings)
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n');

  return {
    content: [
      {
        type: 'text',
        text: `Camera settings updated successfully:\n${changedSettings}`
      }
    ]
  };
}