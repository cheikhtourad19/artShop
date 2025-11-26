const cloudinary = require("cloudinary").v2;
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { InferenceClient } = require("@huggingface/inference");
const Replicate = require("replicate");
const { GoogleGenAI } = require("@google/genai");

const axios = require("axios");
const client = new InferenceClient(process.env.HUGGINGFACE_API_KEY);
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const generateProductDescription = async (req, res) => {
  try {
    const { title, currentDescription } = req.body;

    // Validation des données d'entrée
    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Le titre du produit est requis",
      });
    }

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Prompt optimisé pour la génération de descriptions de produits
    const prompt = `
      Tu es un expert en marketing e-commerce et rédaction de descriptions produits. 
      Génère une description de produit professionnelle, attrayante et convaincante en français.

      Informations du produit:
      - Titre: ${title}
      ${
        currentDescription
          ? `- Description actuelle: ${currentDescription}`
          : ""
      }

      Règles à suivre:
      1. La description doit être en français courant et professionnel
      2. Structure: Commence par un accroche percutante, puis les caractéristiques principales, avantages, et appel à l'action
      3. Longueur: 90-250 mots maximum
      4. Ton: Convaincant mais honnête, orienté vers les bénéfices client
      5. Inclure des mots-clés pertinents pour le référencement
      6. Mettre en valeur les points forts du produit
      7. Utiliser un langage simple et accessible
      8. Éviter le jargon technique excessif

      ${
        currentDescription
          ? `Améliore et enrichis la description existante en la rendant plus persuasive et professionnelle.`
          : `Crée une description complète basée sur le titre du produit.`
      }

      Retourne uniquement la description générée, sans commentaires supplémentaires.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const generatedDescription = response.text().trim();

    // Nettoyer la réponse si nécessaire
    const cleanDescription = generatedDescription
      .replace(/^\*+/g, "") // Supprimer les astérisques au début
      .replace(/\*\*|\*/g, "") // Supprimer les astérisques de formatage
      .trim();

    if (!cleanDescription) {
      throw new Error("La génération de description a échoué");
    }

    res.status(200).json({
      success: true,
      description: cleanDescription,
      message: "Description générée avec succès",
    });
  } catch (error) {
    console.error("Erreur lors de la génération de description:", error);

    // Gestion spécifique des erreurs Gemini
    if (
      error.message.includes("API_KEY_INVALID") ||
      error.message.includes("API key not valid")
    ) {
      return res.status(500).json({
        success: false,
        message: "Clé API Gemini invalide",
      });
    }

    if (error.message.includes("QUOTA_EXCEEDED")) {
      return res.status(429).json({
        success: false,
        message: "Quota d'API dépassé",
      });
    }

    res.status(500).json({
      success: false,
      message:
        "Erreur lors de la génération de la description: " + error.message,
    });
  }
};

// const generateProductImage = async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({ error: "No image file provided" });
//     }

//     const uploadResult = await new Promise((resolve, reject) => {
//       const uploadStream = cloudinary.uploader.upload_stream(
//         { folder: "product-enhancement" },
//         (error, result) => {
//           if (error) reject(error);
//           else resolve(result);
//         }
//       );
//       uploadStream.end(req.file.buffer);
//     });

//     const enhancedUrl = cloudinary.url(uploadResult.public_id, {
//       effect:
//         "gen_background_replace:prompt_elegant product photography studio with soft box lighting and gradient backdrop",
//       quality: "auto:best",
//       fetch_format: "auto",
//     });

//     const response = await fetch(enhancedUrl);
//     const imageBuffer = await response.arrayBuffer();

//     res.setHeader("Content-Type", "image/jpeg");
//     res.send(Buffer.from(imageBuffer));
//   } catch (error) {
//     console.error("Error:", error);
//     res.status(500).json({ error: error.message });
//   }
// };

// const generateProductImage = async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({ error: "No image file provided" });
//     }

//     // Convert buffer to Blob
//     const blob = new Blob([req.file.buffer], { type: req.file.mimetype });

//     const image = await client.imageToImage({
//       model: "dx8152/Qwen-Image-Edit-2509-Fusion",
//       inputs: blob,
//       parameters: {
//         prompt:
//           "Transform this into a professional product photo with clean white background, studio lighting, perfect for e-commerce.",
//       },
//     });

//     const arrayBuffer = await image.arrayBuffer();
//     const imageBuffer = Buffer.from(arrayBuffer);

//     res.setHeader("Content-Type", "image/jpeg");
//     res.send(imageBuffer);
//   } catch (error) {
//     console.error("Error:", error);
//     res.status(500).json({ error: error.message });
//   }
// };

// // const generateProductImage = async (req, res) => {
// //   try {
// //     if (!req.file) {
// //       return res.status(400).json({ error: "No image file provided" });
// //     }

// //     // Check if API key exists
// //     if (!process.env.GOOGLE_AI_API_KEY) {
// //       throw new Error("GEMINI_API_KEY environment variable is not set");
// //     }

// //     console.log(
// //       "API Key exists:",
// //       process.env.GOOGLE_AI_API_KEY ? "Yes" : "No"
// //     );

// //     // Initialize Google GenAI
// //     const ai = new GoogleGenAI({
// //       apiKey: process.env.GOOGLE_AI_API_KEY,
// //     });

// //     // Prepare the image data
// //     const base64Image = req.file.buffer.toString("base64");
// //     const mimeType = req.file.mimetype || "image/jpeg";

// //     const config = {
// //       responseModalities: ["IMAGE", "TEXT"],
// //     };

// //     const model = "gemini-2.5-flash-image";

// //     const contents = [
// //       {
// //         role: "user",
// //         parts: [
// //           {
// //             inlineData: {
// //               mimeType: mimeType,
// //               data: base64Image,
// //             },
// //           },
// //           {
// //             text: "Transform this into professional product photography with clean white background and studio lighting. Generate only the enhanced product image.",
// //           },
// //         ],
// //       },
// //     ];

//     console.log("Sending request to Gemini API...");

//     const response = await ai.models.generateContentStream({
//       model,
//       config,
//       contents,
//     });

//     let imageGenerated = false;
//     let imageBuffer = null;
//     let textResponse = "";

//     // Process the streaming response
//     for await (const chunk of response) {
//       if (
//         !chunk.candidates ||
//         !chunk.candidates[0].content ||
//         !chunk.candidates[0].content.parts
//       ) {
//         continue;
//       }

//       // Check for image data
//       if (chunk.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
//         const inlineData = chunk.candidates[0].content.parts[0].inlineData;
//         imageBuffer = Buffer.from(inlineData.data || "", "base64");
//         imageGenerated = true;
//         console.log("Image generated successfully");
//       }
//       // Collect text responses
//       else if (chunk.text) {
//         textResponse += chunk.text;
//         console.log("Text chunk:", chunk.text);
//       }
//     }

//     // Send the generated image back to the client
//     if (imageGenerated && imageBuffer) {
//       res.setHeader("Content-Type", "image/jpeg");
//       res.send(imageBuffer);
//     } else {
//       throw new Error("No image was generated. Response: " + textResponse);
//     }
//   } catch (error) {
//     console.error("Error:", error);
//     res.status(500).json({
//       error: error.message,
//       details: "Failed to generate product image with Gemini API",
//     });
//   }
// };

// Optional: Function to check processing status
const synthesizeImage = async (prompt, images, options = {}) => {
  try {
    if (!DASHSCOPE_API_KEY) {
      throw new Error("DASHSCOPE_API_KEY is not set in environment variables");
    }

    const requestBody = {
      model: options.model || "wan2.5-i2i-preview",
      input: {
        prompt: prompt,
        images: images,
        negative_prompt: options.negativePrompt || "",
      },
      parameters: {
        n: options.n || 1,
        seed: options.seed || Math.floor(Math.random() * 100000),
        watermark: options.watermark !== undefined ? options.watermark : false,
      },
    };

    // Add size if specified
    if (options.size) {
      requestBody.parameters.size = options.size;
    }

    console.log("Calling DashScope API with model:", requestBody.model);

    const response = await axios.post(
      `${DASHSCOPE_BASE_URL}/services/aigc/image-synthesis/generation`,
      requestBody,
      {
        headers: {
          Authorization: `Bearer ${DASHSCOPE_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("DashScope API Error Details:", error.response?.data);
    throw new Error(
      `DashScope API Error: ${error.response?.data?.message || error.message}`
    );
  }
};

