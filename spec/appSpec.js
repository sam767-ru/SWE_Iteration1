const fs = require('fs');
const path = require('path');

describe("Project Structure & Frontend Assets", function() {
    
    // Test 1: Verify the Landing Page exists
    it("should have index.html in the public folder", function() {
        const filePath = path.resolve(__dirname, '../public/index.html');
        const exists = fs.existsSync(filePath);
        expect(exists).toBe(true);
    });

    // Test 2: Verify the CSS styling exists
    it("should have a style.css file for the UI", function() {
        const filePath = path.resolve(__dirname, '../public/style.css');
        const exists = fs.existsSync(filePath);
        expect(exists).toBe(true);
    });

    // Test 3: Verify the JavaScript logic file exists
    it("should have app.js for frontend interactivity", function() {
        const filePath = path.resolve(__dirname, '../public/app.js');
        const exists = fs.existsSync(filePath);
        expect(exists).toBe(true);
    });
});
