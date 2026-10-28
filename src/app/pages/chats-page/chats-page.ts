import { DatePipe } from '@angular/common';
import { NgOptimizedImage } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormField, form, maxLength, required, submit } from '@angular/forms/signals';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../../auth/auth.service';
import { LocalDataService } from '../../data/local-data.service';
import { LocalProfile } from '../../data/local-profile';

@Component({
  selector: 'app-chats-page',
  standalone: true,
  imports: [DatePipe, FormField, NgOptimizedImage, RouterLink],
  template: `
    <section class="chats-page">
      @if (recipient(); as activeRecipient) {
        <header class="chats-page__header">
          <a class="chats-page__back" routerLink="/chats" aria-label="До списку чатів">←</a>
          <img
            [ngSrc]="activeRecipient.avatarUrl || '/assets/imgs/img.png'"
            [alt]="'Аватар ' + activeRecipient.displayName"
            width="46"
            height="46"
          >
          <div>
            <h1>{{ activeRecipient.displayName }}</h1>
            <a [routerLink]="['/profile', activeRecipient.id]">&#64;{{ activeRecipient.username }}</a>
          </div>
        </header>

        <div class="chats-page__messages" aria-live="polite">
          @if (conversationMessages().length) {
            @for (message of conversationMessages(); track message.id) {
              <article class="message" [class.message--own]="message.senderId === currentUser()?.id">
                <p>{{ message.text }}</p>
                @if (message.isDemo) {
                  <span class="message__demo-label">Демо</span>
                }
                <time [attr.datetime]="message.createdAt">{{ message.createdAt | date: 'shortTime' }}</time>
              </article>
            }
          } @else {
            <p class="chats-page__empty-thread">Почніть розмову — напишіть перше повідомлення.</p>
          }
        </div>

        <form class="chats-page__composer" (submit)="$event.preventDefault(); sendMessage()" novalidate>
          <label class="visually-hidden" for="message">Повідомлення</label>
          <textarea
            id="message"
            rows="2"
            placeholder="Напишіть повідомлення…"
            [formField]="messageForm.text"
          ></textarea>
          @if (messageForm.text().invalid() && messageForm.text().touched()) {
            <p class="chats-page__error">{{ messageForm.text().errors()[0].message }}</p>
          }
          @if (errorMessage()) {
            <p class="chats-page__error" role="alert">{{ errorMessage() }}</p>
          }
          <button type="submit" [disabled]="sending() || messageForm().invalid()">
            {{ sending() ? 'Надсилаємо…' : 'Надіслати' }}
          </button>
        </form>
      } @else {
        <header class="chats-page__title">
          <h1>Чати</h1>
          <p>Профілі й повідомлення з позначкою «Демо» — приклади для перегляду.</p>
        </header>

        @if (conversations().length) {
          <section class="chats-page__section" aria-labelledby="recent-title">
            <h2 id="recent-title">Останні розмови</h2>
            <div class="chats-page__contacts">
              @for (conversation of conversations(); track conversation.profile.id) {
                <button
                  type="button"
                  class="contact"
                  (click)="openConversation(conversation.profile.id)"
                >
                  <img
                    [ngSrc]="conversation.profile.avatarUrl || '/assets/imgs/img.png'"
                    [alt]="'Аватар ' + conversation.profile.displayName"
                    width="46"
                    height="46"
                  >
                  <span class="contact__text">
                    <strong>{{ conversation.profile.displayName }}</strong>
                    <span>{{ conversation.lastMessage }}</span>
                  </span>
                  @if (conversation.isDemo) {
                    <span class="contact__badge">Демо</span>
                  }
                  <time>{{ conversation.createdAt | date: 'shortTime' }}</time>
                </button>
              }
            </div>
          </section>
        }

        <section class="chats-page__section" aria-labelledby="people-title">
          <h2 id="people-title">{{ conversations().length ? 'Написати комусь' : 'Користувачі' }}</h2>
          @if (contacts().length) {
            <div class="chats-page__contacts">
              @for (contact of contacts(); track contact.id) {
                <button type="button" class="contact" (click)="openConversation(contact.id)">
                  <img
                    [ngSrc]="contact.avatarUrl || '/assets/imgs/img.png'"
                    [alt]="'Аватар ' + contact.displayName"
                    width="46"
                    height="46"
                  >
                  <span class="contact__text">
                    <strong>{{ contact.displayName }}</strong>
                    <span>&#64;{{ contact.username }}</span>
                  </span>
                  <span class="contact__action">Написати</span>
                </button>
              }
            </div>
          } @else {
            <div class="chats-page__empty">
              <h2>Поки що немає з ким поспілкуватися</h2>
              <p>Зареєструйте ще один акаунт у цьому браузері або скористайтеся Tik-Talk на іншому пристрої після підключення сервера.</p>
              <a routerLink="/search">Перейти до пошуку</a>
            </div>
          }
        </section>
      }
    </section>
  `,
  styles: `
    .chats-page { display: flex; flex-direction: column; width: min(100%, 900px); min-height: calc(100vh - 80px); margin: 0 auto; }
    .chats-page__title { margin-bottom: 28px; }
    .chats-page__title h1 { margin-bottom: 8px; font-size: 28px; }
    .chats-page__title p, .chats-page__empty p { color: var(--muted-color); line-height: 1.6; }
    .chats-page__section { margin-bottom: 28px; }
    .chats-page__section > h2 { margin-bottom: 14px; font-size: 17px; }
    .chats-page__contacts { display: grid; gap: 10px; }
    .contact {
      display: flex; align-items: center; gap: 14px; width: 100%; min-height: 76px; padding: 12px 16px;
      border: 1px solid var(--border-color); border-radius: 12px; background: var(--card-bg);
      color: var(--light-color); cursor: pointer; font: inherit; text-align: left;
    }
    .contact:hover, .contact:focus-visible { border-color: var(--primary-color); }
    .contact:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }
    .contact > img, .chats-page__header > img { width: 46px; height: 46px; border-radius: 50%; object-fit: cover; }
    .contact__text { display: flex; flex: 1; flex-direction: column; gap: 5px; min-width: 0; }
    .contact__text > span { overflow: hidden; color: var(--muted-color); font-size: 13px; text-overflow: ellipsis; white-space: nowrap; }
    .contact time { color: var(--muted-color); font-size: 12px; }
    .contact__action { color: var(--primary-color); font-size: 13px; font-weight: 600; }
    .contact__badge, .message__demo-label {
      padding: 3px 7px; border-radius: 999px; background: rgb(161 112 255 / 15%);
      color: var(--primary-color); font-size: 11px;
    }
    .chats-page__empty { padding: 28px; border: 1px solid var(--border-color); border-radius: 12px; background: var(--card-bg); }
    .chats-page__empty h2 { margin-bottom: 8px; font-size: 18px; }
    .chats-page__empty a { display: inline-flex; margin-top: 16px; color: var(--primary-color); }
    .chats-page__header { display: flex; align-items: center; gap: 14px; padding: 16px 0; border-bottom: 1px solid var(--border-color); }
    .chats-page__header h1 { margin-bottom: 5px; font-size: 18px; }
    .chats-page__header a:not(.chats-page__back) { color: var(--muted-color); font-size: 13px; }
    .chats-page__back { color: var(--light-color); font-size: 26px; }
    .chats-page__messages { display: flex; flex: 1; flex-direction: column; justify-content: flex-end; gap: 12px; padding: 24px 0; }
    .chats-page__empty-thread { align-self: center; padding: 16px; color: var(--muted-color); text-align: center; }
    .message { align-self: flex-start; max-width: min(75%, 560px); padding: 12px 14px 8px; border-radius: 14px 14px 14px 4px; background: var(--card-bg); }
    .message--own { align-self: flex-end; border-radius: 14px 14px 4px 14px; background: var(--primary-color); color: var(--dark-color); }
    .message p { white-space: pre-wrap; overflow-wrap: anywhere; }
    .message__demo-label { display: inline-flex; margin-top: 6px; }
    .message time { display: block; margin-top: 6px; color: inherit; font-size: 11px; opacity: .7; text-align: right; }
    .chats-page__composer { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 12px; padding: 16px 0; border-top: 1px solid var(--border-color); }
    .chats-page__composer textarea { width: 100%; resize: vertical; padding: 12px; border: 1px solid var(--border-color); border-radius: 10px; background: var(--card-bg); color: var(--light-color); font: inherit; }
    .chats-page__composer textarea:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }
    .chats-page__composer button { align-self: end; min-height: 44px; padding: 0 16px; border: 0; border-radius: 8px; background: var(--primary-color); color: var(--dark-color); cursor: pointer; font: inherit; font-weight: 600; }
    .chats-page__composer button:disabled { cursor: not-allowed; opacity: .6; }
    .chats-page__error { grid-column: 1 / -1; color: #ff9999; font-size: 13px; }
    .visually-hidden { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
    @media (max-width: 600px) {
      .chats-page { min-height: calc(100vh - 32px); }
      .chats-page__composer { grid-template-columns: 1fr; }
      .chats-page__composer button { justify-self: end; }
      .contact time { display: none; }
      .contact__action { font-size: 12px; }
    }
  `,
})
export class ChatsPage {
  private readonly route = inject(ActivatedRoute);
  private readonly queryParams = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly data = inject(LocalDataService);

