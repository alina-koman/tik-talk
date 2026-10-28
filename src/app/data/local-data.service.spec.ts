import { TestBed } from '@angular/core/testing';
import { LocalDataService, UsernameTakenError } from './local-data.service';

describe('LocalDataService', () => {
  let localData: LocalDataService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    localData = TestBed.inject(LocalDataService);
  });

  afterEach(() => localStorage.clear());

  it('provides demo profiles but never authenticates demo accounts', async () => {
    expect(localData.profiles().map((profile) => profile.isDemo)).toEqual([true, true, true]);
    await expect(localData.authenticate('maya.rose', 'any-password')).resolves.toBeUndefined();
  });

  it('adds sample conversations when a new account is created', async () => {
    const profile = await localData.register('new-user', 'New User', 'safe-password');
    const messages = localData.messages();

    expect(localData.searchProfiles('', profile.id)).toHaveLength(3);
    expect(messages).toHaveLength(3);
    expect(messages.every((message) => message.isDemo && message.recipientId === profile.id)).toBe(true);
    expect(localData.getConversationMessages(profile.id, 'demo-maya')).toHaveLength(1);
  });

  it('stores a salted password hash instead of the original password', async () => {
    const profile = await localData.register('Test_User', 'Test User', 'safe-password');
    const storedDatabase = localStorage.getItem('tik-talk.local-database');

    expect(profile.username).toBe('test_user');
    expect(storedDatabase).toContain('"passwordSalt"');
    expect(storedDatabase).toContain('"passwordHash"');
    expect(storedDatabase).not.toContain('safe-password');
  });

  it('rejects duplicate usernames and verifies account passwords', async () => {
    await localData.register('same-user', 'First User', 'safe-password');

    await expect(localData.register('SAME-USER', 'Second User', 'another-password'))
      .rejects.toBeInstanceOf(UsernameTakenError);
    await expect(localData.authenticate('same-user', 'wrong-password')).resolves.toBeUndefined();
    await expect(localData.authenticate('SAME-USER', 'safe-password')).resolves.toMatchObject({
      username: 'same-user',
    });
  });

  it('persists editable profiles and messages between local accounts', async () => {
    const first = await localData.register('first-user', 'First User', 'first-password');
    const second = await localData.register('second-user', 'Second User', 'second-password');

    localData.updateProfile(first.id, { displayName: 'Updated User', bio: 'A short bio' });
    localData.sendMessage(first.id, second.id, 'Hello there');

    expect(localData.findProfile(first.id)).toMatchObject({
      displayName: 'Updated User',
      bio: 'A short bio',
    });
    expect(localData.getConversationMessages(second.id, first.id)).toMatchObject([
      { senderId: first.id, recipientId: second.id, text: 'Hello there' },
    ]);
  });

  it('migrates existing version 1 accounts without losing them', async () => {
    localStorage.setItem('tik-talk.local-database', JSON.stringify({
      version: 1,
      users: [{
        id: 'existing-user',
        username: 'existing-user',
        displayName: 'Existing User',
        bio: '',
        avatarUrl: '',
        passwordSalt: '010203',
        passwordHash: 'already-hashed',
      }],
      messages: [],
    }));

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const migratedData = TestBed.inject(LocalDataService);

    expect(migratedData.findProfile('existing-user')).toMatchObject({
      username: 'existing-user',
      isDemo: false,
    });
    expect(migratedData.profiles()).toHaveLength(4);
    expect(JSON.parse(localStorage.getItem('tik-talk.local-database') ?? '{}').version).toBe(2);
  });
});
