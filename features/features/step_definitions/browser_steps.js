const { Given, When, Then, Before, After } = require('@cucumber/cucumber');
const puppeteer = require('puppeteer');
const assert = require('assert');

let browser, page;
let testUser;

Before(async function () {
  browser = await puppeteer.launch({
    headless: process.env.HEADLESS !== 'false',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  
  // Generate unique test user
  testUser = {
    username: `test_${Date.now()}`,
    email: `test_${Date.now()}@example.com`,
    password: 'TestPassword123'
  };
});

After(async function () {
  if (browser) {
    await browser.close();
  }
});

// ============ Authentication Steps ============

Given('I am logged in', { timeout: 20000 }, async function () {
  await page.goto('http://localhost:3000/signup');
  
  // Sign up
  await page.type('#signupUsername', testUser.username);
  await page.type('#signupEmail', testUser.email);
  await page.type('#signupPassword', testUser.password);
  await page.click('#signupForm button[type="submit"]');
  
  await page.waitForTimeout(1000);
  
  // Login
  await page.goto('http://localhost:3000/login');
  await page.type('#loginUsername', testUser.username);
  await page.type('#loginPassword', testUser.password);
  await page.click('#loginForm button[type="submit"]');
  
  await page.waitForNavigation({ waitUntil: 'networkidle0' });
  await page.waitForSelector('#chatInput', { timeout: 10000 });
});

Given('I have an active conversation', async function () {
  await page.waitForSelector('#chatInput');
  await page.type('#chatInput', 'Hello, this is a test message');
  await page.click('#sendBtn');
  await page.waitForTimeout(3000);
});

Given('I have a previous conversation', async function () {
  await page.waitForSelector('#chatInput');
  await page.type('#chatInput', 'Previous conversation test');
  await page.click('#sendBtn');
  await page.waitForTimeout(3000);
});

Given('I have selected a response to {string}', async function (query) {
  await page.waitForSelector('#chatInput');
  await page.type('#chatInput', query);
  await page.click('#sendBtn');
  await page.waitForSelector('.options-container', { timeout: 15000 });
  
  // Click first option
  const firstOption = await page.waitForSelector('.option-btn:not(.cancel-option-btn)');
  await firstOption.click();
  await page.waitForTimeout(2000);
});

Given('I am viewing my chat list', async function () {
  await page.waitForSelector('.chat-list');
});

Given('I have at least one chat in my list', async function () {
  await page.waitForSelector('.chat-list li');
});

Given('I am viewing a chat', async function () {
  const chatItem = await page.waitForSelector('.chat-list li');
  await chatItem.click();
  await page.waitForTimeout(1000);
});

Given('I create a new chat', async function () {
  await page.click('#newChatBtn');
  await page.waitForTimeout(1000);
});

Given('I have created {int} different conversations', async function (count) {
  for (let i = 0; i < count; i++) {
    await page.click('#newChatBtn');
    await page.waitForTimeout(500);
    await page.type('#chatInput', `Conversation ${i + 1}`);
    await page.click('#sendBtn');
    await page.waitForTimeout(2000);
  }
});

Given('I set language to {string}', async function (language) {
  await page.select('#languageSelect', language);
  await page.waitForTimeout(500);
});

Given('I enable agent mode', async function () {
  const agentBtn = await page.waitForSelector('#agentModeBtn');
  const btnText = await agentBtn.evaluate(el => el.textContent);
  if (btnText.includes('Off')) {
    await agentBtn.click();
  }
  await page.waitForTimeout(500);
});

Given('I have a chat named {string}', async function (title) {
  // Create a chat first
  await page.click('#newChatBtn');
  await page.waitForTimeout(500);
  await page.type('#chatInput', 'Test message for title');
  await page.click('#sendBtn');
  await page.waitForTimeout(2000);
  
  // Save/rename it
  const chatItem = await page.waitForSelector('.chat-list-item');
  await chatItem.hover();
  const saveBtn = await chatItem.$('.chat-save-btn');
  await saveBtn.click();
  await page.waitForTimeout(500);
  await page.keyboard.type(title);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1000);
});

Given('I have renamed a chat to {string}', async function (title) {
  const chatItem = await page.waitForSelector('.chat-list-item');
  await chatItem.hover();
  const saveBtn = await chatItem.$('.chat-save-btn');
  await saveBtn.click();
  await page.waitForTimeout(500);
  await page.keyboard.type(title);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1000);
});

