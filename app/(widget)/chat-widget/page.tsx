'use client';

import React, { useState, useEffect, useRef } from 'react';

interface ChatMessage {
  id: string;
  role: 'bot' | 'user' | 'agent';
  content: string;
  time: string;
  senderName?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'document';
  mediaName?: string;
  mediaSize?: string;
}

interface FlowOption {
  id: string;
  node_id: string;
  next_node_id: string;
  label: string;
}

interface SelectedMedia {
  file: File;
  name: string;
  size: string;
  type: string;
  dataUrl: string;
}

// Realtime clock helper (HH:mm in user's local real time)
const getRealtimeClock = (): string => {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

// Format ISO timestamp or fallback to realtime
const formatClock = (isoStr?: string): string => {
  if (!isoStr) return getRealtimeClock();
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return getRealtimeClock();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  } catch {
    return getRealtimeClock();
  }
};

// Strip all emojis from a string, keeping pure sentence/phrase text
function stripEmojis(text: string): string {
  if (!text) return '';
  return text
    .replace(/[\p{Extended_Pictographic}\uFE0F\u200D\u20E3]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Outline SVG Logout Icon for ending/exiting chat session
const LogoutIcon = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

// Outline SVG Smiley Icon (Matches Image 1 & Image 2)
const SmileyIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.9"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M8 14s1.5 2 4 2 4-2 4-2" />
    <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="2.5" />
    <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="2.5" />
  </svg>
);

// Outline SVG Paperclip Icon (Matches Image 1 & Image 2)
const PaperclipIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.9"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
  </svg>
);

// Paper Airplane Send Icon
const SendAirplaneIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
  </svg>
);

// Comprehensive 8-category Emoji dataset matching Image 2
type EmojiCategoryKey = 'smileys' | 'gestures' | 'hearts' | 'animals' | 'food' | 'travel' | 'objects' | 'symbols';

const EMOJI_CATEGORIES: Record<EmojiCategoryKey, { icon: string; name: string; emojis: string[] }> = {
  smileys: {
    icon: '😊',
    name: 'Smileys & Emosi',
    emojis: [
      '😀', '😃', '😄', '😁', '😆', '😅', '😂',
      '🤣', '🥲', '🥹', '😊', '😇', '🙂', '🙃',
      '😉', '😌', '😍', '🥰', '😘', '😗', '😙',
      '😚', '😋', '😛', '😝', '😜', '🤪', '🤨',
      '🧐', '🤓', '😎', '🥸', '🤩', '🥳', '😏',
      '😒', '😞', '😔', '😟', '😕', '🙁', '☹️',
      '😣', '😖', '😫', '😩', '🥺', '😢', '😭',
      '😮‍💨', '😤', '😠', '😡', '🤬', '🤯', '😳',
      '🥵', '🥶', '😱', '😨', '😰', '😥', '😓',
      '🤗', '🤔', '🫣', '🫢', '🫡', '🤫', '🫠',
      '🤥', '😶', '😐', '😑', '😬', '🙄', '😯',
      '😦', '😧', '😮', '😲', '🥱', '😴', '🤤',
      '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧',
      '😷', '🤒', '🤕', '🤑', '🤠', '😈', '👿',
    ],
  },
  gestures: {
    icon: '👏',
    name: 'Gestur & Manusia',
    emojis: [
      '👋', '🤚', '🖐️', '✋', '🖖', '🫱', '🫲',
      '🫳', '🫴', '👌', '🤌', '🤏', '✌️', '🤞',
      '🫰', '🤟', '🤘', '🤙', '👈', '👉', '👆',
      '🖕', '👇', '☝️', '👍', '👎', '✊', '👊',
      '🤛', '🤜', '👏', '🙌', '🫶', '👐', '🤲',
      '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🦵',
      '🦶', '👂', '🦻', '👃', '🧠', '👀', '👁️',
      '🧒', '👧', '👦', '👶', '🧑', '👨', '👩',
      '🧓', '👴', '👵', '👨‍👩‍👦', '👨‍👩‍👧‍👦', '🧑‍🏫', '🧑‍🎓',
    ],
  },
  hearts: {
    icon: '❤️',
    name: 'Hati & Cinta',
    emojis: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤',
      '🤍', '🤎', '💔', '❤️‍🔥', '❤️‍🩹', '❣️', '💕',
      '💞', '💓', '💗', '💖', '💘', '💝', '💟',
      '💌', '💋', '👥', '🫂', '💐', '🌹', '🌷',
      '🌺', '🌸', '🌼', '🌻', '🥀', '☘️', '🍀',
    ],
  },
  animals: {
    icon: '🐱',
    name: 'Hewan & Alam',
    emojis: [
      '🐱', '🐶', '🐭', '🐹', '🐰', '🦊', '🐻',
      '🐼', '🐻‍❄️', '🐨', '🐯', '🦁', '🐮', '🐷',
      '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦆',
      '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄',
      '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🐢',
      '🐙', '🦑', '🦐', '🦀', '🐡', '🐠', '🐟',
      '🐬', '🐳', '🐋', '🦈', '🐊', '🐅', '🐆',
      '🦓', '🦍', '🦧', '🐘', '🦛', '🦏', '🐪',
    ],
  },
  food: {
    icon: '🍕',
    name: 'Makanan & Minuman',
    emojis: [
      '🍕', '🍔', '🍟', '🌭', '🍿', '🧇', '🥞',
      '🧀', '🥪', '🌮', '🌯', '🥙', '🍳', '🍲',
      '🥣', '🥗', '🍱', '🍘', '🍙', '🍚', '🍛',
      '🍜', '🍝', '🍠', '🍢', '🍣', '🍤', '🥟',
      '🍦', '🍧', '🍨', '🍩', '🍪', '🎂', '🍰',
      '🧁', '🥧', '🍫', '🍬', '🍭', '🍮', '🍯',
      '🍼', '🥛', '☕', '🫖', '🍵', '🧃', '🥤',
      '🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓',
    ],
  },
  travel: {
    icon: '✈️',
    name: 'Perjalanan & Tempat',
    emojis: [
      '✈️', '🛫', '🛬', '🚀', '🚁', '🚗', '🚙',
      '🚚', '🚛', '🏎️', '🏍️', '🛵', '🚲', '🛴',
      '🚏', '🛣️', '🚨', '🚥', '🚦', '🛑', '🚧',
      '⛵', '🚤', '🛳️', '⛴️', '🚢', '⚓', '🚂',
      '🚆', '🚇', '🚊', '🚌', '🚑', '🚒', '🚓',
      '🏛️', '🏫', '🏢', '🏬', '🏠', '🏡', '🏕️',
      '🎪', '🎢', '🏔️', '⛰️', '🏖️', '🏝️', '🌅',
    ],
  },
  objects: {
    icon: '💡',
    name: 'Objek & Alat',
    emojis: [
      '💡', '🔦', '🕯️', '🧰', '🔧', '🔨', '🛠️',
      '⚙️', '⛓️', '🧲', '🔬', '🔭', '📡', '💉',
      '💊', '🩺', '🚪', '🪞', '🪟', '🛏️', '🛋️',
      '🚿', '🛁', '🧹', '🧺', '🧼', '🪥', '🛒',
      '📱', '💻', '🖥️', '⌨️', '🖱️', '📷', '📺',
      '📻', '⏰', '⏱️', '⏳', '🔑', '🗝️', '🔒',
    ],
  },
  symbols: {
    icon: '✨',
    name: 'Simbol & Sekolah',
    emojis: [
      '✨', '⭐', '🌟', '💫', '💥', '🔥', '⚡',
      '🎉', '🎊', '🎈', '🎁', '🏆', '🥇', '🥈',
      '🥉', '🏅', '📚', '📖', '📕', '📗', '📘',
      '📙', '📓', '📔', '📒', '✏️', '✒️', '🖊️',
      '📝', '📐', '📏', '📌', '📍', '📎', '📊',
      '📈', '📉', '📁', '📂', '📅', '🗓️', '📋',
      '📄', '📑', '✉️', '📦', '💰', '💵', '💳',
      '🧾', '✅', '❌', '⚠️', '❓', '❗', '💯',
    ],
  },
};

