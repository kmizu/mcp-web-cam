import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { CameraWebServer } from '../webcam/web-server.js';
import { WebcamController } from '../webcam/controller.js';

export const selectCameraTool: Tool = {
  name: 'select_camera',
  description: 'Open camera selection UI to choose from available cameras',
  inputSchema: {
    type: 'object',
    properties: {}
  }
};

let webServer: CameraWebServer | null = null;

export async function selectCamera(args: unknown, webcamController: WebcamController) {
  try {
    // Start web server if not already running
    if (!webServer) {
      webServer = new CameraWebServer(webcamController);
      const port = await webServer.start();
      
      // Open browser
      await webServer.openBrowser();
      
      // Keep server running for 60 seconds to allow user to select camera
      setTimeout(() => {
        if (webServer) {
          webServer.stop();
          webServer = null;
        }
      }, 60000);
      
      return {
        content: [
          {
            type: 'text',
            text: `Camera selection UI opened in your browser at http://localhost:${port}`
          },
          {
            type: 'text',
            text: 'The UI will remain open for 60 seconds. Select your preferred camera from the list.'
          }
        ]
      };
    } else {
      // Server already running, just open browser
      await webServer.openBrowser();
      return {
        content: [
          {
            type: 'text',
            text: 'Camera selection UI reopened in your browser'
          }
        ]
      };
    }
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text',
          text: `Failed to open camera selection UI: ${error.message}`
        }
      ]
    };
  }
}

export const getCurrentCameraTool: Tool = {
  name: 'get_current_camera',
  description: 'Get the currently selected camera',
  inputSchema: {
    type: 'object',
    properties: {}
  }
};

export async function getCurrentCamera(args: unknown, webcamController: WebcamController) {
  const currentCamera = webcamController.getSelectedCamera();
  
  if (currentCamera) {
    return {
      content: [
        {
          type: 'text',
          text: `Current camera: ${currentCamera}`
        }
      ]
    };
  } else {
    return {
      content: [
        {
          type: 'text',
          text: 'No camera currently selected. Use the select_camera tool to choose one.'
        }
      ]
    };
  }
}