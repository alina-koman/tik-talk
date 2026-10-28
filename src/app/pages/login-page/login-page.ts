import { Component, inject, signal } from '@angular/core';
import { FormField, form, required, submit } from '@angular/forms/signals';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [FormField, RouterLink],
  templateUrl: './login-page.html',
  styleUrl: './login-page.scss',
})
export class LoginPage {
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly credentials = signal({ username: '', password: '' });
  protected readonly loginForm = form(this.credentials, (path) => {
    required(path.username, { message: "Введіть ім'я користувача." });
    required(path.password, { message: 'Введіть пароль.' });
  });
  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal('');

  protected onSubmit(): void {
    this.errorMessage.set('');
    void submit(this.loginForm, async () => {
      this.submitting.set(true);

      try {
        const loggedIn = await this.authService.login(
          this.credentials().username,
          this.credentials().password,
        );

        if (!loggedIn) {
          this.errorMessage.set('Неправильне ім’я користувача або пароль.');
          return;
        }

        await this.router.navigateByUrl(this.getReturnUrl());
      } catch (error) {
        if (error instanceof Error) {
          this.errorMessage.set(error.message);
          return;
        }

        throw error;
      } finally {
        this.submitting.set(false);
      }
    });
  }

  private getReturnUrl(): string {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');

    if (returnUrl?.startsWith('/') && !returnUrl.startsWith('//') && !returnUrl.includes('\\')) {
      return returnUrl;
    }

    return '/search';
  }
}
