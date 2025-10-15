# 📄 Credit Card Statement Parser

A smart, universal PDF parser built with the MERN stack (React, Node.js, Express.js) to intelligently extract key financial data from various credit card statements. This project focuses on robust, flexible parsing logic rather than relying on fixed templates.

## ✨ Key Features

* **Universal Parsing Engine**: Intelligently scans PDFs for keywords and patterns, allowing it to parse statements from various banks without being pre-programmed for a specific layout.
* **5 Key Data Points**: Extracts the most crucial information from any statement:
    * Last 4 Digits of the Card
    * Statement Period
    * Payment Due Date
    * Minimum Amount Due
    * Total Amount Due
* **Dynamic Bank Identification**: Automatically detects the card issuer (e.g., SBI, HDFC, ICICI) from the document and displays the corresponding logo.
* **Confidence Score**: Calculates and displays a confidence score to indicate how many data points were successfully extracted.
* **Robust Error Handling**:
    * Gracefully handles corrupted or improperly formatted PDFs without crashing the server.
    * Features a seamless, automatic frontend retry mechanism to overcome initial server "cold start" issues.

## 🛠️ Tech Stack

* **Frontend**: React (with Vite), Axios
* **Backend**: Node.js, Express.js
* **File Handling**: Multer
* **PDF Parsing Engine**: `pdf-parse`

## 📂 Project Structure

The project is organized into two main folders: `frontend` and `backend`.

credit-card-parser/
├── backend/
│   ├── node_modules/
│   ├── package.json
│   └── server.js        # The Express server and all parsing logic
└── frontend/
├── src/
│   ├── App.css
│   └── App.jsx      # The main React component
├── package.json
└── ...

### 1. Backend Setup

First, let's get the server running. Open a terminal and navigate to the project's `backend` folder.

```bash
# Navigate to the backend directory
cd backend

# Install dependencies (including the specific, stable version of pdf-parse)
npm install express cors multer pdf-parse@1.1.1

# Start the server
node server.js or nodemon server.js
```
### 2. Frontend Setup

First, let's get the server running. Open a terminal and navigate to the project's `frontend` folder.

```bash

# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Start the React development server
npm run dev
```

3. Usage
You're all set! You can now use the application:

    1. Click the "Choose File" button to select a credit card statement PDF.

    2. Click the "✨ Parse PDF" button.

    3. The extracted data will appear on the results card.