function selectResponse(responses, selectedIndex) {
  if (!Array.isArray(responses)) {
    throw new Error("Responses must be an array.");
  }

  if (
    !Number.isInteger(selectedIndex) ||
    selectedIndex < 0 ||
    selectedIndex >= responses.length
  ) {
    throw new Error("Invalid selected response index.");
  }

  return responses[selectedIndex];
}

module.exports = { selectResponse };