let sharp = null;
try {
  sharp = require("sharp");
} catch (err) {
  console.warn(
    "[imageHelper] sharp not available — image compression disabled:",
    err.message,
  );
}

const ImageKit = require("imagekit");

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

const compressBuffer = async (buffer, targetKb = 100) => {
  if (!sharp) return buffer;

  let quality = 80;
  let output = await sharp(buffer).jpeg({ quality }).toBuffer();
  const targetBytes = targetKb * 1024;

  while (output.length > targetBytes && quality > 30) {
    quality -= 10;
    output = await sharp(buffer).jpeg({ quality }).toBuffer();
  }

  let metadata = await sharp(output).metadata();
  let width = metadata.width || 800;
  while (output.length > targetBytes && width > 400) {
    width = Math.round(width * 0.9);
    output = await sharp(buffer).resize({ width }).jpeg({ quality }).toBuffer();
    metadata = await sharp(output).metadata();
  }

  return output;
};

const uploadBufferToImageKit = async (
  buffer,
  filename,
  mimeType = "image/jpeg",
) => {
  const base64 = buffer.toString("base64");
  const dataUri = `data:${mimeType};base64,${base64}`;
  const result = await imagekit.upload({
    file: dataUri,
    fileName: filename,
    useUniqueFileName: true,
  });
  return {
    url: result.url,
    fileId: result.fileId,
    name: result.name,
  };
};

module.exports = {
  compressBuffer,
  uploadBufferToImageKit,
};
