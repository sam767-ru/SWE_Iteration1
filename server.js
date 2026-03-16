require("dotenv").config();
const {generateChatReply} = require("./chatService");
const express = require("express");
const path = require("path");
const session = require("express-session");
const db = require("./db");
const {
  isValidUsername,
  isValidEmail,
  isValidPassword,
  hashPassword,
  comparePassword
} = require("./auth");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: "software-engineering-group-5-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60
    }
  })
);

app.use(express.static(path.join(__dirname, "../public")));

/* ---------- Page Routes ---------- */

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/login.html"));
});

app.get("/signup", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/signup.html"));
});

app.get("/dashboard", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }

  res.sendFile(path.join(__dirname, "../public/dashboard.html"));
});

app.get("/terms", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/terms.html"));
});

/* ---------- API Routes ---------- */

/* Sign up */
app.post("/api/signup", async (req, res) => {
  const { username, email, password } = req.body;

  if (!isValidUsername(username)) {
    return res.status(400).json({
      error: "Username must be at least 3 characters long."
    });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({
      error: "Please enter a valid email address."
    });
  }

  if (!isValidPassword(password)) {
    return res.status(400).json({
      error: "Password must be at least 6 characters long."
    });
  }

  try {
    const passwordHash = await hashPassword(password);

    db.run(
      `INSERT INTO users (username, email, password_hash)
       VALUES (?, ?, ?)`,
      [username.trim(), email.trim(), passwordHash],
      function (err) {
        if (err) {
          if (err.message.includes("users.username")) {
            return res.status(409).json({
              error: "That username is already taken."
            });
          }

          if (err.message.includes("users.email")) {
            return res.status(409).json({
              error: "That email is already registered."
            });
          }

          return res.status(500).json({
            error: "Failed to create account."
          });
        }

        return res.status(201).json({
          message: "Account created successfully.",
          userId: this.lastID
        });
      }
    );
  } catch (error) {
    return res.status(500).json({
      error: "Server error while creating account."
    });
  }
});

/* Log in */
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      error: "Username and password are required."
    });
  }

  db.get(
    `SELECT * FROM users WHERE username = ?`,
    [username.trim()],
    async (err, user) => {
      if (err) {
        return res.status(500).json({
          error: "Server error during login."
        });
      }

      if (!user) {
        return res.status(401).json({
          error: "Invalid username or password."
        });
      }

      try {
        const passwordMatches = await comparePassword(
          password,
          user.password_hash
        );

        if (!passwordMatches) {
          return res.status(401).json({
            error: "Invalid username or password."
          });
        }

        req.session.user = {
          id: user.id,
          username: user.username,
          email: user.email
        };

        return res.json({
          message: "Login successful.",
          user: req.session.user
        });
      } catch (error) {
        return res.status(500).json({
          error: "Server error during password verification."
        });
      }
    }
  );
});

/* Log out */
app.post("/api/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({
        error: "Failed to log out."
      });
    }

    res.clearCookie("connect.sid");
    return res.json({
      message: "Logged out successfully."
    });
  });
});

/* Check session */
app.get("/api/session", (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({
      loggedIn: false
    });
  }

  return res.json({
    loggedIn: true,
    user: req.session.user
  });
});

/* Placeholder CAS route */
app.get("/auth/cas", (req, res) => {
  res.status(501).send(`
    <h1>Rutgers CAS Placeholder</h1>
    <p>CAS login is planned for a later iteration.</p>
    <p><a href="/login">Back to Sign In</a></p>
  `);
});

/* ---------- Chat Demo API Routes ---------- */

/* Return mock chats for signed-in user */
app.get("/api/chats", (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({
      error: "You must be logged in to view chats."
    });
  }

  return res.json([
    {
      id: 1,
      title: "Recipe ideas",
      messages: [
        { sender: "bot", text: "Welcome. Start a conversation by typing a message below." },
        { sender: "user", text: "Ask me for a recipe" },
        { sender: "bot", text: "Sure. What ingredients do you have?" }
      ]
    },
    {
      id: 2,
      title: "Homework help",
      messages: [
        { sender: "user", text: "Can you explain recursion?" },
        { sender: "bot", text: "Recursion is when a function calls itself on a smaller version of the same problem." }
      ]
    }
  ]);
});

/* Demo chatbot reply */
app.post("/api/chat", async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({
      error: "You must be logged in to chat."
    });
  }

  const { message, language, agentMode } = req.body;

  if (!message || !String(message).trim()) {
    return res.status(400).json({
      error: "Message cannot be empty."
    });
  }

  try {
    const reply = await generateChatReply({
      message,
      language,
      agentMode
    });

    return res.json({ reply });
  } catch (error) {
    console.error("Chat route error:", error.message);

    return res.status(500).json({
      error: "Failed to generate chatbot response."
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});