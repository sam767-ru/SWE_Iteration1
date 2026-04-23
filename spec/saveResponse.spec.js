const { buildSavedResponse } = require("../saveResponse");

describe("buildSavedResponse", () => {
  it("should build the saved response object correctly", () => {
    const result = buildSavedResponse({
      userId: 1,
      prompt: "What is AI?",
      responseText: "AI is artificial intelligence.",
      llmName: "Llama 3.2 (1B)"
    });

    expect(result.user_id).toBe(1);
    expect(result.prompt).toBe("What is AI?");
    expect(result.response_text).toBe("AI is artificial intelligence.");
    expect(result.llm_name).toBe("Llama 3.2 (1B)");
  });

  it("should preserve the selected model name", () => {
    const result = buildSavedResponse({
      userId: 2,
      prompt: "Explain derivatives",
      responseText: "A derivative measures rate of change.",
      llmName: "Qwen 2.5 (0.5B)"
    });

    expect(result.llm_name).toBe("Qwen 2.5 (0.5B)");
  });

  it("should preserve the original prompt and selected response", () => {
    const result = buildSavedResponse({
      userId: 3,
      prompt: "What is recursion?",
      responseText: "Recursion is when a function calls itself.",
      llmName: "Llama 3.2 (1B)"
    });

    expect(result.prompt).toContain("recursion");
    expect(result.response_text).toContain("function calls itself");
  });
});
