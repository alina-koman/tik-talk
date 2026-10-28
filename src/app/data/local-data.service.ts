import { computed, Injectable, signal } from '@angular/core';
import { LocalMessage } from './local-message';
import { LocalProfile, ProfileChanges } from './local-profile';

const DATABASE_KEY = 'tik-talk.local-database';
const DATABASE_VERSION = 2;
const PASSWORD_ITERATIONS = 210_000;

interface StoredUser extends LocalProfile {
  passwordSalt: string;
  passwordHash: string;
}

interface LocalDatabase {
  version: number;
  users: StoredUser[];
  messages: LocalMessage[];
}

interface LegacyLocalDatabase {
  version: 1;
  users: Omit<StoredUser, 'isDemo'>[];
  messages: Omit<LocalMessage, 'isDemo'>[];
}

const DEMO_USERS: StoredUser[] = [
  {
    id: 'demo-maya',
    username: 'maya.rose',
    displayName: 'Мая Роуз',
    bio: 'Люблю книжки, каву та довгі прогулянки містом ☕',
    avatarUrl: '',
    isDemo: true,
    passwordSalt: '',
    passwordHash: '',
  },
  {
    id: 'demo-mark',
    username: 'marko.dev',
    displayName: 'Марко Левченко',
    bio: 'Дизайн, технології та нові знайомства ✨',
    avatarUrl: '',
    isDemo: true,
    passwordSalt: '',
    passwordHash: '',
  },
  {
    id: 'demo-sofia',
    username: 'sofia.sun',
    displayName: 'Софія Сонце',
    bio: 'Музика — це мій спосіб розповідати історії 🎧',
    avatarUrl: '',
    isDemo: true,
    passwordSalt: '',
    passwordHash: '',
  },
];

export class LocalDatabaseError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'LocalDatabaseError';
  }
}

export class UsernameTakenError extends Error {
  constructor() {
    super('An account with this username already exists on this device.');
    this.name = 'UsernameTakenError';
  }
}

export class InvalidRegistrationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidRegistrationError';
  }
}

@Injectable({ providedIn: 'root' })
export class LocalDataService {
  private readonly database = signal<LocalDatabase>(this.readDatabase());
  private readonly storedMessages = computed(() => this.database().messages);

  readonly profiles = computed(() => this.database().users.map(toProfile));
  readonly messages = this.storedMessages;

  async register(username: string, displayName: string, password: string): Promise<LocalProfile> {
    const normalizedUsername = username.trim().toLowerCase();
    const normalizedDisplayName = displayName.trim();

    if (!/^[a-z0-9._-]{3,24}$/.test(normalizedUsername)) {
      throw new InvalidRegistrationError(
        'Ім’я користувача має містити від 3 до 24 латинських літер, цифр, крапок, дефісів або підкреслень.',
      );
    }

    if (normalizedDisplayName.length < 2 || normalizedDisplayName.length > 40) {
      throw new InvalidRegistrationError('Ім’я має містити від 2 до 40 символів.');
    }

    if (password.length < 8) {
      throw new InvalidRegistrationError('Пароль має містити щонайменше 8 символів.');
    }

    if (this.database().users.some((user) => user.username === normalizedUsername)) {
      throw new UsernameTakenError();
    }

    const passwordSalt = createSalt();
    const passwordHash = await hashPassword(password, passwordSalt);
    const user: StoredUser = {
      id: crypto.randomUUID(),
      username: normalizedUsername,
      displayName: normalizedDisplayName,
      bio: '',
      avatarUrl: '',
      isDemo: false,
      passwordSalt,
      passwordHash,
    };

    const now = Date.now();
    const welcomeMessages: LocalMessage[] = [
      {
        id: crypto.randomUUID(),
        senderId: DEMO_USERS[0].id,
        recipientId: user.id,
        text: 'Привіт! Рада бачити тебе в Tik-Talk 👋',
        createdAt: new Date(now - 3 * 60_000).toISOString(),
        isDemo: true,
      },
      {
        id: crypto.randomUUID(),
        senderId: DEMO_USERS[1].id,
        recipientId: user.id,
        text: 'Вітаю! Зазирни в профіль — будемо знайомі 🙂',
        createdAt: new Date(now - 2 * 60_000).toISOString(),
        isDemo: true,
      },
      {
        id: crypto.randomUUID(),
        senderId: DEMO_USERS[2].id,
        recipientId: user.id,
        text: 'Привіт! Я додала сюди трохи демоданих, щоб було з чого почати 💜',
        createdAt: new Date(now - 60_000).toISOString(),
        isDemo: true,
      },
    ];

    this.saveDatabase({
      ...this.database(),
      users: [
        ...this.database().users.filter((storedUser) => !storedUser.isDemo),
        ...DEMO_USERS,
        user,
      ],
      messages: [
        ...this.database().messages,
        ...welcomeMessages,
      ],
    });

    return toProfile(user);
  }

