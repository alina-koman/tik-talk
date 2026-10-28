import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  afterEach(() => localStorage.clear());

  it('registers, logs in, restores, and clears a local account session', async () => {
    const auth = TestBed.inject(AuthService);
    await auth.register('test-user', 'Test User', 'safe-password');

    expect(auth.isAuthenticated()).toBe(true);
    expect(auth.currentUser()?.username).toBe('test-user');
    expect(localStorage.getItem('tik-talk.current-user')).toBe(auth.currentUser()?.id);

    auth.logout();
    expect(auth.isAuthenticated()).toBe(false);
    expect(localStorage.getItem('tik-talk.current-user')).toBeNull();

    await expect(auth.login('test-user', 'safe-password')).resolves.toBe(true);
    expect(auth.isAuthenticated()).toBe(true);
    await expect(auth.login('test-user', 'wrong-password')).resolves.toBe(false);
  });
});
