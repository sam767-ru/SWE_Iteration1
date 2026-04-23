const { selectResponse } = require("../selection");

describe("selectResponse", () => {
  it("should mark the chosen response as selected", () => {
    const responses = [
      { llm: "Llama 3.2 (1B)", text: "First response" },
      { llm: "Qwen 2.5 (0.5B)", text: "Second response" }
    ];

    const updated = selectResponse(responses, 1);

    expect(updated[0].selected).toBeFalse();
    expect(updated[1].selected).toBeTrue();
  });

  it("should only allow one selected response", () => {
    const responses = [
      { llm: "Llama 3.2 (1B)", text: "First response" },
      { llm: "Qwen 2.5 (0.5B)", text: "Second response" },
      { llm: "Extra Model", text: "Third response" }
    ];

    const updated = selectResponse(responses, 2);
    const selectedCount = updated.filter((r) => r.selected).length;

    expect(selectedCount).toBe(1);
    expect(updated[2].selected).toBeTrue();
  });

  it("should unselect previous selections when a new one is chosen", () => {
    const responses = [
      { llm: "A", text: "One", selected: true },
      { llm: "B", text: "Two", selected: false }
    ];

    const updated = selectResponse(responses, 1);

    expect(updated[0].selected).toBeFalse();
    expect(updated[1].selected).toBeTrue();
  });
});
