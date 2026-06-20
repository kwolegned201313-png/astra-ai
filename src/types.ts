// Shared TypeScript interfaces for Nexa Labs - Astra Portal

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  isCustomDomain: boolean; // whether they use @nexa-labs.com
  joinedAt: string;
  isGuest?: boolean;
  isSimulated?: boolean;
  isPremium?: boolean;
  premiumUntil?: string;
}

export interface Message {
  id?: string;
  role: "user" | "assistant";
  content: string;
  image?: string;
  timestamp: string;
}

export interface ImageResult {
  id?: string;
  imageUrl: string;
  originalPrompt: string;
  expandedPrompt: string;
  isRealGen: boolean;
  timestamp: string;
}

export interface VideoResult {
  id?: string;
  videoUrl: string;
  prompt: string;
  storyboard: string;
  category: string;
  timestamp: string;
}

export interface CodeResult {
  id?: string;
  request: string;
  htmlCode: string;
  timestamp: string;
}

export interface TelemetryMetrics {
  quantumThroughput: string;
  averageLatency: string;
  gpuCoreUtilization: string;
  modelWeightDensity: string;
  nexaMeshSyncRate: string;
  clusterRegions: string[];
}

export interface MailItem {
  id: string;
  from: string;
  fromName: string;
  to: string;
  subject: string;
  body: string;
  timestamp: string;
  isRead: boolean;
  isSystem?: boolean;
}
