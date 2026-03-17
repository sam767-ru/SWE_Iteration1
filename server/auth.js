const bcrypt = require("bcrypt");

function isValidUsername(username) {
  return typeof username === "string" && username.trim().length >= 3;
}

function isValidEmail(email) {
  return typeof email === "string" && /\S+@\S+\.\S+/.test(email);
}

function isValidPassword(password) {
  return typeof password === "string" && password.length >= 6;
}

async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

module.exports = {
  isValidUsername,
  isValidEmail,
  isValidPassword,
  hashPassword,
  comparePassword
};