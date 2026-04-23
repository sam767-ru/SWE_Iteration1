const { getFallbackReply } = require("../server/chatService");

describe("chatService fallback replies", () => {
  it("should return an error message for empty input", () => {
    const result = getFallbackReply("", "english", false);
    expect(result).toBe("Please enter a message.");
  });

  it("should return a greeting reply in english", () => {
    const result = getFallbackReply("hello", "english", false);
    expect(result).toBe("Hello! How can I help you today?");
  });

  it("should return a localized greeting in spanish", () => {
    const result = getFallbackReply("hello", "spanish", false);
    expect(result).toBe("¡Hola! ¿Cómo puedo ayudarte hoy?");
  });

  it("should return a coding-related reply", () => {
    const result = getFallbackReply("I need help with javascript", "english", false);
    expect(result).toContain("coding");
  });

  it("should return a math-related reply", () => {
    const result = getFallbackReply("help me with calculus", "english", false);
    expect(result).toContain("math");
  });

  it("should return a more detailed response when agent mode is on", () => {
    const result = getFallbackReply("hello", "english", true);
    expect(result.length).toBeGreaterThan(30);
    expect(result).toContain("I can help");
  });

  it("should return a weather-related reply", () => {
    const result = getFallbackReply("weather forecast", "english", false);
    expect(result).toContain("weather");
  });

  it("should return a time-related reply", () => {
    const result = getFallbackReply("what time is it", "english", false);
    expect(result).toContain("The current time is");
  });
});
