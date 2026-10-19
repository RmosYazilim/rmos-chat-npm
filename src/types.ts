import type { FirebaseApp } from "firebase/app";
import type { Auth } from "firebase/auth";
import type { Firestore } from "firebase/firestore";

/** Host uygulamanın verdiği Firebase web config */
export interface FirebaseWebConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId: string;
  databaseURL?: string;
  measurementId?: string;
}

export interface ChatConfig {
  /** RMOS oturum token'ı — login API'den alınan Bearer token */
  token: string;
  /** Giriş yapan kullanıcının ID'si */
  userId: string;
  /**
   * RMOS General API adresi. Verilmezse host "dev" ile başlıyorsa develop, değilse production
   * URL'i kullanılır. Göreli bir yol da olabilir (ör. "/service"): istekler host uygulamanın
   * kendi proxy'sinden geçer — API IP izniyle korunuyorsa tarayıcıdan doğrudan erişilemez.
   */
  baseUrl?: string;
  /** @internal Genellikle verilmez; varsayılan Firebase config kullanılır */
  firebaseConfig?: FirebaseWebConfig;
  /** @internal */
  firebaseTokenPath?: string;
  /** @internal */
  usersPath?: string;
}

export interface ChatContextValue {
  token: string;
  userId: string;
  baseUrl: string;
  firebaseConfig: FirebaseWebConfig;
  firebaseTokenPath: string;
  usersPath: string;
  /** Firebase hazır mı (JWT alındı + auth tamam) */
  firebaseReady: boolean;
  firebaseError: Error | null;
  firebaseApp: FirebaseApp | null;
  firebaseAuth: Auth | null;
  firestore: Firestore | null;
}

export type HttpMethod = "GET" | "POST";

export interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  signal?: AbortSignal;
  headers?: Record<string, string>;
}

export class ChatHttpError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ChatHttpError";
    this.status = status;
  }
}

/** REST'ten gelen kullanıcı (GET /api/Users/GetUsersBySirket) */
export interface ChatUser {
  fldUserID: number;
  fldName: string;
  fldSurname: string;
}

/** Firestore mesaj dokümanı */
export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: number;
  /** @deprecated Okundu bilgisi konuşmadaki `readAt` ile hesaplanır. */
  status?: "sent" | "delivered" | "read";
  /** Mesaj düzenlendiyse son düzenleme zamanı (ms) */
  editedAt?: number;
  /** Mesaj silindiyse true (metin boşaltılır, balon "silindi" olarak görünür) */
  deleted?: boolean;
  /** Henüz sunucuya yazılmadı (yerel bekleyen yazma) */
  pending?: boolean;
}

export interface FirebaseTokenResponse {
  token: string;
}

/** Firestore konuşma özeti (conversations/{conversationId}) */
export interface ChatConversation {
  id: string;
  participants: string[];
  lastMessage: {
    text: string;
    senderId: string;
    createdAt: number;
  } | null;
  /** Mevcut kullanıcı için okunmamış mesaj sayısı */
  unreadCount: number;
  /**
   * Katılımcının konuşmayı en son okuduğu zaman (ms): userId → zaman.
   * Bir mesaj, karşı tarafın readAt değeri mesajın (editedAt ?? createdAt)
   * zamanından büyük/eşitse okunmuş sayılır.
   */
  readAt: Record<string, number>;
}
