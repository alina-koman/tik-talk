import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { ProfileCard } from '../../common-ui/profile-card/profile-card';
import { LocalDataService } from '../../data/local-data.service';

@Component({
  selector: 'app-search-page',
  standalone: true,
  imports: [ProfileCard],
  template: `
    <section class="page">
      <header class="page__header">
        <div>
          <h1>Пошук людей</h1>
          <p>Перегляньте профілі демокористувачів або знайдіть акаунти, зареєстровані в цьому браузері.</p>
        </div>
      </header>

      <label class="search__label" for="people-search">Ім’я або логін</label>
      <input
        id="people-search"
        class="search__input"
        type="search"
        autocomplete="off"
        placeholder="Наприклад, olena"
        [value]="query()"
        (input)="query.set($any($event.target).value)"
      >

      @if (profiles().length) {
        <div class="search__results">
          @for (profile of profiles(); track profile.id) {
            <app-profile-card
              [profile]="profile"
              (messageRequested)="openChat($event)"
            />
          }
        </div>
      } @else {
        <div class="empty-state">
          <h2>{{ query() ? 'Нікого не знайдено' : 'Поки що тут порожньо' }}</h2>
          <p>
            {{ query()
              ? 'Спробуйте змінити пошуковий запит.'
              : 'Зареєструйте ще один акаунт у цьому браузері або скористайтеся Tik-Talk на іншому пристрої після підключення сервера.' }}
          </p>
        </div>
      }
    </section>
  `,
  styles: `
    .page { max-width: 900px; margin: 0 auto; }
    .page__header { margin-bottom: 28px; }
    h1 { margin-bottom: 8px; font-size: 28px; }
    .page__header p, .empty-state p { color: var(--muted-color); line-height: 1.6; }
    .search__label { display: block; margin-bottom: 8px; font-size: 14px; font-weight: 600; }
    .search__input {
      width: 100%; min-height: 48px; margin-bottom: 24px; padding: 0 14px;
      border: 1px solid var(--border-color); border-radius: 10px;
      background: var(--card-bg); color: var(--light-color); font: inherit;
    }
    .search__input:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }
    .search__results { display: grid; gap: 14px; }
    .empty-state { padding: 36px 24px; border: 1px solid var(--border-color); border-radius: 14px; background: var(--card-bg); }
    .empty-state h2 { margin-bottom: 8px; font-size: 18px; }
  `,
})
export class SearchPage {
  private readonly auth = inject(AuthService);
  private readonly data = inject(LocalDataService);
  private readonly router = inject(Router);

  protected readonly query = signal('');
  protected readonly profiles = computed(() => {
    const userId = this.auth.currentUser()?.id;
    return userId ? this.data.searchProfiles(this.query(), userId) : [];
  });

  protected openChat(profileId: string): void {
    void this.router.navigate(['/chats'], { queryParams: { user: profileId } });
  }
}
