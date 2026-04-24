const { saveSelectedResponse } = require("../saveResponse");

describe("saveSelectedResponse", () => {
  it("saves response, updates selected model, and inserts bot message", async () => {
    const calls = [];

    const fakeDbRun = async (sql, params) => {
      calls.push({ sql, params });
      return { lastID: 1 };
    };

    const result = await saveSelectedResponse(fakeDbRun, {
      userId: 1,
      chatId: 2,
      prompt: "Explain recursion",
      responseText: "Recursion is when a function calls itself.",
      llmName: "llama3.2"
    });

    expect(result.success).toBeTrue();
    expect(result.selectedModel).toBe("llama3.2");
    expect(calls.length).toBe(3);

    expect(calls[0].sql).toContain("INSERT INTO saved_responses");
    expect(calls[1].sql).toContain("UPDATE chats");
    expect(calls[2].sql).toContain("INSERT INTO messages");
  });

  it("throws an error when required fields are missing", async () => {
    const fakeDbRun = async () => ({});

    await expectAsync(
      saveSelectedResponse(fakeDbRun, {
        userId: 1,
        chatId: 2,
        prompt: "",
        responseText: "Answer",
        llmName: "llama3.2"
      })
   ).toBeRejectedWithError("Missing required save response fields.");
  });
});