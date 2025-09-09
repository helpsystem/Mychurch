// Generate a simple audio file programmatically for testing
const fs = require('fs');

// Create a minimal WAV file header and silent audio data
function createSampleAudio(filename, durationSeconds = 5) {
  const sampleRate = 44100;
  const numChannels = 1;
  const bitsPerSample = 16;
  const blockAlign = numChannels * bitsPerSample / 8;
  const byteRate = sampleRate * blockAlign;
  const dataSize = sampleRate * durationSeconds * blockAlign;
  const fileSize = 36 + dataSize;

  const buffer = Buffer.alloc(44 + dataSize);
  
  // WAV header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(fileSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  // Generate simple sine wave for testing
  for (let i = 0; i < dataSize / 2; i++) {
    const sample = Math.sin(2 * Math.PI * 440 * i / sampleRate) * 0.3 * 32767;
    buffer.writeInt16LE(sample, 44 + i * 2);
  }

  fs.writeFileSync(filename, buffer);
}

// Create sample files
createSampleAudio('public/assets/audio/sample-worship.wav', 3);
createSampleAudio('public/assets/audio/bible/genesis.wav', 5);

console.log('Sample audio files created successfully!');