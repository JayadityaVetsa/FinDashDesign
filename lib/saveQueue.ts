const activeQueues = new Set<{ flushAll: () => Promise<boolean> }>();
export function registerSaveQueue(queue: { flushAll: () => Promise<boolean> }) {
  activeQueues.add(queue);
  return () => { activeQueues.delete(queue); };
}
export async function flushPendingSaves() {
  return (await Promise.all([...activeQueues].map(queue => queue.flushAll()))).every(Boolean);
}
/** Debounce per resource and serialize its writes so older requests cannot win. */
export class SaveQueue<T> {
  private pending = new Map<string, T>();
  private timers = new Map<string, ReturnType<typeof setTimeout>>();
  private running = new Map<string, Promise<boolean>>();

  constructor(
    private write: (id: string, value: T) => Promise<void>,
    private onError: (error: unknown) => void,
    private onChange: () => void = () => {},
    private delay = 600,
  ) {}

  get busy() { return this.pending.size > 0 || this.running.size > 0; }

  schedule(id: string, value: T) {
    this.pending.set(id, value);
    const timer = this.timers.get(id);
    if (timer) clearTimeout(timer);
    this.timers.set(id, setTimeout(() => { void this.flush(id); }, this.delay));
    this.onChange();
  }

  async flush(id: string): Promise<boolean> {
    const timer = this.timers.get(id);
    if (timer) clearTimeout(timer);
    this.timers.delete(id);
    const previous = this.running.get(id);
    if (previous) {
      if (!await previous) return false;
      return this.flush(id);
    }
    if (!this.pending.has(id)) return true;
    const value = this.pending.get(id)!;
    this.pending.delete(id);
    const task = Promise.resolve().then(async () => {
      try {
        await this.write(id, value);
        return true;
      } catch (error) {
        if (!this.pending.has(id)) this.pending.set(id, value);
        this.onError(error);
        return false;
      } finally {
        this.running.delete(id);
        this.onChange();
      }
    });
    this.running.set(id, task);
    this.onChange();
    const success = await task;
    return success ? this.flush(id) : false;
  }

  async flushAll(): Promise<boolean> {
    const ids = new Set([...this.pending.keys(), ...this.running.keys()]);
    const results = await Promise.all([...ids].map((id) => this.flush(id)));
    return results.every(Boolean);
  }
}
