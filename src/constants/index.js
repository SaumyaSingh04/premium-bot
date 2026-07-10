export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
};

export const BOT_MESSAGES = {
  WELCOME: (name) =>
    `👋 Hello, *${name}*\\! I'm your AI assistant powered by *Groq \\+ Llama 3\\.3*\\.\n\n` +
    `Just send me any message and I'll respond intelligently\\.\n\n` +
    `Type /help to see all available commands\\.`,

  HELP:
    `🤖 *Available Commands*\n\n` +
    `/start \\- Welcome message\n` +
    `/help \\- Show this help\n` +
    `/chat <prompt> \\- Chat with AI directly\n` +
    `/new \\- Start a new conversation\n` +
    `/clear \\- Clear conversation history\n` +
    `/ping \\- Check bot latency\n` +
    `/about \\- About this bot\n` +
    `/stats \\- Your usage statistics\n` +
    `/settings \\- View your current settings\n` +
    `/balance \\- Check your coin balance\n` +
    `/plans \\- View available coin plans\n` +
    `/buy \\- Buy coins with Telegram Stars\n` +
    `/history \\- Your generation history\n` +
    `/generate <prompt> \\- Generate an AI image\n` +
    `/edit <prompt> \\- Edit an image \\(reply to a photo\\)\n` +
    `/video <prompt> \\- Generate an AI video\n\n` +
    `💬 *Just type any message to chat with the AI\\.*`,

  CHAT_NO_PROMPT: '💬 Please provide a message. Usage: /chat <your message>',

  NEW: '🆕 New conversation started. What would you like to talk about?',
  CLEAR: '🗑️ Conversation history cleared. Starting fresh!',
  ERROR: '❌ Something went wrong. Please try again in a moment.',
  THINKING: '🤔 Thinking...',
  RATE_LIMITED: "⏳ You're sending messages too fast. Please wait a moment.",
  TIMEOUT: '⌛ The AI took too long to respond. Please try again.',
  UNKNOWN_COMMAND: '❓ Unknown command. Type /help to see available commands.',
  CREDITS_EXHAUSTED: '💳 You have used all your daily free credits. Come back tomorrow for more!',
};

export const AI_DEFAULTS = {
  MAX_TOKENS: 1024,
  TEMPERATURE: 0.7,
  MAX_HISTORY: 20,
  MODEL: 'llama-3.3-70b-versatile',
};