// Inline bold and styling helper
const renderInlineFormatting = (text: string) => {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} style={{ fontWeight: 700, color: '#1f1a44' }}>
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return (
        <strong key={i} style={{ fontWeight: 700, color: '#1f1a44' }}>
          {part.slice(1, -1)}
        </strong>
      );
    }
    return part;
  });
};

// Neatly format suggestion / bot message text with bullets, headers, and clean line breaks
const renderMessageContent = (rawText: string) => {
  if (!rawText) return null;

  // Unescape literal \n or \r\n characters into real newlines
  const normalized = rawText
    .replace(/\\r\\n/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '  ');

  const lines = normalized.split('\n');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        // Empty line becomes a neat paragraph separator
        if (!trimmed) {
          return <div key={idx} style={{ height: '7px' }} />;
        }

        // Sub-indentation check
        const isIndented = line.startsWith('  ') || line.startsWith('\t');

        // Bullet point lines (•, -, or *)
        const isBullet =
          trimmed.startsWith('•') ||
          trimmed.startsWith('- ') ||
          trimmed.startsWith('* ');

        if (isBullet) {
          const cleanBulletText = trimmed.replace(/^[•\-*]\s*/, '');
          return (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '7px',
                paddingLeft: isIndented ? '16px' : '4px',
                lineHeight: 1.5,
              }}
            >
              <span
                style={{
                  color: '#443795',
                  fontWeight: 800,
                  fontSize: '13px',
                  lineHeight: 1.3,
                  flexShrink: 0,
                }}
              >
                •
              </span>
              <span style={{ flex: 1 }}>{renderInlineFormatting(cleanBulletText)}</span>
            </div>
          );
        }

        // Header lines or emoji lines
        const isMainHeader =
          idx === 0 &&
          (trimmed.includes('Rincian Biaya') ||
            trimmed.includes('Informasi') ||
            trimmed.startsWith("Assalamu"));
        const isSectionHeader =
          trimmed.endsWith(':') &&
          (trimmed.startsWith('📊') ||
            trimmed.startsWith('📌') ||
            trimmed.startsWith('✅') ||
            trimmed.startsWith('❌') ||
            trimmed.startsWith('⚠️') ||
            trimmed.startsWith('🎒') ||
            trimmed.startsWith('📚') ||
            trimmed.startsWith('🏫') ||
            trimmed.startsWith('🎓'));

        return (
          <div
            key={idx}
            style={{
              lineHeight: 1.55,
              fontWeight: isMainHeader ? 750 : isSectionHeader ? 650 : 400,
              color: isMainHeader ? '#1e1b4b' : 'inherit',
              paddingLeft: isIndented ? '14px' : '0',
            }}
          >
            {renderInlineFormatting(line)}
          </div>
        );
      })}
    </div>
  );
};

