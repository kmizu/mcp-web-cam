# MCP Web Cam Server

A Model Context Protocol (MCP) server for controlling webcams. This server enables LLMs to capture photos, record videos, and manage camera settings through the MCP protocol.

## Installation as MCP Server

### For Claude Desktop App

#### Option 1: Using npx (Recommended)

Add to your Claude Desktop configuration:

**On macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**On Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "webcam": {
      "command": "npx",
      "args": [
        "-y",
        "@kmizu/mcp-web-cam"
      ]
    }
  }
}
```

Then restart Claude Desktop.

#### Option 2: Manual Installation

1. Install the dependencies and build:
```bash
git clone https://github.com/mizushima/mcp-web-cam.git
cd mcp-web-cam
npm install
npm run build
```

2. Add to your Claude Desktop configuration:

**On macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**On Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "webcam": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-web-cam/dist/index.js"]
    }
  }
}
```

3. Restart Claude Desktop

### For Other MCP Clients

The server communicates via stdio, so you can run:

```bash
node /path/to/mcp-web-cam/dist/index.js
```

## Features

- **Photo Capture**: Take high-quality photos with customizable settings
- **Video Recording**: Record videos with various formats and codecs
- **Camera Management**: List available cameras and adjust settings
- **Image Processing**: Basic image manipulation capabilities
- **Cross-platform**: Supports Linux, Windows, and macOS

## Installation

### Global Installation (for use outside MCP)

```bash
npm install -g @kmizu/mcp-web-cam
```

### Local Development

```bash
npm install
npm run build
```

## Usage

### As an MCP Server

The server can be used with any MCP-compatible client:

```bash
npm start
```

### Development

```bash
npm run dev    # Watch mode for development
npm run build  # Build TypeScript
npm run typecheck  # Type checking only
```

## Available Tools

### `select_camera`
Open a modern web UI to select from available cameras with live preview.

**Features:**
- Live preview of all connected cameras
- WebRTC-based preview when available
- Fallback to snapshot mode for compatibility
- Persistent camera selection

### `get_current_camera`
Get the currently selected camera device.

### `capture_photo`
Take a photo using the webcam.

**Parameters:**
- `width` (optional): Image width in pixels (320-3840)
- `height` (optional): Image height in pixels (240-2160)
- `quality` (optional): Image quality (1-100)
- `format` (optional): Image format ('jpeg', 'png', 'bmp')
- `return_type` (optional): How to return data ('location', 'buffer', 'base64')
- `device` (optional): Camera device ID

### `start_recording`
Start recording video from the webcam.

**Parameters:**
- `duration` (optional): Recording duration in seconds (1-3600)
- `fps` (optional): Frames per second (1-60)
- `format` (optional): Video format ('mp4', 'avi', 'mkv')
- `codec` (optional): Video codec (e.g., 'libx264', 'libx265')

### `stop_recording`
Stop the current video recording.

### `list_cameras`
List all available camera devices.

### `get_camera_settings`
Get current camera settings.

**Parameters:**
- `device` (optional): Camera device ID

### `set_camera_settings`
Adjust camera settings like brightness, contrast, etc.

**Parameters:**
- `device` (optional): Camera device ID
- `brightness` (optional): Brightness level (0-100)
- `contrast` (optional): Contrast level (0-100)
- `saturation` (optional): Saturation level (0-100)
- `hue` (optional): Hue adjustment (-180 to 180)
- `gamma` (optional): Gamma correction (1-500)
- `sharpness` (optional): Sharpness level (0-100)
- `whiteBalance` (optional): White balance in Kelvin (2000-10000)
- `exposure` (optional): Exposure compensation (-10 to 10)
- `gain` (optional): Gain level (0-100)
- `focus` (optional): Focus level (0-100, 0=auto)

## Resources

The server provides the following resources:

- `webcam://cameras`: List of available camera devices
- `webcam://captures`: List of captured photos
- `webcam://recordings`: List of video recordings

## Dependencies

### Required System Dependencies

#### Linux
```bash
# Ubuntu/Debian
sudo apt-get install v4l-utils ffmpeg

# CentOS/RHEL
sudo yum install v4l-utils ffmpeg
```

#### Windows
- FFmpeg (download from https://ffmpeg.org/)
- Windows Media Foundation

#### macOS
```bash
brew install ffmpeg
```

## File Structure

```
mcp-web-cam/
├── src/
│   ├── index.ts              # Main MCP server
│   ├── webcam/
│   │   ├── controller.ts     # Camera control logic
│   │   └── types.ts          # TypeScript type definitions
│   ├── tools/                # MCP tool implementations
│   │   ├── capture.ts        # Photo capture tool
│   │   ├── recording.ts      # Video recording tools
│   │   └── camera.ts         # Camera management tools
│   └── types/
│       └── node-webcam.d.ts  # Type declarations
├── captures/                 # Captured photos (auto-created)
├── recordings/               # Video recordings (auto-created)
└── dist/                     # Compiled JavaScript
```

## License

MIT