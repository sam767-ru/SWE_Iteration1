const {
  generateChatReply,
  getFallbackReply,
  detectIntent
} = require('../../server/chatService');

describe('Chat Service Unit Tests', () => {
  
  describe('detectIntent', () => {
    it('should detect greeting intent', () => {
      const intent = detectIntent('Hello there!');
      expect(intent).toBe('greeting');
    });

    it('should detect greeting with hey', () => {
      const intent = detectIntent('Hey, how are you?');
      expect(intent).toBe('greeting');
    });

    it('should detect recipe intent', () => {
      const intent = detectIntent('I need a recipe for pasta');
      expect(intent).toBe('recipe');
    });

    it('should detect cooking intent', () => {
      const intent = detectIntent('What should I cook for dinner?');
      expect(intent).toBe('recipe');
    });

    it('should detect homework intent', () => {
      const intent = detectIntent('Can you help me with my math homework?');
      expect(intent).toBe('homework');
    });

    it('should detect coding intent', () => {
      const intent = detectIntent('Help me debug my JavaScript code');
      expect(intent).toBe('coding');
    });

    it('should detect Python coding intent', () => {
      const intent = detectIntent('How do I write a loop in Python?');
      expect(intent).toBe('coding');
    });

    it('should detect math intent', () => {
      const intent = detectIntent('Solve this equation: 2x + 5 = 15');
      expect(intent).toBe('math');
    });

    it('should detect writing intent', () => {
      const intent = detectIntent('Can you help me rewrite this essay?');
      expect(intent).toBe('writing');
    });

    it('should detect travel intent', () => {
      const intent = detectIntent('I want to plan a trip to Paris');
      expect(intent).toBe('travel');
    });

    it('should detect fitness intent', () => {
      const intent = detectIntent('Give me a workout routine');
      expect(intent).toBe('fitness');
    });

    it('should detect brainstorming intent', () => {
      const intent = detectIntent('I need project ideas for my class');
      expect(intent).toBe('brainstorming');
    });

    it('should detect explanation intent', () => {
      const intent = detectIntent('What is quantum entanglement?');
      expect(intent).toBe('explanation');
    });

    it('should detect summarization intent', () => {
      const intent = detectIntent('Can you summarize this article?');
      expect(intent).toBe('summarization');
    });

    it('should detect planning intent', () => {
      const intent = detectIntent('Help me organize my schedule');
      expect(intent).toBe('planning');
    });

    it('should detect time intent', () => {
      const intent = detectIntent('What time is it?');
      expect(intent).toBe('time');
    });

    it('should detect weather intent', () => {
      const intent = detectIntent('What is the weather today?');
      expect(intent).toBe('weather');
    });

    it('should default to general intent', () => {
      const intent = detectIntent('Random unrelated text that doesnt match anything');
      expect(intent).toBe('general');
    });
  });

  describe('getFallbackReply', () => {
    it('should handle empty message', () => {
      const reply = getFallbackReply('');
      expect(reply.toLowerCase()).toContain('please enter');
    });

    it('should return greeting response for hello', () => {
      const reply = getFallbackReply('hello', 'english', false);
      expect(reply.toLowerCase()).toContain('hello');
    });

    it('should return recipe-related response', () => {
      const reply = getFallbackReply('Can you give me a recipe?', 'english', false);
      expect(reply.toLowerCase()).toContain('recipe');
    });

    it('should return homework-related response', () => {
      const reply = getFallbackReply('Help me with homework', 'english', false);
      expect(reply.toLowerCase()).toContain('homework');
    });

    it('should return coding-related response', () => {
      const reply = getFallbackReply('Help me debug my javascript code', 'english', false);
      expect(reply.toLowerCase()).toContain('coding');
    });

    it('should return math-related response', () => {
      const reply = getFallbackReply('Solve this math problem', 'english', false);
      expect(reply.toLowerCase()).toContain('math');
    });

    it('should provide different response lengths based on agentMode', () => {
      const shortReply = getFallbackReply('Explain AI', 'english', false);
      const longReply = getFallbackReply('Explain AI', 'english', true);
      
      expect(longReply.length).toBeGreaterThan(shortReply.length);
      expect(longReply.length).toBeGreaterThan(40);
    });

    it('should localize responses to Spanish', () => {
      const englishReply = getFallbackReply('hello', 'english', false);
      const spanishReply = getFallbackReply('hello', 'spanish', false);
      
      expect(englishReply.toLowerCase()).toContain('hello');
      expect(spanishReply.toLowerCase()).toContain('hola');
    });

    it('should localize responses to French', () => {
      const frenchReply = getFallbackReply('hello', 'french', false);
      expect(frenchReply.toLowerCase()).toContain('bonjour');
    });

    it('should return detailed response for agent mode on recipe query', () => {
      const reply = getFallbackReply('recipe for pasta', 'english', true);
      expect(reply.length).toBeGreaterThan(50);
      expect(reply.toLowerCase()).toContain('recipe');
    });

    it('should return detailed response for agent mode on coding query', () => {
      const reply = getFallbackReply('help with JavaScript', 'english', true);
      expect(reply.length).toBeGreaterThan(50);
      expect(reply.toLowerCase()).toContain('code');
    });
  });

  describe('generateChatReply', () => {
    const originalEnv = { ...process.env };

    beforeEach(() => {
      // Save original environment
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      // Restore environment
      process.env = { ...originalEnv };
    });

    it('should throw error for empty message', async () => {
      await expectAsync(
        generateChatReply({
          message: '',
          language: 'english',
          agentMode: false
        })
      ).toBeRejectedWithError('Message cannot be empty.');
    });

    it('should throw error for whitespace-only message', async () => {
      await expectAsync(
        generateChatReply({
          message: '   ',
          language: 'english',
          agentMode: false
        })
      ).toBeRejectedWithError('Message cannot be empty.');
    });

    it('should fall back to local logic when Ollama is not available', async () => {
      // Set invalid API URL to force fallback
      process.env.OLLAMA_API_URL = 'http://invalid-url:9999';
      
      const reply = await generateChatReply({
        message: 'test message',
        language: 'english',
        agentMode: false
      });

      expect(typeof reply).toBe('string');
      expect(reply.length).toBeGreaterThan(0);
    });

    it('should handle history array correctly', async () => {
      const history = [
        { sender: 'user', content: 'Previous message' },
        { sender: 'bot', content: 'Previous response' }
      ];

      process.env.OLLAMA_API_URL = 'http://invalid-url:9999';
      
      const reply = await generateChatReply({
        message: 'New message',
        history,
        language: 'english',
        agentMode: false
      });

      expect(typeof reply).toBe('string');
      expect(reply.length).toBeGreaterThan(0);
    });

    it('should handle agentMode true', async () => {
      process.env.OLLAMA_API_URL = 'http://invalid-url:9999';
      
      const reply = await generateChatReply({
        message: 'Tell me something interesting',
        language: 'english',
        agentMode: true
      });

      expect(typeof reply).toBe('string');
      expect(reply.length).toBeGreaterThan(0);
    });

    it('should handle Spanish language', async () => {
      process.env.OLLAMA_API_URL = 'http://invalid-url:9999';
      
      const reply = await generateChatReply({
        message: 'hello',
        language: 'spanish',
        agentMode: false
      });

      expect(typeof reply).toBe('string');
      // Should contain Spanish content from fallback
      expect(reply.length).toBeGreaterThan(0);
    });

    it('should handle French language', async () => {
      process.env.OLLAMA_API_URL = 'http://invalid-url:9999';
      
      const reply = await generateChatReply({
        message: 'hello',
        language: 'french',
        agentMode: false
      });

      expect(typeof reply).toBe('string');
      expect(reply.length).toBeGreaterThan(0);
    });

    it('should handle history with text property (legacy format)', async () => {
      const history = [
        { sender: 'user', text: 'Legacy message' },
        { sender: 'bot', text: 'Legacy response' }
      ];

      process.env.OLLAMA_API_URL = 'http://invalid-url:9999';
      
      const reply = await generateChatReply({
        message: 'New message',
        history,
        language: 'english',
        agentMode: false
      });

      expect(typeof reply).toBe('string');
      expect(reply.length).toBeGreaterThan(0);
    });
  });
});
