
export enum NavTab {
  Dashboard = 'Dashboard',
  Activity = 'Aktifitas',
  Calculator = 'Kalkulator',
  Community = 'Diskusi Grup',
  Profile = 'Profil Saya',
  Messages = 'Pesan'
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  province?: string;
  city?: string;
  district?: string;
  village?: string;
  bio?: string;
}

export interface DirectMessage {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName: string;
  content: string;
  timestamp: string;
  isRead: boolean;
}

export interface AppNotification {
  id: string;
  userId: string;
  type: 'like' | 'comment' | 'reply' | 'danger';
  fromName: string;
  postId?: string;
  postExcerpt: string;
  timestamp: string;
  isRead: boolean;
}

export interface PondMetrics {
  ph: number;
  temp: number;
  ammonia: number;
  do: number;
  lastUpdated: string;
}

export interface Pond {
  id: string;
  name: string;
  type: 'Bioflok' | 'Tanah' | 'Beton' | 'Terpal';
  size: string;
  ownerId: string;
  ownerName: string;
  fishType: string;
  fishCount: number;
  members: { id: string; name: string; role: 'owner' | 'staff' }[];
  inviteCode?: string;
  inviteCodeExpiry?: number;
  customFeeds?: string[];
  currentMetrics?: PondMetrics;
}

export interface ActivityLog {
  id: string;
  pondId: string;
  pondName: string;
  type: 'Feeding' | 'Sampling' | 'Mortality' | 'Medicine' | 'WaterParameter';
  value: string;
  officerName: string;
  date: string;
  timestamp: string;
  details?: any;
}

export interface ForumComment {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  timestamp: string;
  replies?: ForumComment[];
}

export interface ForumPost {
  id: string;
  authorId: string;
  authorName: string;
  authorLocation?: string;
  type: 'Diskusi' | 'Marketplace';
  content: string;
  image?: string;
  likes: string[];
  comments: ForumComment[];
  timestamp: string;
}