  protected readonly currentUser = this.auth.currentUser;
  protected readonly recipient = computed(() => {
    const userId = this.queryParams().get('user');
    const currentUserId = this.currentUser()?.id;
    return userId && userId !== currentUserId ? this.data.findProfile(userId) : undefined;
  });
  protected readonly contacts = computed(() => {
    const currentUserId = this.currentUser()?.id;
    return currentUserId ? this.data.searchProfiles('', currentUserId) : [];
  });
  protected readonly conversationMessages = computed(() => {
    const senderId = this.currentUser()?.id;
    const recipientId = this.recipient()?.id;
    return senderId && recipientId
      ? this.data.getConversationMessages(senderId, recipientId)
      : [];
  });
  protected readonly conversations = computed(() => {
    const currentUserId = this.currentUser()?.id;
    if (!currentUserId) {
      return [];
    }

    const latestByContact = new Map<string, {
      profile: LocalProfile;
      lastMessage: string;
      createdAt: string;
      isDemo: boolean;
    }>();

    for (const message of this.data.messages()) {
      const contactId = message.senderId === currentUserId
        ? message.recipientId
        : message.recipientId === currentUserId ? message.senderId : undefined;

      if (!contactId) {
        continue;
      }

      const existing = latestByContact.get(contactId);
      if (existing && existing.createdAt >= message.createdAt) {
        continue;
      }

      const profile = this.data.findProfile(contactId);
      if (profile) {
        latestByContact.set(contactId, {
          profile,
          lastMessage: message.text,
          createdAt: message.createdAt,
          isDemo: message.isDemo,
        });
      }
    }

    return [...latestByContact.values()].sort((first, second) =>
      second.createdAt.localeCompare(first.createdAt),
    );
  });

