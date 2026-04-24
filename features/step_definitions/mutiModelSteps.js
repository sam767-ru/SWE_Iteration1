const { Given, When, Then } = require("@cucumber/cucumber");
const puppeteer = require("puppeteer");

let browser;
let page;

async function loginToDashboard() {
  browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null
  });

  page = await browser.newPage();

  page.on("dialog", async (dialog) => {
    await dialog.accept();
  });

  const username = "testuser" + Date.now();
  const email = `${username}@test.com`;
  const password = "password123";

  await page.goto("http://localhost:3000/signup", {
    waitUntil: "networkidle2"
  });

  await page.type("#signupUsername", username);
  await page.type("#signupEmail", email);
  await page.type("#signupPassword", password);
  await page.click("#signupForm button");

  await new Promise((resolve) => setTimeout(resolve, 1500));

  await page.goto("http://localhost:3000/login", {
    waitUntil: "networkidle2"
  });

  await page.type("#loginUsername", username);
  await page.type("#loginPassword", password);
  await page.click("#loginForm button");

  await page.waitForSelector("#chatInput", { timeout: 15000 });
}

Given("I am on the dashboard", { timeout: 30000 }, async function () {
  await loginToDashboard();
});

When("I enter a prompt", { timeout: 15000 }, async function () {
  await page.waitForSelector("#chatInput", { timeout: 15000 });
  await page.type("#chatInput", "say hi");
});

When("I submit the prompt", { timeout: 180000 }, async function () {
  await page.click("#sendBtn");
  await page.waitForSelector(".model-response-card", { timeout: 180000 });
});

Then("I should see responses from multiple models", { timeout: 30000 }, async function () {
  const responses = await page.$$(".model-response-card");

  if (responses.length < 2) {
    throw new Error("Did not find multiple model responses.");
  }

  console.log("Multiple model responses detected.");

  await browser.close();
});

Given("multiple model responses are displayed", { timeout: 180000 }, async function () {
  await loginToDashboard();

  await page.waitForSelector("#chatInput", { timeout: 15000 });
  await page.type("#chatInput", "say hi");
  await page.click("#sendBtn");

  await page.waitForSelector(".model-response-card", { timeout: 180000 });

  const responses = await page.$$(".model-response-card");

  if (responses.length < 2) {
    throw new Error("Multiple model responses were not displayed.");
  }
});

When("I click {string}", { timeout: 30000 }, async function (buttonText) {
  await page.waitForSelector(".select-model-btn", { timeout: 30000 });
  await page.click(".select-model-btn");
});

Then("future responses should come from only that model", { timeout: 180000 }, async function () {
  await page.waitForSelector("#chatInput", { timeout: 15000 });

  const beforeGroupCount = await page.$$eval(".multi-response-wrapper", (wrappers) => wrappers.length);

  await page.type("#chatInput", "say hello again");
  await page.click("#sendBtn");

  await page.waitForFunction(
    (oldCount) => document.querySelectorAll(".multi-response-wrapper").length > oldCount,
    { timeout: 180000 },
    beforeGroupCount
  );

  const lastGroupCount = await page.$$eval(".multi-response-wrapper", (wrappers) => {
    const lastWrapper = wrappers[wrappers.length - 1];
    return lastWrapper.querySelectorAll(".model-response-card").length;
  });

  if (lastGroupCount !== 1) {
    throw new Error("More than one model responded after selecting a preferred model.");
  }

  console.log("Model selection working correctly.");

  await browser.close();
});