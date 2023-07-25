import React, { useState } from 'react';
import { BACKEND_URL } from '../config';

const FileCollectorPage = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [existingReference, setExistingReference] = useState(false);
  const [referenceId, setReferenceId] = useState(-1);

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleFileUpload = () => {
    if (!selectedFile) {
      alert('Please select a file before uploading.');
      return;
    }
    if (isNaN(referenceId)) {
      alert('Please enter a valid reference ID. It should be numeric only.');
      return;
    }

    const accountAddress = localStorage.getItem('AccountAddress');
    if (!accountAddress) {
      alert('Please log in using your wallet first');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('reference_id', existingReference ? Number(referenceId) : null)
    formData.append('submitter_address', accountAddress)

    // TODO: Change to BACKEND_URL
    // FOR now, just localhost:5000
    fetch(`http://localhost:5000/files/upload`, {
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
      <div>
        <label for="existing-reference">Do you have an existing reference number?</label>
        <input type="checkbox" id="existing-reference" onChange={(e) => {setExistingReference(e.target.checked)}}/>
      </div>
      {existingReference && (
        <div>
          <br />
          <label for="reference_id">Reference ID:</label>
          <input type="text" id="reference_id" onChange={(e) => {setReferenceId(Number(e.target.value))}} />
          <br />
        </div>
      )}
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleFileUpload}>Upload</button>
    </div>
  );
};

export default FileCollectorPage;
