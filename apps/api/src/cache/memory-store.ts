import { Global, Injectable, Module, OnModuleDestroy } from '@nestjs/common';

interface Entry {
  value: string;
  expiresAt: number;
}

/**
 * Stockage clé/valeur en mémoire avec expiration (remplace Redis).
 * Suffisant pour une instance unique (Render free tier) : les données sont perdues au
 * redémarrage et ne sont pas partagées entre plusieurs instances.
 */
@Injectable()
export class MemoryStore implements OnModuleDestroy {
  private readonly entries = new Map<string, Entry>();
  private readonly sweeper: NodeJS.Timeout;

  constructor() {
    // Purge périodique des clés expirées pour borner la mémoire
    this.sweeper = setInterval(() => this.sweep(), 60_000);
    this.sweeper.unref();
  }

  set(key: string, value: string, ttlSeconds: number): void {
    this.entries.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  }

  get(key: string): string | null {
    const entry = this.entries.get(key);
    if (!entry) return null;
    if (entry.expiresAt <= Date.now()) {
      this.entries.delete(key);
      return null;
    }
    return entry.value;
  }

  /** Lecture + suppression atomique (Node est mono-thread) : jetons à usage unique. */
  getdel(key: string): string | null {
    const value = this.get(key);
    this.entries.delete(key);
    return value;
  }

  delete(key: string): void {
    this.entries.delete(key);
  }

  get size(): number {
    return this.entries.size;
  }

  sweep(now = Date.now()): void {
    for (const [key, entry] of this.entries) if (entry.expiresAt <= now) this.entries.delete(key);
  }

  onModuleDestroy() {
    clearInterval(this.sweeper);
  }
}

@Global()
@Module({ providers: [MemoryStore], exports: [MemoryStore] })
export class MemoryStoreModule {}
