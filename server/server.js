require("dotenv").config();
const { generateChatReply } = require("./chatService");
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

/* ---------- Helpers ---------- */

function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({
      error: "You must be logged in to access this resource."
    });
  }

  next();
}

function dbRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) {
        reject(err);
      } else {
        resolve(this);
      }
    });
  });
}

function dbGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

function dbAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

async function getChatByIdForUser(chatId, userId) {
  return dbGet(
    `
      SELECT id, user_id, title, created_at
      FROM chats
      WHERE id = ? AND user_id = ?
    `,
    [chatId, userId]
  );
}

async function getMessagesForChat(chatId) {
  return dbAll(
    `
      SELECT id, chat_id, sender, content, created_at
      FROM messages
      WHERE chat_id = ?
      ORDER BY id ASC
    `,
    [chatId]
  );
}

function toFrontendMessage(row) {
  return {
    id: row.id,
    sender: row.sender,
    text: row.content,
    content: row.content,
    created_at: row.created_at
  };
}

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

/* ---------- Chat Routes ---------- */

/* Get all chats for signed-in user, with optional search */
app.get("/api/chats", requireAuth, async (req, res) => {
  const userId = req.session.user.id;
  const search = String(req.query.q || "").trim();

  try {
    let chats;

    if (search) {
      chats = await dbAll(
        `
          SELECT DISTINCT chats.id, chats.title, chats.created_at
          FROM chats
          LEFT JOIN messages ON messages.chat_id = chats.id
          WHERE chats.user_id = ?
            AND (
              chats.title LIKE ?
              OR messages.content LIKE ?
            )
          ORDER BY chats.created_at DESC, chats.id DESC
        `,
        [userId, `%${search}%`, `%${search}%`]
      );
    } else {
      chats = await dbAll(
        `
          SELECT id, title, created_at
          FROM chats
          WHERE user_id = ?
          ORDER BY created_at DESC, id DESC
        `,
        [userId]
      );
    }

    return res.json(chats);
  } catch (error) {
    console.error("Get chats error:", error.message);

    return res.status(500).json({
      error: "Failed to load chats."
    });
  }
});

/* Create a new chat */
app.post("/api/chats", requireAuth, async (req, res) => {
  const userId = req.session.user.id;
  const rawTitle = String(req.body.title || "").trim();
  const title = rawTitle || "New Chat";

  try {
    const result = await dbRun(
      `
        INSERT INTO chats (user_id, title)
        VALUES (?, ?)
      `,
      [userId, title]
    );

    const chat = await dbGet(
      `
        SELECT id, title, created_at
        FROM chats
        WHERE id = ?
      `,
      [result.lastID]
    );

    return res.status(201).json(chat);
  } catch (error) {
    console.error("Create chat error:", error.message);

    return res.status(500).json({
      error: "Failed to create chat."
    });
  }
});

/* Get one chat's messages */
app.get("/api/chats/:chatId/messages", requireAuth, async (req, res) => {
  const chatId = Number(req.params.chatId);
  const userId = req.session.user.id;

  if (!Number.isInteger(chatId) || chatId <= 0) {
    return res.status(400).json({
      error: "Invalid chat ID."
    });
  }

  try {
    const chat = await getChatByIdForUser(chatId, userId);

    if (!chat) {
      return res.status(404).json({
        error: "Chat not found."
      });
    }

    const messages = await getMessagesForChat(chatId);

    return res.json({
      chat: {
        id: chat.id,
        title: chat.title,
        created_at: chat.created_at
      },
      messages: messages.map(toFrontendMessage)
    });
  } catch (error) {
    console.error("Get messages error:", error.message);

    return res.status(500).json({
      error: "Failed to load messages."
    });
  }
});

