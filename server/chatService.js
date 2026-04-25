const https = require("https");

function localize(text, language) {
  const translations = {
    spanish: {
      "Please enter a message.": "Por favor, escribe un mensaje.",
      "Hello! How can I help you today?": "¡Hola! ¿Cómo puedo ayudarte hoy?",
      "I can help with recipes. Tell me what ingredients you have.":
        "Puedo ayudarte con recetas. Dime qué ingredientes tienes.",
      "I can help with homework. Send me the subject and exact problem.":
        "Puedo ayudarte con tareas. Envíame la materia y el problema exacto.",
      "I can help with coding. Tell me the language and the issue.":
        "Puedo ayudarte con programación. Dime el lenguaje y el problema.",
      "I can help with math. Send the exact problem.":
        "Puedo ayudarte con matemáticas. Envíame el problema exacto.",
      "I can help with writing. Paste your draft and tell me what to improve.":
        "Puedo ayudarte con escritura. Pega tu borrador y dime qué quieres mejorar.",
      "I can help plan a trip. Tell me where you want to go and your budget.":
        "Puedo ayudarte a planear un viaje. Dime a dónde quieres ir y tu presupuesto.",
      "I can help with fitness. Tell me your goal and experience level.":
        "Puedo ayudarte con fitness. Dime tu objetivo y tu nivel de experiencia.",
      "I can help brainstorm project ideas. Tell me your topic or constraints.":
        "Puedo ayudarte a generar ideas para proyectos. Dime tu tema o restricciones.",
      "I can explain concepts. Tell me what term or topic you want explained.":
        "Puedo explicar conceptos. Dime qué término o tema quieres entender.",
      "I can help summarize text. Paste the text you want summarized.":
        "Puedo ayudarte a resumir texto. Pega el texto que quieres resumir.",
      "I can help write emails or resumes. Tell me what kind of document you need.":
        "Puedo ayudarte a escribir correos o currículums. Dime qué tipo de documento necesitas.",
      "I can help with planning and productivity. Tell me what you are trying to organize.":
        "Puedo ayudarte con planificación y productividad. Dime qué estás tratando de organizar.",
      "I can help with that. Tell me more about what you need.":
        "Puedo ayudarte con eso. Cuéntame más sobre lo que necesitas."
    },
    french: {
      "Please enter a message.": "Veuillez entrer un message.",
      "Hello! How can I help you today?": "Bonjour ! Comment puis-je vous aider aujourd'hui ?",
      "I can help with recipes. Tell me what ingredients you have.":
        "Je peux vous aider avec des recettes. Dites-moi quels ingrédients vous avez.",
      "I can help with homework. Send me the subject and exact problem.":
        "Je peux vous aider pour les devoirs. Envoyez-moi la matière et le problème exact.",
      "I can help with coding. Tell me the language and the issue.":
        "Je peux vous aider en programmation. Dites-moi le langage et le problème.",
      "I can help with math. Send the exact problem.":
        "Je peux vous aider en mathématiques. Envoyez le problème exact.",
      "I can help with writing. Paste your draft and tell me what to improve.":
        "Je peux vous aider en rédaction. Collez votre brouillon et dites-moi quoi améliorer.",
      "I can help plan a trip. Tell me where you want to go and your budget.":
        "Je peux vous aider à planifier un voyage. Dites-moi où vous voulez aller et votre budget.",
      "I can help with fitness. Tell me your goal and experience level.":
        "Je peux vous aider pour le fitness. Dites-moi votre objectif et votre niveau.",
      "I can help brainstorm project ideas. Tell me your topic or constraints.":
        "Je peux vous aider à trouver des idées de projet. Donnez-moi votre sujet ou vos contraintes.",
      "I can explain concepts. Tell me what term or topic you want explained.":
        "Je peux expliquer des concepts. Dites-moi quel terme ou sujet vous voulez comprendre.",
      "I can help summarize text. Paste the text you want summarized.":
        "Je peux vous aider à résumer un texte. Collez le texte à résumer.",
      "I can help write emails or resumes. Tell me what kind of document you need.":
        "Je peux vous aider à rédiger des e-mails ou des CV. Dites-moi quel document vous voulez.",
      "I can help with planning and productivity. Tell me what you are trying to organize.":
        "Je peux vous aider avec l'organisation et la productivité. Dites-moi ce que vous essayez d'organiser.",
      "I can help with that. Tell me more about what you need.":
        "Je peux vous aider avec cela. Dites-m'en plus sur ce dont vous avez besoin."
    }
  };

  return translations[language]?.[text] || text;
}