/**
 * Download image from URL
 */
const downloadImage = async (imageUrl) => {
  const response = await axios.get(imageUrl, {
    responseType: "arraybuffer",
  });
  return Buffer.from(response.data);
};

const generateProductImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided" });
    }

    if (!DASHSCOPE_API_KEY) {
      throw new Error("DASHSCOPE_API_KEY environment variable is not set");
    }

    // Convert uploaded file to base64
    const imageBase64 = encodeBufferToBase64(
      req.file.buffer,
      req.file.mimetype
    );

    // For single image, you might want to use a different prompt
    const prompt =
      req.body.prompt ||
      "Transform this into professional product photography with clean white background and studio lighting";

    console.log("Enhancing product image with DashScope API...");

    const result = await synthesizeImage(prompt, [imageBase64], {
      model: "wan2.5-i2i-preview",
      n: 1,
      watermark: false,
    });

    if (
      result.output &&
      result.output.results &&
      result.output.results.length > 0
    ) {
      const imageUrl = result.output.results[0].url;
      const imageBuffer = await downloadImage(imageUrl);

      res.setHeader("Content-Type", "image/jpeg");
      res.send(imageBuffer);
    } else {
      throw new Error("No image was generated in the response");
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      error: error.message,
      details: "Failed to enhance product image with DashScope API",
    });
  }
};

const DASHSCOPE_BASE_URL = "https://dashscope-intl.aliyuncs.com/api/v1";
const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY;
/**
 * Encode local file to base64 format
 */
const encodeFileToBase64 = (filePath) => {
  const fileBuffer = fs.readFileSync(filePath);
  const mimeType = getMimeType(filePath);
  const base64Data = fileBuffer.toString("base64");
  return `data:${mimeType};base64,${base64Data}`;
};

/**
 * Encode buffer to base64 format
 */
const encodeBufferToBase64 = (buffer, mimeType) => {
  const base64Data = buffer.toString("base64");
  return `data:${mimeType};base64,${base64Data}`;
};

/**
 * Get MIME type from file extension
 */
const getMimeType = (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".bmp": "image/bmp",
  };
  return mimeTypes[ext] || "image/jpeg";
};

module.exports = { generateProductImage, generateProductDescription };
