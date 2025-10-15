const express = require('express');
const multer = require('multer');
const cors = require('cors');
// Use the stable, universally compatible version of pdf-parse
const pdf = require('pdf-parse');

const app = express();
const port = 5000;

app.use(cors());

// Setup Multer for file handling in memory
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// --- Configuration for the Smart Parser ---
const bankIdentifier = {
    sbi: { name: 'SBI', logoUrl: 'https://1000logos.net/wp-content/uploads/2018/03/SBI-Logo.png' },
    icici: { name: 'ICICI', logoUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRp8mXBusladp4eop5YLbiGOpipboZcpsGylw&s' },
    hdfc: { name: 'HDFC', logoUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQrzPShBJ8yWKer7KnP6aofIajMV5-xegeXFA&s' },
    indusind: { name: 'Indusind', logoUrl: 'https://i.pinimg.com/736x/01/28/25/0128254f4655e5936c8726883f71a212.jpg' },
    kotak: { name: 'Kotak', logoUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQim1VPxwUweF5uzFXCtwDH0DZUJC41ELBuFQ&s' },
    axis: { name: 'Axis', logoUrl: 'https://brandlogos.net/wp-content/uploads/2014/12/axis_bank-logo-brandlogos.net_-512x512.png' },
    citi: { name: 'Citi', logoUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQl1NaINOggDVgrBXjppmAcSImca1IgyWIpXw&s' },
    amex: { name: 'American Express', logoUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSUsYBjE7TwDu9OBFPYv17gkLDNBHMfTI_SDg&s' },
};

const searchPatterns = {
    totalDue: {
        // ** THE FIX **: Added 'total balance' from your sample PDFs.
        keywords: ['total amount due', 'total due', 'new balance', 'statement balance', 'amount due', 'total balance'],
        regex: /([\d,]+\.\d{2})/
    },
    dueDate: {
        keywords: ['payment due date', 'due date'],
        regex: /(\d{1,2}[-\s]\w{3}[-\s]\d{4})/i
    },
    last4Digits: {
        // ** THE FIX **: Added 'card (last 4 digits)' from your sample PDFs.
        keywords: ['card number ending', 'account number:', 'card no\.', 'xxxx-', 'card number', 'credit card number', 'card (last 4 digits)'],
        regex: /(\d{4})/
    },
    statementPeriod: {
        keywords: ['statement period', 'billing cycle', 'statement date'],
        regex: /(\d{1,2}[-\s]\w{3}[-\s]\d{2,4}\s*(?:to|-)\s*\d{1,2}[-\s]\w{3}[-\s]\d{2,4})/i
    }
};

// --- The Universal Parsing Function ---
const universalParser = async (pdfBuffer) => {
    // This simple, direct call works perfectly with the stable library version.
    const data = await pdf(pdfBuffer);
    
    const text = data.text;
    const lines = text.toLowerCase().split('\n');

    let extractedData = {
        issuer: 'Unknown',
        logoUrl: 'https://i.imgur.com/r3bJ1gG.png', // Generic logo
        totalDue: 'N/A',
        dueDate: 'N/A',
        last4Digits: 'N/A',
        statementPeriod: 'N/A'
    };

    // Step 1: Identify the Bank
    for (const bankKey in bankIdentifier) {
        if (text.toLowerCase().includes(bankKey)) {
            extractedData.issuer = bankIdentifier[bankKey].name;
            extractedData.logoUrl = bankIdentifier[bankKey].logoUrl;
            break;
        }
    }

    // Step 2: Extract data using keywords and flexible regex
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

    // Step 3: Clean up data and calculate confidence score
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

// --- API Endpoint with Robust Error Handling ---
app.post('/api/upload', upload.single('statement'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded.' });
    }
    try {
        const data = await universalParser(req.file.buffer);
        res.status(200).json(data);
    } catch (error) {
        // This block catches errors from corrupted PDFs (like 'bad XRef entry')
        // It prevents the server from crashing and sends a clean error to the user.
        console.error("Error parsing PDF:", error.message);
        res.status(500).json({ error: "This PDF file may be corrupted or password-protected and cannot be read." });
    }
});

// --- Server Startup ---
app.listen(port, () => {
    console.log(`🚀 Server running on http://localhost:${port}`);
});