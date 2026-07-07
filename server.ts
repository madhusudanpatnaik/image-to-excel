import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Set up large payload limits for image uploads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Shared Gemini Client
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured. Please add your Gemini API key in the Secrets panel in AI Studio Settings.");
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
};

// API endpoint for extracting table data from image
app.post("/api/extract", async (req, res) => {
  try {
    const { image, mimeType } = req.body;
    if (!image) {
      return res.status(400).json({ error: "Missing image data" });
    }

    const ai = getGeminiClient();

    const imagePart = {
      inlineData: {
        mimeType: mimeType || "image/png",
        data: image,
      },
    };

    const textPart = {
      text: "Analyze this image and extract all structured data or tables into a JSON format. Make sure to capture every row and column. If cells are merged or empty, handle them properly. Propose column headers if they are missing or unclear.",
    };

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: { parts: [imagePart, textPart] },
      config: {
        systemInstruction: "You are an expert data entry assistant and OCR specialist. Your task is to extract tabular or structured data from the uploaded image. Analyze the table, grid, or structured list in the image and convert it into a neat structured format consisting of headers and rows. Make sure to: 1. Identify all column headers accurately. If there are no clear headers, invent appropriate header names. 2. Extract all row values in order. Do not skip any rows or cells. Keep formatting (like currency, percentage, IDs) exactly as shown in the image. 3. Handle empty cells by providing an empty string. 4. Clean up any artifacts, lines, or visual dividers. 5. Provide a short, relevant table name.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tableName: {
              type: Type.STRING,
              description: "The name of the table or a summary of the data contents."
            },
            headers: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of table headers/column names in correct order. Capture every column."
            },
            rows: {
              type: Type.ARRAY,
              items: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "The cells of the row. Must correspond to the order of the headers."
              },
              description: "List of rows. Each row contains values in the exact same order as the headers."
            }
          },
          required: ["headers", "rows", "tableName"]
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response text received from Gemini.");
    }

    const parsedData = JSON.parse(text.trim());
    return res.json(parsedData);
  } catch (error: any) {
    console.error("Extraction error:", error);
    return res.status(500).json({ error: error.message || "Failed to process image and extract data." });
  }
});

// Vite dev server integration
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
