export const loadPDFTemplate = async (templateName) => {
  try {
    if (window.electronAPI && window.electronAPI.isElectron) {
      console.log("Loading PDF template via Electron:", templateName);
      const result = await window.electronAPI.getPDFTemplate(templateName);

      if (result.success) {
        return new Uint8Array(result.data).buffer;
      } else {
        throw new Error(result.error || "Failed to load PDF template");
      }
    } else {
      console.log("Loading PDF template via fetch:", templateName);
      const baseUrl = process.env.PUBLIC_URL || "";
      const templateUrl = `${baseUrl}/templates/${templateName}`;
      const response = await fetch(templateUrl);

      if (!response.ok) {
        throw new Error(`Failed to fetch template: ${response.statusText}`);
      }

      return await response.arrayBuffer();
    }
  } catch (error) {
    console.error("Error loading PDF template:", error);
    throw error;
  }
};
