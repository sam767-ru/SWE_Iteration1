const { generateMultipleChatReplies } = require("../server/chatService");

describe("Multi-response system", () => {
  it("should return multiple responses", async () => {
    const responses = await generateMultipleChatReplies({
      message: "hello",
      language: "english",
      agentMode: false
    });

    expect(responses.length).toBeGreaterThan(1);
  });
});