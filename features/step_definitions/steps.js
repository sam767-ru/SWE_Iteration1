const { Given, When, Then, Before, After, setDefaultTimeout } = require("@cucumber/cucumber");
const puppeteer = require("puppeteer");
const assert = require("assert");

setDefaultTimeout(30000)

let browser;
let page;

Before(async function () {
  browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null
  });

  page = await browser.newPage();
});

After(async function () {
  if (browser) {
    await browser.close();
  }
});

Given("I am logged in and on the dashboard page", async function () {
  await page.goto("http://127.0.0.1:3000/login", {
    waitUntil: "networkidle2"
  });

  await page.waitForSelector("#loginUsername", { timeout: 10000 });
  await page.waitForSelector("#loginPassword", { timeout: 10000 });

  await page.click("#loginUsername", { clickCount: 3 });
  await page.type("#loginUsername", "testuser");

  await page.click("#loginPassword", { clickCount: 3 });
  await page.type("#loginPassword", "test123");

  await Promise.all([
    page.click('button[type="submit"]'),
    page.waitForFunction(() => {
      return (
        window.location.pathname.includes("/dashboard") ||
        document.querySelector("#chatInput") !== null
      );
    }, { timeout: 10000 })
  ]);

  const url = page.url();
  assert(
    url.includes("/dashboard") || await page.$("#chatInput"),
    `Expected to reach dashboard, but got ${url}`
  );
});

When("I enter {string} into the prompt box", async function (text) {
  await page.waitForSelector("#chatInput");
  await page.click("#chatInput", { clickCount: 3 });
  await page.type("#chatInput", text);
});

When('I click the "Send" button', async function () {
  await page.waitForSelector("#sendBtn");
  await page.click("#sendBtn");
});

Then("I should see multiple LLM responses displayed", async function () {
  await page.waitForFunction(() => {
    const container = document.getElementById("responsesContainer");
    return container && container.querySelectorAll(".response-card").length >= 2;
  });

  const responseCount = await page.$$eval(
    "#responsesContainer .response-card",
    (cards) => cards.length
  );

  assert(
    responseCount >= 2,
    `Expected at least 2 response cards, but found ${responseCount}`
  );
});

Then("I should see two LLM responses displayed", async function () {
  await page.waitForFunction(() => {
    const container = document.getElementById("responsesContainer");
    return container && container.querySelectorAll(".response-card").length === 2;
  });

  const responseCount = await page.$$eval(
    "#responsesContainer .response-card",
    (cards) => cards.length
  );

  assert.strictEqual(
    responseCount,
    2,
    `Expected exactly 2 response cards, but found ${responseCount}`
  );
});

Given("multiple LLM responses are displayed", async function () {
  await page.waitForSelector("#chatInput");
  await page.click("#chatInput", { clickCount: 3 });
  await page.type("#chatInput", "What is artificial intelligence?");
  await page.click("#sendBtn");

  await page.waitForFunction(() => {
    const container = document.getElementById("responsesContainer");
    return container && container.querySelectorAll(".response-card").length >= 2;
  });
});

When('I click the "Select" button on one response', async function () {
  await page.waitForSelector("#responsesContainer .selectBtn");

  const buttons = await page.$$("#responsesContainer .selectBtn");
  assert(buttons.length > 0, "No select buttons found");

  await buttons[0].click();
});

Then("that response should be marked as selected", async function () {
  await page.waitForFunction(() => {
    return document.querySelectorAll("#responsesContainer .response-card.selected").length === 1;
  });

  const selectedCount = await page.$$eval(
    "#responsesContainer .response-card.selected",
    (cards) => cards.length
  );

  assert.strictEqual(
    selectedCount,
    1,
    `Expected exactly 1 selected response, but found ${selectedCount}`
  );
});

Given("I have selected a response", async function () {
  await page.waitForSelector("#chatInput");
  await page.click("#chatInput", { clickCount: 3 });
  await page.type("#chatInput", "Explain what a derivative is.");
  await page.click("#sendBtn");

  await page.waitForFunction(() => {
    const container = document.getElementById("responsesContainer");
    return container && container.querySelectorAll(".response-card").length >= 2;
  });

  const buttons = await page.$$("#responsesContainer .selectBtn");
  assert(buttons.length > 0, "No select buttons found");

  await buttons[0].click();

  await page.waitForFunction(() => {
    return document.querySelectorAll("#responsesContainer .response-card.selected").length === 1;
  });
});

When('I click the "Save Selected Response" button', async function () {
  await page.waitForSelector("#saveBtn");

  page.once("dialog", async (dialog) => {
    await dialog.accept();
  });

  await page.click("#saveBtn");
});

Then("the selected response should be saved successfully", async function () {
  await page.waitForTimeout(1000);

  const chatMessages = await page.$$eval(
    "#chatWindow .chat-message",
    (els) => els.map((el) => el.textContent.trim())
  );

  assert(
    chatMessages.length > 0,
    "Expected the chat window to contain messages after saving"
  );
});
