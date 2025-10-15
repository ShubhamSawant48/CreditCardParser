// Import required packages
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const pdf = require('pdf-parse');

// Initialize the Express app
const app = express();
const port = 5000;

app.use(cors());

// Setup Multer for file handling in memory
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

/**
 * ================================================================
 * UNIQUE FEATURE 1: Bank logos and organized regex patterns
 * ================================================================
 */
const bankConfigs = {
    sbi: {
        issuer: /SBI Card/,
        patterns: {
            last4Digits: /Card Number ending (\d{4})/,
            statementPeriod: /Statement Period: (\d{2} \w{3} \d{4}-\d{2} \w{3} \d{4})/,
            dueDate: /Due Date: (\d{2} \w{3} \d{4})/,
            totalDue: /Total Due: ([\d,]+\.\d{2})/,
        },
        logoUrl: 'https://i.imgur.com/Qv9p27j.png' // Example logo URL
    },
    icici: {
        issuer: /ICICI Bank/,
        patterns: {
            last4Digits: /ICICI Coral \(XXXX-XXXX-XXXX-(\d{4})\)/,
            statementPeriod: /Statement Period\s*(\d{2} \w{3} \d{4}- \d{2} \w{3} \d{4})/,
            dueDate: /Payment Due Date\s*(\d{2} \w{3} \d{4})/,
            totalDue: /Total Amount Due\s*INR ([\d,]+\.\d{2})/,
        },
        logoUrl: 'https://i.imgur.com/83p1J4g.png'
    },
    hdfc: {
        issuer: /HDFC Bank/,
        patterns: {
            last4Digits: /Account Number: \d{4}-\d{4}-\d{4}-(\d{4})/,
            statementPeriod: /Statement Period: (\d{2}-\w{3}-\d{4} to \d{2}-\w{3}-\d{4})/,
            dueDate: /Payment Due Date: (\d{2}-\w{3}-\d{4})/,
            totalDue: /Total Amount Due:\s*([\d,]+\.\d{2})/,
        },
        logoUrl: 'https://i.imgur.com/LTSaH6p.png'
    },
    indusind: {
        issuer: /Indusind Bank/,
        patterns: {
            last4Digits: /Indusind Platinum \(XXXX-XXXX-XXXX-(\d{4})\)/,
            statementPeriod: /Statement Period: (\d{2} \w{3} \d{4}-\d{2} \w{3} \d{4})/,
            dueDate: /Payment Due Date: (\d{2} \w{3} \d{4})/,
            totalDue: /Total Amount Due: INR ([\d,]+\.\d{2})/,
        },
        logoUrl: 'https://i.imgur.com/G5l4h02.png'
    },
    kotak: {
        issuer: /Kotak Mahindra Bank/,
        patterns: {
            last4Digits: /Kotak Royale \(XXXX-XXXX-XXXX-(\d{4})\)/,
            statementPeriod: /Statement Period: (\d{2} \w{3} \d{4}-\d{2} \w{3} \d{4})/,
            dueDate: /Payment Due Date: (\d{2} \w{3} \d{4})/,
            totalDue: /Total Amount Due: INR ([\d,]+\.\d{2})/,
        },
        logoUrl: 'https://i.imgur.com/97y1t60.png'
    },
};

const parseCreditCardStatement = async (pdfBuffer) => {
    const data = await pdf(pdfBuffer);
    const text = data.text;

    let detectedBank = null;
    for (const bank in bankConfigs) {
        if (bankConfigs[bank].issuer.test(text)) {
            detectedBank = bank;
            break;
        }
    }

    if (!detectedBank) {
        throw new Error("Unsupported statement. Please upload a statement from a supported bank.");
    }
    
    const config = bankConfigs[detectedBank];
    const patterns = config.patterns;
    let confidenceScore = 0;
    const totalFields = Object.keys(patterns).length;

    const extract = (regex) => {
        const match = text.match(regex);
        if (match && match[1]) {
            confidenceScore++; // Increment score if field is found
            return match[1];
        }
        return 'N/A';
    };

    let extractedData = {};
    for (const key in patterns) {
        extractedData[key] = extract(patterns[key]);
    }

    /**
     * ================================================================
     * UNIQUE FEATURE 2: Data Cleaning and Formatting
     * ================================================================
     */
    // Clean the totalDue amount by removing commas
    if (extractedData.totalDue !== 'N/A') {
        extractedData.totalDue = extractedData.totalDue.replace(/,/g, '');
    }
    // You could add more formatting here, e.g., for dates

    return {
        issuer: detectedBank.charAt(0).toUpperCase() + detectedBank.slice(1),
        ...extractedData,
        logoUrl: config.logoUrl,
        /**
         * ================================================================
         * UNIQUE FEATURE 3: Extraction Confidence Score
         * ================================================================
         */
        confidence: `${confidenceScore}/${totalFields} fields found`,
    };
};

// API Endpoint (remains the same)
app.post('/api/upload', upload.single('statement'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded.' });
    }

    try {
        const extractedData = await parseCreditCardStatement(req.file.buffer);
        res.status(200).json(extractedData);
    } catch (error) {
        console.error("Error parsing PDF:", error);
        res.status(500).json({ error: error.message || "Failed to parse the PDF." });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`🚀 Server running on http://localhost:${port}`);
});