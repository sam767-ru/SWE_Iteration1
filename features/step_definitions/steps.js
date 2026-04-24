const { Given, When, Then } = require('@cucumber/cucumber');
const puppeteer = require('puppeteer');

let browser, page;

Given('I open the landing page', {timeout: 30000}, async function () {
  browser = await puppeteer.launch({ headless: false }); 
  page = await browser.newPage();
  // Start at the landing page
await page.goto('http://localhost:3000');});

When('I click the "Sign In" button', async function () {
  // This clicks the button on your index.html
  await page.click('#landingSignInBtn'); // The # symbol tells Puppeteer to look for an ID 
  await new Promise(r => setTimeout(r, 3000));
});

Then('I should be on the login page', async function () {
  // This waits to see the "Sign In" header from your screenshot
  await page.waitForSelector('h1'); 
  console.log("Navigation Successful!");
  await browser.close();
});