'use client';

import { useState, useRef, useEffect } from 'react';
import type { LangCode } from '@/lib/i18n';
import { t } from '@/lib/i18n';
import type { AppState, Plan, Conversation } from '@/lib/store';
import { getMessageLimit, checkDailyReset, type Message } from '@/lib/store';
import { Win98Button, Win98Input, Win98Select, Win98Window, Win98Progress } from '@/components/win98';
import { MessageBubble } from '@/components/MessageBubble';
import { Send, Bot, Zap, Gift, ShoppingCart, Crown, Users, Save, CornerUpLeft, X } from 'lucide-react';

type Engine = 'groq' | 'openrouter' | 'gemini' | 'ollama';
type AIMessage = { id: string; role: 'user' | 'assistant'; text: string; save: boolean; deleted?: boolean; replyToId?: string; forwarded?: boolean; timestamp: number };

export function AIChat({
  lang,
  state,
  onUpdate,
  onIncrementUsage,
}: {
  lang: LangCode;
  state: AppState;
  onUpdate: (partial: Partial<AppState>) => void;
  onIncrementUsage: () => void;
}) {
  const [engine, setEngine] = useState<Engine>('ollama');
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState('');
  const [showBlocked, setShowBlocked] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [ollamaStatus, setOllamaStatus] = useState<'checking' | 'ok' | 'fail'>('checking');
  const [replyTo, setReplyTo] = useState<AIMessage | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const tt = (key: Parameters<typeof t>[1]) => t(lang, key);
  const limit = getMessageLimit(state.plan);
  const used = state.messagesUsedToday;
  const remaining = limit - used;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [messages.length]);

  // Check Ollama status
  useEffect(() => {
    if (engine !== 'ollama') return;
    setOllamaStatus('checking');
    fetch('http://localhost:11434/api/tags')
      .then((r) => r.ok ? setOllamaStatus('ok') : setOllamaStatus('fail'))
      .catch(() => setOllamaStatus('fail'));
  }, [engine]);

  const statusColor = remaining > 20 ? '#008000' : remaining > 10 ? '#808000' : remaining > 0 ? '#ff8000' : '#800000';

  const handleSend = async () => {
    if (!input.trim()) return;

    if (state.plan === 'free' && remaining <= 0) {
      setShowBlocked(true);
      return;
    }

    if (state.plan === 'free' && remaining === 10) {
      setShowWarning(true);
    }

    const userMsg: AIMessage = {
      id: `m_${Date.now()}`,
      role: 'user',
      text: input.trim(),
      save: true,
      replyToId: replyTo?.id,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setReplyTo(null);
    onIncrementUsage();

    // Simulate AI response
    setTimeout(() => {
      const aiMsg: AIMessage = {
        id: `m_${Date.now() + 1}`,
        role: 'assistant',
        text: `[${engine.toUpperCase()}] This is a simulated response. Connect your API key in Settings to get real AI responses.\n\nYou said: "${userMsg.text}"`,
        save: true,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    }, 300);
  };

  const handleDeleteMessage = (msg: AIMessage) => {
    setMessages((prev) => prev.map((m) => m.id === msg.id ? { ...m, deleted: true } : m));
  };

  const handleJumpToMessage = (msgId: string) => {
    const ref = messageRefs.current[msgId];
    if (ref) {
      ref.scrollIntoView({ behavior: 'smooth', block: 'center' });
      ref.style.transition = 'background 0.3s';
      ref.style.background = 'rgba(0,0,128,0.15)';
      setTimeout(() => { ref.style.background = ''; }, 1500);
    }
  };

  const engineNames: Record<Engine, string> = {
    groq: tt('groq'),
    openrouter: tt('openrouter'),
    gemini: tt('gemini'),
    ollama: tt('ollama'),
  };

  return (
    <div className="flex flex-col h-full" style={{ background: '#c0c0c0' }}>
      {/* Status bar */}
      <div className="flex items-center justify-between px-2 py-1" style={{ borderBottom: '1px solid #808080' }}>
        <div className="flex items-center gap-2">
          <Bot size={14} />
          <Win98Select
            value={engine}
            onChange={(v) => setEngine(v as Engine)}
            options={[
              { value: 'groq', label: tt('groq') },
              { value: 'openrouter', label: tt('openrouter') },
              { value: 'gemini', label: tt('gemini') },
              { value: 'ollama', label: tt('ollamaLocal') },
            ]}
            className="text-small"
          />
          {engine === 'ollama' && (
            <span className="text-small" style={{ color: ollamaStatus === 'ok' ? '#008000' : ollamaStatus === 'fail' ? '#800000' : '#808000' }}>
              {ollamaStatus === 'ok' ? `✓ ${tt('ollamaDetected')}` : ollamaStatus === 'fail' ? tt('ollamaNotDetected') : '...'}
            </span>
          )}
        </div>
        {state.plan === 'free' ? (
          <div className="text-small flex items-center gap-1" style={{ color: statusColor, fontWeight: 'bold' }}>
            {tt('freeLimit')}: {remaining}{tt('ofLimit')}
          </div>
        ) : (
          <div className="text-small font-bold flex items-center gap-1" style={{ color: '#000080' }}>
            <Crown size={12} /> {tt('premium')}
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 win98-scroll p-2" style={{ overflowY: 'auto', background: '#fff' }}>
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center" style={{ color: '#606060' }}>
            <div>
              <Bot size={48} className="mb-2 opacity-30" />
              <p className="text-normal">{tt('newChat')} — {engineNames[engine]}</p>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const replyToMsg = msg.replyToId
              ? messages.find((m) => m.id === msg.replyToId) ?? null
              : null;
            const adaptedMsg: Message = {
              id: msg.id,
              text: msg.text,
              sent: msg.role === 'user',
              timestamp: msg.timestamp,
              read: true,
              save: msg.save,
              deleted: msg.deleted,
              replyToId: msg.replyToId,
              forwarded: msg.forwarded,
            };
            return (
              <div key={msg.id} ref={(el) => { messageRefs.current[msg.id] = el; }}>
                <MessageBubble
                  message={adaptedMsg}
                  lang={lang}
                  isAI={msg.role === 'assistant'}
                  replyToMessage={replyToMsg ? {
                    id: replyToMsg.id,
                    text: replyToMsg.text,
                    sent: replyToMsg.role === 'user',
                    timestamp: replyToMsg.timestamp,
                    read: true,
                    save: replyToMsg.save,
                  } : null}
                  onSelectReply={(m) => setReplyTo({ ...msg, text: m.text, id: m.id, role: m.sent ? 'user' : 'assistant' })}
                  onDelete={(m) => handleDeleteMessage({ ...msg, id: m.id })}
                  onJumpToMessage={handleJumpToMessage}
                />
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply bar */}
      {replyTo && (
        <div className="reply-bar">
          <CornerUpLeft size={12} />
          <div className="flex-1 truncate">
            <span className="reply-bar-label font-bold">{tt('replyTo')}: </span>
            <span style={{ color: '#666' }}>{replyTo.text.slice(0, 60)}</span>
          </div>
          <button onClick={() => setReplyTo(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            <X size={12} />
          </button>
        </div>
      )}

      {/* Input */}
      <div className="p-2 flex gap-1" style={{ borderTop: '1px solid #fff' }}>
        <Win98Input
          value={input}
          onChange={setInput}
          placeholder={tt('typeMessage')}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
          className="flex-1"
        />
        <Win98Button onClick={handleSend} disabled={!input.trim()}>
          <Send size={12} /> {tt('sendMessage')}
        </Win98Button>
      </div>

      {/* Warning popup (10 left) */}
      {showWarning && (
        <div className="fixed inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.3)', zIndex: 100 }}>
          <Win98Window title="!" onClose={() => setShowWarning(false)} className="w-80" style={{ maxWidth: 320 }}>
            <div className="p-3 space-y-3">
              <p className="font-bold" style={{ color: '#ff8000' }}>⚠ {remaining} {tt('messagesLeft')}</p>
              <p className="text-normal">{tt('addApiKey')}</p>
              <div className="flex justify-end">
                <Win98Button onClick={() => setShowWarning(false)}>{tt('ok')}</Win98Button>
              </div>
            </div>
          </Win98Window>
        </div>
      )}

      {/* Blocked popup (50 used) */}
      {showBlocked && (
        <div className="fixed inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.3)', zIndex: 100 }}>
          <Win98Window title={tt('blockedTitle')} onClose={() => setShowBlocked(false)} className="w-96" style={{ maxWidth: 380 }}>
            <div className="p-3 space-y-3">
              <div className="flex items-center gap-2">
                <Zap size={20} className="text-red-700" />
                <span className="font-bold">{tt('blockedTitle')}</span>
              </div>
              <p className="text-normal">{tt('blockedBody')}</p>
              <div className="win98-divider" />
              <div className="space-y-1">
                <Win98Button
                  className="w-full"
                  onClick={() => { onUpdate({ bonusClaimed: true, bonusDate: new Date().toDateString(), messagesUsedToday: used - 5 }); setShowBlocked(false); }}
                  disabled={state.bonusClaimed}
                >
                  <Gift size={12} /> {tt('getBonusCredits')} {!state.bonusClaimed && '(Free)'}
                </Win98Button>
                <Win98Button className="w-full" onClick={() => setShowBlocked(false)}>
                  <ShoppingCart size={12} /> {tt('buyCredits')}
                </Win98Button>
                <Win98Button className="w-full" onClick={() => { onUpdate({ plan: 'basic' }); setShowBlocked(false); }}>
                  <Crown size={12} /> {tt('upgradeBasic')}
                </Win98Button>
                <Win98Button className="w-full" onClick={() => { onUpdate({ plan: 'pro' }); setShowBlocked(false); }}>
                  <Crown size={12} /> {tt('upgradePro')}
                </Win98Button>
                <Win98Button className="w-full" onClick={() => setShowBlocked(false)}>
                  <Users size={12} /> {tt('continueP2P')}
                </Win98Button>
              </div>
            </div>
          </Win98Window>
        </div>
      )}
    </div>
  );
}
