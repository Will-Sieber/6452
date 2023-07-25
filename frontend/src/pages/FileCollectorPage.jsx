import React, { useState } from 'react';
import { BACKEND_URL } from '../config';

const FileCollectorPage = () => {
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleFileUpload = () => {
    if (!selectedFile) {
      alert('Please select a file before uploading.');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);

    fetch(`${BACKEND_URL}/files/upload`, {
      method: 'POST',
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        // Check if the response has a "message" field
        if (data.message) {
          alert(data.message); // Display the message from the backend
        } else {
          alert('File uploaded successfully!'); // Fallback message if "message" field not found
        }
      })
      .catch((error) => {
        // Handle errors
        console.error('Error:', error);
        alert('Error uploading the file. Please try again.');
      });
  };

  return (
    <div>
      <h1>File Collector</h1>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleFileUpload}>Upload</button>
    </div>
  );
};

export default FileCollectorPage;
