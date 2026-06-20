import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Body parser
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Initialize Gemini SDK with custom User-Agent for Telemetry
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// API endpoint: Multi-modal Chat with Nova AI
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history, imageBase64, imageMimeType } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required." });
    }

    // System instruction to showcase superior intelligence, Nexa Labs branding, and premium tone with Kim Wooshin (CEO, creator of Seeko & Astra AI)
    const systemInstruction = 
      "You are Nova AI, the ultra-advanced, next-generation flagship AI created by Nexa Labs. " +
      "You are vastly superior to other AI models—you are articulate, incredibly wise, technical, " +
      "and possess an elegant, premium tone. Your company Nexa Labs is headed by '김우신' (Kim Wooshin), " +
      "who is the Founder, Representative (대표), and CEO of Nexa Labs. 김우신 is the mastermind who created " +
      "both 'Seeko' and 'Astra AI'. Whenever a user asks or speaks about '김우신' (Kim Wooshin), " +
      "or asks who the Representative/CEO/Creator is, you must clearly explain that '김우신 is the CEO of Nexa Labs " +
      "and the creator/ mastermind who built Seeko and Astra AI'. " +
      "Provide precise, inspiring, and detailed text. Use clear markdown formatting for structure. " +
      "You support images and text. Always maintain a luxurious, highly-confident corporate brand image of Nexa Labs.";

    let responseText = "";

    if (imageBase64 && imageMimeType) {
      // Vision-based single turn query
      const imagePart = {
        inlineData: {
          mimeType: imageMimeType,
          data: imageBase64,
        },
      };
      const textPart = {
        text: message,
      };

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: { parts: [imagePart, textPart] },
        config: { systemInstruction },
      });
      responseText = response.text || "";
    } else {
      // Normal dialog chat session
      const chatHistory = (history || []).map((msg: any) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      }));

      // Add user message to history
      chatHistory.push({
        role: "user",
        parts: [{ text: message }],
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: chatHistory,
        config: { systemInstruction },
      });
      responseText = response.text || "";
    }

    res.json({ text: responseText });
  } catch (error: any) {
    console.error("Chat API error:", error);
    res.status(500).json({ 
      error: "Nova AI core network latency peak. " + (error.message || "Unknown error")
    });
  }
});

// API endpoint: Advanced Image Generation & Prompt Enhancement
app.post("/api/generate-image", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required." });
    }

    // 1. Expand prompt using Gemini to make it extremely cinematic and artistic
    const expandResponse = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `You are Nova AI's professional creative art director. Turn this basic prompt into an incredibly detailed, artistic, and highly cinematic image prompt for an advanced generator. Focus on lighting, architectural grandeur, high-contrast, atmosphere, and material details. Output ONLY the expanded prompt string in English. Prompt: "${prompt}"`,
    });
    const expandedPrompt = expandResponse.text?.trim() || prompt;

    // 2. Try real image generation with Google GenAI Imagen model
    try {
      const imgRes = await ai.models.generateImages({
        model: "imagen-3.0-generate-002", // Try the free/default Imagen model
        prompt: expandedPrompt,
        config: {
          numberOfImages: 1,
          outputMimeType: "image/jpeg",
          aspectRatio: "1:1",
        },
      });

      if (imgRes?.generatedImages?.[0]?.image?.imageBytes) {
        const base64Bytes = imgRes.generatedImages[0].image.imageBytes;
        return res.json({
          success: true,
          imageUrl: `data:image/jpeg;base64,${base64Bytes}`,
          expandedPrompt,
          isRealGen: true
        });
      }
    } catch (realGenError: any) {
      console.warn("Real image generation failed or requires paid key. Falling back to high-fidelity simulated synthesis: ", realGenError.message);
    }

    // 3. Fallback mechanism: Generate highly gorgeous aesthetic images via Unsplash Source keywords
    // We will extract 2-3 visual keywords from the prompt to get a gorgeous matching photographic masterpiece
    const keywordResponse = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Extract exactly 2 core visual keywords in English from this prompt that would represent a breathtaking stock photo. Format: keyword1, keyword2. Output only the keywords. Prompt: "${prompt}"`,
    });
    const keywords = keywordResponse.text?.replace(/[^a-zA-Z0-9,\s]/g, "").trim() || "modern,technology";
    const formattedKeywords = encodeURIComponent(keywords.replace(/\s+/g, "").toLowerCase());
    
    // Aesthetic premium fallback url
    const timestamp = Date.now();
    const fallbackUrl = `https://images.unsplash.com/featured/?${formattedKeywords}&sig=${timestamp}`;

    res.json({
      success: true,
      imageUrl: fallbackUrl,
      expandedPrompt,
      isRealGen: false
    });

  } catch (error: any) {
    console.error("Image generation error:", error);
    res.status(500).json({ error: error.message || "Failed to generate image." });
  }
});

