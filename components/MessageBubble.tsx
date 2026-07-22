'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import type { LangCode } from '@/lib/i18n';
import { t } from '@/lib/i18n';
import type { Message } from '@/lib/store';
import { Copy, Reply, Trash2, Forward, CheckSquare, CornerUpLeft, Clock } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
  lang: LangCode;
  isAI?: boolean;
  replyToMessage?: Message | null;
  onSelectReply?: (msg: Message) => void;
  onDelete?: (msg: Message) => void;
  onForward?: (msg: Message) => void;
  onSelectAll?: () => void;
  onJumpToMessage?: (msgId: string) => void;
}

export function MessageBubble({
  message,
  lang,
  isAI = false,
  replyToMessage,
  onSelectReply,
  onDelete,
  onForward,
  onSelectAll,
  onJumpToMessage,
}: MessageBubbleProps) {
  const tt = (key: Parameters<typeof t>[1]) => t(lang, key);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [holdTimer, setHoldTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [showHoldHint, setShowHoldHint] = useState(false);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [swipeTriggered, setSwipeTriggered] = useState(false);
  const bubbleRef = useRef<HTMLDivElement>(null);

  const isSent = message.sent;
  const bubbleClass = message.deleted
    ? 'msg-bubble deleted'
    : isAI
      ? 'msg-bubble ai'
      : isSent
        ? 'msg-bubble sent'
        : 'msg-bubble received';

  const closeMenu = useCallback(() => setContextMenu(null), []);

  useEffect(() => {
    if (contextMenu) {
      window.addEventListener('click', closeMenu);
      window.addEventListener('scroll', closeMenu, true);
      return () => {
        window.removeEventListener('click', closeMenu);
        window.removeEventListener('scroll', closeMenu, true);
      };
    }
  }, [contextMenu, closeMenu]);

  const handleContextMenu = (e: React.MouseEvent) => {
    if (message.deleted) return;
    e.preventDefault();
    const rect = bubbleRef.current?.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    const menuW = 160;
    const menuH = 160;
    const adjustedX = Math.min(x, window.innerWidth - menuW - 4);
    const adjustedY = Math.min(y, window.innerHeight - menuH - 4);
    setContextMenu({ x: adjustedX, y: adjustedY });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (message.deleted) return;
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });

    if (isSent && onDelete) {
      const timer = setTimeout(() => {
        setShowHoldHint(true);
        if (confirm(tt('confirmDeleteMsg'))) {
          onDelete(message);
        }
        setShowHoldHint(false);
      }, 2000);
      setHoldTimer(timer);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (message.deleted || !touchStart) return;
    const touch = e.touches[0];
    const dx = touch.clientX - touchStart.x;
    const dy = touch.clientY - touchStart.y;

    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) {
      if (holdTimer) {
        clearTimeout(holdTimer);
        setHoldTimer(null);
        setShowHoldHint(false);
      }
      if (dx > 0 && isSent) {
        setSwipeOffset(Math.min(dx, 80));
        if (dx > 60 && !swipeTriggered && onSelectReply) {
          setSwipeTriggered(true);
          onSelectReply(message);
        }
      } else if (dx < 0 && !isSent) {
        setSwipeOffset(Math.max(dx, -80));
        if (dx < -60 && !swipeTriggered && onSelectReply) {
          setSwipeTriggered(true);
          onSelectReply(message);
        }
      }
    }
  };

  const handleTouchEnd = () => {
    if (holdTimer) {
      clearTimeout(holdTimer);
      setHoldTimer(null);
    }
    setShowHoldHint(false);
    setSwipeOffset(0);
    setSwipeTriggered(false);
    setTouchStart(null);
  };

  const handleCopy = () => {
    navigator.clipboard?.writeText(message.text);
    setContextMenu(null);
  };

  const handleReply = () => {
    onSelectReply?.(message);
    setContextMenu(null);
  };

  const handleDelete = () => {
    if (confirm(tt('confirmDeleteMsg'))) {
      onDelete?.(message);
    }
    setContextMenu(null);
  };

  const handleForward = () => {
    onForward?.(message);
    setContextMenu(null);
  };

  const handleJumpToReply = () => {
    if (message.replyToId && onJumpToMessage) {
      onJumpToMessage(message.replyToId);
    }
  };

  if (message.deleted) {
    return (
      <div className="mb-2 flex flex-col" style={{ alignItems: isSent ? 'flex-end' : 'flex-start' }}>
        <div className="msg-bubble deleted" style={{ opacity: 0.5, fontStyle: 'italic' }}>
          {tt('messageDeleted')}
        </div>
        <div className="text-small mt-0.5" style={{ color: '#999' }}>
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className="mb-2 flex flex-col"
        style={{
          alignItems: isSent ? 'flex-end' : 'flex-start',
          transform: `translateX(${isSent ? swipeOffset : -swipeOffset}px)`,
          transition: touchStart ? 'none' : 'transform 0.2s ease',
          position: 'relative',
        }}
      >
        {/* Swipe indicator */}
        {swipeOffset > 20 && isSent && (
          <div style={{
            position: 'absolute',
            right: -30,
            top: '50%',
            transform: 'translateY(-50%)',
            opacity: swipeOffset / 80,
            pointerEvents: 'none',
          }}>
            <Reply size={16} />
          </div>
        )}
        {swipeOffset > 20 && !isSent && (
          <div style={{
            position: 'absolute',
            left: -30,
            top: '50%',
            transform: 'translateY(-50%)',
            opacity: swipeOffset / 80,
            pointerEvents: 'none',
          }}>
            <Reply size={16} />
          </div>
        )}

        {/* Reply preview */}
        {message.replyToId && replyToMessage && !replyToMessage.deleted && (
          <div
            onClick={handleJumpToReply}
            className="msg-reply-preview"
            style={{
              borderLeft: '3px solid #000080',
              padding: '2px 6px',
              marginBottom: 2,
              cursor: 'pointer',
              fontSize: 11,
              maxWidth: 280,
              opacity: 0.8,
              background: 'rgba(0,0,128,0.05)',
              borderRadius: 0,
            }}
          >
            <div style={{ fontWeight: 'bold', color: '#000080', fontSize: 10 }}>
              <CornerUpLeft size={8} style={{ display: 'inline', marginRight: 2 }} />
              {tt('replyTo')}: {replyToMessage.sent ? 'You' : 'Friend'}
            </div>
            <div style={{ color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {replyToMessage.text}
            </div>
          </div>
        )}

        {/* Forwarded indicator */}
        {message.forwarded && (
          <div style={{ fontSize: 10, color: '#888', marginBottom: 2, fontStyle: 'italic' }}>
            <Forward size={8} style={{ display: 'inline', marginRight: 2 }} />
            {tt('forwarded')}
          </div>
        )}

        {/* The bubble */}
        <div
          ref={bubbleRef}
          className={bubbleClass}
          onContextMenu={handleContextMenu}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ userSelect: 'text', WebkitUserSelect: 'text', touchAction: 'pan-y' }}
        >
          <div style={{ whiteSpace: 'pre-wrap' }}>{message.text}</div>
        </div>

        {/* Timestamp + status */}
        <div className="text-small flex items-center gap-1 mt-0.5" style={{ color: '#606060' }}>
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          {isSent && (message.read ? ` ✓✓ ${tt('read')}` : ` ✓ ${tt('sent')}`)}
          {message.selfDestruct && <Clock size={8} />}
          {message.save && !isAI && <span style={{ fontSize: 8 }}>💾</span>}
        </div>

        {/* Hold hint */}
        {showHoldHint && (
          <div style={{
            position: 'absolute',
            top: -20,
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#000080',
            color: '#fff',
            padding: '1px 6px',
            fontSize: 10,
            whiteSpace: 'nowrap',
            zIndex: 10,
          }}>
            {tt('holdToDelete')}
          </div>
        )}
      </div>

      {/* Context menu */}
      {contextMenu && (
        <div
          className="msg-context-menu"
          style={{
            position: 'fixed',
            left: contextMenu.x,
            top: contextMenu.y,
            zIndex: 9999,
            minWidth: 150,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="msg-context-item" onClick={handleCopy}>
            <Copy size={12} /> {tt('copy')}
          </div>
          {onSelectReply && (
            <div className="msg-context-item" onClick={handleReply}>
              <Reply size={12} /> {tt('reply')}
            </div>
          )}
          {onForward && (
            <div className="msg-context-item" onClick={handleForward}>
              <Forward size={12} /> {tt('forward')}
            </div>
          )}
          {isSent && onDelete && (
            <>
              <div className="msg-context-divider" />
              <div className="msg-context-item msg-context-danger" onClick={handleDelete}>
                <Trash2 size={12} /> {tt('delete')}
              </div>
            </>
          )}
          {onSelectAll && (
            <>
              <div className="msg-context-divider" />
              <div className="msg-context-item" onClick={() => { onSelectAll(); setContextMenu(null); }}>
                <CheckSquare size={12} /> {tt('selectAll')}
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
