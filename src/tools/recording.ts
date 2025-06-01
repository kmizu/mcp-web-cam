import { z } from 'zod';
import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { WebcamController } from '../webcam/controller.js';

const StartRecordingArgsSchema = z.object({
  duration: z.number().min(1).max(3600).optional(),
  fps: z.number().min(1).max(60).optional(),
  format: z.enum(['mp4', 'avi', 'mkv']).optional(),
  codec: z.string().optional()
});

export const startRecordingTool: Tool = {
  name: 'start_recording',
  description: 'Start recording video from the webcam',
  inputSchema: {
    type: 'object',
    properties: {
      duration: {
        type: 'number',
        description: 'Recording duration in seconds',
        minimum: 1,
        maximum: 3600,
        default: 30
      },
      fps: {
        type: 'number',
        description: 'Frames per second',
        minimum: 1,
        maximum: 60,
        default: 30
      },
      format: {
        type: 'string',
        enum: ['mp4', 'avi', 'mkv'],
        description: 'Video format',
        default: 'mp4'
      },
      codec: {
        type: 'string',
        description: 'Video codec (e.g., libx264, libx265)',
        default: 'libx264'
      }
    }
  }
};

export const stopRecordingTool: Tool = {
  name: 'stop_recording',
  description: 'Stop the current video recording',
  inputSchema: {
    type: 'object',
    properties: {}
  }
};

export async function startRecording(args: unknown, webcamController: WebcamController) {
  const parsed = StartRecordingArgsSchema.parse(args);
  
  const options = {
    duration: parsed.duration || 30,
    fps: parsed.fps || 30,
    format: parsed.format || 'mp4',
    codec: parsed.codec || 'libx264'
  } as const;

  const result = await webcamController.startRecording(options);

  if (!result.success) {
    return {
      content: [
        {
          type: 'text',
          text: `Failed to start recording: ${result.error}`
        }
      ]
    };
  }

  return {
    content: [
      {
        type: 'text',
        text: `Recording started successfully`
      },
      {
        type: 'text',
        text: `Filename: ${result.filename}`
      },
      {
        type: 'text',
        text: `Duration: ${options.duration} seconds`
      },
      {
        type: 'text',
        text: `FPS: ${options.fps}`
      },
      {
        type: 'text',
        text: `Format: ${options.format}`
      }
    ]
  };
}

export async function stopRecording(args: unknown, webcamController: WebcamController) {
  const result = await webcamController.stopRecording();

  if (!result.success) {
    return {
      content: [
        {
          type: 'text',
          text: `Failed to stop recording: ${result.error}`
        }
      ]
    };
  }

  return {
    content: [
      {
        type: 'text',
        text: 'Recording stopped successfully'
      }
    ]
  };
}