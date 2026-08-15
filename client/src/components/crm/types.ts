export interface ChatHistoryItem {
  sender: "client" | "agent" | "system";
  text: string;
  timestamp: string;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  value: number;
  stage: string;
  rooms: string[];
  utmSource: string;
  utmCampaign: string;
  createdAt: string;
  checklist: Record<string, boolean | string>;
  chatHistory: ChatHistoryItem[];
  promobFiles: string[];
  constructionPhotos?: string[];
  materials?: Record<string, string>;
  lastCustomerMessageAt?: string;
  assembler?: string;
  deliveryDate?: string;
}

export interface WhatsappTemplate {
  id: number;
  title: string;
  content: string;
  category: string;
}