/* Send a message to a specific chat, save both user and bot messages */
app.post("/api/chats/:chatId/messages", requireAuth, async (req, res) => {
  const chatId = Number(req.params.chatId);
  const userId = req.session.user.id;
  const message = String(req.body.message || "").trim();
  const language = req.body.language;
  const agentMode = Boolean(req.body.agentMode);

  if (!Number.isInteger(chatId) || chatId <= 0) {
    return res.status(400).json({
      error: "Invalid chat ID."
    });
  }

  if (!message) {
    return res.status(400).json({
      error: "Message cannot be empty."
    });
  }

  try {
    const chat = await getChatByIdForUser(chatId, userId);

    if (!chat) {
      return res.status(404).json({
        error: "Chat not found."
      });
    }

    await dbRun(
      `
        INSERT INTO messages (chat_id, sender, content)
        VALUES (?, ?, ?)
      `,
      [chatId, "user", message]
    );

    const history = await getMessagesForChat(chatId);

    const reply = await generateChatReply({
      message,
      history,
      language,
      agentMode
    });

    const botInsert = await dbRun(
      `
        INSERT INTO messages (chat_id, sender, content)
        VALUES (?, ?, ?)
      `,
      [chatId, "bot", reply]
    );

    if (!chat.title || chat.title === "New Chat") {
      const newTitle =
        message.length > 60 ? `${message.slice(0, 60).trim()}...` : message;

      await dbRun(
        `
          UPDATE chats
          SET title = ?
          WHERE id = ? AND user_id = ?
        `,
        [newTitle || "New Chat", chatId, userId]
      );
    }

    const savedReply = await dbGet(
      `
        SELECT id, chat_id, sender, content, created_at
        FROM messages
        WHERE id = ?
      `,
      [botInsert.lastID]
    );

    return res.json({
      reply,
      message: toFrontendMessage(savedReply)
    });
  } catch (error) {
    console.error("Chat message error:", error.message);

    return res.status(500).json({
      error: "Failed to generate chatbot response."
    });
  }
});

/* Backward-compatible route for older frontend code */
app.post("/api/chat", requireAuth, async (req, res) => {
  const { message, language, agentMode, chatId } = req.body;

  if (!message || !String(message).trim()) {
    return res.status(400).json({
      error: "Message cannot be empty."
    });
  }

  try {
    let activeChatId = Number(chatId);

    if (!Number.isInteger(activeChatId) || activeChatId <= 0) {
      const created = await dbRun(
        `
          INSERT INTO chats (user_id, title)
          VALUES (?, ?)
        `,
        [req.session.user.id, "New Chat"]
      );

      activeChatId = created.lastID;
    }

    const chat = await getChatByIdForUser(activeChatId, req.session.user.id);

    if (!chat) {
      return res.status(404).json({
        error: "Chat not found."
      });
    }

    await dbRun(
      `
        INSERT INTO messages (chat_id, sender, content)
        VALUES (?, ?, ?)
      `,
      [activeChatId, "user", String(message).trim()]
    );

    const history = await getMessagesForChat(activeChatId);

    const reply = await generateChatReply({
      message: String(message).trim(),
      history,
      language,
      agentMode
    });

    const botInsert = await dbRun(
      `
        INSERT INTO messages (chat_id, sender, content)
        VALUES (?, ?, ?)
      `,
      [activeChatId, "bot", reply]
    );

    if (!chat.title || chat.title === "New Chat") {
      const newTitle =
        String(message).trim().length > 60
          ? `${String(message).trim().slice(0, 60)}...`
          : String(message).trim();

      await dbRun(
        `
          UPDATE chats
          SET title = ?
          WHERE id = ? AND user_id = ?
        `,
        [newTitle || "New Chat", activeChatId, req.session.user.id]
      );
    }

    const savedReply = await dbGet(
      `
        SELECT id, chat_id, sender, content, created_at
        FROM messages
        WHERE id = ?
      `,
      [botInsert.lastID]
    );

    return res.json({
      chatId: activeChatId,
      reply,
      message: toFrontendMessage(savedReply)
    });
  } catch (error) {
    console.error("Legacy chat route error:", error.message);

    return res.status(500).json({
      error: "Failed to generate chatbot response."
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});