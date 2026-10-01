export class DebounceDispatcher {
  private timers: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Debounces an action identified by key with a specified delay.
   *
   * @param key Unique key identifying the operation/target (e.g. file path or action id).
   * @param delayMs Delay in milliseconds.
   * @param action Callback to execute when timer expires.
   */
  public debounce(key: string, delayMs: number, action: () => void | Promise<void>): void {
    const existing = this.timers.get(key);
    if (existing) {
      clearTimeout(existing);
    }

    const timer = setTimeout(async () => {
      this.timers.delete(key);
      try {
        await action();
      } catch (err) {
        console.error(`Error in debounced action for key "${key}":`, err);
      }
    }, delayMs);

    this.timers.set(key, timer);
  }

  public cancel(key: string): void {
    const existing = this.timers.get(key);
    if (existing) {
      clearTimeout(existing);
      this.timers.delete(key);
    }
  }

  public dispose(): void {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
  }
}