  async authenticate(username: string, password: string): Promise<LocalProfile | undefined> {
    const normalizedUsername = username.trim().toLowerCase();
    const user = this.database().users.find((candidate) => candidate.username === normalizedUsername);

    if (!user || user.isDemo) {
      return undefined;
    }

    const passwordHash = await hashPassword(password, user.passwordSalt);

    return constantTimeEqual(passwordHash, user.passwordHash) ? toProfile(user) : undefined;
  }

  findProfile(id: string): LocalProfile | undefined {
    const user = this.database().users.find((candidate) => candidate.id === id);
    return user ? toProfile(user) : undefined;
  }

  updateProfile(id: string, changes: ProfileChanges): LocalProfile {
    const displayName = changes.displayName.trim();
    const bio = changes.bio.trim();

    if (displayName.length < 2 || displayName.length > 40) {
      throw new InvalidRegistrationError('Ім’я має містити від 2 до 40 символів.');
    }

    if (bio.length > 240) {
      throw new InvalidRegistrationError('Опис профілю не може перевищувати 240 символів.');
    }

    const user = this.database().users.find((candidate) => candidate.id === id);
    if (!user) {
      throw new LocalDatabaseError('Профіль не знайдено.');
    }

    const updatedUser = { ...user, displayName, bio };
    this.saveDatabase({
      ...this.database(),
      users: this.database().users.map((candidate) => candidate.id === id ? updatedUser : candidate),
    });

    return toProfile(updatedUser);
  }

  searchProfiles(query: string, excludeUserId: string): LocalProfile[] {
    const normalizedQuery = query.trim().toLowerCase();

    return this.profiles().filter((profile) => {
      if (profile.id === excludeUserId) {
        return false;
      }

      return !normalizedQuery
        || profile.displayName.toLowerCase().includes(normalizedQuery)
        || profile.username.includes(normalizedQuery);
    });
  }

  sendMessage(senderId: string, recipientId: string, text: string): LocalMessage {
    const normalizedText = text.trim();

    if (!normalizedText || normalizedText.length > 2000) {
      throw new InvalidRegistrationError('Повідомлення має містити від 1 до 2000 символів.');
    }

    if (
      senderId === recipientId
      || !this.database().users.some((user) => user.id === senderId)
      || !this.database().users.some((user) => user.id === recipientId)
    ) {
      throw new LocalDatabaseError('Не вдалося знайти учасників діалогу.');
    }

    const message: LocalMessage = {
      id: crypto.randomUUID(),
      senderId,
      recipientId,
      text: normalizedText,
      createdAt: new Date().toISOString(),
      isDemo: false,
    };

    this.saveDatabase({
      ...this.database(),
      messages: [...this.database().messages, message],
    });

    return message;
  }

  getConversationMessages(firstUserId: string, secondUserId: string): LocalMessage[] {
    return this.database().messages
      .filter((message) =>
        (message.senderId === firstUserId && message.recipientId === secondUserId)
        || (message.senderId === secondUserId && message.recipientId === firstUserId),
      )
      .sort((first, second) => first.createdAt.localeCompare(second.createdAt));
  }

  private readDatabase(): LocalDatabase {
    let raw: string | null;

    try {
      raw = localStorage.getItem(DATABASE_KEY);
    } catch (error) {
      throw new LocalDatabaseError('Не вдалося прочитати локальне сховище браузера.', { cause: error });
    }

    if (!raw) {
      return { version: DATABASE_VERSION, users: DEMO_USERS, messages: [] };
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      throw new LocalDatabaseError('Локальні дані пошкоджені. Очистіть дані сайту та спробуйте ще раз.', {
        cause: error,
      });
    }

    if (isLocalDatabase(parsed)) {
      return parsed;
    }

    if (isLegacyLocalDatabase(parsed)) {
      const migrated: LocalDatabase = {
        version: DATABASE_VERSION,
        users: [
          ...parsed.users.map((user) => ({ ...user, isDemo: false })),
          ...DEMO_USERS,
        ],
        messages: parsed.messages.map((message) => ({ ...message, isDemo: false })),
      };

      try {
        localStorage.setItem(DATABASE_KEY, JSON.stringify(migrated));
      } catch (error) {
        throw new LocalDatabaseError('Не вдалося оновити локальні дані браузера.', { cause: error });
      }

      return migrated;
    }

    throw new LocalDatabaseError('Локальні дані пошкоджені. Очистіть дані сайту та спробуйте ще раз.');
  }

