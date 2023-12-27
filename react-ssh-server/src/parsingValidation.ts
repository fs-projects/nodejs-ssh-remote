import Papa from "papaparse";

export const handleFileUpload = async (selectedFile) => {
  if (selectedFile) {
    try {
      const parsedData = await Papa.parse(selectedFile, {
        header: true, // Assuming CSV has a header row
        complete: (results) => {
          // Validate parsed data here
          // Check for required fields, data types, etc.
        },
      });
      return parsedData;
      // If validation passes, proceed to SSH operations
    } catch (error) {
      // Handle CSV parsing errors
    }
  }
};
