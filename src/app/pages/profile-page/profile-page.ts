import { Component, computed, inject, linkedSignal, signal } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { FormField, form, maxLength, minLength, required, submit } from '@angular/forms/signals';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../../auth/auth.service';
import { LocalDataService } from '../../data/local-data.service';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [FormField, NgOptimizedImage, RouterLink],
  template: `
    <section class="profile-page">
      @if (profile(); as viewedProfile) {
        <header class="profile-page__header">
          <img
            [ngSrc]="viewedProfile.avatarUrl || '/assets/imgs/img.png'"
            [alt]="'Аватар користувача ' + viewedProfile.displayName"
            width="88"
            height="88"
          >
          <div>
            <h1>{{ viewedProfile.displayName }}</h1>
            <p>&#64;{{ viewedProfile.username }}</p>
          </div>
        </header>

        @if (isOwnProfile()) {
          <form class="profile-page__form" (submit)="$event.preventDefault(); saveProfile()" novalidate>
            <h2>Редагувати профіль</h2>
            <label for="display-name">Ім’я профілю</label>
            <input id="display-name" autocomplete="name" [formField]="profileForm.displayName">
            @if (profileForm.displayName().invalid() && profileForm.displayName().touched()) {
              <p class="profile-page__error">{{ profileForm.displayName().errors()[0].message }}</p>
            }

            <label for="bio">Про себе</label>
            <textarea id="bio" rows="4" [formField]="profileForm.bio"></textarea>
            <p class="profile-page__hint">{{ profileForm.bio().value().length }}/240</p>
            @if (profileForm.bio().invalid() && profileForm.bio().touched()) {
              <p class="profile-page__error">{{ profileForm.bio().errors()[0].message }}</p>
            }

            @if (errorMessage()) {
              <p class="profile-page__error" role="alert">{{ errorMessage() }}</p>
            }
            @if (saved()) {
              <p class="profile-page__success" role="status">Зміни збережено.</p>
            }

            <button type="submit" [disabled]="saving() || profileForm().invalid()">
              {{ saving() ? 'Зберігаємо…' : 'Зберегти зміни' }}
            </button>
          </form>
        } @else {
          <div class="profile-page__bio">
            <h2>Про себе</h2>
            <p>{{ viewedProfile.bio || 'Поки що без опису профілю.' }}</p>
            <a [routerLink]="['/chats']" [queryParams]="{ user: viewedProfile.id }">Написати повідомлення</a>
          </div>
        }
      } @else {
        <div class="profile-page__empty">
          <h1>Профіль не знайдено</h1>
          <a routerLink="/search">Повернутися до пошуку</a>
        </div>
      }
    </section>
  `,
  styles: `
    .profile-page { max-width: 760px; margin: 0 auto; }
    .profile-page__header { display: flex; align-items: center; gap: 20px; margin-bottom: 32px; }
    .profile-page__header img { width: 88px; height: 88px; border-radius: 50%; object-fit: cover; }
    .profile-page__header h1 { margin-bottom: 6px; font-size: 28px; }
    .profile-page__header p, .profile-page__hint { color: var(--muted-color); }
    .profile-page__form, .profile-page__bio, .profile-page__empty {
      display: flex; flex-direction: column; gap: 12px; padding: 24px;
      border: 1px solid var(--border-color); border-radius: 14px; background: var(--card-bg);
    }
    .profile-page__form h2, .profile-page__bio h2 { margin-bottom: 8px; font-size: 18px; }
    .profile-page__form label { margin-top: 6px; font-size: 14px; font-weight: 600; }
    .profile-page__form input, .profile-page__form textarea {
      width: 100%; padding: 12px; border: 1px solid var(--border-color); border-radius: 8px;
      background: var(--dark-color); color: var(--light-color); font: inherit;
    }
    .profile-page__form :is(input, textarea):focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }
    .profile-page__hint { align-self: flex-end; font-size: 12px; }
    .profile-page__error { color: #ff9999; font-size: 14px; }
    .profile-page__success { color: #89d6a5; font-size: 14px; }
    .profile-page__form button, .profile-page__bio a {
      width: fit-content; min-height: 42px; padding: 0 16px; border: 0; border-radius: 8px;
      background: var(--primary-color); color: var(--dark-color); cursor: pointer;
      display: inline-flex; align-items: center; font: inherit; font-weight: 600;
    }
    .profile-page__form button:disabled { cursor: not-allowed; opacity: .6; }
    .profile-page__form button:focus-visible, .profile-page__bio a:focus-visible {
      outline: 2px solid var(--light-color); outline-offset: 3px;
    }
    .profile-page__bio p { color: var(--muted-color); line-height: 1.6; white-space: pre-wrap; }
    .profile-page__bio a { margin-top: 12px; }
  `,
})
export class ProfilePage {
  private readonly route = inject(ActivatedRoute);
  private readonly routeParams = toSignal(this.route.paramMap, { initialValue: this.route.snapshot.paramMap });
  private readonly auth = inject(AuthService);
  private readonly data = inject(LocalDataService);

  protected readonly profile = computed(() => {
    const id = this.routeParams().get('id');
    return !id || id === 'me'
      ? this.auth.currentUser()
      : this.data.findProfile(id);
  });
  protected readonly isOwnProfile = computed(() => this.profile()?.id === this.auth.currentUser()?.id);
  protected readonly profileValues = linkedSignal(() => ({
    displayName: this.profile()?.displayName ?? '',
    bio: this.profile()?.bio ?? '',
  }));
  protected readonly profileForm = form(this.profileValues, (path) => {
    required(path.displayName, { message: 'Введіть ім’я профілю.' });
    minLength(path.displayName, 2, { message: 'Введіть щонайменше 2 символи.' });
    maxLength(path.displayName, 40, { message: 'Ім’я не може перевищувати 40 символів.' });
    maxLength(path.bio, 240, { message: 'Опис не може перевищувати 240 символів.' });
  });
  protected readonly saving = signal(false);
  protected readonly saved = signal(false);
  protected readonly errorMessage = signal('');

  protected saveProfile(): void {
    this.saved.set(false);
    this.errorMessage.set('');
    void submit(this.profileForm, async () => {
      const currentProfile = this.profile();
      if (!currentProfile || !this.isOwnProfile()) {
        return;
      }

      this.saving.set(true);

      try {
        this.data.updateProfile(currentProfile.id, this.profileValues());
        this.saved.set(true);
      } catch (error) {
        if (error instanceof Error) {
          this.errorMessage.set(error.message);
          return;
        }

        throw error;
      } finally {
        this.saving.set(false);
      }
    });
  }
}