  private saveDatabase(nextDatabase: LocalDatabase): void {
    try {
      localStorage.setItem(DATABASE_KEY, JSON.stringify(nextDatabase));
    } catch (error) {
      throw new LocalDatabaseError('Не вдалося зберегти дані. Перевірте доступне місце у браузері.', {
        cause: error,
      });
    }

    this.database.set(nextDatabase);
  }
}

function toProfile(user: StoredUser): LocalProfile {
  const { passwordHash: _passwordHash, passwordSalt: _passwordSalt, ...profile } = user;
  return profile;
}

function createSalt(): string {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return bytesToHex(salt);
}

async function hashPassword(password: string, salt: string): Promise<string> {
  if (!crypto.subtle) {
    throw new LocalDatabaseError('Для створення облікового запису потрібен захищений контекст HTTPS або localhost.');
  }

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: hexToBytes(salt),
      iterations: PASSWORD_ITERATIONS,
      hash: 'SHA-256',
    },
    key,
    256,
  );

  return bytesToHex(new Uint8Array(derivedBits));
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function hexToBytes(hex: string): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(hex.length / 2);

  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16);
  }

  return bytes;
}

function constantTimeEqual(first: string, second: string): boolean {
  let difference = first.length ^ second.length;
  const length = Math.max(first.length, second.length);

  for (let index = 0; index < length; index += 1) {
    difference |= (first.charCodeAt(index) || 0) ^ (second.charCodeAt(index) || 0);
  }

  return difference === 0;
}

function isLocalDatabase(value: unknown): value is LocalDatabase {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return candidate['version'] === DATABASE_VERSION
    && Array.isArray(candidate['users'])
    && candidate['users'].every(isStoredUser)
    && Array.isArray(candidate['messages'])
    && candidate['messages'].every(isLocalMessage);
}

function isStoredUser(value: unknown): value is StoredUser {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return typeof candidate['id'] === 'string'
    && typeof candidate['username'] === 'string'
    && typeof candidate['displayName'] === 'string'
    && typeof candidate['bio'] === 'string'
    && typeof candidate['avatarUrl'] === 'string'
    && typeof candidate['isDemo'] === 'boolean'
    && typeof candidate['passwordSalt'] === 'string'
    && typeof candidate['passwordHash'] === 'string';
}

function isLocalMessage(value: unknown): value is LocalMessage {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return typeof candidate['id'] === 'string'
    && typeof candidate['senderId'] === 'string'
    && typeof candidate['recipientId'] === 'string'
    && typeof candidate['text'] === 'string'
    && typeof candidate['createdAt'] === 'string'
    && typeof candidate['isDemo'] === 'boolean';
}

function isLegacyLocalDatabase(value: unknown): value is LegacyLocalDatabase {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return candidate['version'] === 1
    && Array.isArray(candidate['users'])
    && candidate['users'].every(isLegacyStoredUser)
    && Array.isArray(candidate['messages'])
    && candidate['messages'].every(isLegacyMessage);
}

function isLegacyStoredUser(value: unknown): value is LegacyLocalDatabase['users'][number] {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return typeof candidate['id'] === 'string'
    && typeof candidate['username'] === 'string'
    && typeof candidate['displayName'] === 'string'
    && typeof candidate['bio'] === 'string'
    && typeof candidate['avatarUrl'] === 'string'
    && typeof candidate['passwordSalt'] === 'string'
    && typeof candidate['passwordHash'] === 'string';
}

function isLegacyMessage(value: unknown): value is LegacyLocalDatabase['messages'][number] {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return typeof candidate['id'] === 'string'
    && typeof candidate['senderId'] === 'string'
    && typeof candidate['recipientId'] === 'string'
    && typeof candidate['text'] === 'string'
    && typeof candidate['createdAt'] === 'string';
}
