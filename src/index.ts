#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { WebcamController } from './webcam/controller.js';
import { 
  capturePhotoTool, 
  capturePhoto 
} from './tools/capture.js';
import { 
  startRecordingTool, 
  stopRecordingTool,
  startRecording,
  stopRecording 
} from './tools/recording.js';
import {
  listCamerasTool,
  getCameraSettingsTool,
  setCameraSettingsTool,
  listCameras,
  getCameraSettings,
  setCameraSettings
} from './tools/camera.js';
import {
  selectCameraTool,
  getCurrentCameraTool,
  selectCamera,
  getCurrentCamera
} from './tools/camera-ui.js';

class WebcamMCPServer {
  private server: Server;
  private webcamController: WebcamController;

  constructor() {
    this.server = new Server(
      {
        name: 'mcp-web-cam',
        version: '0.1.0',
      },
      {
        capabilities: {
          resources: {},
          tools: {},
        },
      }
    );

    this.webcamController = new WebcamController();
    this.setupHandlers();
  }

  private setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          capturePhotoTool,
          startRecordingTool,
          stopRecordingTool,
          listCamerasTool,
          getCameraSettingsTool,
          setCameraSettingsTool,
          selectCameraTool,
          getCurrentCameraTool
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'capture_photo':
            return await capturePhoto(args, this.webcamController);
          
          case 'start_recording':
            return await startRecording(args, this.webcamController);
          
          case 'stop_recording':
            return await stopRecording(args, this.webcamController);
          
          case 'list_cameras':
            return await listCameras(args, this.webcamController);
          
          case 'get_camera_settings':
            return await getCameraSettings(args, this.webcamController);
          
          case 'set_camera_settings':
            return await setCameraSettings(args, this.webcamController);
          
          case 'select_camera':
            return await selectCamera(args, this.webcamController);
          
          case 'get_current_camera':
            return await getCurrentCamera(args, this.webcamController);
          
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: 'text',
              text: `Error executing tool ${name}: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    });

    // List available resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return {
        resources: [
          {
            uri: 'webcam://cameras',
            mimeType: 'application/json',
            name: 'Available Cameras',
            description: 'List of all available camera devices',
          },
          {
            uri: 'webcam://captures',
            mimeType: 'application/json', 
            name: 'Captured Photos',
            description: 'List of captured photos',
          },
          {
            uri: 'webcam://recordings',
            mimeType: 'application/json',
            name: 'Video Recordings',
            description: 'List of video recordings',
          },
        ],
      };
    });

    // Handle resource reads
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;

      try {
        switch (uri) {
          case 'webcam://cameras': {
            const cameras = await this.webcamController.listCameras();
            return {
              contents: [
                {
                  uri,
                  mimeType: 'application/json',
                  text: JSON.stringify(cameras, null, 2),
                },
              ],
            };
          }

          case 'webcam://captures': {
            const fs = await import('fs/promises');
            const path = await import('path');
            const capturesDir = path.join(process.cwd(), 'captures');
            
            try {
              const files = await fs.readdir(capturesDir);
              const captures = files.filter(file => 
                file.endsWith('.jpg') || file.endsWith('.jpeg') || file.endsWith('.png') || file.endsWith('.bmp')
              );
              
              return {
                contents: [
                  {
                    uri,
                    mimeType: 'application/json',
                    text: JSON.stringify(captures, null, 2),
                  },
                ],
              };
            } catch {
              return {
                contents: [
                  {
                    uri,
                    mimeType: 'application/json',
                    text: JSON.stringify([], null, 2),
                  },
                ],
              };
            }
          }

          case 'webcam://recordings': {
            const fs = await import('fs/promises');
            const path = await import('path');
            const recordingsDir = path.join(process.cwd(), 'recordings');
            
            try {
              const files = await fs.readdir(recordingsDir);
              const recordings = files.filter(file => 
                file.endsWith('.mp4') || file.endsWith('.avi') || file.endsWith('.mkv')
              );
              
              return {
                contents: [
                  {
                    uri,
                    mimeType: 'application/json',
                    text: JSON.stringify(recordings, null, 2),
                  },
                ],
              };
            } catch {
              return {
                contents: [
                  {
                    uri,
                    mimeType: 'application/json',
                    text: JSON.stringify([], null, 2),
                  },
                ],
              };
            }
          }

          default:
            throw new Error(`Unknown resource: ${uri}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Error reading resource ${uri}: ${errorMessage}`);
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('MCP Webcam Server running on stdio');
  }
}

const server = new WebcamMCPServer();
server.run().catch(console.error);