const {
  hashPassword,
  comparePassword
} = require("../server/auth");

describe("Authentication helpers", () => {
  it("hashPassword returns a different value than the original password", async () => {
    const password = "mypassword123";
    const hash = await hashPassword(password);

    expect(hash).not.toBe(password);
    expect(typeof hash).toBe("string");
    expect(hash.length).toBeGreaterThan(0);
  });

  it("comparePassword returns true for the correct password", async () => {
    const password = "securePassword";
    const hash = await hashPassword(password);

    const result = await comparePassword(password, hash);

    expect(result).toBeTrue();
  });

  it("comparePassword returns false for the wrong password", async () => {
    const password = "securePassword";
    const wrongPassword = "wrongPassword";
    const hash = await hashPassword(password);

    const result = await comparePassword(wrongPassword, hash);

    expect(result).toBeFalse();
  });
});