  protected readonly messageValues = signal({ text: '' });
  protected readonly messageForm = form(this.messageValues, (path) => {
    required(path.text, { message: 'Введіть текст повідомлення.' });
    maxLength(path.text, 2000, { message: 'Повідомлення не може перевищувати 2000 символів.' });
  });
  protected readonly sending = signal(false);
  protected readonly errorMessage = signal('');

  protected openConversation(userId: string): void {
    void this.navigateToConversation(userId);
  }

  protected sendMessage(): void {
    this.errorMessage.set('');
    void submit(this.messageForm, async () => {
      const senderId = this.currentUser()?.id;
      const recipientId = this.recipient()?.id;
      if (!senderId || !recipientId) {
        this.errorMessage.set('Не вдалося відкрити цей діалог.');
        return;
      }

      this.sending.set(true);

      try {
        this.data.sendMessage(senderId, recipientId, this.messageValues().text);
        this.messageValues.set({ text: '' });
      } catch (error) {
        if (error instanceof Error) {
          this.errorMessage.set(error.message);
          return;
        }

        throw error;
      } finally {
        this.sending.set(false);
      }
    });
  }

  private async navigateToConversation(userId: string): Promise<void> {
    await this.router.navigate(['/chats'], { queryParams: { user: userId } });
  }
}