function getCurrentTime() {
  const now = new Date();

  return now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

function detectIntent(message) {
  const lower = String(message || "").toLowerCase();

  if (["hello", "hi", "hey", "good morning", "good evening"].some(k => lower.includes(k))) {
    return "greeting";
  }

  if (["recipe", "cook", "meal", "dinner", "lunch", "breakfast", "ingredients"].some(k => lower.includes(k))) {
    return "recipe";
  }

  if (["homework", "assignment", "study", "quiz", "exam", "school"].some(k => lower.includes(k))) {
    return "homework";
  }

  if (["code", "programming", "bug", "debug", "javascript", "python", "java", "html", "css", "node"].some(k => lower.includes(k))) {
    return "coding";
  }

  if (["math", "algebra", "calculus", "equation", "matrix", "probability", "derivative", "integral"].some(k => lower.includes(k))) {
    return "math";
  }

  if (["essay", "rewrite", "paragraph", "grammar", "writing"].some(k => lower.includes(k))) {
    return "writing";
  }

  if (["email", "resume", "cover letter"].some(k => lower.includes(k))) {
    return "career_writing";
  }

  if (["travel", "trip", "vacation", "flight", "hotel"].some(k => lower.includes(k))) {
    return "travel";
  }

  if (["workout", "fitness", "gym", "exercise", "diet"].some(k => lower.includes(k))) {
    return "fitness";
  }

  if (["project", "idea", "brainstorm", "capstone"].some(k => lower.includes(k))) {
    return "brainstorming";
  }

  if (["what is", "explain", "definition", "meaning"].some(k => lower.includes(k))) {
    return "explanation";
  }

  if (["summarize", "summary", "shorten this"].some(k => lower.includes(k))) {
    return "summarization";
  }

  if (["schedule", "plan", "organize", "productivity", "time management"].some(k => lower.includes(k))) {
    return "planning";
  }

  if (["time", "current time", "what time"].some(k => lower.includes(k)))
    return "time";

  if (["weather", "temperature", "forecast"].some(k => lower.includes(k)))
    return "weather";

  return "general";
}

function getSimpleReply(intent, language) {
  const replies = {
    greeting: "Hello! How can I help you today?",
    recipe: "I can help with recipes. Tell me what ingredients you have.",
    homework: "I can help with homework. Send me the subject and exact problem.",
    coding: "I can help with coding. Tell me the language and the issue.",
    math: "I can help with math. Send the exact problem.",
    writing: "I can help with writing. Paste your draft and tell me what to improve.",
    career_writing: "I can help write emails or resumes. Tell me what kind of document you need.",
    travel: "I can help plan a trip. Tell me where you want to go and your budget.",
    fitness: "I can help with fitness. Tell me your goal and experience level.",
    brainstorming: "I can help brainstorm project ideas. Tell me your topic or constraints.",
    explanation: "I can explain concepts. Tell me what term or topic you want explained.",
    summarization: "I can help summarize text. Paste the text you want summarized.",
    planning: "I can help with planning and productivity. Tell me what you are trying to organize.",
    general: "I can help with that. Tell me more about what you need.",
    time: `The current time is ${getCurrentTime()}.`,
    weather: "I can check the weather. Tell me the city you want the forecast for."
  };

  return localize(replies[intent] || replies.general, language);
}

function getDetailedReply(intent, message, language) {
  const replies = {
    greeting:
      "Hello! I can help with questions, studying, coding, planning, writing, and more. Tell me what you need and I’ll try to guide you clearly.",
    recipe:
      "I can help you build a recipe step by step. Tell me your ingredients, dietary restrictions, cooking time, and what kind of meal you want, and I can suggest a simple dish.",
    homework:
      "I can help with schoolwork in a more detailed way. Tell me the course, the exact problem, and whether you want a hint, step-by-step reasoning, or a full explanation.",
    coding:
      "I can help debug or explain code. Tell me the programming language, what you are trying to build, what is going wrong, and paste any code or error messages you have.",
    math:
      "I can help solve math problems step by step. Send the exact equation or problem, and I can explain the method clearly instead of only giving the final answer.",
    writing:
      "I can help improve writing in a more detailed way. Paste your draft and tell me whether you want help with clarity, grammar, organization, tone, or expansion.",
    career_writing:
      "I can help with professional writing such as emails, resumes, and cover letters. Tell me the purpose, the audience, and the tone you want, and I can draft something useful.",
    travel:
      "I can help plan a trip in more detail. Tell me where you are going, your budget, how long you are staying, and what kinds of activities you enjoy.",
    fitness:
      "I can help with a workout or fitness plan. Tell me your goal, experience level, schedule, and equipment, and I can suggest a simple structure.",
    brainstorming:
      "I can help brainstorm ideas in a more descriptive way. Tell me the project type, requirements, budget, or constraints, and I can suggest several directions.",
    explanation:
      `I can explain that in more detail. Tell me exactly what concept or term you want explained, and I can break it into simple parts with examples.`,
    summarization:
      "I can summarize text in a more useful way. Paste the text and tell me whether you want a short summary, bullet points, or key takeaways.",
    planning:
      "I can help you organize a schedule or plan. Tell me what you are trying to manage, your deadlines, and your priorities, and I can help structure it clearly.",
    general:
      `I can help with your request: "${message}". Give me a bit more detail about what you want, and I can provide a clearer and more useful answer.`,
    time:
      `The current system time is ${getCurrentTime()}. If you need help scheduling tasks or planning your day, I can also help organize your time.`,
    weather:
      `I can help you check the weather forecast. Tell me the city or location you want, and I can provide temperature, conditions, and forecast details.`
  };

  return localize(replies[intent] || replies.general, language);
}

function getFallbackReply(message, language = "english", agentMode = false) {
  const userMessage = String(message || "").trim();

  if (!userMessage) {
    return localize("Please enter a message.", language);
  }

  const intent = detectIntent(userMessage);

  if (agentMode) {
    return getDetailedReply(intent, userMessage, language);
  }

  return getSimpleReply(intent, language);
}

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

    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error("AI provider request timed out."));
    });

    req.on("error", reject);
    req.write(JSON.stringify(body));
    req.end();
  });
}

