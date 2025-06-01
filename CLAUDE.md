# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an MCP (Model Context Protocol) server for controlling webcams, written in TypeScript. The server provides tools for photo capture, video recording, and camera settings management across Linux, Windows, and macOS platforms.

## Development Commands

- `npm run build`: Compile TypeScript to JavaScript
- `npm run dev`: Start development server with watch mode
- `npm start`: Run the compiled MCP server
- `npm run typecheck`: Run TypeScript type checking without compilation
- `npm run lint`: Run ESLint on source files

## Architecture

### Core Components

- **WebcamController** (`src/webcam/controller.ts`): Main camera control logic using node-webcam and ffmpeg
- **MCP Tools** (`src/tools/`): Individual tool implementations for the MCP protocol
- **Type Definitions** (`src/webcam/types.ts`, `src/types/node-webcam.d.ts`): TypeScript interfaces and type declarations

### Platform Support

The controller uses platform-specific commands:
- **Linux**: v4l2-ctl for camera controls, ffmpeg with v4l2 for recording
- **Windows**: DirectShow with ffmpeg
- **macOS**: AVFoundation with ffmpeg

### File Organization

- Photos are saved to `captures/` directory
- Videos are saved to `recordings/` directory  
- Both directories are auto-created on startup

## MCP Protocol Implementation

The server implements standard MCP interfaces:
- **Tools**: Interactive camera operations (capture, record, settings)
- **Resources**: Static data access (camera list, file listings)

## Key Dependencies

- `@modelcontextprotocol/sdk`: MCP protocol implementation
- `node-webcam`: Camera capture library
- `sharp`: Image processing
- `zod`: Schema validation for tool parameters

## Development Notes

- The server runs on stdio transport for MCP communication
- Camera settings modification requires appropriate system permissions
- FFmpeg must be installed and accessible in PATH for video recording
- Type declarations for node-webcam are included due to lack of official @types package