import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import getTranscript from "./generateTranscript.js";
import generateNotes from "./groqGenerate.js";
import cors from "cors";

dotenv.config(); // Load environment variables from .env file

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(bodyParser.json()); // To parse JSON body
app.use(cors()); // To enable CORS

// Load GROQ API keys as an array
const GROQ_API_KEY_ARRAY = JSON.parse(process.env.GROQ_API_KEY_JSON);
const Transcript_api_keyArray=JSON.parse( process.env.TRANSCRIPT_API_KEY_JSON);
// Helper function to select a random key
const getRandomApiKey = () => {
  const randomIndex = Math.floor(Math.random() * GROQ_API_KEY_ARRAY.length);
  return GROQ_API_KEY_ARRAY[randomIndex];
};
const getRandomApiKeyTrancript= ()=>{
  const randomIndex = Math.floor(Math.random() * Transcript_api_keyArray.length);
  return Transcript_api_keyArray[randomIndex];
}

async function tryGetTranscript(link, maxAttempts = 3) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const apiKey = getRandomApiKeyTrancript();
    try {
      const transcript = await getTranscript(link, apiKey);
      if (transcript) {
        return transcript;
      }
    } catch (error) {
      console.log(`Attempt ${attempt} failed: ${error.message}`);
      if (attempt === maxAttempts) {
        throw new Error('All transcript generation attempts failed');
      }
    }
  }
  return null;
}

// Route to handle POST requests
app.post("/api/generate", async (req, res) => {
  try {
    const { link } = req.body; // Extract the link from the request body

    // Validate the link
    if (!link) {
      return res.status(400).json({ message: "Link not provided" });
    }

    // Try to generate transcript with retries
    const transcript = await tryGetTranscript(link);
    if (!transcript) {
      return res.status(500).json({ message: "Transcript generation failed after multiple attempts" });
    }

    // Select a random API key
    const randomApiKey = getRandomApiKey();

    // Generate notes using the random API key
    const notes = await generateNotes(randomApiKey, transcript);
    if (!notes) {
      return res.status(500).json({ message: "Notes generation from AI failed" });
    }

    // Success response
    res.status(200).json({
      message: "Successful",
      notes: notes,
      link: link,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
