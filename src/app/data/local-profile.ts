export interface LocalProfile {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  isDemo: boolean;
}

export interface ProfileChanges {
  displayName: string;
  bio: string;
}