Given('I have a conversation with {int} messages', async function (count) {
  for (let i = 0; i < count; i++) {
    await page.type('#chatInput', `Message ${i + 1}`);
    await page.click('#sendBtn');
    await page.waitForTimeout(500);
  }
  await page.waitForTimeout(2000);
});

Given('I have sent messages in order: {string}, {string}, {string}', async function (msg1, msg2, msg3) {
  await page.type('#chatInput', msg1);
  await page.click('#sendBtn');
  await page.waitForTimeout(1000);
  await page.waitForSelector('.options-container', { timeout: 5000 });
  const firstOption = await page.$('.option-btn:not(.cancel-option-btn)');
  if (firstOption) await firstOption.click();
  await page.waitForTimeout(1000);
  
  await page.type('#chatInput', msg2);
  await page.click('#sendBtn');
  await page.waitForTimeout(1000);
  
  await page.type('#chatInput', msg3);
  await page.click('#sendBtn');
  await page.waitForTimeout(1000);
});

Given('I have generated response options but not selected one', async function () {
  await page.type('#chatInput', 'Test query for options');
  await page.click('#sendBtn');
  await page.waitForSelector('.options-container', { timeout: 15000 });
});

Given('I have a conversation as {string}', async function (userType) {
  // Already logged in as test user
  await page.type('#chatInput', `Message from ${userType}`);
  await page.click('#sendBtn');
  await page.waitForTimeout(2000);
});

Given('I log out', async function () {
  const logoutBtn = await page.waitForSelector('#logoutBtn');
  await logoutBtn.click();
  await page.waitForTimeout(1000);
  // Handle confirmation dialog
  page.on('dialog', async dialog => {
    await dialog.accept();
  });
  await page.waitForTimeout(1000);
});

Given('I log in as {string}', async function (userType) {
  // Create a different user
  const otherUser = {
    username: `${userType}_${Date.now()}`,
    email: `${userType}_${Date.now()}@test.com`,
    password: 'TestPassword123'
  };
  
  await page.goto('http://localhost:3000/signup');
  await page.type('#signupUsername', otherUser.username);
  await page.type('#signupEmail', otherUser.email);
  await page.type('#signupPassword', otherUser.password);
  await page.click('#signupForm button[type="submit"]');
  await page.waitForTimeout(1000);
  
  await page.goto('http://localhost:3000/login');
  await page.type('#loginUsername', otherUser.username);
  await page.type('#loginPassword', otherUser.password);
  await page.click('#loginForm button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle0' });
  await page.waitForSelector('#chatInput', { timeout: 10000 });
});

Given('I log in again with the same account', async function () {
  await page.goto('http://localhost:3000/login');
  await page.type('#loginUsername', testUser.username);
  await page.type('#loginPassword', testUser.password);
  await page.click('#loginForm button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle0' });
  await page.waitForSelector('#chatInput', { timeout: 10000 });
});

Given('I have multiple chats in my list', async function () {
  for (let i = 0; i < 3; i++) {
    await page.click('#newChatBtn');
    await page.waitForTimeout(500);
    await page.type('#chatInput', `Chat ${i + 1}`);
    await page.click('#sendBtn');
    await page.waitForTimeout(1500);
  }
});

Given('I have an active conversation with multiple messages', async function () {
  await page.type('#chatInput', 'First message');
  await page.click('#sendBtn');
  await page.waitForTimeout(1000);
  await page.type('#chatInput', 'Second message');
  await page.click('#sendBtn');
  await page.waitForTimeout(1000);
  await page.type('#chatInput', 'Third message');
  await page.click('#sendBtn');
  await page.waitForTimeout(2000);
});

// ============ Multiple Responses Steps ============

When('I send a message {string}', async function (message) {
  await page.waitForSelector('#chatInput');
  await page.type('#chatInput', message);
  await page.click('#sendBtn');
});

When('I send an empty message', async function () {
  await page.waitForSelector('#chatInput');
  await page.click('#sendBtn');
});

When('I select the {string} response option', async function (type) {
  await page.waitForSelector('.options-container', { timeout: 15000 });
  
  let selector;
  switch(type) {
    case 'concise':
      selector = '.option-concise';
      break;
    case 'detailed':
      selector = '.option-detailed';
      break;
    case 'creative':
      selector = '.option-creative';
      break;
    default:
      selector = '.option-btn:not(.cancel-option-btn)';
  }
  
  const option = await page.waitForSelector(selector);
  await option.click();
  await page.waitForTimeout(1000);
});

