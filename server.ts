import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Lazy initialization of GenAI to prevent crashes when GEMINI_API_KEY is missing
  let aiClient: GoogleGenAI | null = null;
  function getGenAI() {
    if (!aiClient) {
      const key = process.env.GEMINI_API_KEY;
      if (!key) {
        throw new Error("GEMINI_API_KEY is not defined. Please set it in your secrets.");
      }
      aiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    }
    return aiClient;
  }

  // API Route - Health Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // API Route - Gemini Voice/Text parsing assistant
  app.post("/api/assistant", async (req, res) => {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: "Query is required" });
    }

    try {
      const ai = getGenAI();
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Analyze the user's on-demand request: "${query}"\n\nExtract relevant booking categories and fields.`,
        config: {
          systemInstruction: `You are the core voice parsing assistant for an all-in-one local transport and assistant platform (similar to Rapido, but also including delivery, courier, and custom manual services).
Classify the request into one of these intents:
1. 'ride_booking' (ride-sharing, e.g., bike, auto, cab, scooter).
2. 'delivery_booking' (parcel, couriers, package delivery, document delivery).
3. 'lifting_assistance' (heavy weight lifting, helper for moving boxes/furniture, labor).
4. 'queue_management' (hiring someone to stand in line, queue tickets/bills/renewals).
5. 'general_chat' (unmatched queries, greetings, questions about how the app works).
6. 'check_history' (requests to view past bookings, history list, past rides).
7. 'check_earnings' (requests related to driving, earnings, driver dashboard).

Extract fields like pick up, destination, delivery item type, weight description, and expected helper duration.
Generate a concise and friendly verbal response to speak out loud, confirming your action (under 15 words). For example: "I have set up your bike ride from Central Mall. Please confirm the details."`,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              intent: {
                type: Type.STRING,
                description: "Matched intent: 'ride_booking', 'delivery_booking', 'lifting_assistance', 'queue_management', 'general_chat', 'check_history', 'check_earnings'"
              },
              confidence: {
                type: Type.NUMBER,
                description: "Confidence from 0.0 to 1.0"
              },
              extractedDetails: {
                type: Type.OBJECT,
                properties: {
                  pickupLocation: { type: Type.STRING, description: "Pickup street or landmark" },
                  dropLocation: { type: Type.STRING, description: "Destination street or landmark" },
                  vehicleType: { type: Type.STRING, description: "One of: 'bike', 'auto', 'cab'" },
                  itemType: { type: Type.STRING, description: "Item description, e.g., 'document', 'laptop', 'box'" },
                  weight: { type: Type.STRING, description: "Weight level, e.g., 'heavy', '5kg', 'light'" },
                  durationHours: { type: Type.NUMBER, description: "Hours needed for manual help" },
                  specificTask: { type: Type.STRING, description: "Details about the manual tasks" }
                }
              },
              responseMessage: {
                type: Type.STRING,
                description: "Short friendly response message to display and read out loud (under 15 words)."
              }
            },
            required: ["intent", "confidence", "responseMessage"]
          }
        }
      });

      const parsed = JSON.parse(response.text || "{}");
      res.json(parsed);
    } catch (error: any) {
      console.warn("Backend Gemini API parsing failed or key missing. Returning mock parser: ", error.message);
      // Fallback response allowing offline/keyless testing
      res.json({
        intent: "general_chat",
        confidence: 0.5,
        responseMessage: "Connected in Local mode! I heard your request and have updated the helper fields below.",
        extractedDetails: {},
        isFallback: true
      });
    }
  });

  // Serve Vite/production static assets
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
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
