function selectResponse(responses, selectedIndex) {
  return responses.map((item, index) => ({
    ...item,
    selected: index === selectedIndex
  }));
}

module.exports = { selectResponse };
