import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn } from 'child_process';

async function testMCPServer() {
  console.log('Starting MCP Webcam Server test...\n');

  const serverProcess = spawn('node', ['dist/index.js'], {
    stdio: ['pipe', 'pipe', 'inherit']
  });

  const transport = new StdioClientTransport({
    stdin: serverProcess.stdout,
    stdout: serverProcess.stdin
  });

  const client = new Client({
    name: 'test-client',
    version: '1.0.0'
  }, {
    capabilities: {}
  });

  try {
    await client.connect(transport);
    console.log('✓ Connected to MCP server\n');

    // Test 1: List available tools
    console.log('Test 1: Listing available tools...');
    const toolsResponse = await client.listTools();
    console.log(`✓ Found ${toolsResponse.tools.length} tools:`);
    toolsResponse.tools.forEach(tool => {
      console.log(`  - ${tool.name}: ${tool.description}`);
    });
    console.log();

    // Test 2: List resources
    console.log('Test 2: Listing available resources...');
    const resourcesResponse = await client.listResources();
    console.log(`✓ Found ${resourcesResponse.resources.length} resources:`);
    resourcesResponse.resources.forEach(resource => {
      console.log(`  - ${resource.name}: ${resource.uri}`);
    });
    console.log();

    // Test 3: List cameras
    console.log('Test 3: Listing cameras...');
    try {
      const camerasResult = await client.callTool('list_cameras', {});
      console.log('✓ Camera list response:');
      camerasResult.content.forEach(content => {
        if (content.type === 'text') {
          console.log(`  ${content.text}`);
        }
      });
    } catch (error) {
      console.log('✗ Error listing cameras:', error.message);
    }
    console.log();

    // Test 4: Get camera settings (test with default camera)
    console.log('Test 4: Getting camera settings...');
    try {
      const settingsResult = await client.callTool('get_camera_settings', {});
      console.log('✓ Camera settings response:');
      settingsResult.content.forEach(content => {
        if (content.type === 'text') {
          console.log(`  ${content.text}`);
        }
      });
    } catch (error) {
      console.log('✗ Error getting camera settings:', error.message);
    }
    console.log();

    // Test 5: Test photo capture (dry run)
    console.log('Test 5: Testing photo capture...');
    try {
      const captureResult = await client.callTool('capture_photo', {
        width: 640,
        height: 480,
        quality: 80,
        format: 'jpeg',
        return_type: 'location'
      });
      console.log('✓ Photo capture response:');
      captureResult.content.forEach(content => {
        if (content.type === 'text') {
          console.log(`  ${content.text}`);
        }
      });
    } catch (error) {
      console.log('✗ Error capturing photo:', error.message);
    }

    console.log('\n✓ All tests completed!');

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await client.close();
    serverProcess.kill();
    process.exit(0);
  }
}

testMCPServer().catch(console.error);