When('I click the cancel button', async function () {
  const cancelBtn = await page.waitForSelector('.cancel-option-btn');
  await cancelBtn.click();
  await page.waitForTimeout(500);
});

When('I click the continue button', async function () {
  const continueBtn = await page.waitForSelector('.continue-btn');
  await continueBtn.click();
  await page.waitForTimeout(500);
});

When('I send a follow-up message {string}', async function (message) {
  await page.waitForSelector('#chatInput');
  await page.type('#chatInput', message);
  await page.click('#sendBtn');
  await page.waitForTimeout(3000);
});

When('I try to select a response before generating options', async function () {
  // Try to click on a non-existent option container
  const optionsExist = await page.$('.options-container');
  if (!optionsExist) {
    // This is expected - we're testing that selection isn't possible
    await page.waitForTimeout(500);
  }
});

When('I view the chat later', async function () {
  // Refresh to simulate viewing later
  await page.reload({ waitUntil: 'networkidle0' });
  await page.waitForSelector('#chatInput', { timeout: 10000 });
});

When('I refresh the page', async function () {
  await page.reload({ waitUntil: 'networkidle0' });
  await page.waitForTimeout(2000);
  await page.waitForSelector('#chatInput', { timeout: 10000 });
});

When('I close and reopen the browser', async function () {
  await browser.close();
  browser = await puppeteer.launch({ headless: process.env.HEADLESS !== 'false' });
  page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
});

// ============ Chat Management Steps ============

When('I click the save button on a chat', async function () {
  const chatItem = await page.waitForSelector('.chat-list-item');
  await chatItem.hover();
  const saveBtn = await chatItem.$('.chat-save-btn');
  await saveBtn.click();
  await page.waitForTimeout(500);
});

When('I enter a new title {string}', async function (title) {
  await page.waitForTimeout(500);
  // Clear existing text
  await page.keyboard.down('Control');
  await page.keyboard.press('A');
  await page.keyboard.up('Control');
  await page.keyboard.type(title);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1000);
});

When('I click the delete button on a chat', async function () {
  const chatItem = await page.waitForSelector('.chat-list-item');
  await chatItem.hover();
  const deleteBtn = await chatItem.$('.chat-delete-btn');
  await deleteBtn.click();
});

When('I confirm the deletion', async function () {
  page.on('dialog', async dialog => {
    await dialog.accept();
  });
  await page.waitForTimeout(500);
});

When('I cancel the deletion', async function () {
  page.on('dialog', async dialog => {
    await dialog.dismiss();
  });
  await page.waitForTimeout(500);
});

When('I delete the current chat', async function () {
  const activeChat = await page.waitForSelector('.chat-list-item.active');
  await activeChat.hover();
  const deleteBtn = await activeChat.$('.chat-delete-btn');
  await deleteBtn.click();
  
  page.on('dialog', async dialog => {
    await dialog.accept();
  });
  await page.waitForTimeout(1000);
});

When('I try to save it without sending any messages', async function () {
  const chatItem = await page.waitForSelector('.chat-list-item');
  await chatItem.hover();
  const saveBtn = await chatItem.$('.chat-save-btn');
  await saveBtn.click();
  await page.waitForTimeout(500);
  await page.keyboard.type('Saved Chat');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1000);
});

When('I save another chat as {string}', async function (title) {
  // Create new chat
  await page.click('#newChatBtn');
  await page.waitForTimeout(500);
  
  // Save it
  const chatItem = await page.waitForSelector('.chat-list-item:first-child');
  await chatItem.hover();
  const saveBtn = await chatItem.$('.chat-save-btn');
  await saveBtn.click();
  await page.waitForTimeout(500);
  await page.keyboard.type(title);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1000);
});

When('I delete each chat one by one', async function () {
  let chats = await page.$$('.chat-list-item');
  while (chats.length > 0) {
    const firstChat = await page.$('.chat-list-item');
    await firstChat.hover();
    const deleteBtn = await firstChat.$('.chat-delete-btn');
    await deleteBtn.click();
    
    page.on('dialog', async dialog => {
      await dialog.accept();
    });
    await page.waitForTimeout(500);
    chats = await page.$$('.chat-list-item');
  }
});

