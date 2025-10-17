// aiController.js
const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require("@google/generative-ai");

const generateProductImage = async (req, res) => {
  console.log("Generate product image endpoint hit");
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);

  // 1. ***MODEL CHANGE: Use an Image Generation Model (like Imagen)***
  // NOTE: This model name is for illustration; check Google's latest documentation for the correct, available Image Generation model.
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash-image", // 👈 works, lightweight & fast
    config: {
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ],
    },
  });

  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided" });
    }

    // A textual description of what the user wants in the new image
    const desiredScene =
      req.body.scene ||
      "A professional, marketing-friendly photograph of the product on a white marble table in a well-lit, minimalist studio environment.";

    console.log("File received:", req.file.originalname);
    console.log("Desired Scene:", desiredScene);

    // Convert input image to base64
    const imageBase64 = req.file.buffer.toString("base64");

    const imagePart = {
      inlineData: {
        data: imageBase64,
        mimeType: req.file.mimetype,
      },
    };

    // 2. ***PROMPT CHANGE: Describe the new image, including the product***
    const prompt = `Based on the product in the provided image, create a new, high-quality, professional product photograph. The scene should be: ${desiredScene}`;

    // 3. ***API CALL CHANGE: Use generateContent with the image and scene prompt***
    const result = await model.generateContent([prompt, imagePart]);

    // Check for valid response and generated image parts
    if (
      !result.response.candidates ||
      result.response.candidates.length === 0
    ) {
      throw new Error("AI did not generate an image.");
    }

    // The generated image data is typically in the first candidate's content parts
    const generatedImagePart = result.response.candidates[0].content.parts.find(
      (p) => p.inlineData && p.inlineData.mimeType.startsWith("image/")
    );

    if (!generatedImagePart) {
      throw new Error("AI response did not contain an image data part.");
    }

    const generatedImageBase64 = generatedImagePart.inlineData.data;
    const generatedImageBuffer = Buffer.from(generatedImageBase64, "base64");

    console.log("Image generated successfully by AI");

    // 4. ***RESPONSE CHANGE: Send the newly generated image buffer***
    res.setHeader("Content-Type", "image/jpeg"); // Assuming the generated image is JPEG
    res.send(generatedImageBuffer);
  } catch (error) {
    console.error("Error generating product image:", error);
    res.status(500).json({
      error: "Failed to generate new image",
      details: error.message,
    });
  }
};

module.exports = { generateProductImage }; // Export the new function name
