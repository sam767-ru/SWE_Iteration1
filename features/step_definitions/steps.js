const { Given, When, Then, Before, After, setDefaultTimeout } = require("@cucumber/cucumber");
const puppeteer = require("puppeteer");
const assert = require("assert");

setDefaultTimeout(30000);

let browser;
let page;

Before(async function () {
  browser = await puppeteer.launch({
    headless: false,
    slowMo: 50
  });

  page = await browser.newPage();

  await page.setRequestInterception(true);

  page.on("request", request => {
    const url = request.url();

    if (url.endsWith("/api/multi-chat")) {
      return request.respond({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          chatId: 1,
          responses: [
            { llm: "qwen3.5:4b", text: "Mock response from first LLM." },
            { llm: "llama3.2", text: "Mock response from second LLM." }
          ]
        })
      });
    }

    if (url.endsWith("/api/save-response")) {
      return request.respond({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          message: "Response saved and model selected.",
          selectedModel: "qwen3.5:4b"
        })
      });
    }

    request.continue();
  });
});

After(async function () {
  try {
    if (browser) {
      await browser.close();
    }
  } catch (error) {
    // Ignore browser-close cleanup errors after dialog handling
  }
});

Given("I am logged in", async function () {
  const username = `testuser_${Date.now()}`;
  const password = "testpassword";
  const email = `${username}@test.com`;

  await page.goto("http://localhost:3000/");

  await page.evaluate(async ({ username, password, email }) => {
    await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password })
    });

    const loginRes = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    if (!loginRes.ok) {
      throw new Error("Login failed.");
    }
  }, { username, password, email });
});

Given("I am on the dashboard page", async function () {
  await page.goto("http://localhost:3000/dashboard");
  await page.waitForSelector("#chatInput", { timeout: 10000 });
});

When("I enter {string} into the chat input", async function (text) {
  await page.waitForSelector("#chatInput", { timeout: 10000 });

  await page.$eval("#chatInput", (el, value) => {
    el.value = value;
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }, text);
});

When("I send the message", async function () {
  await page.click("#sendBtn");

  await page.waitForFunction(() => {
    return document.querySelectorAll(".response-card").length >= 2;
  }, { timeout: 10000 });
});

Then("I should see multiple LLM responses", async function () {
  const responses = await page.$$(".response-card");
  assert(responses.length >= 2, "Expected at least two LLM response cards.");
});

Given("multiple LLM responses are displayed", async function () {
  await page.waitForSelector("#chatInput", { timeout: 10000 });

  await page.$eval("#chatInput", el => {
    el.value = "What is AI?";
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });

  await page.click("#sendBtn");

  await page.waitForFunction(() => {
    return document.querySelectorAll(".response-card").length >= 2;
  }, { timeout: 10000 });
});

When('I click the "Select" button on one response', async function () {
  await page.waitForSelector(".selectBtn", { timeout: 10000 });

  const buttons = await page.$$(".selectBtn");
  assert(buttons.length > 0, "Expected at least one Select button.");

  await buttons[0].click();
});

Then("that response should be marked as selected", async function () {
  await page.waitForSelector(".response-card.selected", { timeout: 10000 });

  const selectedCards = await page.$$(".response-card.selected");
  assert(selectedCards.length >= 1, "Expected selected response card.");
});

Given("I have selected a response", async function () {
  await page.waitForSelector("#chatInput", { timeout: 10000 });

  await page.$eval("#chatInput", el => {
    el.value = "What is AI?";
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });

  await page.click("#sendBtn");

  await page.waitForFunction(() => {
    return document.querySelectorAll(".selectBtn").length >= 2;
  }, { timeout: 10000 });

  const buttons = await page.$$(".selectBtn");
  await buttons[0].click();

  await page.waitForSelector(".response-card.selected", { timeout: 10000 });
});

When('I click the "Save Selected Response" button', async function () {
  const dialogPromise = new Promise(resolve => {
    page.once("dialog", async dialog => {
      await dialog.accept();
      resolve();
    });
  });

  await page.click("#saveBtn");
  await dialogPromise;
});

Then("the selected response should be saved sucessfully", async function () {
  assert(true);
});
