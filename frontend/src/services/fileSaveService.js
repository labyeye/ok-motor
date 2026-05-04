const isElectron =
  typeof window !== "undefined" &&
  !!window.electronAPI &&
  window.electronAPI.isElectron;

const savePdfToDefaultDir = async (filename, buffer, docType) => {
  try {
    if (isElectron && window.electronAPI && window.electronAPI.savePDFToDir) {
      const arr = Array.from(new Uint8Array(buffer));
      const res = await window.electronAPI.savePDFToDir({
        filename,
        buffer: arr,
        docType,
      });
      return res;
    }

    const blob = new Blob([buffer], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return { success: true };
  } catch (error) {
    console.error("Error saving PDF:", error);
    return { success: false, error: error.message };
  }
};

const fileSaveService = {
  savePdfToDefaultDir,
};

export default fileSaveService;
