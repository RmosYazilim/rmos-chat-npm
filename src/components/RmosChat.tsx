import { useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { ChatProvider } from "../context/ChatProvider";
import type { ChatConfig, ChatUser } from "../types";
import { useConversations } from "../hooks/useConversations";
import { getUserFullName } from "../hooks/useUsers";
import { BackIcon, ChatIcon, CloseIcon } from "../ui/icons";
import { useRmosStyles } from "../ui/styles";
import { useHostTheme } from "../ui/useHostTheme";
import { usePopoverPosition } from "../ui/usePopoverPosition";
import { Avatar } from "./Avatar";
import { ChatThread } from "./ChatThread";
import { ConversationList } from "./ConversationList";

export interface RmosChatProps extends Pick<ChatConfig, "token" | "userId" | "baseUrl"> {
  /** true → buton sağ/sol altta sabit (floating) balon olur. */
  floating?: boolean;
  /** Floating konumu (varsayılan "bottom-right") */
  position?: "bottom-right" | "bottom-left";
  /** Kart başlığı ve butonun erişilebilir adı (varsayılan "Mesajlar") */
  title?: string;
  /** Kart açıklaması (liste görünümünde) */
  description?: string;
  /** Inline butonda ikonun yanında görünecek yazı (ör. sidebar menüsü). */
  label?: string;
  /** Açık başlasın mı */
  defaultOpen?: boolean;
  /** Butona eklenecek sınıf — tüketen projenin kendi stiliyle uyum için. */
  className?: string;
  style?: CSSProperties;
}

/**
 * Tek butonluk chat. Her zaman bir **buton** render eder; tıklayınca sohbet
 * kartı açılır (helpdesk mantığı). Kart WhatsApp tarzı yataydır: solda kişiler,
 * sağda seçili sohbet; dar ekranlarda tek panele düşer. Host sayfanın temasını (light/dark) otomatik
 * algılar ve @rmosyazilim/helpdesk ile aynı tasarım dilini kullanır.
 *
 * ```tsx
 * // Sayfaya gömülü buton (ör. sidebar menüsü): tıklayınca kart açılır
 * <RmosChat token={token} userId="19" label="Mesajlar" />
 *
 * // Sağ altta sabit balon
 * <RmosChat token={token} userId="19" floating />
 * ```
 */
export function RmosChat({ token, userId, baseUrl, ...ui }: RmosChatProps) {
  return (
    <ChatProvider token={token} userId={userId} baseUrl={baseUrl}>
      <RmosChatInner {...ui} />
    </ChatProvider>
  );
}

type InnerProps = Omit<RmosChatProps, "token" | "userId" | "baseUrl">;

/** Bu genişliğin altında kart tek panelli (liste → sohbet) çalışır. */
const SPLIT_MIN_WIDTH = 640;

function RmosChatInner({
  floating = false,
  position = "bottom-right",
  title = "Mesajlar",
  description = "Kişilerinizle gerçek zamanlı sohbet.",
  label,
  defaultOpen = false,
  className,
  style,
}: InnerProps) {
  useRmosStyles();
  const theme = useHostTheme();

  const [selected, setSelected] = useState<ChatUser | null>(null);
  const [open, setOpen] = useState(defaultOpen);
  const { unreadConversations } = useConversations();

  const triggerRef = useRef<HTMLButtonElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const cardPosition = usePopoverPosition(triggerRef, open);

  const selectedId = selected ? String(selected.fldUserID) : null;

  // Dışına tıklama + Esc ile kapat
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (cardRef.current?.contains(t) || triggerRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      // İç bileşenler (mesaj menüsü, düzenleme) Esc'i kendileri kullanınca preventDefault eder
      if (e.key === "Escape" && !e.defaultPrevented) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const wrapCls =
    `rmos-theme rmos${floating ? " rmos--floating" : ""}` +
    (floating && position === "bottom-left" ? " rmos--bl" : "");

  const triggerCls =
    `rmos-trigger${floating ? "" : " rmos-trigger--inline"}` +
    (className ? ` ${className}` : "");

  const badge =
    unreadConversations > 0 ? (
      <span className="rmos-trigger-badge" aria-hidden="true">
        {unreadConversations > 99 ? "99+" : unreadConversations}
      </span>
    ) : null;

  const triggerName =
    unreadConversations > 0
      ? `${label ?? title} (${unreadConversations} okunmamış sohbet)`
      : label
        ? undefined
        : title;

  // Kart yeterince genişse WhatsApp tarzı yatay düzen: solda kişiler, sağda sohbet.
  // Dar ekranda (mobil) tek panel + geri butonu.
  const split =
    typeof cardPosition?.width === "number" && cardPosition.width >= SPLIT_MIN_WIDTH;

  const closeButton = (
    <button
      type="button"
      className="rmos-iconbtn"
      onClick={() => setOpen(false)}
      aria-label="Kapat"
    >
      <CloseIcon size={18} />
    </button>
  );

  const brandHeader = (
    <div className="rmos-header">
      <div className="rmos-brand">
        <span className="rmos-title-icon">
          <ChatIcon size={18} />
        </span>
        <div className="rmos-brand-text">
          <span className="rmos-title">{title}</span>
          <p className="rmos-desc">{description}</p>
        </div>
      </div>
      {split ? null : <div className="rmos-actions">{closeButton}</div>}
    </div>
  );

  const contactHeader = selected ? (
    <div className="rmos-header">
      {split ? null : (
        <button
          type="button"
          className="rmos-iconbtn"
          onClick={() => setSelected(null)}
          aria-label="Geri"
        >
          <BackIcon size={18} />
        </button>
      )}
      <Avatar
        name={getUserFullName(selected)}
        userId={String(selected.fldUserID)}
        size={32}
        showDetails={false}
      />
      <span className="rmos-header__title">{getUserFullName(selected)}</span>
      <div className="rmos-actions">{closeButton}</div>
    </div>
  ) : null;

  const thread = selected ? (
    <ChatThread key={selectedId} contact={selected} showHeader={false} />
  ) : null;

  const list = (
    <ConversationList selectedUserId={selectedId} onSelect={setSelected} />
  );

  const card = (
    <div
      ref={cardRef}
      className={`rmos-theme rmos-card${split ? " rmos-card--split" : ""}`}
      data-rmos-theme={theme}
      style={cardPosition ?? undefined}
      role="dialog"
      aria-label={title}
    >
      {split ? (
        <div className="rmos-split">
          <aside className="rmos-sidebar">
            {brandHeader}
            {list}
          </aside>
          <section className="rmos-main">
            {selected ? (
              <>
                {contactHeader}
                {thread}
              </>
            ) : (
              <div className="rmos-welcome">
                <div className="rmos-welcome__close">{closeButton}</div>
                <span className="rmos-welcome__icon">
                  <ChatIcon size={36} />
                </span>
                <span className="rmos-welcome__title">{title}</span>
                <p className="rmos-welcome__text">
                  Sohbet etmek için soldan bir kişi seçin.
                </p>
              </div>
            )}
          </section>
        </div>
      ) : (
        <>
          {selected ? contactHeader : brandHeader}
          <div className="rmos-card__body">{selected ? thread : list}</div>
        </>
      )}
    </div>
  );

  return (
    <span className={wrapCls} data-rmos-theme={theme} style={style}>
      <button
        ref={triggerRef}
        type="button"
        className={triggerCls}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={triggerName}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="rmos-trigger-iconwrap">
          <span className="rmos-trigger-icon">
            {floating && open ? (
              <CloseIcon size={24} />
            ) : (
              <ChatIcon size={floating ? 26 : 20} />
            )}
          </span>
          {!floating ? badge : null}
        </span>
        {label && !floating ? <span>{label}</span> : null}
        {floating ? badge : null}
      </button>
      {open && cardPosition && typeof document !== "undefined"
        ? createPortal(card, document.body)
        : null}
    </span>
  );
}
