const { Given, When, Then, Before, After } = require('@cucumber/cucumber');
const puppeteer = require('puppeteer');
const assert = require('assert');

let browser, page;

Before(async function () {
  browser = await puppeteer.launch({ headless: false });
  page = await browser.newPage();
});

After(async function () {
  if (browser) {
    await browser.close();
  }
});

// Iteration 1 steps
Given('I open the landing page', { timeout: 30000 }, async function () {
  await page.goto('http://localhost:3000/');
});

When('I click the "Sign In" button', async function () {
  await page.click('#landingSignInBtn');
  await new Promise(resolve => setTimeout(resolve, 3000));
});

Then('I should be on the login page', async function () {
  await page.waitForSelector('h1');
  console.log('Navigation Successful!');
});

// Iteration 2 steps

Given('I am logged in', { timeout: 20000 }, async function () {
  const username = `testuser_${Date.now()}`;
  const password = 'testpassword';
  const email = `${username}@test.com`;

  await page.goto('http://localhost:3000/');

  await page.evaluate(async ({ username, password, email }) => {
    await fetch('/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });

    const loginRes = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (!loginRes.ok) {
      const data = await loginRes.json().catch(() => ({}));
      throw new Error(`Login failed: ${JSON.stringify(data)}`);
    }
  }, { username, password, email });

  await page.goto('http://localhost:3000/dashboard');
  await page.waitForSelector('#chatInput', { timeout: 10000 });
});

Given('I have an active conversation', async function () {
  await page.goto('http://localhost:3000/dashboard');
  await page.waitForSelector('#chatInput', { timeout: 10000 });
  await page.type('#chatInput', 'Hello');
  await page.click('#sendBtn');
  await new Promise(resolve => setTimeout(resolve, 2000));
});

When('I refresh the page', async function () {
  await page.reload();
  await new Promise(resolve => setTimeout(resolve, 1000));
});

Then('my conversation should still be available', async function () {
  const content = await page.content();
  assert(content.includes('Hello'));
});

// Search history
Given('I have a previous conversation', async function () {
  await page.goto('http://localhost:3000/dashboard');
  await page.waitForSelector('#chatInput', { timeout: 10000 });
  await page.type('#chatInput', 'SearchTestMessage');
  await page.click('#sendBtn');
  await new Promise(resolve => setTimeout(resolve, 1000));
});

When('I search for {string}', async function (keyword) {
  const searchBox = await page.$('input[placeholder="Search chats..."]');

  await searchBox.click({ clickCount: 3 });
  await searchBox.type(keyword);

  await new Promise(resolve => setTimeout(resolve, 1000));
});

Then('relevant conversations should be displayed', async function () {
  const content = await page.content();
  assert(content.includes('SearchTestMessage'));
});

// Continue conversation
Given('I select a previous conversation', async function () {
  await page.goto('http://localhost:3000/dashboard');

  await page.waitForSelector('input[placeholder="Search chats..."]');

  // Just click anywhere in sidebar (past chats area)
  const elements = await page.$$('div');

  for (let el of elements) {
    const text = await page.evaluate(e => e.textContent, el);
    if (text && text.includes('SearchTestMessage')) {
      await el.click();
      break;
    }
  }

  await new Promise(resolve => setTimeout(resolve, 1000));
});

When('I send a new message', async function () {
  await page.waitForSelector('#chatInput', { timeout: 10000 });
  await page.type('#chatInput', 'NewMessage');
  await page.click('#sendBtn');
  await new Promise(resolve => setTimeout(resolve, 1000));
});

Then('the message should be added to the same conversation', async function () {
  const content = await page.content();
  assert(content.includes('NewMessage'));
});