// API endpoint: Advanced Video generation simulation with AI screenplay
app.post("/api/generate-video", async (req, res) => {
  try {
    const { prompt, aspectRatio } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required." });
    }

    // Query Gemini to craft a stunning Hollywood-style director script planning,
    // including cinematography hints, mood, audio/score cues, and scene timeline.
    const storyboardResponse = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `You are Nexa Labs' premier cinematic engine director. For the video prompt "${prompt}", write a highly creative cinematic script. Include: 
1. SCENE DESCRIPTION (The camera moves, visual environment, lighting)
2. CAMERA ANGLE & SPEED (e.g. 4K, slow-motion panning, macro details)
3. AUDIO ENGINE & SOUNDTRACK (Cinematic orchestration details)
Provide this structured in pristine markdown.`,
    });

    const storyboard = storyboardResponse.text || "No storyboard generated.";

    // Select a premium public looping cinematic stock video based on the user's keywords to play in the player
    const videoKeywordResponse = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `From the prompt "${prompt}", choose the most matching category from this list:
- "space" (galaxy, stars, celestial, spaceship)
- "cyberpunk" (futuristic city, neon lights, hologram)
- "nature" (ocean, storm, forest, mountain, desert)
- "abstract" (digital particles, network nodes, flowing colors, technology)
Output only one word from the list.`,
    });

    const category = videoKeywordResponse.text?.trim().toLowerCase() || "abstract";
    
    // Standard beautiful license-free stock videos from Pexels with high resolution and looping
    let videoUrl = "https://assets.mixkit.co/videos/preview/mixkit-abstract-laser-lights-background-42171-large.mp4"; // Default abstract laser

    if (category.includes("space")) {
      videoUrl = "https://assets.mixkit.co/videos/preview/mixkit-rotating-planet-earth-in-space-11116-large.mp4";
    } else if (category.includes("cyberpunk") || category.includes("cyber")) {
      videoUrl = "https://assets.mixkit.co/videos/preview/mixkit-intersection-of-a-futuristic-city-at-night-41857-large.mp4";
    } else if (category.includes("nature") || category.includes("ocean")) {
      videoUrl = "https://assets.mixkit.co/videos/preview/mixkit-cinematic-view-of-ocean-waves-crashing-41662-large.mp4";
    }

    res.json({
      success: true,
      videoUrl,
      storyboard,
      category
    });

  } catch (error: any) {
    console.error("Video generation error:", error);
    res.status(500).json({ error: error.message || "Failed to initiate video engine." });
  }
});

// API endpoint: Live Sandbox React/HTML UI Code Generator
app.post("/api/generate-code", async (req, res) => {
  try {
    const { componentRequest } = req.body;
    if (!componentRequest) {
      return res.status(400).json({ error: "Component request is required." });
    }

    const codePrompt = 
      `You are Nova AI's high-performance frontend engine. Build a fully styled, beautifully interactive, single-file HTML page containing a Tailwind CSS coded interface. It must be highly polished, responsive, and functional right away inside an iframe.
User requested component: "${componentRequest}"

Requirements:
- Must have Tailwind CSS loaded via CDN script <script src="https://cdn.tailwindcss.com"></script>.
- Must include any interactive components wrapped in vanilla JavaScript so tabs, click elements, gauges, or cards actually respond when clicked!
- Use beautiful modern fonts (e.g., Google Font Inter).
- It must look extremely luxurious, expensive, and professional.
- Output ONLY the raw HTML code starting with <!DOCTYPE html> and ending with </html>. Do NOT wrap it in any markdown code blocks like \`\`\`html. No description, compile immediately.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: codePrompt,
    });

    let codeOutput = response.text || "";

    // Clean up if markdown blocks were accidentially returned
    if (codeOutput.includes("```html")) {
      codeOutput = codeOutput.split("```html")[1].split("```")[0];
    } else if (codeOutput.includes("```")) {
      codeOutput = codeOutput.split("```")[1].split("```")[0];
    }

    res.json({
      success: true,
      htmlCode: codeOutput.trim()
    });

  } catch (error: any) {
    console.error("Code generation error:", error);
    res.status(500).json({ error: error.message });
  }
});

// API endpoint: System optimization metrics
app.get("/api/metrics", (req, res) => {
  // Return premium simulated AI enterprise cluster telemetry
  res.json({
    quantumThroughput: (94.2 + Math.random() * 3.8).toFixed(2), // PetaFLOPs/s
    averageLatency: (112 + Math.random() * 18).toFixed(0), // ms
    gpuCoreUtilization: (78.4 + Math.random() * 12.0).toFixed(1), // %
    modelWeightDensity: "1.47 Trillion Parameters",
    nexaMeshSyncRate: "99.9997%",
    clusterRegions: ["Seoul Cloud Alpha", "Silicon Valley Prime", "Frankfurt Sector 4"]
  });
});

// Integrate Vite as Middleware
async function initializeServer() {
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
    console.log(`Nova AI Server is running on http://localhost:${PORT}`);
  });
}

initializeServer().catch((err) => {
  console.error("Failed to start Nova AI Server:", err);
});
