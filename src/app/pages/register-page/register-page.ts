import { Component, inject, signal } from '@angular/core';
import { FormField, form, minLength, required, submit } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import {
  InvalidRegistrationError,
  LocalDatabaseError,
  UsernameTakenError,
} from '../../data/local-data.service';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [FormField, RouterLink],
  templateUrl: './register-page.html',
  styleUrl: '../login-page/login-page.scss',
})
export class RegisterPage {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly credentials = signal({ username: '', displayName: '', password: '' });
  protected readonly registrationForm = form(this.credentials, (path) => {
    required(path.username, { message: 'Введіть ім’я користувача.' });
    minLength(path.username, 3, { message: 'Введіть щонайменше 3 символи.' });
    required(path.displayName, { message: 'Введіть ім’я для профілю.' });
    minLength(path.displayName, 2, { message: 'Введіть щонайменше 2 символи.' });
    required(path.password, { message: 'Введіть пароль.' });
    minLength(path.password, 8, { message: 'Пароль має містити щонайменше 8 символів.' });
  });
  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal('');

  protected onSubmit(): void {
    this.errorMessage.set('');
    void submit(this.registrationForm, async () => {
      this.submitting.set(true);

      try {
        const { username, displayName, password } = this.credentials();
        await this.authService.register(username, displayName, password);
        await this.router.navigateByUrl('/search');
      } catch (error) {
        if (error instanceof UsernameTakenError) {
          this.errorMessage.set('Це ім’я користувача вже зайняте на цьому пристрої.');
        } else if (error instanceof InvalidRegistrationError || error instanceof LocalDatabaseError) {
          this.errorMessage.set(error.message);
        } else if (error instanceof Error) {
          this.errorMessage.set(error.message);
        } else {
          throw error;
        }
      } finally {
        this.submitting.set(false);
      }
    });
  }
}
