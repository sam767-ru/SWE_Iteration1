const { Given, When, Then, After } = require("@cucumber/cucumber");
const puppeteer = require("puppeteer");

let browser;
let page;

const BASE_URL = "http://localhost:3000";

async function openBrowser() {
  browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null
  });

  page = await browser.newPage();
}

Given("I open the landing page", { timeout: 30000 }, async function () {
  await openBrowser();
  await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle0" });
});

When('I click the "Sign In" button', async function () {
  await page.click("#landingSignInBtn");
});

Then("I should be on the login page", async function () {
  await page.waitForSelector("#loginForm");
});

Given("I am signed in and on the dashboard", { timeout: 30000 }, async function () {
  await openBrowser();

  const username = `testuser_${Date.now()}`;
  const password = "password123";
  const email = `${username}@test.com`;

  await page.goto(`${BASE_URL}/signup.html`, { waitUntil: "networkidle0" });

  await page.type("#signupUsername", username);
  await page.type("#signupEmail", email);
  await page.type("#signupPassword", password);
  await page.click('button[type="submit"]');

  await page.waitForSelector("#signupMessage");

  await page.goto(`${BASE_URL}/login.html`, { waitUntil: "networkidle0" });

  await page.type("#loginUsername", username);
  await page.type("#loginPassword", password);
  await page.click('button[type="submit"]');

  await page.waitForNavigation({ waitUntil: "networkidle0" });
  await page.waitForSelector("#chatInput");
});

Then(
  'I should see the model options "Local Model", "GPT", "Gemini", and "Claude"',
  async function () {
    const optionTexts = await page.$$eval("#modelSelect option", options =>
      options.map(option => option.textContent.trim())
    );

    if (
      !optionTexts.includes("Local Model") ||
      !optionTexts.includes("GPT") ||
      !optionTexts.includes("Gemini") ||
      !optionTexts.includes("Claude")
    ) {
      throw new Error(`Missing model option. Found: ${optionTexts.join(", ")}`);
    }
  }
);

When("I select the {string} model", async function (modelValue) {
  await page.select("#modelSelect", modelValue);
});

When("I send the message {string}", async function (message) {
  await page.type("#chatInput", message);
  await page.click("#sendBtn");
});

Then("I should see a bot response containing {string}", { timeout: 30000 }, async function (expectedText) {
  await page.waitForFunction(
    expected => document.body.innerText.includes(expected),
    {},
    expectedText
  );
});

After(async function () {
  if (browser) {
    await browser.close();
  }
});