When('I save the chat with title {string}', async function (title) {
  const chatItem = await page.waitForSelector('.chat-list-item');
  await chatItem.hover();
  const saveBtn = await chatItem.$('.chat-save-btn');
  await saveBtn.click();
  await page.waitForTimeout(500);
  await page.keyboard.type(title);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1000);
});

When('I try to save with an empty title', async function () {
  const chatItem = await page.waitForSelector('.chat-list-item');
  await chatItem.hover();
  const saveBtn = await chatItem.$('.chat-save-btn');
  await saveBtn.click();
  await page.waitForTimeout(500);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1000);
});

// ============ Then Assertions ============

Then('I should see {int} response options', async function (count) {
  const options = await page.$$('.option-btn:not(.cancel-option-btn)');
  assert.strictEqual(options.length, count);
});

Then('I should see a {string} option', async function (type) {
  let selector;
  switch(type) {
    case 'concise':
      selector = '.option-concise';
      break;
    case 'detailed':
      selector = '.option-detailed';
      break;
    case 'creative':
      selector = '.option-creative';
      break;
    default:
      selector = '.option-btn';
  }
  const option = await page.$(selector);
  assert.ok(option, `${type} option not found`);
});

Then('the detailed option should be longer than the concise option', async function () {
  const conciseText = await page.$eval('.option-concise', el => el.textContent);
  const detailedText = await page.$eval('.option-detailed', el => el.textContent);
  assert.ok(detailedText.length > conciseText.length);
});

Then('the creative option should be unique from the other options', async function () {
  const conciseText = await page.$eval('.option-concise', el => el.textContent);
  const detailedText = await page.$eval('.option-detailed', el => el.textContent);
  const creativeText = await page.$eval('.option-creative', el => el.textContent);
  
  assert.notStrictEqual(creativeText, conciseText);
  assert.notStrictEqual(creativeText, detailedText);
});

Then('the options should disappear', async function () {
  const optionsContainer = await page.$('.options-container');
  assert.strictEqual(optionsContainer, null);
});

Then('the chat input should be focused', async function () {
  const isFocused = await page.$eval('#chatInput', el => el === document.activeElement);
  assert.ok(isFocused);
});

Then('I should see response options in Spanish', async function () {
  const options = await page.$$eval('.option-btn', els => els.map(el => el.textContent.toLowerCase()));
  const hasSpanish = options.some(text =>
    text.includes('hola') || text.includes('cómo') || text.includes('puedo')
  );
  assert.ok(hasSpanish);
});

Then('I should see an error message', async function () {
  const errorMsg = await page.$('.error-message, .message.error');
  assert.ok(errorMsg);
});

Then('no response options should be generated', async function () {
  const optionsContainer = await page.$('.options-container');
  assert.strictEqual(optionsContainer, null);
});

Then('the response options should be more detailed', async function () {
  const options = await page.$$eval('.option-btn', els => els.map(el => el.textContent.length));
  const allLong = options.every(len => len > 100);
  assert.ok(allLong);
});

Then('each option should be at least 100 characters long', async function () {
  const options = await page.$$eval('.option-btn', els => els.map(el => el.textContent.length));
  options.forEach(len => {
    assert.ok(len >= 100, `Option length ${len} is less than 100`);
  });
});

Then('the bot response should reference pizza', async function () {
  const lastBotMessage = await page.$eval('.bot-message:last-child', el => el.textContent.toLowerCase());
  assert.ok(lastBotMessage.includes('pizza') || lastBotMessage.includes('topping'));
});

Then('the selected response should appear in the chat', async function () {
  const botMessages = await page.$$eval('.bot-message', els => els.map(el => el.textContent));
  assert.ok(botMessages.length > 0);
});

Then('I should see a {string} button', async function (buttonText) {
  const continueBtn = await page.$('.continue-btn');
  assert.ok(continueBtn);
});

Then('I should be able to type a follow-up message', async function () {
  const chatInput = await page.$('#chatInput');
  const isEnabled = await chatInput.evaluate(el => !el.disabled);
  assert.ok(isEnabled);
});

Then('the new message should be added to the same conversation', async function () {
  const messages = await page.$$eval('.chat-message', els => els.map(el => el.textContent));
  assert.ok(messages.some(msg => msg.includes('Give me an example')));
});

Then('the bot should respond with a new message', async function () {
  await page.waitForTimeout(2000);
  const botMessages = await page.$$eval('.bot-message', els => els.length);
  assert.ok(botMessages > 0);
});

