'use client';

import { useState, useRef, useEffect } from 'react';
import type { LangCode } from '@/lib/i18n';
import { t } from '@/lib/i18n';
import type { Friend, Conversation, Message } from '@/lib/store';
import { generateCode } from '@/lib/store';
import { Win98Button, Win98Input, Win98Window } from '@/components/win98';
import { MessageBubble } from '@/components/MessageBubble';
import { QrCode, ScanLine, Link2, UserPlus, Trash2, Users, Send, Save, Clock, CornerUpLeft, X, Forward } from 'lucide-react';

export function P2PChat({
  lang,
  friends,
  conversations,
  onAddFriend,
  onSendMessage,
  onDeleteFriend,
  onUpdateConversations,
  onDeleteMessage,
  onForwardMessage,
}: {
  lang: LangCode;
  friends: Friend[];
  conversations: Conversation[];
  onAddFriend: (friend: Friend) => void;
  onSendMessage: (friendId: string, text: string, replyToId?: string) => void;
  onDeleteFriend: (id: string) => void;
  onUpdateConversations: (convs: Conversation[]) => void;
  onDeleteMessage: (friendId: string, msgId: string) => void;
  onForwardMessage: (msg: Message, targetFriendId: string) => void;
}) {
  const [selectedFriend, setSelectedFriend] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [connectCode, setConnectCode] = useState('');
  const [connectError, setConnectError] = useState('');
  const [myCode] = useState(generateCode());
  const [showConnectPopup, setShowConnectPopup] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [showForward, setShowForward] = useState<Message | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const tt = (key: Parameters<typeof t>[1]) => t(lang, key);

  const selected = friends.find((f) => f.id === selectedFriend);
  const currentConv = conversations.find((c) => c.friendId === selectedFriend);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [currentConv?.messages.length]);

  const handleSend = () => {
    if (!message.trim() || !selectedFriend) return;
    onSendMessage(selectedFriend, message.trim(), replyTo?.id);
    setMessage('');
    setReplyTo(null);
  };

  const handleConnect = () => {
    if (connectCode.length !== 6) {
      setConnectError(tt('invalidCode'));
      return;
    }
    const newFriend: Friend = {
      id: `f_${Date.now()}`,
      username: `user-${connectCode}`,
      online: Math.random() > 0.5,
      addedAt: Date.now(),
    };
    onAddFriend(newFriend);
    setShowAdd(false);
    setConnectCode('');
    setConnectError('');
    setShowConnectPopup(newFriend.username);
  };

  const handleDeleteMessage = (msg: Message) => {
    if (selectedFriend) {
      onDeleteMessage(selectedFriend, msg.id);
    }
  };

  const handleForwardMessage = (msg: Message) => {
    setShowForward(msg);
  };

  const handleForwardSelect = (targetFriendId: string) => {
    if (showForward) {
      onForwardMessage(showForward, targetFriendId);
    }
    setShowForward(null);
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

  return (
    <div className="flex h-full" style={{ background: '#c0c0c0' }}>
      {/* Friend list */}
      <div className="win98-sunken-gray" style={{ width: 200, borderRight: '2px solid #808080', overflowY: 'auto' }} >
        <div className="p-1 flex items-center justify-between" style={{ borderBottom: '1px solid #808080' }}>
          <span className="font-bold text-normal">{tt('friends')} ({friends.length})</span>
          <Win98Button onClick={() => setShowAdd(true)} style={{ padding: '2px 6px' }}>
            <UserPlus size={12} />
          </Win98Button>
        </div>
        <div className="win98-scroll" style={{ overflowY: 'auto' }}>
          {friends.length === 0 ? (
            <div className="p-2 text-small text-center" style={{ color: '#404040' }}>{tt('noFriends')}</div>
          ) : (
            friends.map((f) => (
              <div
                key={f.id}
                onClick={() => { setSelectedFriend(f.id); setReplyTo(null); }}
                className="flex items-center gap-2 px-2 py-1 cursor-pointer text-normal"
                style={{
                  background: selectedFriend === f.id ? '#000080' : 'transparent',
                  color: selectedFriend === f.id ? '#fff' : '#000',
                }}
              >
                <div className={`status-dot ${f.online ? 'online' : 'offline'}`} />
                <span className="truncate flex-1">{f.username}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {selected ? (
          <>
            {/* Chat header */}
            <div className="flex items-center justify-between px-2 py-1" style={{ borderBottom: '1px solid #808080' }}>
              <div className="flex items-center gap-2">
                <div className={`status-dot ${selected.online ? 'online' : 'offline'}`} />
                <span className="font-bold text-normal">{selected.username}</span>
                <span className="text-small" style={{ color: '#404040' }}>
                  {selected.online ? tt('online') : tt('offline')}
                </span>
              </div>
              <div className="flex gap-1">
                <Win98Button style={{ padding: '2px 6px' }} onClick={() => {
                  if (friends.length < 8) {
                    alert(tt('addToConference') + ' — ' + tt('maxParticipants'));
                  }
                }}>
                  <Users size={12} /> {tt('addToConference')}
                </Win98Button>
                <Win98Button style={{ padding: '2px 6px' }} onClick={() => {
                  if (confirm(tt('confirmDelete'))) {
                    onDeleteFriend(selected.id);
                    setSelectedFriend(null);
                  }
                }}>
                  <Trash2 size={12} />
                </Win98Button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 win98-scroll p-2" style={{ overflowY: 'auto', background: '#fff' }}>
              {currentConv?.messages.map((msg) => {
                const replyToMsg = msg.replyToId
                  ? currentConv.messages.find((m) => m.id === msg.replyToId) ?? null
                  : null;
                return (
                  <div key={msg.id} ref={(el) => { messageRefs.current[msg.id] = el; }}>
                    <MessageBubble
                      message={msg}
                      lang={lang}
                      replyToMessage={replyToMsg}
                      onSelectReply={(m) => setReplyTo(m)}
                      onDelete={handleDeleteMessage}
                      onForward={handleForwardMessage}
                      onJumpToMessage={handleJumpToMessage}
                    />
                  </div>
                );
              })}
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
                value={message}
                onChange={setMessage}
                placeholder={tt('typeMessage')}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
                className="flex-1"
              />
              <Win98Button onClick={handleSend} disabled={!message.trim()}>
                <Send size={12} /> {tt('sendMessage')}
              </Win98Button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center" style={{ color: '#404040' }}>
            <div>
              <Users size={48} className="mb-2 opacity-30" />
              <p>{tt('noConversation')}</p>
            </div>
          </div>
        )}
      </div>

      {/* Add Friend Dialog */}
      {showAdd && (
        <div className="fixed inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.3)', zIndex: 100 }}>
          <Win98Window title={tt('addFriend')} onClose={() => setShowAdd(false)} className="w-96" style={{ maxWidth: 360 }}>
            <div className="p-3 space-y-3">
              <div className="win98-sunken-gray p-2">
                <div className="font-bold mb-1 flex items-center gap-1"><QrCode size={12} /> {tt('qrCode')}</div>
                <div className="flex items-center justify-center bg-white" style={{ height: 100, border: '1px solid #808080' }}>
                  <QrCode size={64} className="opacity-50" />
                </div>
              </div>
              <div className="win98-sunken-gray p-2">
                <div className="font-bold mb-1">{tt('oneTimeCode')}: <span className="text-base">{myCode}</span></div>
                <p className="text-small" style={{ color: '#404040' }}>Valid for 10 minutes</p>
              </div>
              <div className="win98-sunken-gray p-2">
                <div className="font-bold mb-1 flex items-center gap-1"><Link2 size={12} /> {tt('shareLink')}</div>
                <div className="win98-sunken p-1 text-small">shadowchat98://connect?code={myCode}</div>
                <Win98Button onClick={() => { navigator.clipboard?.writeText(`shadowchat98://connect?code=${myCode}`); }} style={{ marginTop: 4, padding: '2px 8px' }}>
                  {tt('copyLink')}
                </Win98Button>
              </div>
              <div className="win98-sunken-gray p-2">
                <div className="font-bold mb-1 flex items-center gap-1"><ScanLine size={12} /> {tt('addFriendCode')}</div>
                <div className="flex gap-1">
                  <Win98Input value={connectCode} onChange={(v) => { setConnectCode(v.replace(/\D/g, '').slice(0, 6)); setConnectError(''); }} placeholder="000000" maxLength={6} className="flex-1" />
                  <Win98Button onClick={handleConnect}>{tt('ok')}</Win98Button>
                </div>
                {connectError && <p className="text-small mt-1" style={{ color: '#800000' }}>{connectError}</p>}
              </div>
              <div className="flex justify-end">
                <Win98Button onClick={() => setShowAdd(false)}>{tt('close')}</Win98Button>
              </div>
            </div>
          </Win98Window>
        </div>
      )}

      {/* Connect request popup */}
      {showConnectPopup && (
        <div className="fixed inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.3)', zIndex: 100 }}>
          <Win98Window title={tt('addFriend')} onClose={() => setShowConnectPopup(null)} className="w-72" style={{ maxWidth: 280 }}>
            <div className="p-3 space-y-3">
              <p className="text-normal">{showConnectPopup} {tt('connectRequest')}</p>
              <div className="flex justify-end gap-1">
                <Win98Button onClick={() => setShowConnectPopup(null)}>{tt('yes')}</Win98Button>
                <Win98Button onClick={() => setShowConnectPopup(null)}>{tt('no')}</Win98Button>
              </div>
            </div>
          </Win98Window>
        </div>
      )}

      {/* Forward dialog */}
      {showForward && (
        <div className="fixed inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.3)', zIndex: 100 }}>
          <Win98Window title={tt('forward')} onClose={() => setShowForward(null)} className="w-72" style={{ maxWidth: 280 }}>
            <div className="p-3 space-y-2">
              <p className="font-bold text-normal flex items-center gap-1"><Forward size={12} /> {tt('forward')}</p>
              <div className="win98-sunken-gray p-1" style={{ maxHeight: 200, overflowY: 'auto' }}>
                {friends.length === 0 ? (
                  <p className="text-small text-center p-2" style={{ color: '#404040' }}>{tt('noFriends')}</p>
                ) : (
                  friends.filter((f) => f.id !== selectedFriend).map((f) => (
                    <div
                      key={f.id}
                      onClick={() => handleForwardSelect(f.id)}
                      className="flex items-center gap-2 px-2 py-1 cursor-pointer text-normal hover:bg-[#000080] hover:text-white"
                    >
                      <div className={`status-dot ${f.online ? 'online' : 'offline'}`} />
                      <span className="truncate flex-1">{f.username}</span>
                    </div>
                  ))
                )}
              </div>
              <div className="flex justify-end">
                <Win98Button onClick={() => setShowForward(null)}>{tt('close')}</Win98Button>
              </div>
            </div>
          </Win98Window>
        </div>
      )}
    </div>
  );
}
