/**
 * botService — thin shim that delegates to chatService.
 * Kept for backward compatibility with any remaining callers.
 * Prefer importing chatService directly in new code.
 */
import chatService from '../modules/chat/chatService.js';

export default chatService;
