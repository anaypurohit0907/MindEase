export interface Message {
  id: string;
  text: string;
  thinking?: string;
  isUser: boolean;
  timestamp?: number;
}