function buildSystemPrompt(language = "english", agentMode = false) {
  const languageInstruction =
    language === "spanish"
      ? "Respond in Spanish."
      : language === "french"
      ? "Respond in French."
      : "Respond in English.";

  const behaviorInstruction = agentMode
    ? "You are in agentic mode. Give a descriptive, detailed answer. Break the response into clear steps when helpful. Ask a clarifying question only if the request is too vague."
    : "Give a short, simple, direct answer that is easy for a student to understand.";

  return `${languageInstruction} ${behaviorInstruction}`;
}
function buildMessages({ message, history = [], language, agentMode }) {
  const systemPrompt = buildSystemPrompt(language, agentMode);

  const messages = [
    { role: "system", content: systemPrompt }
  ];

  for (const item of history) {
    if (item.sender === "user") {
      messages.push({ role: "user", content: item.content || item.text });
    } else if (item.sender === "bot") {
      messages.push({ role: "assistant", content: item.content || item.text });
    }
  }

  messages.push({ role: "user", content: message });

  return messages;
}

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
async function generateMultipleChatReplies({ message, language, agentMode }) {
  const userMessage = String(message || "").trim();

  if (!userMessage) {
    throw new Error("Message cannot be empty.");
  }

  const intent = detectIntent(userMessage);

  return [
    {
      model_name: "LLM 1",
      response_text: getSimpleReply(intent, language)
    },
    {
      model_name: "LLM 2",
      response_text: getDetailedReply(intent, userMessage, language)
    }
  ];
}
module.exports = {
  generateChatReply,
  generateMultipleChatReplies,
  getFallbackReply
};