type AnnouncerListener = (message: string) => void;

class AnnouncerService {
  private listeners: Set<AnnouncerListener> = new Set();
  private lastMessage: string = '';
  private lastTime: number = 0;

  /**
   * Subscribes a listener to live announcements.
   */
  subscribe(listener: AnnouncerListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Broadcasts a message to screen readers with polite throttling.
   */
  announce(message: string, throttleMs = 300): void {
    const now = Date.now();
    if (!message || (message === this.lastMessage && now - this.lastTime < throttleMs)) {
      return;
    }
    this.lastMessage = message;
    this.lastTime = now;
    this.listeners.forEach((listener) => {
      try {
        listener(message);
      } catch (err) {
        console.error('[Announcer] Listener error:', err);
      }
    });
  }
}

export const announcer = new AnnouncerService();
export const announce = (msg: string, throttleMs?: number) => announcer.announce(msg, throttleMs);
