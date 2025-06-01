import { spawn } from 'child_process';

console.log('Testing MCP Server via stdio...\n');

const serverProcess = spawn('node', ['dist/index.js'], {
  stdio: ['pipe', 'pipe', 'pipe']
});

// Listen for server errors
serverProcess.stderr.on('data', (data) => {
  console.log('Server log:', data.toString());
});

// Send initialize request
const initRequest = {
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: {
      name: 'test-client',
      version: '1.0.0'
    }
  }
};

console.log('Sending initialize request...');
serverProcess.stdin.write(JSON.stringify(initRequest) + '\n');

// Listen for responses
serverProcess.stdout.on('data', (data) => {
  try {
    const lines = data.toString().split('\n').filter(line => line.trim());
    lines.forEach(line => {
      const response = JSON.parse(line);
      console.log('Response:', JSON.stringify(response, null, 2));
      
      // If initialization successful, send list tools request
      if (response.id === 1 && response.result) {
        console.log('\n✓ Server initialized successfully!\n');
        
        const listToolsRequest = {
          jsonrpc: '2.0',
          id: 2,
          method: 'tools/list',
          params: {}
        };
        
        console.log('Sending tools/list request...');
        serverProcess.stdin.write(JSON.stringify(listToolsRequest) + '\n');
      }
      
      // If tools list received, show them and exit
      if (response.id === 2 && response.result) {
        console.log('\n✓ Available tools:');
        response.result.tools.forEach(tool => {
          console.log(`  - ${tool.name}: ${tool.description}`);
        });
        
        console.log('\n✓ MCP server is working correctly!');
        serverProcess.kill();
        process.exit(0);
      }
    });
  } catch (error) {
    // Ignore parse errors for incomplete data
  }
});

// Timeout after 5 seconds
setTimeout(() => {
  console.log('\n✗ Test timed out');
  serverProcess.kill();
  process.exit(1);
}, 5000);