export default function ChatWidgetPage() {
  // Stage 1 (Intake Form) vs Stage 2 (Chat Frame)
  const [stage, setStage] = useState<'intake' | 'chat'>('intake');

  // Intake form fields
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [isParent, setIsParent] = useState<string>(''); // '', 'ya', 'tidak'
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Session & Chat states
  const [sessionId, setSessionId] = useState<string>('');
  const [sessionToken, setSessionToken] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [options, setOptions] = useState<FlowOption[]>([]);
  const [rootOptions, setRootOptions] = useState<FlowOption[]>([]);
  const [rootGreeting, setRootGreeting] = useState<string>('');
  const [hasChattedWithAi, setHasChattedWithAi] = useState<boolean>(false);
  const [inputText, setInputText] = useState('');
  const [aiStreaming, setAiStreaming] = useState(false);
  const [isEscalated, setIsEscalated] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [restoringSession, setRestoringSession] = useState(true);

  // Media & Emoji states
  const [selectedMedia, setSelectedMedia] = useState<SelectedMedia | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeEmojiCat, setActiveEmojiCat] = useState<EmojiCategoryKey>('smileys');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Pre-fetch root node options so initial suggestions are always ready
  useEffect(() => {
    fetch('/api/chatbot/root')
      .then((res) => res.json())
      .then((data) => {
        if (data.rootNode?.options) {
          setRootOptions((prev) => (prev.length > 0 ? prev : data.rootNode.options));
          setRootGreeting((prev) => (prev ? prev : data.rootNode.message_text || ''));
        }
      })
      .catch((e) => console.error('Failed to pre-fetch root node:', e));
  }, []);

  // 1. Restore session from localStorage on initial load (Auto-Login)
  useEffect(() => {
    const savedToken = typeof window !== 'undefined' ? localStorage.getItem('kreativa_chat_session_token') : null;
    if (!savedToken) {
      setRestoringSession(false);
      return;
    }

    const restore = async () => {
      try {
        const res = await fetch(`/api/chatbot/session?token=${encodeURIComponent(savedToken)}`);
        if (!res.ok) {
          localStorage.removeItem('kreativa_chat_session_token');
          setRestoringSession(false);
          return;
        }

        const data = await res.json();
        if (data.success && data.session) {
          setSessionId(String(data.session.id));
          setSessionToken(data.session.session_token);
          setParentName(data.contactName || data.session.parent_name || '');
          setParentPhone(data.contactPhone || data.session.parent_phone || '');
          setIsEscalated(Boolean(data.isEscalated));
          setStage('chat');

          if (data.messages && data.messages.length > 0) {
            const restored: ChatMessage[] = data.messages.map((m: any) => ({
              id: String(m.id),
              role: m.role,
              content: m.content,
              senderName: m.senderName,
              time: formatClock(m.createdAt),
            }));
            setMessages(restored);
            if (restored.some((m) => m.role === 'user')) {
              setHasChattedWithAi(true);
            }
          }

          if (data.rootNode && data.rootNode.options) {
            setRootOptions(data.rootNode.options);
            setRootGreeting(data.rootNode.message_text || '');
          }

          if (data.currentNode && data.currentNode.options) {
            setOptions(data.currentNode.options);
          }
        }
      } catch (err) {
        console.error('Failed to restore session from token:', err);
      } finally {
        setRestoringSession(false);
      }
    };

    restore();
  }, []);

  // 2. Real-time background sync polling for admin/agent replies in CRM
  useEffect(() => {
    if (stage !== 'chat' || !sessionToken) return;

    let isPolling = false;

    const interval = setInterval(async () => {
      // Don't poll if document is hidden to conserve bandwidth and CPU
      if (typeof document !== 'undefined' && document.hidden) return;
      if (isPolling) return;

      isPolling = true;
      try {
        const lastMsg = messages[messages.length - 1];
        const lastId = lastMsg?.id?.replace(/^agent_/, '').replace(/^user_/, '').replace(/^bot_/, '');
        const afterParam = lastId && !isNaN(Number(lastId)) ? `&afterId=${lastId}` : '';

        const res = await fetch(
          `/api/chatbot/session/sync?token=${encodeURIComponent(sessionToken)}${afterParam}`
        );
        if (!res.ok) return;

        const data = await res.json();
        if (data.success) {
          if (data.isEscalated) {
            setIsEscalated(true);
          }

          if (data.messages && data.messages.length > 0) {
            setMessages((prev) => {
              const existingIds = new Set(prev.map((m) => m.id));
              const newItems: ChatMessage[] = [];

              for (const m of data.messages) {
                const uniqueKey = `agent_${m.id}`;
                if (!existingIds.has(uniqueKey) && !existingIds.has(String(m.id))) {
                  newItems.push({
                    id: uniqueKey,
                    role: m.role === 'agent' ? 'agent' : m.role === 'bot' ? 'bot' : 'user',
                    content: m.content,
                    senderName: m.senderName || 'Tim Admission',
                    time: formatClock(m.createdAt),
                  });
                }
              }

              if (newItems.length === 0) return prev;
              return [...prev, ...newItems];
            });
          }
        }
      } catch (err) {
        // Silently catch polling errors
      } finally {
        isPolling = false;
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [stage, sessionToken, messages]);

  // Auto scroll chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, options, aiStreaming]);

  // Handle Intake Form submission (Login / Resume Session)
  const handleStartChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parentName.trim() || !parentPhone.trim() || !isParent) {
      setErrorMsg('Mohon lengkapi seluruh kolom formulir.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/chatbot/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolId: 1,
          parentName: parentName.trim(),
          parentPhone: parentPhone.trim(),
          isParent: isParent === 'ya',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memulai sesi');

      setSessionId(String(data.session.id));
      setSessionToken(data.session.session_token);
      localStorage.setItem('kreativa_chat_session_token', data.session.session_token);
      setStage('chat');

      // Simpan root node options
      if (data.rootNode?.options) {
        setRootOptions(data.rootNode.options);
        setRootGreeting(data.rootNode.message_text || '');
      } else if (data.initialNode?.options) {
        setRootOptions(data.initialNode.options);
        setRootGreeting(data.initialNode.message_text || '');
      }

      // Jika nomor HP ini pernah memiliki percakapan sebelumnya (resumed session)
      if (data.isResumed && data.messages && data.messages.length > 0) {
        const restored: ChatMessage[] = data.messages.map((m: any) => ({
          id: String(m.id),
          role: m.role,
          content: m.content,
          senderName: m.senderName,
          time: formatClock(m.createdAt),
        }));
        setMessages(restored);
        setIsEscalated(Boolean(data.isEscalated));
        setOptions(data.initialNode?.options || []);
        if (restored.some((m) => m.role === 'user')) {
          setHasChattedWithAi(true);
        }
      } else if (data.initialNode) {
        // Percakapan baru: sapa dengan root node
        const timeNow = getRealtimeClock();
        setMessages([
          {
            id: 'init_bot',
            role: 'bot',
            content: data.initialNode.message_text,
            time: timeNow,
          },
        ]);
        setOptions(data.initialNode.options || []);
        setIsEscalated(false);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan saat memulai obrolan');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Logout / Ending active chat session
  const handleConfirmLogout = async () => {
    setShowLogoutModal(false);
    try {
      if (sessionToken) {
        await fetch('/api/chatbot/session/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: sessionToken }),
        });
      }
    } catch (err) {
      // Ignore network errors on logout
    }

    localStorage.removeItem('kreativa_chat_session_token');
    setSessionId('');
    setSessionToken('');
    setStage('intake');
    setMessages([]);
    setOptions([]);
    setRootOptions([]);
    setRootGreeting('');
    setHasChattedWithAi(false);
    setIsEscalated(false);
    setInputText('');
    setSelectedMedia(null);
  };

  // Handle clicking an interactive flow option pill
  const handleSelectOption = async (opt: FlowOption) => {
    const timeNow = getRealtimeClock();
    const cleanLabel = stripEmojis(opt.label);

    // Add user's choice to chat (clean sentence without emoji)
    setMessages((prev) => [
      ...prev,
      {
        id: `user_${Date.now()}`,
        role: 'user',
        content: cleanLabel,
        time: timeNow,
      },
    ]);
    setOptions([]); // temporarily clear options

    try {
      const res = await fetch(`/api/chatbot/nodes/${opt.next_node_id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          optionId: opt.id,
          optionLabel: cleanLabel,
        }),
      });

      const data = await res.json();
      if (data.nextNode) {
        const botTime = getRealtimeClock();
        setMessages((prev) => [
          ...prev,
          {
            id: `bot_${data.nextNode.id}_${Date.now()}`,
            role: 'bot',
            content: data.nextNode.message_text,
            time: botTime,
          },
        ]);
        setOptions(data.nextNode.options || []);

        // Check if node is handover type
        if (data.nextNode.node_type === 'handover') {
          handleEscalate(data.nextNode.handover_team || 'Admission');
        }
      }
    } catch (err) {
      console.error('Failed to advance flow:', err);
    }
  };

  // Handle emoji insertion
  const handleInsertEmoji = (emoji: string) => {
    setInputText((prev) => prev + emoji);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Handle file selection (Images & Documents)
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('Ukuran file maksimal 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const sizeStr =
        file.size < 1024 * 1024
          ? `${Math.round(file.size / 1024)} KB`
          : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;

      setSelectedMedia({
        file,
        name: file.name,
        size: sizeStr,
        type: file.type,
        dataUrl,
      });
      setShowEmojiPicker(false);
    };
    reader.readAsDataURL(file);

    e.target.value = '';
  };

  // Handle sending free-text message or media
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (aiStreaming) return;
    if (!inputText.trim() && !selectedMedia) return;

    const userText = inputText.trim();
    const mediaToSend = selectedMedia;

    setInputText('');
    setSelectedMedia(null);
    setShowEmojiPicker(false);

    const userTime = getRealtimeClock();

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: userText,
      time: userTime,
      mediaUrl: mediaToSend?.dataUrl,
      mediaType: mediaToSend ? (mediaToSend.type.startsWith('image/') ? 'image' : 'document') : undefined,
      mediaName: mediaToSend?.name,
      mediaSize: mediaToSend?.size,
    };

    const newMessages: ChatMessage[] = [...messages, userMsg];
    setMessages(newMessages);
    setOptions([]);
    setHasChattedWithAi(true);

    // If sending media only (no question text)
    if (mediaToSend && !userText) {
      const isImg = mediaToSend.type.startsWith('image/');
      const ackMsg = isImg
        ? `Alhamdulillah, foto/gambar "${mediaToSend.name}" telah kami terima dan terlampir pada sesi ini. Jika ini adalah bukti transfer atau formulir, tim Admission akan segera memverifikasinya. Ada hal lain yang ingin ditanyakan, Ayah/Bunda?`
        : `Alhamdulillah, dokumen "${mediaToSend.name}" telah kami terima dan tercatat di sistem CRM kami. Tim sekolah akan segera meninjau lampiran ini. Ada hal lain yang dapat kami bantu?`;

      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: `bot_ack_${Date.now()}`,
            role: 'bot',
            content: ackMsg,
            time: getRealtimeClock(),
          },
        ]);
      }, 500);
      return;
    }

    // If escalated to human staff / CRM: forward message directly to CRM conversation for staff visibility
    if (isEscalated && userText) {
      try {
        await fetch('/api/chatbot/session/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: sessionToken,
            content: userText,
          }),
        });
      } catch (err) {
        console.error('Failed to forward message to CRM:', err);
      }
      // Continue to AI response so parent receives an immediate, intelligent answer
    }

    // Process user question text via Gemini AI Streaming
    if (userText) {
      setAiStreaming(true);

      try {
        const apiMessages = newMessages.map((m) => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.content || (m.mediaName ? `[Lampiran file: ${m.mediaName}]` : ''),
        }));

        const res = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: apiMessages,
            sessionId,
            schoolId: 1,
          }),
        });

        if (!res.ok) throw new Error('AI service error');

        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        let botContent = '';
        const botId = `bot_ai_${Date.now()}`;
        const botInitTime = getRealtimeClock();

        setMessages((prev) => [
          ...prev,
          {
            id: botId,
            role: 'bot',
            content: '',
            time: botInitTime,
          },
        ]);

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            botContent += chunk;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === botId ? { ...m, content: botContent, time: getRealtimeClock() } : m
              )
            );
          }
        }
      } catch (err) {
        console.error('AI chat failed:', err);
        setMessages((prev) => [
          ...prev,
          {
            id: `bot_err_${Date.now()}`,
            role: 'bot',
            content:
              'Maaf, terjadi gangguan pada sistem AI. Kami dapat menghubungkan Anda langsung dengan tim Admission sekolah.',
            time: getRealtimeClock(),
          },
        ]);
      } finally {
        setAiStreaming(false);
      }
    }
  };

  // Handle escalation to human staff
  const handleEscalate = async (teamName: string = 'Admission') => {
    if (isEscalated) return;
    try {
      const res = await fetch('/api/chatbot/escalate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, schoolId: 1, teamName }),
      });
      const data = await res.json();
      if (data.success) {
        setIsEscalated(true);
      }
    } catch (err) {
      console.error('Escalation failed:', err);
    }
  };

  // Helper: cek apakah options yang sedang tampil adalah root options
  const isShowingRootOptions =
    options.length > 0 &&
    rootOptions.length > 0 &&
    options.length === rootOptions.length &&
    options.every((o, i) => o.id === rootOptions[i]?.id);

  // Handle "Kembali ke awal" - menampilkan suggestion chat seperti awal sesi
  const handleResetToRoot = async () => {
    const timeNow = getRealtimeClock();

    // 1. Tampilkan respon user & kembalikan status sesi ke mode bot/AI aktif
    setIsEscalated(false);
    setHasChattedWithAi(false);

    setMessages((prev) => [
      ...prev,
      {
        id: `user_reset_${Date.now()}`,
        role: 'user',
        content: 'Kembali ke awal',
        time: timeNow,
      },
    ]);

    // 2. Siapkan root options
    let targetOptions = rootOptions;
    let targetGreeting = rootGreeting;

    if (!targetOptions || targetOptions.length === 0) {
      try {
        const res = await fetch('/api/chatbot/root');
        const data = await res.json();
        if (data.rootNode) {
          targetOptions = data.rootNode.options || [];
          targetGreeting = data.rootNode.message_text || '';
          setRootOptions(targetOptions);
          setRootGreeting(targetGreeting);
        }
      } catch (err) {
        console.error('Failed to fetch root options:', err);
      }
    }

    // 3. Bot merespon dan langsung memunculkan opsi seperti awal sesi
    const botMsg =
      targetGreeting ||
      'Baik Ayah/Bunda, berikut pilihan menu utama layanan informasi Kreativa Global School:';

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot_root_${Date.now()}`,
          role: 'bot',
          content: botMsg,
          time: getRealtimeClock(),
        },
      ]);
      setOptions(targetOptions);
    }, 250);

    // 4. Update session di server jika session aktif
    if (sessionId) {
      try {
        await fetch('/api/chatbot/nodes/1', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, optionLabel: 'Kembali ke awal' }),
        });
      } catch (e) {
        // Silently catch background error
      }
    }
  };

  return (
    <>
      {/* Responsive Styles for 100% Full Screen Mobile & Centered Floating Desktop */}
      <style>{`
        .chat-widget-wrapper {
          min-height: 100vh;
          min-height: 100dvh;
          background: #f0eff5;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          font-family: 'Albert Sans', 'Inter', sans-serif;
          box-sizing: border-box;
        }

        .chat-widget-container {
          width: 100%;
          max-width: 440px;
          height: 92vh;
          max-height: 720px;
          background: #ffffff;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 20px 50px rgba(37, 29, 82, 0.15);
          display: flex;
          flex-direction: column;
          position: relative;
          box-sizing: border-box;
          transition: all 0.2s ease;
        }

        /* 100% Full Screen Mobile Responsive */
        @media (max-width: 640px) {
          .chat-widget-wrapper {
            padding: 0 !important;
            min-height: 100vh !important;
            min-height: 100dvh !important;
            height: 100dvh !important;
            background: #ffffff !important;
            align-items: stretch !important;
            justify-content: stretch !important;
          }

          .chat-widget-container {
            max-width: 100% !important;
            width: 100% !important;
            height: 100vh !important;
            height: 100dvh !important;
            max-height: 100dvh !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
        }

        .emoji-tile-7col {
          font-size: 24px;
          height: 40px;
          background: none;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          display: grid;
          place-items: center;
          transition: transform 0.1s ease, background 0.15s ease;
        }

        .emoji-tile-7col:hover {
          background: #f1f5f9;
          transform: scale(1.18);
        }

        /* WhatsApp Green Theme & Interactive Hover States */
        .wa-send-btn {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          border: none;
          background: #25d366;
          color: #ffffff;
          display: grid;
          place-items: center;
          cursor: pointer;
          transition: all 0.15s ease;
          box-shadow: 0 2px 8px rgba(37, 211, 102, 0.35);
          flex-shrink: 0;
        }

        .wa-send-btn:hover:not(:disabled) {
          background: #1ebd5a !important;
          transform: scale(1.05);
          box-shadow: 0 4px 12px rgba(37, 211, 102, 0.45);
        }

        .wa-send-btn:active:not(:disabled) {
          background: #00a884 !important;
          transform: scale(0.96);
        }

        .wa-send-btn:disabled {
          opacity: 0.45;
          cursor: not-allowed;
          box-shadow: none;
        }

        .wa-option-pill {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          text-align: left;
          padding: 10px 14px;
          background: #ffffff;
          border: 1px solid #cce8dc;
          border-radius: 12px;
          color: #075e54;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
        }

        .wa-option-pill:hover {
          background: #e7f7ef !important;
          border-color: #25d366 !important;
          color: #054c44 !important;
          transform: translateY(-1px);
          box-shadow: 0 4px 10px rgba(37, 211, 102, 0.18);
        }

        .wa-option-pill:active {
          transform: translateY(0);
          background: #daf2e5 !important;
        }

        .wa-option-arrow {
          color: #25d366;
          font-size: 14px;
          font-weight: 700;
          transition: transform 0.15s ease, color 0.15s ease;
          margin-left: 8px;
          flex-shrink: 0;
        }

        .wa-option-pill:hover .wa-option-arrow {
          transform: translateX(3px);
          color: #075e54;
        }

        .wa-icon-btn {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          border: none;
          display: grid;
          place-items: center;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .wa-icon-btn:hover {
          background: #e7f7ef !important;
          color: #00a884 !important;
        }

        .wa-primary-btn {
          background: #00a884 !important;
          border-color: #00a884 !important;
          color: #ffffff !important;
          transition: all 0.15s ease;
          cursor: pointer;
        }

        .wa-primary-btn:hover {
          background: #008f6f !important;
          border-color: #008f6f !important;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 168, 132, 0.3) !important;
        }

        .wa-emoji-tab {
          border: none;
          border-radius: 8px;
          font-size: 16px;
          cursor: pointer;
          display: grid;
          place-items: center;
          transition: all 0.15s ease;
        }

        .wa-emoji-tab:hover {
          background: #e7f7ef;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>

      {/* Main Responsive Wrapper */}
      <div className="chat-widget-wrapper">
        {/* Main Phone / App Container */}
        <div className="chat-widget-container">
          {/* ======================================================= */}
          {/* STAGE 1: PRE-CHAT INTAKE FORM                           */}
          {/* ======================================================= */}
          {stage === 'intake' && (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              {/* Header: Kreativa Global School Official */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '16px 20px',
                  borderBottom: '1px solid #f0f0f5',
                  background: '#fff',
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '12px',
                    background: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    border: '1px solid #f0f0f5',
                    overflow: 'hidden',
                    flexShrink: 0,
                  }}
                >
                  <img
                    src="/images/LOGO-kgs.png"
                    alt="Logo Kreativa Global School"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      display: 'block',
                      transform: 'scale(1.4)',
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <strong style={{ fontSize: '14px', color: '#25223f', display: 'block', fontWeight: 800 }}>
                    Kreativa Global School
                  </strong>
                  <small style={{ fontSize: '11px', color: '#169a72', fontWeight: 600 }}>
                    ● Layanan Informasi & Pendaftaran
                  </small>
                </div>
              </div>

              {/* Form Content */}
              <div
                style={{
                  padding: '24px 20px',
                  flex: 1,
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <h2
                  style={{
                    fontSize: '22px',
                    fontWeight: 850,
                    color: '#25223f',
                    marginBottom: '8px',
                    letterSpacing: '-0.5px',
                  }}
                >
                  Mulai Percakapan
                </h2>
                <p
                  style={{
                    fontSize: '13px',
                    color: '#7b8096',
                    lineHeight: 1.5,
                    marginBottom: '24px',
                  }}
                >
                  Halo! Silakan lengkapi formulir di bawah ini untuk memulai obrolan resmi dengan layanan kami.
                </p>

                {errorMsg && (
                  <div
                    style={{
                      background: '#fff1f5',
                      color: '#d64270',
                      fontSize: '12px',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      marginBottom: '16px',
                      border: '1px solid #fed2e0',
                    }}
                  >
                    {errorMsg}
                  </div>
                )}

                <form onSubmit={handleStartChat} suppressHydrationWarning style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '11px',
                        fontWeight: 800,
                        color: '#49446d',
                        marginBottom: '6px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      Nama Lengkap *
                    </label>
                    <input
                      className="field full"
                      placeholder="Contoh: Nadia Putri"
                      value={parentName}
                      onChange={(e) => setParentName(e.target.value)}
                      required
                      suppressHydrationWarning
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '11px',
                        fontWeight: 800,
                        color: '#49446d',
                        marginBottom: '6px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      Nomor WhatsApp / Telepon *
                    </label>
                    <input
                      type="tel"
                      className="field full"
                      placeholder="Contoh: 08123456789"
                      value={parentPhone}
                      onChange={(e) => setParentPhone(e.target.value)}
                      required
                      suppressHydrationWarning
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '11px',
                        fontWeight: 800,
                        color: '#49446d',
                        marginBottom: '6px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      Apakah orang tua siswa? *
                    </label>
                    <select
                      className="field full"
                      value={isParent}
                      onChange={(e) => setIsParent(e.target.value)}
                      required
                      suppressHydrationWarning
                    >
                      <option value="">Pilih status...</option>
                      <option value="ya">Ya, orang tua siswa aktif Kreativa</option>
                      <option value="tidak">Tidak (Calon orang tua / pendaftar baru)</option>
                    </select>
                  </div>

                  <div style={{ marginTop: '16px' }}>
                    <button
                      className="button primary wa-primary-btn"
                      style={{
                        width: '100%',
                        padding: '13px',
                        fontSize: '13px',
                        borderRadius: '12px',
                        background: '#00a884',
                        borderColor: '#00a884',
                        fontWeight: 700,
                      }}
                      type="submit"
                      disabled={submitting}
                      suppressHydrationWarning
                    >
                      {submitting ? 'Menghubungkan ke CRM...' : 'Mulai Percakapan →'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ======================================================= */}
          {/* STAGE 2: INTERACTIVE WHATSAPP CHAT FRAME                */}
          {/* ======================================================= */}
          {stage === 'chat' && (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              {/* WhatsApp Header */}
              <div
                style={{
                  background: '#fff',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid #e8e8e8',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.03)',
                  flexShrink: 0,
                  zIndex: 2,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      background: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                      border: '1px solid #eef2f6',
                      overflow: 'hidden',
                      flexShrink: 0,
                    }}
                  >
                    <img
                      src="/images/LOGO-kgs.png"
                      alt="Logo Kreativa Global School"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        display: 'block',
                        transform: 'scale(1.4)',
                      }}
                    />
                  </div>
                  <div>
                    <strong style={{ fontSize: '13.5px', color: '#25223f', display: 'block', lineHeight: 1.2 }}>
                      Kreativa Global School
                    </strong>
                    <small style={{ fontSize: '11px', color: '#169a72', fontWeight: 600 }}>
                      ● Online (Asisten Resmi)
                    </small>
                  </div>
                </div>

                {/* Actions: Logout Button + WhatsApp Brand Badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setShowLogoutModal(true)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '5px 9px',
                      borderRadius: '8px',
                      border: '1px solid #fee2e2',
                      background: '#fef2f2',
                      color: '#dc2626',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    title="Keluar Sesi / Ganti Nomor"
                  >
                    <LogoutIcon />
                    <span>Keluar</span>
                  </button>

                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: '#25d366',
                      display: 'grid',
                      placeItems: 'center',
                      color: 'white',
                    }}
                    title="Official WhatsApp Simulator"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.93.55 3.73 1.5 5.27L2 22l4.98-1.59c1.5 1 3.29 1.56 5.06 1.56 5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm5.78 13.92c-.24.67-1.39 1.25-1.92 1.32-.5.06-1.15.1-3.32-.79-2.77-1.15-4.56-3.95-4.7-4.14-.14-.19-1.12-1.49-1.12-2.84 0-1.35.71-2.02.96-2.29.25-.27.55-.34.73-.34.18 0 .36 0 .52.01.17.01.4.06.61.56.22.52.74 1.8.8 1.94.07.13.11.29.02.48-.09.19-.14.3-.27.46-.14.16-.29.35-.42.47-.14.14-.29.29-.12.57.16.29.72 1.18 1.55 1.91 1.07.95 1.96 1.24 2.24 1.38.28.14.44.12.61-.07.16-.19.7-.81.89-1.09.18-.28.37-.23.62-.14.25.09 1.6.75 1.87.89.28.14.46.21.53.32.07.11.07.67-.17 1.34z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Status Banner when Escalated to Admin */}
              {isEscalated && (
                <div
                  style={{
                    background: '#f0fdf4',
                    borderBottom: '1px solid #bbf7d0',
                    padding: '6px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '7px',
                    fontSize: '11px',
                    color: '#166534',
                    fontWeight: 650,
                    flexShrink: 0,
                  }}
                >
                  <span
                    style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      background: '#22c55e',
                      boxShadow: '0 0 0 2px rgba(34, 197, 94, 0.3)',
                    }}
                  />
                  <span>Terhubung ke Tim Admission • Balasan staff terpantau aktif</span>
                </div>
              )}

              {/* Chat Body (Subtle WhatsApp dots wallpaper) */}
              <div
                ref={chatContainerRef}
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '14px',
                  background:
                    'radial-gradient(circle at 20px 22px, #ffffff7d 2px, transparent 3px) 0 0/33px 33px, #eeede3',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                {/* Disclaimer notice bubble */}
                <div
                  style={{
                    alignSelf: 'center',
                    background: '#fff9e6',
                    borderRadius: '10px',
                    padding: '8px 12px',
                    fontSize: '11px',
                    color: '#82631a',
                    maxWidth: '92%',
                    textAlign: 'center',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                  }}
                >
                  🔒 Percakapan ini terhubung langsung ke Layanan CRM Orang Tua Kreativa.
                </div>

                {/* Chat bubbles */}
                {messages.map((m) => {
                  const isUser = m.role === 'user';
                  const isAgent = m.role === 'agent';
                  return (
                    <div
                      key={m.id}
                      style={{
                        alignSelf: isUser ? 'flex-end' : 'flex-start',
                        background: isUser ? '#d9fdd3' : '#ffffff',
                        borderRadius: isUser ? '14px 14px 3px 14px' : '14px 14px 14px 3px',
                        padding: '10px 14px 8px 14px',
                        maxWidth: '88%',
                        boxShadow: isAgent
                          ? '0 2px 6px rgba(0, 168, 132, 0.18)'
                          : '0 1px 3px rgba(11,20,26,0.1)',
                        fontSize: '12.5px',
                        lineHeight: 1.55,
                        color: '#111b21',
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        borderLeft: isAgent ? '3.5px solid #00a884' : 'none',
                      }}
                    >
                      {/* Agent Badge (Verified Staff Reply) */}
                      {isAgent && (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            marginBottom: '6px',
                            paddingBottom: '4px',
                            borderBottom: '1px solid #f0fdf4',
                          }}
                        >
                          <span
                            style={{
                              background: '#00a884',
                              color: '#fff',
                              fontSize: '9px',
                              fontWeight: 800,
                              padding: '2px 5px',
                              borderRadius: '4px',
                              letterSpacing: '0.4px',
                            }}
                          >
                            STAFF RESMI
                          </span>
                          <span style={{ fontSize: '11px', fontWeight: 750, color: '#065f46' }}>
                            {m.senderName || 'Tim Admission'}
                          </span>
                        </div>
                      )}

                      {/* Media Attachment (Photo / Document) */}
                      {m.mediaUrl && (
                        <div style={{ marginBottom: m.content ? '8px' : '0' }}>
                          {m.mediaType === 'image' ? (
                            <div
                              style={{
                                borderRadius: '10px',
                                overflow: 'hidden',
                                cursor: 'pointer',
                                background: 'rgba(0,0,0,0.04)',
                              }}
                              onClick={() => setPreviewImage(m.mediaUrl || null)}
                              title="Klik untuk memperbesar gambar"
                            >
                              <img
                                src={m.mediaUrl}
                                alt={m.mediaName || 'Lampiran Gambar'}
                                style={{
                                  maxWidth: '100%',
                                  maxHeight: '220px',
                                  objectFit: 'cover',
                                  display: 'block',
                                  borderRadius: '10px',
                                }}
                              />
                              {m.mediaName && (
                                <div
                                  style={{
                                    fontSize: '10px',
                                    color: isUser ? '#2b7858' : '#7b8096',
                                    marginTop: '4px',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                  }}
                                >
                                  📷 {m.mediaName} {m.mediaSize ? `(${m.mediaSize})` : ''}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '10px 12px',
                                background: isUser ? 'rgba(0,0,0,0.06)' : '#f6f5fb',
                                borderRadius: '10px',
                                border: '1px solid rgba(0,0,0,0.05)',
                              }}
                            >
                              <div
                                style={{
                                  width: '36px',
                                  height: '36px',
                                  borderRadius: '8px',
                                  background: '#ee3779',
                                  color: 'white',
                                  display: 'grid',
                                  placeItems: 'center',
                                  fontSize: '18px',
                                  flexShrink: 0,
                                }}
                              >
                                📄
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <strong
                                  style={{
                                    fontSize: '12px',
                                    display: 'block',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    color: isUser ? '#103928' : '#25223f',
                                  }}
                                >
                                  {m.mediaName || 'Dokumen'}
                                </strong>
                                <small style={{ fontSize: '10px', color: isUser ? '#3b785d' : '#888ba0' }}>
                                  {m.mediaSize ? `${m.mediaSize} • ` : ''}Dokumen Terlampir
                                </small>
                              </div>
                              <a
                                href={m.mediaUrl}
                                download={m.mediaName || 'dokumen'}
                                style={{
                                  background: isUser ? '#169a72' : '#443795',
                                  color: 'white',
                                  padding: '5px 9px',
                                  borderRadius: '6px',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  textDecoration: 'none',
                                }}
                              >
                                Unduh
                              </a>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Text content if present */}
                      {m.content && <div>{renderMessageContent(m.content)}</div>}

                      {/* Realtime timestamp & double checkmarks */}
                      <div
                        style={{
                          alignSelf: 'flex-end',
                          fontSize: '10px',
                          color: isUser ? '#54656f' : '#667781',
                          marginTop: '4px',
                          marginLeft: '12px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                        }}
                      >
                        <span>{m.time}</span>
                        {isUser && (
                          <svg
                            width="14"
                            height="10"
                            viewBox="0 0 16 11"
                            fill="none"
                            style={{ color: '#53bdeb' }}
                          >
                            <path
                              d="M11.05 0.7L4.7 7.05L1.95 4.3L0.9 5.35L4.7 9.15L12.1 1.75L11.05 0.7ZM15.05 0.7L8.7 7.05L7.9 6.25L6.85 7.3L8.7 9.15L16.1 1.75L15.05 0.7Z"
                              fill="currentColor"
                            />
                          </svg>
                        )}
                      </div>
                    </div>
                  );
                })}

                {aiStreaming && (
                  <div
                    style={{
                      alignSelf: 'flex-start',
                      background: '#fff',
                      borderRadius: '12px 12px 12px 3px',
                      padding: '8px 14px',
                      fontSize: '11px',
                      color: '#7b8096',
                      fontStyle: 'italic',
                    }}
                  >
                    Asisten sedang mengetik...
                  </div>
                )}
              </div>

              {/* Branching Suggestion Option Pills (Pure sentences without emoji) */}
              {(options.length > 0 || hasChattedWithAi) && (
                <div
                  style={{
                    background: '#f8fafc',
                    borderTop: '1px solid #e8e8e8',
                    padding: '10px 14px',
                    maxHeight: '160px',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    flexShrink: 0,
                  }}
                >
                  {/* Current flow options */}
                  {options.map((opt) => (
                    <button
                      key={opt.id}
                      className="wa-option-pill"
                      onClick={() => handleSelectOption(opt)}
                    >
                      <span>{stripEmojis(opt.label)}</span>
                      <span className="wa-option-arrow">→</span>
                    </button>
                  ))}

                  {/* Suggestion "Kembali ke awal" yang selalu muncul jika sudah chat dengan AI dan belum di root */}
                  {hasChattedWithAi && !isShowingRootOptions && (
                    <button
                      className="wa-option-pill"
                      onClick={handleResetToRoot}
                      style={{
                        borderColor: '#25d366',
                        background: '#ffffff',
                        fontWeight: 650,
                      }}
                    >
                      <span>Kembali ke awal</span>
                      <span className="wa-option-arrow">↺</span>
                    </button>
                  )}
                </div>
              )}

              {/* Bottom Interactive Area (Selected Media Preview + Emoji Picker + Capsule Input) */}
              <div
                style={{
                  background: '#fff',
                  borderTop: '1px solid #eef0f5',
                  padding: '10px 12px 12px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  flexShrink: 0,
                }}
              >
                {/* Selected Media Preview Bar (Before sending) */}
                {selectedMedia && (
                  <div
                    style={{
                      padding: '8px 12px',
                      background: '#f8fafc',
                      borderRadius: '14px',
                      border: '1px solid #e2e8f0',
                      marginBottom: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                      {selectedMedia.type.startsWith('image/') ? (
                        <img
                          src={selectedMedia.dataUrl}
                          alt="Preview"
                          style={{
                            width: '40px',
                            height: '40px',
                            objectFit: 'cover',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '40px',
                            height: '40px',
                            background: '#ee3779',
                            color: 'white',
                            borderRadius: '8px',
                            display: 'grid',
                            placeItems: 'center',
                            fontSize: '20px',
                            flexShrink: 0,
                          }}
                        >
                          📄
                        </div>
                      )}
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: '12px',
                            fontWeight: 700,
                            color: '#1e293b',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {selectedMedia.name}
                        </div>
                        <small style={{ fontSize: '10px', color: '#64748b' }}>
                          {selectedMedia.size} • Siap dikirim
                        </small>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedMedia(null)}
                      style={{
                        border: 'none',
                        background: '#e2e8f0',
                        borderRadius: '50%',
                        width: '24px',
                        height: '24px',
                        display: 'grid',
                        placeItems: 'center',
                        cursor: 'pointer',
                        color: '#475569',
                        fontSize: '11px',
                      }}
                      title="Batalkan lampiran"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* Emoji Picker Modal/Drawer (Image 2) */}
                {showEmojiPicker && (
                  <div
                    style={{
                      background: '#ffffff',
                      borderRadius: '16px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 -4px 20px rgba(0,0,0,0.07)',
                      marginBottom: '8px',
                      overflow: 'hidden',
                      animation: 'fadeIn 0.15s ease',
                    }}
                  >
                    {/* Header: Title "Emoji" on Left, Close "✕" on Right */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px 6px 14px',
                      }}
                    >
                      <span style={{ fontSize: '13.5px', fontWeight: 650, color: '#374151' }}>
                        Emoji
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowEmojiPicker(false)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#9ca3af',
                          fontSize: '16px',
                          cursor: 'pointer',
                          padding: '2px 4px',
                          lineHeight: 1,
                        }}
                        title="Tutup"
                      >
                        ✕
                      </button>
                    </div>

                    {/* Category Tabs: 8 categories exactly matching Image 2 */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '4px 10px 8px 10px',
                        borderBottom: '1px solid #f1f5f9',
                        gap: '2px',
                      }}
                    >
                      {(Object.keys(EMOJI_CATEGORIES) as EmojiCategoryKey[]).map((catKey) => {
                        const cat = EMOJI_CATEGORIES[catKey];
                        const isActive = activeEmojiCat === catKey;
                        return (
                          <button
                            key={catKey}
                            type="button"
                            className="wa-emoji-tab"
                            onClick={() => setActiveEmojiCat(catKey)}
                            style={{
                              background: isActive ? '#00a884' : 'transparent',
                              color: isActive ? '#ffffff' : '#374151',
                              padding: isActive ? '5px 10px' : '5px 8px',
                              opacity: isActive ? 1 : 0.8,
                            }}
                            title={cat.name}
                          >
                            <span>{cat.icon}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* 7-Column Emoji Grid (Matches Image 2) */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(7, 1fr)',
                        gap: '4px',
                        padding: '10px 10px',
                        maxHeight: '210px',
                        overflowY: 'auto',
                      }}
                    >
                      {EMOJI_CATEGORIES[activeEmojiCat].emojis.map((emoji, i) => (
                        <button
                          key={i}
                          type="button"
                          className="emoji-tile-7col"
                          onClick={() => handleInsertEmoji(emoji)}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Hidden File Input for Media Uploads */}
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={handleFileSelect}
                  accept="image/*,.pdf,.doc,.docx"
                />

                {/* Capsule Input Pill with Right-Side Icons (WhatsApp Style) */}
                <form
                  onSubmit={handleSendMessage}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: '#ffffff',
                    border: showEmojiPicker ? '1.5px solid #00a884' : '1.5px solid #dbe2ea',
                    borderRadius: '9999px',
                    padding: '3px 4px 3px 16px',
                    boxShadow: showEmojiPicker ? '0 0 0 3px rgba(0, 168, 132, 0.15)' : '0 2px 6px rgba(0,0,0,0.03)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {/* Left: Text Input */}
                  <input
                    ref={inputRef}
                    style={{
                      flex: 1,
                      border: 'none',
                      background: 'transparent',
                      fontSize: '13.5px',
                      color: '#1f2937',
                      outline: 'none',
                      padding: '8px 0',
                      minWidth: 0,
                    }}
                    placeholder={
                      selectedMedia
                        ? 'Ketik keterangan dokumen/foto (opsional)...'
                        : 'Tulis pesan...'
                    }
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    disabled={aiStreaming}
                  />

                  {/* Right: Group of 3 Action Icons (Smiley Icon -> Paperclip Icon -> WhatsApp Send Button) */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '3px', flexShrink: 0, marginLeft: '6px' }}>
                    {/* 1. Emoji Outline Icon Button (Turns solid WhatsApp green when active) */}
                    <button
                      type="button"
                      className="wa-icon-btn"
                      onClick={() => setShowEmojiPicker((prev) => !prev)}
                      style={{
                        background: showEmojiPicker ? '#00a884' : 'transparent',
                        color: showEmojiPicker ? '#ffffff' : '#64748b',
                      }}
                      title="Pilih Emoji"
                    >
                      <SmileyIcon />
                    </button>

                    {/* 2. Paperclip Media Attachment Icon Button */}
                    <button
                      type="button"
                      className="wa-icon-btn"
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        background: selectedMedia ? '#e7f7ef' : 'transparent',
                        color: selectedMedia ? '#00a884' : '#64748b',
                      }}
                      title="Lampirkan Dokumen / Gambar"
                    >
                      <PaperclipIcon />
                    </button>

                    {/* 3. Circular WhatsApp Send Button */}
                    <button
                      type="submit"
                      className="wa-send-btn"
                      disabled={aiStreaming || (!inputText.trim() && !selectedMedia)}
                      title="Kirim pesan"
                    >
                      <SendAirplaneIcon />
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Restoring Session Loading Overlay (Auto-Login) */}
          {restoringSession && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: '#ffffff',
                zIndex: 100,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
              }}
            >
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  border: '3px solid #e2e8f0',
                  borderTopColor: '#00a884',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
                Memulihkan sesi percakapan...
              </span>
            </div>
          )}
        </div>

        {/* Logout Confirmation Modal */}
        {showLogoutModal && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
              backdropFilter: 'blur(2px)',
            }}
          >
            <div
              style={{
                background: '#ffffff',
                borderRadius: '18px',
                padding: '22px 24px',
                maxWidth: '340px',
                width: '100%',
                boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '50%',
                  background: '#fee2e2',
                  color: '#dc2626',
                  display: 'grid',
                  placeItems: 'center',
                  margin: '0 auto 12px auto',
                }}
              >
                <LogoutIcon />
              </div>
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#1f2937', marginBottom: '8px' }}>
                Keluar dari Percakapan?
              </h3>
              <p style={{ fontSize: '12.5px', color: '#6b7280', lineHeight: 1.5, marginBottom: '20px' }}>
                Sesi Anda pada perangkat ini akan diakhiri. Anda dapat masuk kembali kapan saja menggunakan nomor WhatsApp yang sama untuk melanjutkan obrolan.
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowLogoutModal(false)}
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid #d1d5db',
                    background: '#ffffff',
                    color: '#374151',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmLogout}
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: 'none',
                    background: '#dc2626',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Ya, Keluar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Image Fullscreen Lightbox Modal */}
        {previewImage && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 12, 35, 0.92)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
            }}
            onClick={() => setPreviewImage(null)}
          >
            <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
              <img
                src={previewImage}
                alt="Enlarged preview"
                style={{
                  maxWidth: '100%',
                  maxHeight: '90vh',
                  objectFit: 'contain',
                  borderRadius: '12px',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                }}
              />
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                style={{
                  position: 'absolute',
                  top: '-14px',
                  right: '-14px',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: '#ffffff',
                  color: '#25223f',
                  border: 'none',
                  fontWeight: 900,
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'grid',
                  placeItems: 'center',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
                }}
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
