const {
  generateChatReply,
  getFallbackReply
} = require("../server/chatService");

describe("Iteration 3 Chat Service Tests", () => {
  it("returns GPT prefix when GPT model is selected", async () => {
    const reply = await generateChatReply({
      message: "Help me with math",
      language: "english",
      model: "gpt",
      agentMode: false
    });

    expect(reply).toContain("[GPT]");
  });

  it("returns Gemini prefix when Gemini model is selected", async () => {
    const reply = await generateChatReply({
      message: "What is the weather?",
      language: "english",
      model: "gemini",
      agentMode: false
    });

    expect(reply).toContain("[Gemini]");
  });

  it("returns Claude prefix when Claude model is selected", async () => {
    const reply = await generateChatReply({
      message: "Explain recursion",
      language: "english",
      model: "claude",
      agentMode: false
    });

    expect(reply).toContain("[Claude]");
  });

  it("rejects an invalid model selection", async () => {
    await expectAsync(
      generateChatReply({
        message: "Hello",
        language: "english",
        model: "invalidModel",
        agentMode: false
      })
    ).toBeRejectedWithError("Invalid model selected.");
  });

  it("detects math questions in fallback logic", () => {
    const reply = getFallbackReply("Can you help me with math?", "english", false);
    expect(reply.toLowerCase()).toContain("math");
  });

  it("handles weather questions using fallback logic", () => {
    const reply = getFallbackReply("What is the weather today?", "english", false);
    expect(reply).toBeDefined();
    expect(reply.length).toBeGreaterThan(0);
  });
});