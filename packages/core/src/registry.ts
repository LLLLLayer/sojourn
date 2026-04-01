export class Registry<T> {
  private items = new Map<string, new (...args: any[]) => T>();

  register(name: string, ctor: new (...args: any[]) => T): void {
    this.items.set(name, ctor);
  }

  get(name: string, ...args: any[]): T {
    const Ctor = this.items.get(name);
    if (!Ctor) {
      const available = this.list().join(", ");
      throw new Error(`Unknown "${name}". Available: ${available}`);
    }
    return new Ctor(...args);
  }

  list(): string[] {
    return [...this.items.keys()];
  }

  has(name: string): boolean {
    return this.items.has(name);
  }
}
