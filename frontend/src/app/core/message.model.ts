export interface Message {
  id: number;
  name: string;
  message: string;
  createdAt: string;
}

export interface CreateMessage {
  name: string;
  message: string;
  passcode: string;
}