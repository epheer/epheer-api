const fs = require("fs");
const wav = require("node-wav");
const probe = require("probe-image-size");

const validateWavFile = async (filePath) => {
  try {
    const buffer = fs.readFileSync(filePath);
    const result = wav.decode(buffer);
    return (
      result.sampleRate >= 44100 &&
      result.sampleRate <= 48000 &&
      result.bitDepth === 16
    );
  } catch (error) {
    return false;
  }
};

const validateFlacFile = async (filePath) => {
  try {
    const { FLACDecoder } = await import("@wasm-audio-decoders/flac");
    const buffer = fs.readFileSync(filePath);
    const decoder = new FLACDecoder();
    await decoder.decode(buffer);

    const { sampleRate, bitsPerSample } = decoder.getInfo();
    return sampleRate >= 44100 && sampleRate <= 48000 && bitsPerSample === 16;
  } catch (error) {
    return false;
  }
};

const validateAudioFile = async (filePath) => {
  const ext = filePath.split(".").pop().toLowerCase();

  if (ext === "wav") {
    return await validateWavFile(filePath);
  } else if (ext === "flac") {
    return await validateFlacFile(filePath);
  }

  return false;
};

const validateJpgFile = async (filePath) => {
  try {
    const buffer = fs.readFileSync(filePath);
    const result = await probe(buffer);
    return (
      result &&
      result.width === 3000 &&
      result.height === 3000 &&
      result.type === "jpg"
    );
  } catch (error) {
    return false;
  }
};

const validateImageFile = async (filePath) => {
  const ext = filePath.split(".").pop().toLowerCase();

  if (ext === "jpg") {
    return await validateJpgFile(filePath);
  }

  return false;
};

module.exports = {
  validateAudioFile,
  validateImageFile,
};
