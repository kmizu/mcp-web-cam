import { z } from 'zod';
import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { WebcamController } from '../webcam/controller.js';

const CapturePhotoArgsSchema = z.object({
  width: z.number().min(320).max(3840).optional(),
  height: z.number().min(240).max(2160).optional(),
  quality: z.number().min(1).max(100).optional(),
  format: z.enum(['jpeg', 'png', 'bmp']).optional(),
  return_type: z.enum(['location', 'buffer', 'base64']).optional(),
  device: z.string().optional()
});

export const capturePhotoTool: Tool = {
  name: 'capture_photo',
  description: 'Take a photo using the webcam',
  inputSchema: {
    type: 'object',
    properties: {
      width: {
        type: 'number',
        description: 'Image width in pixels',
        minimum: 320,
        maximum: 3840,
        default: 1280
      },
      height: {
        type: 'number',
        description: 'Image height in pixels',
        minimum: 240,
        maximum: 2160,
        default: 720
      },
      quality: {
        type: 'number',
        description: 'Image quality (1-100)',
        minimum: 1,
        maximum: 100,
        default: 85
      },
      format: {
        type: 'string',
        enum: ['jpeg', 'png', 'bmp'],
        description: 'Image format',
        default: 'jpeg'
      },
      return_type: {
        type: 'string',
        enum: ['location', 'buffer', 'base64'],
        description: 'How to return the image data',
        default: 'location'
      },
      device: {
        type: 'string',
        description: 'Camera device ID (optional)',
        optional: true
      }
    }
  }
};

export async function capturePhoto(args: unknown, webcamController: WebcamController) {
  const parsed = CapturePhotoArgsSchema.parse(args);
  
  const options = {
    width: parsed.width || 1280,
    height: parsed.height || 720,
    quality: parsed.quality || 85,
    output: parsed.format || 'jpeg',
    callbackReturn: parsed.return_type || 'location',
    device: parsed.device
  } as const;

  const result = await webcamController.capturePhoto(options);

  if (!result.success) {
    return {
      content: [
        {
          type: 'text',
          text: `Failed to capture photo: ${result.error}`
        }
      ]
    };
  }

  if (options.callbackReturn === 'base64') {
    return {
      content: [
        {
          type: 'text',
          text: `Photo captured successfully at ${new Date(result.timestamp).toISOString()}`
        },
        {
          type: 'text',
          text: `Base64 data: ${result.data}`
        }
      ]
    };
  } else if (options.callbackReturn === 'location') {
    return {
      content: [
        {
          type: 'text',
          text: `Photo captured successfully and saved to: ${result.data}`
        },
        {
          type: 'text',
          text: `Timestamp: ${new Date(result.timestamp).toISOString()}`
        },
        {
          type: 'text',
          text: `Format: ${result.format}`
        }
      ]
    };
  } else {
    return {
      content: [
        {
          type: 'text',
          text: `Photo captured successfully (${(result.data as Buffer).length} bytes)`
        },
        {
          type: 'text',
          text: `Timestamp: ${new Date(result.timestamp).toISOString()}`
        }
      ]
    };
  }
}