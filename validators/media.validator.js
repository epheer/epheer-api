const fs = require("fs");
const wav = require("node-wav");
const probe = require("probe-image-size");
const sharp = require("sharp");
const musicMetadata = require("music-metadata");

const validateWavFile = async (fileBuffer) => {
  try {
    const buffer = fs.readFileSync(fileBuffer);
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

const validateFlacFile = async (fileBuffer) => {
  try {
    const { FLACDecoder } = await import("@wasm-audio-decoders/flac");
    const buffer = fs.readFileSync(fileBuffer);
    const decoder = new
    FLACDecoder();
    await decoder.decode(buffer);

    const { sampleRate, bitsPerSample } = decoder.getInfo();
    return sampleRate >= 44100 && sampleRate <= 48000 && bitsPerSample === 16;
  } catch (error) {
    return false;
  }
};

const validateAudioFile = async (fileBuffer) => {
  const metadata = await musicMetadata.parseFile(fileBuffer);

  if (metadata.format.container === "wav") {
    return await validateWavFile(fileBuffer);
  } else if (metadata.format.container === "flac") {
    return await validateFlacFile(fileBuffer);
  }

  return false;
};

const validateJpgFile = async (fileBuffer) => {
  try {
    const buffer = fs.readFileSync(fileBuffer);
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

const validateImageFile = async (fileBuffer) => {
  const metadata = await sharp(fileBuffer).metadata();

  if (['jpeg', 'jpg'].includes(metadata.format)) {
    return await validateJpgFile(fileBuffer);
  }

  return false;
};

module.exports = {
  validateAudioFile,
  validateImageFile,
};
