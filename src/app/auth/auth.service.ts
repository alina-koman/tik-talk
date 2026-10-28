import { computed, inject, Injectable, signal } from '@angular/core';
import { LocalDataService } from '../data/local-data.service';
import { LocalProfile } from '../data/local-profile';

const SESSION_KEY = 'tik-talk.current-user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly localData = inject(LocalDataService);
  private readonly currentUserId = signal<string | undefined>(this.restoreSession());

  readonly currentUser = computed(() => {
    const userId = this.currentUserId();
    return userId ? this.localData.findProfile(userId) : undefined;
  });
  readonly isAuthenticated = computed(() => this.currentUser() !== undefined);

  async register(username: string, displayName: string, password: string): Promise<LocalProfile> {
    const profile = await this.localData.register(username, displayName, password);
    this.startSession(profile.id);
    return profile;
  }

  async login(username: string, password: string): Promise<boolean> {
    const profile = await this.localData.authenticate(username, password);

    if (!profile) {
      return false;
    }

    this.startSession(profile.id);
    return true;
  }

  logout(): void {
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch (error) {
      throw new Error('Не вдалося завершити сесію в локальному сховищі браузера.', { cause: error });
    }

    this.currentUserId.set(undefined);
  }

  private restoreSession(): string | undefined {
    let userId: string | null;

    try {
      userId = localStorage.getItem(SESSION_KEY);
    } catch (error) {
      throw new Error('Не вдалося відновити сесію з локального сховища браузера.', { cause: error });
    }

    if (!userId || !this.localData.findProfile(userId)) {
      return undefined;
    }

    return userId;
  }

  private startSession(userId: string): void {
    try {
      localStorage.setItem(SESSION_KEY, userId);
    } catch (error) {
      throw new Error('Не вдалося зберегти сесію в локальному сховищі браузера.', { cause: error });
    }

    this.currentUserId.set(userId);
  }
}
