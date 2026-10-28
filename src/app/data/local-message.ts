export interface LocalMessage {
  id: string;
  senderId: string;
  recipientId: string;
  text: string;
  createdAt: string;
  isDemo: boolean;
}
