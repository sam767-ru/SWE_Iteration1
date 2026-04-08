const { Given, When, Then, Before, After } = require('@cucumber/cucumber');
const puppeteer = require('puppeteer');
const assert = require('assert');

let browser, page;

//Setup / Teardown (better than launching at given)
Before(async function(){
  browser = await puppeteer.launch({headless: false});
  page = await browser.newPage();
});

After(async function(){
  if(browser){
    await browser.close();
  }
});

// iteration 1 steps
Given('I open the landing page', {timeout: 30000}, async function () {
  // Start at the landing page
  await page.goto('http://127.0.0.1:8080/public/index.html'); 
});

When('I click the "Sign In" button', async function () {
  // This clicks the button on your index.html
  await page.click('#landingSignInBtn'); // The # symbol tells Puppeteer to look for an ID 
  await new Promise(r => setTimeout(r, 3000));
});

Then('I should be on the login page', async function () {
  // This waits to see the "Sign In" header from your screenshot
  await page.waitForSelector('h1'); 
  console.log("Navigation Successful!");
});

//Iteration 2 steps

// Save conversation History
Given('I am logged in', async function(){
  await page.goto('http://127.0.0.1:8080/public/login.html');
  await page.type('input[name="username"]', 'testuser');
  await page.type('input[name="password"]', 'testpassword');
  await page.click('button[type="submit"]');
  await page.waitForNavigation();
});

Given('I have an active conversation', async function(){
  await page.goto('http://127.0.0.1:8080/public/dashboard.html');
  await page.type('#chat-input', 'Hello');
  await page.click('#send-button');
  await page.waitForTimeout(1000);
});

When('I refresh the page', async function(){
  await page.reload();
});

Then('my conversation should still be available', async function(){
  const content = await page.content();
  assert(content.includes('Hello'));
});

//Search history
Given('I have a previous conversation', async function(){
  await page.goto('http://127.0.0.1:8080/public/dashboard.html');
  await page.type('#chat-input', 'SearchTestMessage');
  await page.click('#send-button');
  await page.waitForTimeout(1000);
});

When('I search for {string}', async function(Keyword){
  await page.type('#search-bar', Keyword);
  await page.waitForTimeout(1000);
});

Then('relevant conversations should be displayed', async function(){
  const content = await page.content();
  assert(content.includes('SearchTestMessage'));
});

//Continue conversation
Given('I select a previous conversation', async function(){
  await page.goto('http://127.0.0.1:8080/public/dashboard.html');
  await page.click('.chat-item');
  await page.waitForTimeout(1000);
});

When('I send a new message', async function(){
  await page.type('#chat-input', 'NewMessage');
  await page.click('#send-button');
  await page.waitForTimeout(1000);
});

Then('the message should be added to the same conversation', async function(){
  const content = await page.content();
  assert(content.includes('NewMessage'));
});
