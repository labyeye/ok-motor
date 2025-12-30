/**
 * Utility to load PDF templates - works in both web and Electron environments
 */

export const loadPDFTemplate = async (templateName) => {
  try {
    // Check if running in Electron
    if (window.electronAPI && window.electronAPI.isElectron) {
      console.log('Loading PDF template via Electron:', templateName);
      const result = await window.electronAPI.getPDFTemplate(templateName);
      
      if (result.success) {
        // Convert array back to Uint8Array
        return new Uint8Array(result.data).buffer;
      } else {
        throw new Error(result.error || 'Failed to load PDF template');
      }
    } else {
      // Web browser - use fetch
      console.log('Loading PDF template via fetch:', templateName);
      const templateUrl = `/software/templates/${templateName}`;
      const response = await fetch(templateUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch template: ${response.statusText}`);
      }
      
      return await response.arrayBuffer();
    }
  } catch (error) {
    console.error('Error loading PDF template:', error);
    throw error;
  }
};
