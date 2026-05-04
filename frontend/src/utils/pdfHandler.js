export const extractImagesFromPdf = async (pdfFile) => {
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

    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@5.4.530/build/pdf.worker.min.mjs`;

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
