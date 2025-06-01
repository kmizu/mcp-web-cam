import { WebcamController } from './dist/webcam/controller.js';

async function testWebcamController() {
  console.log('Testing Webcam Controller directly...\n');
  
  const controller = new WebcamController();
  
  try {
    // Test 1: List cameras
    console.log('Test 1: Listing cameras...');
    const cameras = await controller.listCameras();
    console.log(`Found ${cameras.length} camera(s):`);
    cameras.forEach(camera => {
      console.log(`  - ${camera.name} (${camera.id})`);
    });
    console.log();
    
    // Test 2: Get camera settings
    console.log('Test 2: Getting camera settings...');
    const settings = await controller.getCameraSettings();
    if (settings) {
      console.log('Camera settings:');
      Object.entries(settings).forEach(([key, value]) => {
        console.log(`  ${key}: ${value}`);
      });
    } else {
      console.log('  Unable to retrieve camera settings');
    }
    console.log();
    
    // Test 3: Capture photo (simulation)
    console.log('Test 3: Testing photo capture...');
    try {
      const result = await controller.capturePhoto({
        width: 640,
        height: 480,
        quality: 80,
        output: 'jpeg',
        callbackReturn: 'location'
      });
      
      if (result.success) {
        console.log('✓ Photo captured successfully!');
        console.log(`  Location: ${result.data}`);
        console.log(`  Timestamp: ${new Date(result.timestamp).toISOString()}`);
      } else {
        console.log(`✗ Photo capture failed: ${result.error}`);
      }
    } catch (error) {
      console.log(`✗ Photo capture error: ${error.message}`);
    }
    
    console.log('\n✓ Controller tests completed!');
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testWebcamController().catch(console.error);