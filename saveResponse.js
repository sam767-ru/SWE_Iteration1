async function saveSelectedResponse(dbRun, {
  userId,
  chatId,
  prompt,
  responseText,
  llmName
}) {
  if (!userId || !chatId || !prompt || !responseText || !llmName) {
    throw new Error("Missing required save response fields.");
  }

  await dbRun(
    `
      INSERT INTO saved_responses (user_id, prompt, response_text, llm_name)
      VALUES (?, ?, ?, ?)
    `,
    [userId, prompt, responseText, llmName]
  );

  await dbRun(
    `
      UPDATE chats
      SET selected_model = ?
      WHERE id = ? AND user_id = ?
    `,
    [llmName, chatId, userId]
  );

  await dbRun(
    `
      INSERT INTO messages (chat_id, sender, content)
      VALUES (?, ?, ?)
    `,
    [chatId, "bot", responseText]
  );

  return {
    success: true,
    selectedModel: llmName
  };
}

module.exports = { saveSelectedResponse };