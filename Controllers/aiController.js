const cloudinary = require("cloudinary").v2;
const { GoogleGenerativeAI } = require("@google/generative-ai");

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
      3. Longueur: 150-250 mots maximum
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

const generateProductImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided" });
    }

    // Upload to Cloudinary first
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: "product-enhancement" },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(req.file.buffer);
    });

    const enhancedUrl = cloudinary.url(uploadResult.public_id, {
      effect:
        "gen_background_replace:prompt_professional product photography studio",
      quality: "auto:best",
      fetch_format: "auto",
    });

    const response = await fetch(enhancedUrl);
    const imageBuffer = await response.arrayBuffer();

    res.setHeader("Content-Type", "image/jpeg");
    res.send(Buffer.from(imageBuffer));
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { generateProductImage, generateProductDescription };
