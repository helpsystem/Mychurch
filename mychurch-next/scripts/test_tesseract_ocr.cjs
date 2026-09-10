const Tesseract = require('tesseract.js');

async function testOCR() {
  console.log('Testing Tesseract initialization...');
  try {
    const worker = await Tesseract.createWorker('eng+fas');
    console.log('Worker initialized for eng+fas successfully!');
    await worker.terminate();
  } catch (err) {
    console.error('Tesseract error:', err.message);
  }
}

testOCR();
