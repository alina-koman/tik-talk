import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
  });

  afterEach(() => localStorage.clear());

  it('redirects guests to login and retains the requested route', () => {
    const router = TestBed.inject(Router);
    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, { url: '/profile/me' } as RouterStateSnapshot),
    );

    expect(result).toBeInstanceOf(UrlTree);
    if (result instanceof UrlTree) {
      expect(router.serializeUrl(result)).toBe('/login?returnUrl=%2Fprofile%2Fme');
    }
  });
});
