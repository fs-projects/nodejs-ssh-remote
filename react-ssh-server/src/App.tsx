/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import "./App.css";
import { useEffect, useState } from "react";
import DropzoneArea from "./Dropzone";
import axios from 'axios';

function App() {
  const [selectedFile, setSelectedFile] = useState<string>("");

  useEffect(() => {
    if(!selectedFile) {
      return;
    }
    // Define the API endpoint
    const apiUrl = '/ssh-servers';

    // Make the API call using Axios
    axios.post(apiUrl, {serverData: selectedFile})
      .then(response => {
        // Handle the successful response
        console.log('API Response:', response.data);

        // Assuming the backend sends an array of file paths in the response
        console.log("RESPONSE", response.data);

      })
      .catch(error => {
        // Handle errors
        console.error('API Error:', error);
      });
  }, [selectedFile]);


  const handleFileChange = (acceptedFiles: any) => {
    setSelectedFile(acceptedFiles);
  };

  return <DropzoneArea handleFileChange={handleFileChange} />;
}

export default App;
