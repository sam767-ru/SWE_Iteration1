const https = require("https");

/**
 * Fallback local response generator.
 * Used when no real AI provider is configured yet.
 */
function getFallbackReply(message, language = "english", agentMode = false) {
  const userMessage = String(message || "").trim();

  if (!userMessage) {
    return "Please enter a message.";
  }

  if (agentMode) {
    if (language === "spanish") {
      return "Modo agéntico activado. ¿Cuál es el objetivo específico que quieres lograr?";
    }

    if (language === "french") {
      return "Mode agentique activé. Quel est l'objectif précis que vous voulez atteindre ?";
    }

    return "Agentic mode is enabled. What specific goal are you trying to accomplish?";
  }

  const lower = userMessage.toLowerCase();

  if (lower.includes("hello") || lower.includes("hi")) {
    return language === "spanish"
      ? "¡Hola! ¿Cómo puedo ayudarte hoy?"
      : language === "french"
      ? "Bonjour ! Comment puis-je vous aider aujourd'hui ?"
      : "Hello! How can I help you today?";
  }

  if (lower.includes("recipe")) {
    return language === "spanish"
      ? "Claro. Dime qué ingredientes tienes y te sugiero una receta."
      : language === "french"
      ? "Bien sûr. Dites-moi quels ingrédients vous avez et je vous proposerai une recette."
      : "Sure. Tell me what ingredients you have, and I can suggest a recipe.";
  }

  if (lower.includes("homework") || lower.includes("assignment")) {
    return language === "spanish"
      ? "Puedo ayudarte con la tarea. ¿Qué materia o problema estás estudiando?"
      : language === "french"
      ? "Je peux vous aider avec vos devoirs. Sur quelle matière ou quel problème travaillez-vous ?"
      : "I can help with homework. What class or problem are you working on?";
  }

  if (lower.includes("code") || lower.includes("programming")) {
    return language === "spanish"
      ? "Puedo ayudarte con programación. Dime el lenguaje y el problema que quieres resolver."
      : language === "french"
      ? "Je peux vous aider en programmation. Dites-moi le langage et le problème à résoudre."
      : "I can help with coding. Tell me the language and the problem you want to solve.";
  }

  if (language === "spanish") {
    return `Entiendo tu pregunta: "${userMessage}". Puedo ayudarte con preguntas generales, tareas, programación, recetas y planificación.`;
  }

  if (language === "french") {
    return `Je comprends votre question : "${userMessage}". Je peux vous aider avec des questions générales, les devoirs, la programmation, les recettes et la planification.`;
  }

  return `I understand your question: "${userMessage}". I can help with general questions, homework, coding, recipes, and planning.`;
}

/**
 * Small helper to call an external chat API using HTTPS.
 * This is vendor-agnostic in structure, but the example payload
 * is shaped for a chat-completions style API.
 */
function postJson(url, headers, body) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);

    const req = https.request(
      {
        hostname: parsed.hostname,
        path: parsed.pathname + parsed.search,
        method: "POST",
        port: parsed.port || 443,
        headers: {
          "Content-Type": "application/json",
          ...headers
        }
      },
      (res) => {
        let data = "";

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          try {
            const json = JSON.parse(data);
            resolve({ status: res.statusCode, data: json });
          } catch (error) {
            reject(new Error("Failed to parse AI provider response."));
          }
        });
      }
    );

    req.on("error", reject);
    req.write(JSON.stringify(body));
    req.end();
  });
}

/**
 * Builds a system prompt based on current UI controls.
 */
function buildSystemPrompt(language = "english", agentMode = false) {
  const languageInstruction =
    language === "spanish"
      ? "Respond in Spanish."
      : language === "french"
      ? "Respond in French."
      : "Respond in English.";

  const behaviorInstruction = agentMode
    ? "You are in agentic mode. Ask clarifying follow-up questions when needed before solving the user's request."
    : "Answer the user's question directly and helpfully.";

  return `${languageInstruction} ${behaviorInstruction} Keep answers clear, concise, and useful for a student web app.`;
}

/**
 * Main function the route will call.
 * If AI env vars exist, it uses the external provider.
 * Otherwise it falls back to local logic.
 */
async function generateChatReply({ message, language, agentMode }) {
  const userMessage = String(message || "").trim();

  if (!userMessage) {
    throw new Error("Message cannot be empty.");
  }

  const apiKey = process.env.LLM_API_KEY;
  const apiUrl = process.env.LLM_API_URL;
  const model = process.env.LLM_MODEL || "default-model";

  if (!apiKey || !apiUrl) {
    return getFallbackReply(userMessage, language, agentMode);
  }

  const systemPrompt = buildSystemPrompt(language, agentMode);

  const payload = {
    model,
    messages: [
      {
        role: "system",
        content: systemPrompt
      },
      {
        role: "user",
        content: userMessage
      }
    ],
    temperature: 0.7
  };

  const response = await postJson(
    apiUrl,
    {
      Authorization: `Bearer ${apiKey}`
    },
    payload
  );

  if (!response.status || response.status >= 400) {
    throw new Error("AI provider returned an error.");
  }

  // Chat-completions style parsing
  const reply =
    response.data?.choices?.[0]?.message?.content ||
    response.data?.reply ||
    response.data?.output ||
    null;

  if (!reply) {
    throw new Error("AI provider returned no usable reply.");
  }

  return reply.trim();
}

module.exports = {
  generateChatReply,
  getFallbackReply
};