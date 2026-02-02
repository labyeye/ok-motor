// Utility for handling PDF documents - extracting images and text

export const extractImagesFromPdf = async (pdfFile) => {
  // This uses pdfjs-dist to extract images from PDF
  // For now, we'll store the PDF as-is and display it
  // The actual image extraction would happen during printing
  try {
    const url = URL.createObjectURL(pdfFile);
    return {
      type: "pdf",
      file: pdfFile,
      url: url,
      name: pdfFile.name,
    };
  } catch (error) {
    console.error("Error processing PDF:", error);
    throw error;
  }
};

export const convertPdfToImages = async (pdfFile) => {
  try {
    const pdfjsLib = await import("pdfjs-dist");

    // Prefer a locally served worker placed in `frontend/public` (served at root).
    // This avoids bundler path/fingerprint issues in production. If that file
    // is not present or not reachable, fall back to a CDN-hosted worker.
    const publicWorker = (process.env.PUBLIC_URL || "") + "/pdf.worker.min.mjs";
    try {
      // Probe the public path to see if worker is available (HEAD request).
      const resp = await fetch(publicWorker, { method: "HEAD" });
      if (resp.ok) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = publicWorker;
      } else {
        // fallback to a stable CDN copy
        pdfjsLib.GlobalWorkerOptions.workerSrc =
          "https://unpkg.com/pdfjs-dist@3.8.162/build/pdf.worker.min.js";
      }
    } catch (err) {
      // network/probe failed — use CDN fallback
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://unpkg.com/pdfjs-dist@3.8.162/build/pdf.worker.min.js";
    }

    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
    const images = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2 });
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({
        canvasContext: context,
        viewport: viewport,
      }).promise;

      const imageData = canvas.toDataURL("image/jpeg");
      images.push({
        pageNumber: i,
        data: imageData,
        width: viewport.width,
        height: viewport.height,
      });
    }

    return images;
  } catch (error) {
    console.error("Error converting PDF to images:", error);
    // If pdfjs-dist is not available, return the PDF as-is
    return {
      type: "pdf",
      file: pdfFile,
      url: URL.createObjectURL(pdfFile),
    };
  }
};

export const isPdfFile = (file) => {
  return file?.type === "application/pdf" || file?.name?.endsWith(".pdf");
};

export const isImageFile = (file) => {
  return file?.type?.startsWith("image/");
};
