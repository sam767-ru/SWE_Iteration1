const { selectResponse } = require("../selection");

describe("selectResponse", () => {
  it("selects the response at the given index", () => {
    const responses = [
      { llm: "model-a", text: "Answer A" },
      { llm: "model-b", text: "Answer B" }
    ];

    const selected = selectResponse(responses, 1);

    expect(selected.llm).toBe("model-b");
    expect(selected.text).toBe("Answer B");
  });

  it("throws an error if responses is not an array", () => {
    expect(() => selectResponse(null, 0)).toThrowError("Responses must be an array.");
  });

  it("throws an error for an invalid index", () => {
    const responses = [{ llm: "model-a", text: "Answer A" }];

    expect(() => selectResponse(responses, 5)).toThrowError(
  "Invalid selected response index."
);
  });
});