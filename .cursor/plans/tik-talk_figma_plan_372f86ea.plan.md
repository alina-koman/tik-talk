---
name: Tik-Talk Figma Plan
overview: "План розробки Tik-Talk за Figma (після завершення початкового налаштування середовища, правил та скілів)."
todos:
  - id: design-tokens-shell
    content: Токени з Figma, сайдбар, layout-route, HttpClient в appConfig
    status: pending
  - id: auth
    content: Login сторінка, AuthService, interceptor, authGuard
    status: pending
  - id: search-cards
    content: Search page + ProfileCard з викликом API (вузол 4010-7817)
    status: pending
  - id: profile-settings
    content: Сторінка профілю та редагування (forms + PATCH)
    status: pending
  - id: chats
    content: Список чатів і діалог через ChatService
    status: pending
  - id: verify
    content: Звірка з Figma, ng build та тестування
    status: pending
isProject: false
---

# План розробки Tik-Talk (тільки розробка)

Усі початкові інструменти, правила (`.cursor/rules/tik-talk.mdc`) та конфігурації вже встановлені й перевірені. Шлях до ассетів виправлено.

Нижче наведено чистий план розробки функціоналу додатка:

## Кроки реалізації

### 1. Дизайн-система і оболонка
- Розширити CSS-змінні (dark background, accent, text muted, border) в `src/styles.scss`
- Компонент сайдбару: лого, навігація (Search / Chats / Profile), аватар знизу
- Layout-роут із `router-outlet` для авторизованої зони
- Оновити `src/app/app.routes.ts` та `src/app/app.config.ts`: додати `provideHttpClient` та інтерцептори

### 2. Auth
- Сторінка логіну (за макетом Figma)
- `AuthService`: методи логіну/реєстрації, збереження токенів
- HTTP Interceptor для додавання JWT заголовка та `authGuard` для захисту маршрутів

### 3. Пошук людей та картки профілю (вузол 4010-7817)
- Сторінка Search: пошукове поле + сітка карток
- Оновлення `ProfileCard` під `input()` профілю (аватар, ім’я, username, скіли, підписники)
- `ProfileService` для отримання списку користувачів та пошуку з публічного API

### 4. Профіль
- Сторінка профілю: шапка, опис, скіл-теги, підписники
- Роути `/profile/:id` та `/profile/me`
- Кнопки взаємодії («Підписатись» / «Написати»)

### 5. Редагування профілю
- Сторінка Settings: форма редагування (аватар, ім’я, опис, стек)
- Сигнал-форми / Reactive Forms та відправка `PATCH`-запиту на API

### 6. Чати
- Список діалогів та вікно повідомлень з полем введення
- `ChatService` для списку чатів, історії та відправки повідомлень

### 7. Фінальна перевірка
- Звірка екранів із вимогами Figma та проходження шляху користувача
- Виправлення тестів (зокрема `app.spec.ts`) та успішна збірка (`ng build`)
