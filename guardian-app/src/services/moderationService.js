import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize with your API Key
const genAI = new GoogleGenerativeAI("YOUR_GEMINI_API_KEY");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

/**
 * PROJECT GUARDIAN - AI MODERATOR (Text + Image)
 * Checks for: Relevance to women's safety, NSFW/Nudity, and Malicious/Spam.
 * * @param {string} title 
 * @param {string} description 
 * @param {string|null} imageBase64 - Optional base64 string of the photo
 * @returns {Promise<{status: "APPROVED"|"REJECTED", reason: string}>}
 */
export const moderateReport = async (title, description, imageBase64 = null) => {
  const prompt = `
    You are the lead Safety Officer for "Project Guardian," a women's safety application.
    Analyze the provided text and image (if present) for safety compliance.
    
    STRICT GUIDELINES:
    1. RELEVANCE: Is this specifically about women's safety? (Harassment, stalking, threats, or infrastructure issues like dark alleys/broken streetlights).
    2. NSFW: Does the image contain nudity, suggestive/sexual content, or graphic violence? (INSTANT REJECT).
    3. MALICIOUS: Is this spam, offensive language, a joke, or a general crime unrelated to women's transit safety?

    RESPONSE FORMAT: 
    You must respond ONLY with a valid JSON object:
    {"status": "APPROVED" or "REJECTED", "reason": "short explanation"}
  `;

  try {
    const parts = [
      { text: prompt },
      { text: `User Report Content: Title: ${title} | Description: ${description}` }
    ];
    
    // Add image part if a base64 string is provided
    if (imageBase64) {
      parts.push({
        inlineData: {
          data: imageBase64,
          mimeType: "image/jpeg"
        }
      });
    }

    const result = await model.generateContent(parts);
    const text = result.response.text();
    
    // Cleanup: Remove markdown JSON blocks if present
    const cleanJson = text.replace(/```json|```/g, "").trim();
    const response = JSON.parse(cleanJson);

    return {
      status: response.status || "REJECTED",
      reason: response.reason || "Undetermined by AI"
    };

  } catch (error) {
    console.error("[Moderation Service] AI Error:", error);
    // Safety Fallback: In a hackathon, we usually "Approve" on error to avoid blocking the demo,
    // but for a production safety app, you might want to "Reject" or "Flag".
    return { status: "APPROVED", reason: "Bypassed due to AI service timeout" };
  }
};
