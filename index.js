// const express = require("express");
// const bodyParser = require("body-parser");
// const dotenv = require("dotenv");
// const getTranscript = require("./getTranscript"); // Import the getTranscript function
// const generateNotes = require("./groqGenerate"); // Import the generateNotes function
import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import getTranscript from "./generateTranscript.js";
import generateNotes from "./groqGenerate.js";
dotenv.config(); // Load environment variables from .env file
const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(bodyParser.json()); // To parse JSON body

// Route to handle POST requests
app.post("/api/generate", async (req, res) => {
  try {
    const { link } = req.body; // Extract the link from the request body
    // console.log("Link given by user is:", link);
    
    // Validate the link
    if (!link) {
      return res.status(400).json({ message: "Link not provided" });
    }

    // Generate transcript
    const transcript = await getTranscript(link);
    if (!transcript) {
      return res.status(500).json({ message: "Transcript generation failed" });
    }

    // Generate notes
    const notes = await generateNotes(process.env.GROQ_API_KEY, transcript);
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
