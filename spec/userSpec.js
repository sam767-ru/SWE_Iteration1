const {
  getFallbackReply,
  generateChatReply
} = require("../server/chatService");

describe("Chat service", () => {
  describe("getFallbackReply", () => {
    it("returns a greeting response for hello", () => {
      const reply = getFallbackReply("hello", "english", false);
      expect(reply.toLowerCase()).toContain("hello");
    });

    it("returns a recipe-related response", () => {
      const reply = getFallbackReply("Can you give me a recipe?", "english", false);
      expect(reply.toLowerCase()).toContain("recipe");
    });

    it("returns a homework-related response", () => {
      const reply = getFallbackReply("Help me with homework", "english", false);
      expect(reply.toLowerCase()).toContain("homework");
    });

    it("returns a coding-related response", () => {
      const reply = getFallbackReply("Help me debug my javascript code", "english", false);
      expect(reply.toLowerCase()).toContain("coding");
    });

    it("returns a more detailed response in agentic mode", () => {
      const reply = getFallbackReply("Help me with math", "english", true);
      expect(reply.length).toBeGreaterThan(40);
    });

    it("returns a Spanish response when language is spanish", () => {
      const reply = getFallbackReply("hello", "spanish", false);
      expect(reply.toLowerCase()).toContain("hola");
    });

    it("returns a French response when language is french", () => {
      const reply = getFallbackReply("hello", "french", false);
      expect(reply.toLowerCase()).toContain("bonjour");
    });

    it("returns a message asking for input when the message is empty", () => {
      const reply = getFallbackReply("", "english", false);
      expect(reply.toLowerCase()).toContain("please enter");
    });
  });

  describe("generateChatReply", () => {
    it("falls back to local logic when no API key is set", async () => {
      const oldApiKey = process.env.LLM_API_KEY;
      const oldApiUrl = process.env.LLM_API_URL;

      delete process.env.LLM_API_KEY;
      delete process.env.LLM_API_URL;

      const reply = await generateChatReply({
        message: "hello",
        language: "english",
        agentMode: false
      });

      expect(typeof reply).toBe("string");
      expect(reply.length).toBeGreaterThan(0);

      process.env.LLM_API_KEY = oldApiKey;
      process.env.LLM_API_URL = oldApiUrl;
    });

    it("throws an error for an empty message", async () => {
      await expectAsync(
        generateChatReply({
          message: "",
          language: "english",
          agentMode: false
        })
      ).toBeRejectedWithError("Message cannot be empty.");
    });
  });
});