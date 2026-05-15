'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import styles from './ChatPanel.module.css';

interface Message {
  pengirim: 'admin' | 'mahasiswa';
  isi: string;
  waktu: string;
}
interface Chat {
  chatId: string;
  pesan: Message[];
}

interface Props {
  konteksType: 'laporan' | 'claim';
  konteksId: string;
  userId: string;          // student's userId (needed for admin to create)
  role: 'admin' | 'mahasiswa';
  onClose: () => void;
  itemName?: string;       // shown in panel header
}

const BASE = 'http://localhost:5000/api/chat';

export default function ChatPanel({ konteksType, konteksId, userId, role, onClose, itemName }: Props) {
  const [chat, setChat]       = useState<Chat | null>(null);
  const [input, setInput]     = useState('');
  const [initMsg, setInitMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef   = useRef<ReturnType<typeof setInterval> | null>(null);

  const token = () => localStorage.getItem('token') || '';

  const fetchChat = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res  = await fetch(`${BASE}/${konteksType}/${konteksId}`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json();
      if (data.success) setChat(data.data);
    } catch (_) {}
    finally { if (!silent) setLoading(false); }
  }, [konteksType, konteksId]);

  useEffect(() => {
    fetchChat();
    pollRef.current = setInterval(() => fetchChat(true), 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchChat]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat?.pesan.length]);

  const startChat = async () => {
    if (!initMsg.trim()) return;
    setSending(true);
    try {
      const res  = await fetch(BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ konteksType, konteksId, userId, pesanAwal: initMsg }),
      });
      const data = await res.json();
      if (data.success) { setChat(data.data); setInitMsg(''); }
    } catch (_) {}
    finally { setSending(false); }
  };

  const sendMsg = async () => {
    if (!input.trim() || !chat) return;
    setSending(true);
    try {
      const res  = await fetch(`${BASE}/${chat.chatId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ isi: input, pengirim: role }),
      });
      const data = await res.json();
      if (data.success) { setChat(data.data); setInput(''); }
    } catch (_) {}
    finally { setSending(false); }
  };

  const closeChat = async () => {
    if (!chat) return;
    if (!confirm('Hapus chat ini? Semua pesan akan terhapus permanen.')) return;
    await fetch(`${BASE}/${chat.chatId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token()}` },
    });
    setChat(null);
  };

  const fmt = (d: string) =>
    new Date(d).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

  // Group messages by date
  const grouped: { date: string; messages: (Message & { idx: number })[] }[] = [];
  (chat?.pesan || []).forEach((m, i) => {
    const d = fmtDate(m.waktu);
    const last = grouped[grouped.length - 1];
    if (!last || last.date !== d) grouped.push({ date: d, messages: [{ ...m, idx: i }] });
    else last.messages.push({ ...m, idx: i });
  });

  return (
    <div className={styles.panel}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerAvatar}>💬</div>
          <div>
            <div className={styles.headerTitle}>
              {role === 'admin' ? 'Chat dengan Mahasiswa' : 'Chat dengan Tim DPM FTI'}
            </div>
            {itemName && <div className={styles.headerSub}>Re: {itemName}</div>}
          </div>
        </div>
        <div className={styles.headerActions}>
          {role === 'admin' && chat && (
            <button className={styles.btnCloseChat} onClick={closeChat} title="Hapus chat">🗑️</button>
          )}
          <button className={styles.btnClose} onClick={onClose} title="Tutup panel">✕</button>
        </div>
      </div>

      {/* Body */}
      <div className={styles.body}>
        {loading ? (
          <div className={styles.center}><div className={styles.spinner} /></div>
        ) : !chat && role === 'admin' ? (
          /* Admin: initiate form */
          <div className={styles.initBox}>
            <div className={styles.initIcon}>✉️</div>
            <p className={styles.initTitle}>Mulai Diskusi</p>
            <p className={styles.initDesc}>Kirim pesan pertama untuk berdiskusi dengan mahasiswa mengenai laporan ini.</p>
            <textarea
              className={styles.initInput}
              placeholder="Halo, kami membutuhkan informasi lebih lanjut mengenai barang hilang kamu..."
              value={initMsg}
              onChange={(e) => setInitMsg(e.target.value)}
              rows={3}
              onKeyDown={(e) => { if (e.key === 'Enter' && e.ctrlKey) startChat(); }}
            />
            <button
              className={styles.btnStart}
              onClick={startChat}
              disabled={sending || !initMsg.trim()}
            >
              {sending ? <span className={styles.spinner} /> : '💬 Mulai Chat'}
            </button>
          </div>
        ) : !chat && role === 'mahasiswa' ? (
          /* Student: waiting */
          <div className={styles.center}>
            <div className={styles.initIcon}>⏳</div>
            <p style={{ opacity: 0.6, textAlign: 'center', padding: '0 24px' }}>
              Belum ada pesan dari Tim DPM. Kamu akan menerima notifikasi jika admin memulai diskusi.
            </p>
          </div>
        ) : (
          /* Messages */
          <>
            {grouped.map((group) => (
              <div key={group.date}>
                <div className={styles.dateSep}><span>{group.date}</span></div>
                {group.messages.map((msg) => {
                  const isMe = (role === 'admin' && msg.pengirim === 'admin') ||
                               (role === 'mahasiswa' && msg.pengirim === 'mahasiswa');
                  return (
                    <div key={msg.idx} className={`${styles.row} ${isMe ? styles.rowMe : styles.rowThem}`}>
                      {!isMe && (
                        <div className={styles.avatarSmall}>
                          {role === 'mahasiswa' ? '👤' : '🎓'}
                        </div>
                      )}
                      <div className={`${styles.bubble} ${isMe ? styles.bubbleMe : styles.bubbleThem}`}>
                        <div className={styles.bubbleText}>{msg.isi}</div>
                        <div className={styles.bubbleTime}>{fmt(msg.waktu)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Input */}
      {chat && (
        <div className={styles.inputArea}>
          <input
            className={styles.input}
            placeholder="Ketik pesan... (Enter untuk kirim)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); } }}
          />
          <button
            className={styles.btnSend}
            onClick={sendMsg}
            disabled={sending || !input.trim()}
          >
            ➤
          </button>
        </div>
      )}
    </div>
  );
}
