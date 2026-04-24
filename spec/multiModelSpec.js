const {
  generateMultiModelReplies,
  generateSingleModelReply
} = require("../server/chatService");

describe("Multi-Model Chat Service Unit Tests", function () {
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 300000;

  it("should return an array when querying multiple models", async function () {
    const responses = await generateMultiModelReplies({
      message: "say hi",
      history: [],
      language: "english",
      agentMode: false
    });

    expect(Array.isArray(responses)).toBeTrue();
  });

  it("should return responses from two models", async function () {
    const responses = await generateMultiModelReplies({
      message: "say hi",
      history: [],
      language: "english",
      agentMode: false
    });

    expect(responses.length).toBe(2);
  });

  it("each model response should include a model name", async function () {
    const responses = await generateMultiModelReplies({
      message: "say hi",
      history: [],
      language: "english",
      agentMode: false
    });

    responses.forEach((response) => {
      expect(response.model).toBeDefined();
      expect(typeof response.model).toBe("string");
    });
  });

  it("single model response should only use the selected model", async function () {
    const response = await generateSingleModelReply({
      model: "qwen3.5:4b",
      message: "say hi",
      history: [],
      language: "english",
      agentMode: false
    });

    expect(response.model).toBe("qwen3.5:4b");
  });
});