const express = require('express');
const multer = require('multer');
const cors = require('cors');
const pdf = require('pdf-parse');

const app = express();
const port = 5000;

app.use(cors());

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const bankIdentifier = {
    sbi: { name: 'SBI', logoUrl: 'https://i.imgur.com/Qv9p27j.png' },
    icici: { name: 'ICICI', logoUrl: 'https://i.imgur.com/83p1J4g.png' },
    hdfc: { name: 'HDFC', logoUrl: 'https://i.imgur.com/LTSaH6p.png' },
    indusind: { name: 'Indusind', logoUrl: 'https://i.imgur.com/G5l4h02.png' },
    kotak: { name: 'Kotak', logoUrl: 'https://i.imgur.com/97y1t60.png' },
    axis: { name: 'Axis', logoUrl: 'https://i.imgur.com/v12aKqO.png' },
    citi: { name: 'Citi', logoUrl: 'https://i.imgur.com/2a7x061.png' },
    amex: { name: 'American Express', logoUrl: 'https://i.imgur.com/2s3otz7.png' },
};

const searchPatterns = {
    totalDue: {
        keywords: ['total amount due', 'total due', 'new balance', 'statement balance'],
        regex: /([\d,]+\.\d{2})/
    },
    dueDate: {
        keywords: ['payment due date', 'due date'],
        regex: /(\d{1,2}[-\s]\w{3}[-\s]\d{4})/i
    },
    last4Digits: {
        keywords: ['card number ending', 'account number:', 'card no\.', 'xxxx-'],
        regex: /(\d{4})/
    },
    statementPeriod: {
        keywords: ['statement period', 'billing cycle', 'statement date'],
        regex: /(\d{1,2}[-\s]\w{3}[-\s]\d{2,4}\s*(?:to|-)\s*\d{1,2}[-\s]\w{3}[-\s]\d{2,4})/i
    }
};

const universalParser = async (pdfBuffer) => {
    const data = await pdf(pdfBuffer);
    
    const text = data.text;
    const lines = text.toLowerCase().split('\n');

    let extractedData = {
        issuer: 'Unknown',
        logoUrl: 'https://i.imgur.com/r3bJ1gG.png',
        totalDue: 'N/A',
        dueDate: 'N/A',
        last4Digits: 'N/A',
        statementPeriod: 'N/A'
    };

    for (const bankKey in bankIdentifier) {
        if (text.toLowerCase().includes(bankKey)) {
            extractedData.issuer = bankIdentifier[bankKey].name;
            extractedData.logoUrl = bankIdentifier[bankKey].logoUrl;
            break;
        }
    }

    for (const key in searchPatterns) {
        const pattern = searchPatterns[key];
        for (const line of lines) {
            for (const keyword of pattern.keywords) {
                if (line.includes(keyword)) {
                    const match = line.match(pattern.regex);
                    if (match && match[0]) {
                        extractedData[key] = match[0].trim();
                        if (key === 'last4Digits') {
                             const digitMatches = line.match(/\d{4}/g);
                             if (digitMatches) {
                                extractedData[key] = digitMatches[digitMatches.length - 1];
                             }
                        }
                        break; 
                    }
                }
            }
            if (extractedData[key] !== 'N/A') break;
        }
    }

    let confidenceScore = 0;
    if (extractedData.totalDue !== 'N/A') {
        extractedData.totalDue = extractedData.totalDue.replace(/,/g, '');
        confidenceScore++;
    }
    if (extractedData.dueDate !== 'N/A') confidenceScore++;
    if (extractedData.last4Digits !== 'N/A') confidenceScore++;
    if (extractedData.statementPeriod !== 'N/A') confidenceScore++;
    extractedData.confidence = `${confidenceScore}/4 fields found`;

    return extractedData;
};

app.post('/api/upload', upload.single('statement'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded.' });
    }
    try {
        const data = await universalParser(req.file.buffer);
        res.status(200).json(data);
    } catch (error) {
        console.error("Error parsing PDF:", error.message);
        res.status(500).json({ error: "This PDF file may be corrupted or password-protected and cannot be read." });
    }
});

app.listen(port, () => {
    console.log(`🚀 Server running on http://localhost:${port}`);
});