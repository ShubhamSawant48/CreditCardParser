import React, { useState } from 'react';
import axios from 'axios';
import './App.css'; // We will update the CSS as well

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [extractedData, setExtractedData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
    setExtractedData(null);
    setError('');
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a PDF file first!');
      return;
    }

    const formData = new FormData();
    formData.append('statement', selectedFile);

    setIsLoading(true);
    setError('');

    try {
      const response = await axios.post('http://localhost:5000/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setExtractedData(response.data);
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'An unexpected error occurred.';
      setError(errorMessage);
      setExtractedData(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container">
      <header>
        <h1>Credit Card Statement Parser 📄</h1>
        <p>A smart parser that extracts key details from your PDF statements.</p>
      </header>
      
      <div className="upload-section">
        <input type="file" accept=".pdf" onChange={handleFileChange} />
        <button onClick={handleUpload} disabled={!selectedFile || isLoading}>
          {isLoading ? 'Parsing...' : '✨ Parse PDF'}
        </button>
      </div>

      {error && <p className="error-message">{error}</p>}
      
      {extractedData && (
        <div className="results-card">
          <div className="card-header">
            {/* UNIQUE FEATURE: Display the bank logo */}
            <img src={extractedData.logoUrl} alt={`${extractedData.issuer} logo`} className="bank-logo" />
            <h2>Extraction Results</h2>
          </div>
          <div className="result-item">
            <strong>Card Last 4 Digits:</strong> <span>{extractedData.last4Digits}</span>
          </div>
          <div className="result-item">
            <strong>Statement Period:</strong> <span>{extractedData.statementPeriod}</span>
          </div>
          <div className="result-item">
            <strong>Payment Due Date:</strong> <span>{extractedData.dueDate}</span>
          </div>
          <div className="result-item total-due">
            <strong>Total Amount Due:</strong> <span>₹{extractedData.totalDue}</span>
          </div>
          <div className="card-footer">
            {/* UNIQUE FEATURE: Display the confidence score */}
            <strong>Confidence:</strong> <span>{extractedData.confidence}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;