# @rmosyazilim/chat-widget

Rmos Yazılım Otel uygulamaları için gerçek zamanlı chat widget.

Sayfaya bir buton ekler. Tıklayınca kişi listesi açılır, kişiye tıklayınca sohbet başlar. Light/dark temayı host sayfadan otomatik alır.

Entegrasyon için yalnızca `token` ve `userId` gerekir.

---

## Kurulum

```bash
npm install @rmosyazilim/chat-widget firebase
```

Gerekenler: `react` / `react-dom` (>=18), `firebase` (^11).

---

## Kullanım

```tsx
import { RmosChat } from "@rmosyazilim/chat-widget";

// Menüde ikon + yazı
<RmosChat token={token} userId="19" label="Mesajlar" />

// Sadece ikon
<RmosChat token={token} userId="19" />

// Sağ altta sabit balon
<RmosChat token={token} userId="19" floating />
```

**Akış:** buton → kart (solda kişiler, sağda sohbet; dar ekranda tek panel). Dışarı tıkla veya `Esc` ile kapanır.

**Mesajlar:**

- **Sayfalama:** sohbet açılınca yalnızca son 10 mesaj okunur. Üstteki _Eski mesajları yükle_ her tıklamada 10 eski mesaj daha ekler (10 → 20 → 30). Yüklenmiş sayfalar yeniden okunmaz; konuşmanın tamamı hiçbir zaman tek seferde çekilmez.
- **Okundu bilgisi:** kendi mesajlarının altında saat (gönderiliyor), tek tik (gönderildi) ve renkli çift tik (okundu) görünür.
- **Düzenleme:** kendi mesajının menüsünden (balonun sağ üstü) _Düzenle_ seçilir. Düzenlenen mesaj "düzenlendi" etiketi alır. Mesaj okunmuşsa okundu bilgisi sıfırlanır ve karşı taraf tekrar okuyana kadar tek tik görünür.
- **Silme:** menüden _Sil_ seçilip onaylanınca mesaj herkes için "Bu mesaj silindi" olur.

> Firestore kuralları; gönderenin kendi mesajını (`conversations/{id}/messages/{msgId}`) güncellemesine ve katılımcıların konuşma dokümanına `readAt` yazmasına izin vermelidir. Hazır kurallar: [`firestore.rules`](firestore.rules) (Firebase Console → Firestore → Kurallar).

### Props

| Prop | Tip | Varsayılan | Açıklama |
|------|-----|-----------|----------|
| `token` | `string` | — | RMOS oturum token'ı (zorunlu) |
| `userId` | `string` | — | Kullanıcı ID (zorunlu) |
| `baseUrl` | `string` | host'a göre | RMOS General API adresi. Verilmezse site `localhost` ya da `dev…` ile başlıyorsa `dev-generalapis.rmosweb.com`, aksi halde `generalapis.rmosweb.com`. Göreli yol da olabilir (ör. `"/service"`) — bkz. [API adresi](#api-adresi) |
| `floating` | `boolean` | `false` | Sağ/sol altta sabit balon |
| `position` | `"bottom-right" \| "bottom-left"` | `"bottom-right"` | Floating konumu |
| `title` | `string` | `"Mesajlar"` | Kart başlığı |
| `description` | `string` | `"Kişilerinizle gerçek zamanlı sohbet."` | Liste açıklaması |
| `label` | `string` | — | Buton yazısı |
| `defaultOpen` | `boolean` | `false` | Açık başlasın mı |
| `className` | `string` | — | Buton CSS sınıfı |
| `style` | `CSSProperties` | — | Sarmalayıcı stili |

## API adresi

REST çağrıları (Firebase token, kişi listesi) `baseUrl` adresine gider. `generalapis.rmosweb.com` IP izniyle korunduğu için tarayıcıdan doğrudan çağrı, izinli olmayan IP'lerde **403** alır. Host uygulamanın bu adrese giden bir proxy'si varsa `baseUrl` olarak onun yolunu verin:

```tsx
<RmosChat token={token} userId={userId} baseUrl="/service" />
```

İstekler `"/service/api/..."` olarak host uygulamaya gider; proxy kendi oturumundaki token ile API'ye iletir. Mesajlar Firestore üzerinden doğrudan Firebase'e gittiği için bundan etkilenmez.

---

## Tema

Host sayfanın temasını otomatik takip eder (`.dark` / `.light`, `data-theme` vb.).

```tsx
import { useHostTheme } from "@rmosyazilim/chat-widget";

const theme = useHostTheme(); // "light" | "dark"
```

---

## Kendi arayüzünüz

Hazır widget yerine kendi UI'nızı yazmak için:

```tsx
import {
  ChatProvider,
  useUsers,
  useMessages,
  useSendMessage,
  directConversationId,
} from "@rmosyazilim/chat-widget";

function ChatRoom({ myId, otherId }: { myId: string; otherId: string }) {
  const conversationId = directConversationId(myId, otherId);
  const { messages } = useMessages(conversationId);
  const { send } = useSendMessage();

  return (
    <button onClick={() => send(conversationId, "Merhaba")}>
      {messages.length} mesaj
    </button>
  );
}

<ChatProvider token={token} userId="19">
  <ChatRoom myId="19" otherId="320" />
</ChatProvider>
```

Diğer export'lar: `ChatThread`, `ConversationList`, `MessageList`, `MessageBubble`, `MessageInput`, `Avatar`, `useChatContext`, `useConversations`, `useGet`, `usePost`, `detectHostTheme`, `getUserFullName`.