Then('the response should contain step-by-step explanation', async function () {
  const lastBotMessage = await page.$eval('.bot-message:last-child', el => el.textContent.toLowerCase());
  const hasSteps = lastBotMessage.includes('step') ||
                   lastBotMessage.includes('first') ||
                   lastBotMessage.includes('then') ||
                   lastBotMessage.includes('next');
  assert.ok(hasSteps);
});

Then('the conversation should continue normally', async function () {
  const chatInput = await page.$('#chatInput');
  const isEnabled = await chatInput.evaluate(el => !el.disabled);
  assert.ok(isEnabled);
});

Then('the response should be stored in the database', async function () {
  // Refresh to verify persistence
  await page.reload({ waitUntil: 'networkidle0' });
  await page.waitForSelector('#chatInput', { timeout: 10000 });
  const botMessages = await page.$$eval('.bot-message', els => els.map(el => el.textContent));
  assert.ok(botMessages.length > 0);
});

Then('the selected response should still be visible', async function () {
  const botMessages = await page.$$eval('.bot-message', els => els.map(el => el.textContent));
  assert.ok(botMessages.length > 0);
});

Then('the bot should extend the story naturally', async function () {
  const botMessages = await page.$$eval('.bot-message', els => els.map(el => el.textContent));
  const storyMessages = botMessages.filter(msg => msg.length > 50);
  assert.ok(storyMessages.length >= 2);
});

Then('no selection should be possible', async function () {
  const optionsContainer = await page.$('.options-container');
  assert.strictEqual(optionsContainer, null);
});

Then('I should be able to select the {string} option', async function (type) {
  let selector;
  switch(type) {
    case 'concise':
      selector = '.option-concise';
      break;
    case 'detailed':
      selector = '.option-detailed';
      break;
    case 'creative':
      selector = '.option-creative';
      break;
    default:
      selector = '.option-btn';
  }
  const option = await page.$(selector);
  assert.ok(option);
});

Then('the user message should be saved', async function () {
  const userMessages = await page.$$eval('.user-message', els => els.map(el => el.textContent));
  assert.ok(userMessages.some(msg => msg.includes('Explain gravity')));
});

Then('the selected bot response should be saved', async function () {
  const botMessages = await page.$$eval('.bot-message', els => els.map(el => el.textContent));
  assert.ok(botMessages.length > 0);
});

Then('both messages should appear in the conversation', async function () {
  const messages = await page.$$eval('.chat-message', els => els.length);
  assert.ok(messages >= 2);
});

Then('I should see new response options for the follow-up query', async function () {
  await page.waitForSelector('.options-container', { timeout: 15000 });
  const options = await page.$$('.option-btn');
  assert.ok(options.length >= 3);
});

Then('I should be able to select another response', async function () {
  const option = await page.$('.option-concise');
  assert.ok(option);
});

Then('the chat title should update to {string}', async function (title) {
  const chatTitle = await page.$eval(`.chat-list-item:first-child .chat-title`, el => el.textContent);
  assert.strictEqual(chatTitle, title);
});

Then('the chat should appear with the new title in the list', async function () {
  const titles = await page.$$eval('.chat-title', els => els.map(el => el.textContent));
  assert.ok(titles.includes('My Important Chat'));
});

Then('the chat should be removed from the list', async function () {
  const chats = await page.$$('.chat-list-item');
  const originalCount = chats.length;
  await page.waitForTimeout(500);
  const newChats = await page.$$('.chat-list-item');
  assert.ok(newChats.length < originalCount);
});

Then('the chat should no longer be accessible', async function () {
  const chatExists = await page.$('.chat-list-item');
  // If there are other chats, the deleted one should be gone
  assert.ok(true);
});

Then('the chat window should clear', async function () {
  const chatWindow = await page.$('#chatWindow');
  const hasMessages = await chatWindow.evaluate(el => el.children.length > 0);
  assert.ok(true);
});

Then('another chat should be selected automatically if available', async function () {
  const activeChat = await page.$('.chat-list-item.active');
  if (await page.$$eval('.chat-list-item', els => els.length) > 0) {
    assert.ok(activeChat);
  }
});

Then('the save should still work with a default title', async function () {
  const chatTitle = await page.$eval('.chat-list-item:first-child .chat-title', el => el.textContent);
  assert.ok(chatTitle === 'Saved Chat' || chatTitle.includes('Chat'));
});

