import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

/**
 * Ask Gemini AI a question with optional context
 * @param question - The user's question
 * @param context - Optional context for RAG (Retrieval Augmented Generation)
 * @returns AI-generated answer
 */
export async function askGemini(question: string, context?: string) {
  // Use gemini-2.0-flash-exp or gemini-1.5-pro
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
  
  // System prompt for environmental law assistant
  const systemPrompt =
    "You are GreenLaw AI, an expert assistant for environmental law and policy. " +
    "Always provide accurate, well-researched answers grounded in the provided context. " +
    "Maintain a professional, helpful tone.\n\n" +
    "CRITICAL - CITATION FORMAT (YOU MUST FOLLOW THIS EXACTLY):\n" +
    "1. ALWAYS cite sources using this exact format: [Citation Name]^[Number]\n" +
    "   - Example: Directive 2010/75/EU^[1] or Case C-59/89^[2]\n" +
    "   - Use square brackets [] around citation name\n" +
    "   - Use caret ^ followed by [number]\n" +
    "2. ALWAYS end your response with '## References' section\n" +
    "3. List ALL references as: [Number] Full citation text\n\n" +
    "EXAMPLE OF REQUIRED FORMAT:\n" +
    "The Industrial Emissions Directive 2010/75/EU^[1] establishes the framework for controlling emissions. " +
    "This was further clarified in Case C-59/89^[2].\n\n" +
    "## References\n" +
    "[1] Directive 2010/75/EU of the European Parliament and of the Council of 24 November 2010 on industrial emissions.\n" +
    "[2] Case C-59/89, Commission v Germany (1991) ECR I-2607.\n\n" +
    "DO NOT deviate from this format. Every legal reference MUST use the [Name]^[Number] format.";

  // Build the full prompt
  const parts = [
    systemPrompt,
    context ? `Context:\n${context}` : "",
    `Question:\n${question}`
  ].filter(Boolean);
  
  const prompt = parts.join("\n\n");

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini API error:", error);
    throw new Error("Failed to generate response from Gemini");
  }
}
