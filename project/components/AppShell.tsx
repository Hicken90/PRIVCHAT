'use client';

import { useState, useEffect } from 'react';
import { useAppState, type AppState, type Friend, type Conversation, type Message, checkDailyReset, type Theme, loadTheme, saveTheme, applyThemeClass, getThemeClass } from '@/lib/store';
import { t, type LangCode } from '@/lib/i18n';
import { Onboarding } from '@/components/Onboarding';
import { P2PChat } from '@/components/P2PChat';
import { AIChat } from '@/components/AIChat';
import { Settings } from '@/components/Settings';
import { Win98Window, Win98Button, Win98Input } from '@/components/win98';
import { Users, Bot, Settings as SettingsIcon, Lock, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';

type Tab = 'p2p' | 'ai' | 'settings';

export function AppShell() {
  const { state, setState, update, loaded } = useAppState();
  const [activeTab, setActiveTab] = useState<Tab>('p2p');
  const [locked, setLocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [startMenuOpen, setStartMenuOpen] = useState(false);
  const [clock, setClock] = useState('');
  const [theme, setTheme] = useState<Theme>('retro');

  // Update clock
  useEffect(() => {
    const updateClock = () => {
      const d = new Date();
      setClock(`${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`);
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Daily reset
  useEffect(() => {
    if (!loaded) return;
    const reset = checkDailyReset(state);
    if (reset.messagesUsedToday !== undefined) update(reset);
  }, [loaded]);

  // Load and apply theme
  useEffect(() => {
    const t = loadTheme();
    setTheme(t);
    applyThemeClass(t);
  }, []);

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    saveTheme(newTheme);
    applyThemeClass(newTheme);
    update({ theme: newTheme });
  };

  // Check lock on mount
  useEffect(() => {
    if (loaded && state.pin && !state.onboarded === false) {
      // Don't auto-lock on first load, only when explicitly locked
    }
  }, [loaded]);

  if (!loaded) {
    return <div className="fixed inset-0 flex items-center justify-center" style={{ background: '#008080', color: '#fff' }}>Loading...</div>;
  }

  // Onboarding
  if (!state.onboarded || !state.lang) {
    return (
      <Onboarding
        onComplete={(lang, username, selectedTheme) => {
          saveTheme(selectedTheme);
          applyThemeClass(selectedTheme);
          setTheme(selectedTheme);
          update({ lang, username, onboarded: true, theme: selectedTheme });
        }}
      />
    );
  }

  const lang = state.lang;
  const tt = (key: Parameters<typeof t>[1]) => t(lang, key);

  // Lock screen
  if (locked) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: '#008080' }}>
        <Win98Window title={tt('unlock')} className="w-72" style={{ maxWidth: 280 }}>
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Lock size={24} className="text-blue-800" />
              <span className="font-bold">{tt('enterAppPin')}</span>
            </div>
            <Win98Input
              value={pinInput}
              onChange={(v) => { setPinInput(v.replace(/\D/g, '').slice(0, 6)); setPinError(''); }}
              placeholder="••••••"
              type="password"
              maxLength={6}
              className="w-full"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (pinInput === state.pin) { setLocked(false); setPinInput(''); }
                  else { setPinError(tt('wrongPin')); setPinInput(''); }
                }
              }}
            />
            {pinError && <p className="text-small" style={{ color: '#800000' }}>{pinError}</p>}
            <div className="flex justify-end gap-1">
              <Win98Button onClick={() => { if (pinInput === state.pin) { setLocked(false); setPinInput(''); } else { setPinError(tt('wrongPin')); setPinInput(''); } }}>
                {tt('unlock')}
              </Win98Button>
            </div>
          </div>
        </Win98Window>
      </div>
    );
  }

  const handleAddFriend = (friend: Friend) => {
    update({ friends: [...state.friends, friend] });
  };

  const handleSendMessage = (friendId: string, text: string, replyToId?: string) => {
    const msg: Message = {
      id: `m_${Date.now()}`,
      text,
      sent: true,
      timestamp: Date.now(),
      read: false,
      save: !state.incognito,
      replyToId,
    };
    const convs = [...state.conversations];
    const idx = convs.findIndex((c) => c.friendId === friendId);
    if (idx >= 0) {
      convs[idx] = { ...convs[idx], messages: [...convs[idx].messages, msg] };
    } else {
      convs.push({ friendId, messages: [msg] });
    }
    update({ conversations: convs });

    // Simulate friend reply
    if (Math.random() > 0.3) {
      setTimeout(() => {
        const reply: Message = {
          id: `m_${Date.now() + 1}`,
          text: `[Simulated reply] Got your message: "${text.slice(0, 50)}"`,
          sent: false,
          timestamp: Date.now(),
          read: true,
          save: !state.incognito,
        };
        const updated = [...convs];
        const uidx = updated.findIndex((c) => c.friendId === friendId);
        if (uidx >= 0) {
          updated[uidx] = { ...updated[uidx], messages: [...updated[uidx].messages, reply] };
          update({ conversations: updated });
        }
      }, 1500);
    }
  };

  const handleDeleteMessage = (friendId: string, msgId: string) => {
    const convs = state.conversations.map((c) => {
      if (c.friendId !== friendId) return c;
      return {
        ...c,
        messages: c.messages.map((m) =>
          m.id === msgId ? { ...m, deleted: true, text: '' } : m
        ),
      };
    });
    update({ conversations: convs });
  };

  const handleForwardMessage = (msg: Message, targetFriendId: string) => {
    const forwardedMsg: Message = {
      id: `m_${Date.now()}`,
      text: msg.text,
      sent: true,
      timestamp: Date.now(),
      read: false,
      save: !state.incognito,
      forwarded: true,
    };
    const convs = [...state.conversations];
    const idx = convs.findIndex((c) => c.friendId === targetFriendId);
    if (idx >= 0) {
      convs[idx] = { ...convs[idx], messages: [...convs[idx].messages, forwardedMsg] };
    } else {
      convs.push({ friendId: targetFriendId, messages: [forwardedMsg] });
    }
    update({ conversations: convs });
  };

  const handleDeleteFriend = (id: string) => {
    update({
      friends: state.friends.filter((f) => f.id !== id),
      conversations: state.conversations.filter((c) => c.friendId !== id),
    });
  };

  const handleWipe = () => {
    localStorage.clear();
    if (indexedDB.databases) {
      indexedDB.databases().then((dbs) => dbs.forEach((db) => { if (db.name) indexedDB.deleteDatabase(db.name); }));
    }
    setState({ ...state, onboarded: false, lang: null, username: '', pin: null, friends: [], conversations: [], messagesUsedToday: 0, apiKeys: { groq: '', openrouter: '', gemini: '', ollama: '' }, plan: 'free', encryptData: false, incognito: false, bonusClaimed: false, bonusDate: null });
  };

  const tabConfig: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'p2p', label: tt('p2pChat'), icon: <Users size={14} /> },
    { id: 'ai', label: tt('aiChat'), icon: <Bot size={14} /> },
    { id: 'settings', label: tt('settings'), icon: <SettingsIcon size={14} /> },
  ];

  return (
    <div className={cn('fixed inset-0 flex flex-col theme-transition', getThemeClass(theme))} style={{ background: theme === 'modern-dark' ? '#000' : theme === 'modern-light' ? '#fff' : '#008080' }}>
      {/* Desktop area */}
      <div className="flex-1 p-2 overflow-hidden" style={{ paddingBottom: '38px' }}>
        <Win98Window
          title={`ShadowChat 98 — ${tabConfig.find((t) => t.id === activeTab)?.label ?? ''}`}
          active
          onClose={() => {}}
          onMinimize={() => {}}
          onMaximize={() => {}}
          className="h-full"
          icon={<Monitor size={14} />}
        >
          <div className="h-full">
            {activeTab === 'p2p' && (
              <P2PChat
                lang={lang}
                friends={state.friends}
                conversations={state.conversations}
                onAddFriend={handleAddFriend}
                onSendMessage={handleSendMessage}
                onDeleteFriend={handleDeleteFriend}
                onUpdateConversations={(convs) => update({ conversations: convs })}
                onDeleteMessage={handleDeleteMessage}
                onForwardMessage={handleForwardMessage}
              />
            )}
            {activeTab === 'ai' && (
              <AIChat
                lang={lang}
                state={state}
                onUpdate={update}
                onIncrementUsage={() => update({ messagesUsedToday: state.messagesUsedToday + 1 })}
              />
            )}
            {activeTab === 'settings' && (
              <Settings
                lang={lang}
                state={state}
                onUpdate={update}
                onWipe={handleWipe}
                onLangChange={(l) => update({ lang: l })}
                theme={theme}
                onThemeChange={handleThemeChange}
              />
            )}
          </div>
        </Win98Window>
      </div>

      {/* Start Menu */}
      {startMenuOpen && (
        <>
          <div className="fixed inset-0" style={{ zIndex: 1000 }} onClick={() => setStartMenuOpen(false)} />
          <div className="start-menu" onClick={(e) => e.stopPropagation()}>
            <div className="start-menu-sidebar">ShadowChat 98</div>
            <div className="flex-1 py-1">
              <div className="start-menu-item" onClick={() => { setActiveTab('p2p'); setStartMenuOpen(false); }}>
                <Users size={14} /> {tt('p2pChat')}
              </div>
              <div className="start-menu-item" onClick={() => { setActiveTab('ai'); setStartMenuOpen(false); }}>
                <Bot size={14} /> {tt('aiChat')}
              </div>
              <div className="start-menu-item" onClick={() => { setActiveTab('settings'); setStartMenuOpen(false); }}>
                <SettingsIcon size={14} /> {tt('settings')}
              </div>
              <div className="win98-divider mx-1" />
              <div className="start-menu-item" style={{ opacity: state.pin ? 1 : 0.5, cursor: state.pin ? 'pointer' : 'default' }} onClick={() => { if (state.pin) { setLocked(true); setStartMenuOpen(false); } }}>
                <Lock size={14} /> {tt('lock')}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Taskbar */}
      <div className="win98-taskbar">
        <button className="win98-start-btn" onClick={() => setStartMenuOpen((o) => !o)}>
          <span style={{ fontSize: '14px' }}>⊞</span> {tt('start')}
        </button>
        <div className="flex gap-1 flex-1 overflow-hidden">
          {tabConfig.map((tab) => (
            <button
              key={tab.id}
              className={`win98-taskbar-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon}
              <span className="truncate">{tab.label}</span>
            </button>
          ))}
        </div>
        <div className="win98-tray">
          {state.pin && <Lock size={12} />}
          <span>{clock}</span>
        </div>
      </div>
    </div>
  );
}