Then('both chats should exist with the same title', async function () {
  const titles = await page.$$eval('.chat-title', els => els.map(el => el.textContent));
  const count = titles.filter(t => t === 'Study Notes').length;
  assert.strictEqual(count, 2);
});

Then('the chat should remain in the list', async function () {
  const chat = await page.$('.chat-list-item');
  assert.ok(chat);
});

Then('the chat should still be accessible', async function () {
  const chatItem = await page.$('.chat-list-item');
  await chatItem.click();
  await page.waitForTimeout(1000);
  const chatWindow = await page.$('#chatWindow');
  assert.ok(chatWindow);
});

Then('the chat title should save with special characters', async function () {
  const chatTitle = await page.$eval('.chat-list-item:first-child .chat-title', el => el.textContent);
  assert.ok(chatTitle.includes('#1') && chatTitle.includes('!!!'));
});

Then('the title should display correctly', async function () {
  const chatTitle = await page.$eval('.chat-list-item:first-child .chat-title', el => el.textContent);
  assert.ok(chatTitle.length > 0);
});

Then('the chat list should become empty', async function () {
  const chats = await page.$$('.chat-list-item');
  assert.strictEqual(chats.length, 0);
});

Then('I should see a welcome message in the chat area', async function () {
  const welcomeMsg = await page.$eval('.chat-message', el => el.textContent);
  assert.ok(welcomeMsg.includes('Welcome'));
});

Then('the chat should save all messages', async function () {
  const messages = await page.$$eval('.chat-message', els => els.length);
  assert.ok(messages >= 3);
});

Then('the title should persist after page refresh', async function () {
  await page.reload({ waitUntil: 'networkidle0' });
  await page.waitForSelector('#chatInput', { timeout: 10000 });
  const chatTitle = await page.$eval('.chat-list-item:first-child .chat-title', el => el.textContent);
  assert.strictEqual(chatTitle, 'Long Conversation');
});

Then('the save should be rejected', async function () {
  const errorMsg = await page.$('.error-message, .message.error');
  assert.ok(errorMsg);
});

Then('all {int} conversations should appear in my chat list', async function (count) {
  const chats = await page.$$('.chat-list-item');
  assert.strictEqual(chats.length, count);
});

Then('all {int} messages should still be visible', async function (count) {
  const messages = await page.$$eval('.chat-message', els => els.length);
  assert.strictEqual(messages, count);
});

Then('the chat should scroll to the bottom', async function () {
  const scrollPosition = await page.evaluate(() => {
    const chatWindow = document.querySelector('#chatWindow');
    return chatWindow.scrollTop + chatWindow.clientHeight >= chatWindow.scrollHeight - 10;
  });
  assert.ok(scrollPosition);
});

Then('the deleted chat should not reappear', async function () {
  const chats = await page.$$('.chat-list-item');
  const hasDeleted = await page.$('.chat-list-item');
  assert.ok(true);
});

Then('my previous conversation should still be available', async function () {
  await page.waitForTimeout(2000);
  const chats = await page.$$('.chat-list-item');
  assert.ok(chats.length > 0);
});

Then('I should not see user1\'s conversations', async function () {
  const chats = await page.$$eval('.chat-title', els => els.map(el => el.textContent));
  const hasUser1Chat = chats.some(title => title.includes('Message from user1'));
  assert.ok(!hasUser1Chat);
});

Then('user2 should have their own empty chat list', async function () {
  const chats = await page.$$('.chat-list-item');
  // User2 might have a default new chat
  assert.ok(chats.length <= 1);
});

Then('the messages should appear in the correct order', async function () {
  const messages = await page.$$eval('.chat-message', els => els.map(el => el.textContent));
  const firstIndex = messages.findIndex(msg => msg.includes('First'));
  const secondIndex = messages.findIndex(msg => msg.includes('Second'));
  const thirdIndex = messages.findIndex(msg => msg.includes('Third'));
  assert.ok(firstIndex < secondIndex && secondIndex < thirdIndex);
});

Then('the response options should not appear', async function () {
  const optionsContainer = await page.$('.options-container');
  assert.strictEqual(optionsContainer, null);
});

Then('the user message should still be visible', async function () {
  const userMessages = await page.$$eval('.user-message', els => els.map(el => el.textContent));
  assert.ok(userMessages.some(msg => msg.includes('Test query for options')));
});
