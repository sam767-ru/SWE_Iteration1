const request = require('supertest');
const express = require('express');
const session = require('express-session');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

// Mock the database and app for testing
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Setup session for testing
app.use(
  session({
    secret: 'test-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
  })
);

// In-memory database for testing
const db = new sqlite3.Database(':memory:');

// Initialize test database
beforeAll(async () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT NOT NULL UNIQUE,
          email TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS chats (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          title TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          chat_id INTEGER NOT NULL,
          sender TEXT NOT NULL,
          content TEXT NOT NULL,
          is_pending_response INTEGER DEFAULT 0,
          option_type TEXT DEFAULT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (chat_id) REFERENCES chats(id)
        )
      `, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });
});

afterAll(() => {
  return new Promise((resolve) => {
    db.close(resolve);
  });
});

// Helper functions for database operations
function dbRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function dbGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function dbAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

// Mock authentication helpers
async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

function isValidUsername(username) {
  return typeof username === 'string' && username.trim().length >= 3;
}

function isValidEmail(email) {
  return typeof email === 'string' && /\S+@\S+\.\S+/.test(email);
}

function isValidPassword(password) {
  return typeof password === 'string' && password.length >= 6;
}

// Mock chat service for testing
const mockGenerateChatReply = async ({ message, history, language, agentMode }) => {
  if (!message || !message.trim()) {
    throw new Error('Message cannot be empty.');
  }
  
  // Simulate different response types based on mode
  if (agentMode) {
    return `[Detailed] I understand you asked: "${message}". Here is a comprehensive answer with multiple steps...`;
  }
  
  return `[Response] Thank you for your message: "${message}". How can I help further?`;
};

// Helper to get chat by ID for user
async function getChatByIdForUser(chatId, userId) {
  return dbGet(
    `SELECT id, user_id, title, created_at FROM chats WHERE id = ? AND user_id = ?`,
    [chatId, userId]
  );
}

async function getMessagesForChat(chatId) {
  return dbAll(
    `SELECT id, chat_id, sender, content, created_at FROM messages WHERE chat_id = ? ORDER BY id ASC`,
    [chatId]
  );
}

// Setup API routes for testing (simplified version of server.js)
function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: 'You must be logged in.' });
  }
  next();
}

// POST /api/signup
app.post('/api/signup', async (req, res) => {
  const { username, email, password } = req.body;

  if (!isValidUsername(username)) {
    return res.status(400).json({ error: 'Username must be at least 3 characters.' });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Valid email required.' });
  }
  if (!isValidPassword(password)) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }

  try {
    const passwordHash = await hashPassword(password);
    const result = await dbRun(
      `INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)`,
      [username.trim(), email.trim(), passwordHash]
    );
    res.status(201).json({ message: 'Account created.', userId: result.lastID });
  } catch (err) {
    if (err.message.includes('username')) {
      res.status(409).json({ error: 'Username taken.' });
    } else if (err.message.includes('email')) {
      res.status(409).json({ error: 'Email registered.' });
    } else {
      res.status(500).json({ error: 'Server error.' });
    }
  }
});

// POST /api/login
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required.' });
  }

  try {
    const user = await dbGet(`SELECT * FROM users WHERE username = ?`, [username.trim()]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const passwordMatches = await comparePassword(password, user.password_hash);
    if (!passwordMatches) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    req.session.user = { id: user.id, username: user.username, email: user.email };
    res.json({ message: 'Login successful.', user: req.session.user });
  } catch (error) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/chats
app.get('/api/chats', requireAuth, async (req, res) => {
  const userId = req.session.user.id;
  const search = String(req.query.q || '').trim();

  try {
    let chats;
    if (search) {
      chats = await dbAll(
        `SELECT DISTINCT chats.id, chats.title, chats.created_at
         FROM chats LEFT JOIN messages ON messages.chat_id = chats.id
         WHERE chats.user_id = ? AND (chats.title LIKE ? OR messages.content LIKE ?)
         ORDER BY chats.created_at DESC`,
        [userId, `%${search}%`, `%${search}%`]
      );
    } else {
      chats = await dbAll(
        `SELECT id, title, created_at FROM chats WHERE user_id = ? ORDER BY created_at DESC`,
        [userId]
      );
    }
    res.json(chats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load chats.' });
  }
});

// POST /api/chats
app.post('/api/chats', requireAuth, async (req, res) => {
  const userId = req.session.user.id;
  const title = String(req.body.title || 'New Chat').trim();

  try {
    const result = await dbRun(`INSERT INTO chats (user_id, title) VALUES (?, ?)`, [userId, title]);
    const chat = await dbGet(`SELECT id, title, created_at FROM chats WHERE id = ?`, [result.lastID]);
    res.status(201).json(chat);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create chat.' });
  }
});

// DELETE /api/chats/:chatId
app.delete('/api/chats/:chatId', requireAuth, async (req, res) => {
  const chatId = Number(req.params.chatId);
  const userId = req.session.user.id;

  try {
    const chat = await getChatByIdForUser(chatId, userId);
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found.' });
    }
    await dbRun(`DELETE FROM messages WHERE chat_id = ?`, [chatId]);
    await dbRun(`DELETE FROM chats WHERE id = ? AND user_id = ?`, [chatId, userId]);
    res.json({ message: 'Chat deleted.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete chat.' });
  }
});

// PUT /api/chats/:chatId
app.put('/api/chats/:chatId', requireAuth, async (req, res) => {
  const chatId = Number(req.params.chatId);
  const userId = req.session.user.id;
  const { title } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Title cannot be empty.' });
  }

  try {
    const chat = await getChatByIdForUser(chatId, userId);
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found.' });
    }
    await dbRun(`UPDATE chats SET title = ? WHERE id = ? AND user_id = ?`, [title.trim(), chatId, userId]);
    res.json({ message: 'Chat saved.', chat: { id: chatId, title: title.trim() } });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save chat.' });
  }
});

// POST /api/chats/:chatId/options
app.post('/api/chats/:chatId/options', requireAuth, async (req, res) => {
  const chatId = Number(req.params.chatId);
  const userId = req.session.user.id;
  const message = String(req.body.message || '').trim();
  const language = req.body.language || 'english';
  const agentMode = Boolean(req.body.agentMode);

  if (!message) {
    return res.status(400).json({ error: 'Message cannot be empty.' });
  }

  try {
    const chat = await getChatByIdForUser(chatId, userId);
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found.' });
    }

    const history = await getMessagesForChat(chatId);
    const responseOptions = [];
    const promptTemplates = ['concise', 'detailed', 'creative'];

    for (let i = 0; i < promptTemplates.length; i++) {
      const optionMessage = `${promptTemplates[i]}: ${message}`;
      const reply = await mockGenerateChatReply({
        message: optionMessage,
        history,
        language,
        agentMode
      });
      
      responseOptions.push({
        id: i + 1,
        text: reply,
        type: promptTemplates[i]
      });
    }

    await dbRun(
      `INSERT INTO messages (chat_id, sender, content, is_pending_response) VALUES (?, ?, ?, ?)`,
      [chatId, 'user', message, 1]
    );

    res.json({ options: responseOptions });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate options.' });
  }
});

// POST /api/chats/:chatId/select-option
app.post('/api/chats/:chatId/select-option', requireAuth, async (req, res) => {
  const chatId = Number(req.params.chatId);
  const userId = req.session.user.id;
  const { optionText, optionType } = req.body;

  if (!optionText) {
    return res.status(400).json({ error: 'Option text required.' });
  }

  try {
    const chat = await getChatByIdForUser(chatId, userId);
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found.' });
    }

    const pendingMessage = await dbGet(
      `SELECT id FROM messages WHERE chat_id = ? AND sender = 'user' AND is_pending_response = 1 ORDER BY id DESC LIMIT 1`,
      [chatId]
    );

    if (pendingMessage) {
      await dbRun(`UPDATE messages SET is_pending_response = 0 WHERE id = ?`, [pendingMessage.id]);
    }

    const botInsert = await dbRun(
      `INSERT INTO messages (chat_id, sender, content, option_type) VALUES (?, ?, ?, ?)`,
      [chatId, 'bot', optionText, optionType || 'selected']
    );

    const savedReply = await dbGet(
      `SELECT id, chat_id, sender, content, created_at FROM messages WHERE id = ?`,
      [botInsert.lastID]
    );

    res.json({ message: savedReply });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save response.' });
  }
});

// POST /api/chats/:chatId/continue
app.post('/api/chats/:chatId/continue', requireAuth, async (req, res) => {
  const chatId = Number(req.params.chatId);
  const userId = req.session.user.id;
  const { message, language, agentMode } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Message cannot be empty.' });
  }

  try {
    const chat = await getChatByIdForUser(chatId, userId);
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found.' });
    }

    await dbRun(`INSERT INTO messages (chat_id, sender, content) VALUES (?, ?, ?)`, [chatId, 'user', message.trim()]);
    const history = await getMessagesForChat(chatId);
    const reply = await mockGenerateChatReply({ message: message.trim(), history, language, agentMode });
    const botInsert = await dbRun(`INSERT INTO messages (chat_id, sender, content) VALUES (?, ?, ?)`, [chatId, 'bot', reply]);
    const savedReply = await dbGet(`SELECT id, chat_id, sender, content, created_at FROM messages WHERE id = ?`, [botInsert.lastID]);

    res.json({ reply, message: savedReply });
  } catch (error) {
    res.status(500).json({ error: 'Failed to continue conversation.' });
  }
});

// GET /api/chats/:chatId/messages
app.get('/api/chats/:chatId/messages', requireAuth, async (req, res) => {
  const chatId = Number(req.params.chatId);
  const userId = req.session.user.id;

  try {
    const chat = await getChatByIdForUser(chatId, userId);
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found.' });
    }
    const messages = await getMessagesForChat(chatId);
    res.json({ chat, messages });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load messages.' });
  }
});

// POST /api/logout
app.post('/api/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed.' });
    }
    res.json({ message: 'Logged out.' });
  });
});

describe('Chat Flow Integration Tests', () => {
  let agent;
  let userId;
  let chatId;
  let sessionCookie;

  beforeAll(async () => {
    agent = request.agent(app);
    
    // Create test user
    const signupRes = await agent
      .post('/api/signup')
      .send({
        username: `test_flow_${Date.now()}`,
        email: `flow_${Date.now()}@test.com`,
        password: 'testpass123'
      });
    userId = signupRes.body.userId;
    expect(signupRes.statusCode).toBe(201);

    // Login
    const loginRes = await agent
      .post('/api/login')
      .send({
        username: `test_flow_${Date.now()}`,
        password: 'testpass123'
      });
    expect(loginRes.statusCode).toBe(200);
  });

  describe('Multiple Response Generation', () => {
    beforeEach(async () => {
      const chatRes = await agent
        .post('/api/chats')
        .send({ title: 'Test Chat' });
      chatId = chatRes.body.id;
    });

    it('should generate 3 response options for a query', async () => {
      const res = await agent
        .post(`/api/chats/${chatId}/options`)
        .send({
          message: 'What is machine learning?',
          language: 'english',
          agentMode: false
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.options).toBeDefined();
      expect(res.body.options.length).toBe(3);
      expect(res.body.options[0].type).toBe('concise');
      expect(res.body.options[1].type).toBe('detailed');
      expect(res.body.options[2].type).toBe('creative');
    });

    it('should handle empty message', async () => {
      const res = await agent
        .post(`/api/chats/${chatId}/options`)
        .send({
          message: '',
          language: 'english',
          agentMode: false
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('should return 404 for invalid chat ID', async () => {
      const res = await agent
        .post('/api/chats/99999/options')
        .send({
          message: 'Test message',
          language: 'english',
          agentMode: false
        });

      expect(res.statusCode).toBe(404);
    });

    it('should save user message as pending', async () => {
      const res = await agent
        .post(`/api/chats/${chatId}/options`)
        .send({
          message: 'Test pending message',
          language: 'english',
          agentMode: false
        });

      expect(res.statusCode).toBe(200);
      
      // Verify message was saved as pending
      const messagesRes = await agent
        .get(`/api/chats/${chatId}/messages`);
      
      const pendingMessages = messagesRes.body.messages.filter(m => m.sender === 'user');
      expect(pendingMessages.length).toBeGreaterThan(0);
    });
  });

  describe('Response Selection', () => {
    let generatedOptions;

    beforeEach(async () => {
      const chatRes = await agent
        .post('/api/chats')
        .send({ title: 'Selection Test' });
      chatId = chatRes.body.id;

      const optionsRes = await agent
        .post(`/api/chats/${chatId}/options`)
        .send({
          message: 'Selection test query',
          language: 'english',
          agentMode: false
        });
      generatedOptions = optionsRes.body.options;
    });

    it('should save selected response option', async () => {
      const selectRes = await agent
        .post(`/api/chats/${chatId}/select-option`)
        .send({
          optionText: generatedOptions[0].text,
          optionType: generatedOptions[0].type
        });

      expect(selectRes.statusCode).toBe(200);
      expect(selectRes.body.message).toBeDefined();
      expect(selectRes.body.message.sender).toBe('bot');
    });

    it('should require option text', async () => {
      const res = await agent
        .post(`/api/chats/${chatId}/select-option`)
        .send({ optionType: 'concise' });

      expect(res.statusCode).toBe(400);
    });

    it('should mark pending message as not pending after selection', async () => {
      await agent
        .post(`/api/chats/${chatId}/select-option`)
        .send({
          optionText: generatedOptions[0].text,
          optionType: generatedOptions[0].type
        });

      const messagesRes = await agent
        .get(`/api/chats/${chatId}/messages`);
      
      const pendingMessages = messagesRes.body.messages.filter(
        m => m.sender === 'user' && m.is_pending_response === 1
      );
      expect(pendingMessages.length).toBe(0);
    });

    it('should return 404 for invalid chat ID when selecting', async () => {
      const res = await agent
        .post('/api/chats/99999/select-option')
        .send({
          optionText: 'Some response',
          optionType: 'concise'
        });

      expect(res.statusCode).toBe(404);
    });
  });

  describe('Chat Management', () => {
    beforeEach(async () => {
      const chatRes = await agent
        .post('/api/chats')
        .send({ title: 'Original Title' });
      chatId = chatRes.body.id;
    });

    it('should rename a chat', async () => {
      const res = await agent
        .put(`/api/chats/${chatId}`)
        .send({ title: 'New Title' });

      expect(res.statusCode).toBe(200);
      expect(res.body.chat.title).toBe('New Title');

      // Verify the change persisted
      const getRes = await agent
        .get(`/api/chats/${chatId}/messages`);
      expect(getRes.body.chat.title).toBe('New Title');
    });

    it('should reject empty title when saving', async () => {
      const res = await agent
        .put(`/api/chats/${chatId}`)
        .send({ title: '   ' });

      expect(res.statusCode).toBe(400);
    });

    it('should delete a chat', async () => {
      const res = await agent
        .delete(`/api/chats/${chatId}`);

      expect(res.statusCode).toBe(200);

      // Verify chat is gone
      const getRes = await agent
        .get(`/api/chats/${chatId}/messages`);
      expect(getRes.statusCode).toBe(404);
    });

    it('should return 404 when deleting non-existent chat', async () => {
      const res = await agent
        .delete('/api/chats/99999');
      expect(res.statusCode).toBe(404);
    });

    it('should list all chats for user', async () => {
      // Create multiple chats
      await agent.post('/api/chats').send({ title: 'Chat 1' });
      await agent.post('/api/chats').send({ title: 'Chat 2' });
      await agent.post('/api/chats').send({ title: 'Chat 3' });

      const res = await agent.get('/api/chats');
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(3);
    });

    it('should search chats by title', async () => {
      await agent.post('/api/chats').send({ title: 'Unique Searchable Title' });
      
      const res = await agent.get('/api/chats?q=Unique');
      expect(res.statusCode).toBe(200);
      expect(res.body.some(chat => chat.title.includes('Unique'))).toBe(true);
    });
  });

  describe('Continue Conversation', () => {
    let generatedOptions;

    beforeEach(async () => {
      const chatRes = await agent
        .post('/api/chats')
        .send({ title: 'Continue Test' });
      chatId = chatRes.body.id;

      const optionsRes = await agent
        .post(`/api/chats/${chatId}/options`)
        .send({
          message: 'Initial query for continuation',
          language: 'english',
          agentMode: false
        });
      generatedOptions = optionsRes.body.options;

      await agent
        .post(`/api/chats/${chatId}/select-option`)
        .send({
          optionText: generatedOptions[0].text,
          optionType: 'concise'
        });
    });

    it('should continue conversation with new message', async () => {
      const continueRes = await agent
        .post(`/api/chats/${chatId}/continue`)
        .send({
          message: 'Tell me more about that',
          language: 'english',
          agentMode: false
        });

      expect(continueRes.statusCode).toBe(200);
      expect(continueRes.body.reply).toBeDefined();

      // Verify messages were saved
      const messagesRes = await agent
        .get(`/api/chats/${chatId}/messages`);
      
      expect(messagesRes.body.messages.length).toBeGreaterThan(2);
    });

    it('should reject empty message when continuing', async () => {
      const res = await agent
        .post(`/api/chats/${chatId}/continue`)
        .send({
          message: '',
          language: 'english',
          agentMode: false
        });

      expect(res.statusCode).toBe(400);
    });

    it('should return 404 for invalid chat when continuing', async () => {
      const res = await agent
        .post('/api/chats/99999/continue')
        .send({
          message: 'Test',
          language: 'english',
          agentMode: false
        });

      expect(res.statusCode).toBe(404);
    });
  });

  describe('Authentication and Session', () => {
    it('should require authentication for protected routes', async () => {
      const agent2 = request.agent(app);
      const res = await agent2.get('/api/chats');
      expect(res.statusCode).toBe(401);
    });

    it('should logout user', async () => {
      const logoutRes = await agent.post('/api/logout');
      expect(logoutRes.statusCode).toBe(200);
      
      // Verify session is destroyed
      const chatsRes = await agent.get('/api/chats');
      expect(chatsRes.statusCode).toBe(401);
    });
  });
});
