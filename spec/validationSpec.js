const {
  isValidUsername,
  isValidEmail,
  isValidPassword
} = require("../server/auth");

describe("Validation functions", () => {
  describe("isValidUsername", () => {
    it("returns true for a valid username", () => {
      expect(isValidUsername("andree123")).toBeTrue();
    });

    it("returns false for a username shorter than 3 characters", () => {
      expect(isValidUsername("ab")).toBeFalse();
    });

    it("returns false for an empty username", () => {
      expect(isValidUsername("")).toBeFalse();
    });

    it("returns false for a non-string username", () => {
      expect(isValidUsername(null)).toBeFalse();
    });
  });

  describe("isValidEmail", () => {
    it("returns true for a valid email", () => {
      expect(isValidEmail("test@example.com")).toBeTrue();
    });

    it("returns false for an email missing @", () => {
      expect(isValidEmail("testexample.com")).toBeFalse();
    });

    it("returns false for an email missing domain", () => {
      expect(isValidEmail("test@")).toBeFalse();
    });

    it("returns false for a non-string email", () => {
      expect(isValidEmail(undefined)).toBeFalse();
    });
  });

  describe("isValidPassword", () => {
    it("returns true for a password with length 6 or more", () => {
      expect(isValidPassword("abcdef")).toBeTrue();
    });

    it("returns false for a short password", () => {
      expect(isValidPassword("abc")).toBeFalse();
    });

    it("returns false for an empty password", () => {
      expect(isValidPassword("")).toBeFalse();
    });

    it("returns false for a non-string password", () => {
      expect(isValidPassword(123456)).toBeFalse();
    });
  });
});