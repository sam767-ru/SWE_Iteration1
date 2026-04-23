function buildSavedResponse({ userId, prompt, responseText, llmName }) {
  return {
    user_id: userId,
    prompt,
    response_text: responseText,
    llm_name: llmName
  };
}

module.exports = { buildSavedResponse };
