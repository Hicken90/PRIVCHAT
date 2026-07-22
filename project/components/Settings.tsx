'use client';

import { useState } from 'react';
import type { LangCode } from '@/lib/i18n';
import { t, LANGUAGES } from '@/lib/i18n';
import type { AppState, Plan } from '@/lib/store';
import { wipeState, generateUsername, getMessageLimit } from '@/lib/store';
import { Win98Button, Win98Input, Win98Checkbox, Win98Tabs, Win98Group, Win98Select, Win98Progress } from '@/components/win98';
import { Eye, EyeOff, Trash2, AlertTriangle, Key, CreditCard, Globe, Info, User, Lock, Plug, Check, X, Crown, Palette } from 'lucide-react';
import type { Theme } from '@/lib/store';

export function Settings({
  lang,
  state,
  onUpdate,
  onWipe,
  onLangChange,
  theme,
  onThemeChange,
}: {
  lang: LangCode;
  state: AppState;
  onUpdate: (partial: Partial<AppState>) => void;
  onWipe: () => void;
  onLangChange: (lang: LangCode) => void;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
}) {
  const [tab, setTab] = useState('general');
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [pinInput, setPinInput] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [pinError, setPinError] = useState('');
  const [panicConfirm, setPanicConfirm] = useState(false);
  const [panicPin, setPanicPin] = useState('');
  const [testStatus, setTestStatus] = useState<Record<string, 'idle' | 'testing' | 'ok' | 'fail'>>({});

  const tt = (key: Parameters<typeof t>[1]) => t(lang, key);

  const tabs = [
    { id: 'general', label: tt('general'), icon: <User size={12} /> },
    { id: 'apikeys', label: tt('apiKeys'), icon: <Key size={12} /> },
    { id: 'subscription', label: tt('subscription'), icon: <CreditCard size={12} /> },
    { id: 'appearance', label: tt('appearance'), icon: <Palette size={12} /> },
    { id: 'language', label: tt('language'), icon: <Globe size={12} /> },
    { id: 'about', label: tt('about'), icon: <Info size={12} /> },
  ];

  const handleSetPin = () => {
    if (pinInput.length !== 6) { setPinError('PIN must be 6 digits'); return; }
    if (pinInput !== pinConfirm) { setPinError(tt('pinsDontMatch')); return; }
    onUpdate({ pin: pinInput });
    setPinInput(''); setPinConfirm(''); setPinError('');
  };

  const handlePanic = () => {
    if (panicPin.length !== 6) return;
    if (state.pin && panicPin !== state.pin) { setPinError(tt('wrongPin')); return; }
    onWipe();
  };

  const testConnection = (engine: string) => {
    setTestStatus((s) => ({ ...s, [engine]: 'testing' }));
    if (engine === 'ollama') {
      fetch('http://localhost:11434/api/tags')
        .then((r) => r.ok ? setTestStatus((s) => ({ ...s, [engine]: 'ok' })) : setTestStatus((s) => ({ ...s, [engine]: 'fail' })))
        .catch(() => setTestStatus((s) => ({ ...s, [engine]: 'fail' })));
    } else {
      setTimeout(() => {
        const hasKey = state.apiKeys[engine as keyof typeof state.apiKeys];
        setTestStatus((s) => ({ ...s, [engine]: hasKey ? 'ok' : 'fail' }));
      }, 500);
    }
  };

  const limit = getMessageLimit(state.plan);

  return (
    <div className="flex flex-col h-full" style={{ background: '#c0c0c0' }}>
      <Win98Tabs tabs={tabs} active={tab} onChange={setTab} />
      <div className="win98-tab-content flex-1 win98-scroll" style={{ overflowY: 'auto' }}>
        {tab === 'general' && (
          <div className="space-y-3">
            <Win98Group title={tt('username')}>
              <div className="space-y-2">
                <Win98Input value={state.username} onChange={(v) => onUpdate({ username: v })} />
                <Win98Button onClick={() => { if (confirm(tt('changeUsernameWarning'))) onUpdate({ username: generateUsername() }); }}>
                  🎲 {tt('generate')}
                </Win98Button>
              </div>
            </Win98Group>

            <Win98Group title={tt('appPassword')}>
              <div className="space-y-2">
                <div className="flex gap-1 items-center">
                  <Win98Input value={pinInput} onChange={(v) => setPinInput(v.replace(/\D/g, '').slice(0, 6))} placeholder="••••••" type="password" maxLength={6} />
                  <Win98Button onClick={handleSetPin}>{tt('setPin')}</Win98Button>
                </div>
                <div className="flex gap-1 items-center">
                  <Win98Input value={pinConfirm} onChange={(v) => setPinConfirm(v.replace(/\D/g, '').slice(0, 6))} placeholder={tt('confirmPin')} type="password" maxLength={6} />
                </div>
                {pinError && <p className="text-small" style={{ color: '#800000' }}>{pinError}</p>}
                {state.pin && <p className="text-small" style={{ color: '#008000' }}>✓ PIN set</p>}
              </div>
            </Win98Group>

            <Win98Group title={tt('encryptData')}>
              <Win98Checkbox checked={state.encryptData} onChange={(v) => onUpdate({ encryptData: v })} label={tt('encryptData')} />
              <Win98Checkbox checked={state.incognito} onChange={(v) => onUpdate({ incognito: v })} label={tt('incognitoMode')} />
            </Win98Group>

            <Win98Group title={tt('panicButton')}>
              {!panicConfirm ? (
                <Win98Button onClick={() => setPanicConfirm(true)} style={{ background: '#c00000', color: '#fff', fontWeight: 'bold' }}>
                  <AlertTriangle size={12} /> {tt('panicButton')}
                </Win98Button>
              ) : (
                <div className="space-y-2">
                  <p className="font-bold" style={{ color: '#c00000' }}>{tt('panicConfirm')}</p>
                  {state.pin && (
                    <Win98Input value={panicPin} onChange={(v) => setPanicPin(v.replace(/\D/g, '').slice(0, 6))} placeholder={tt('enterPin')} type="password" maxLength={6} />
                  )}
                  <div className="flex gap-1">
                    <Win98Button onClick={handlePanic} style={{ background: '#c00000', color: '#fff' }}>
                      <Trash2 size={12} /> {tt('confirmWipe')}
                    </Win98Button>
                    <Win98Button onClick={() => { setPanicConfirm(false); setPanicPin(''); setPinError(''); }}>{tt('cancel')}</Win98Button>
                  </div>
                  {pinError && <p className="text-small" style={{ color: '#800000' }}>{pinError}</p>}
                </div>
              )}
            </Win98Group>
          </div>
        )}

        {tab === 'apikeys' && (
          <div className="space-y-3">
            {(['groq', 'openrouter', 'gemini', 'ollama'] as const).map((engine) => (
              <Win98Group key={engine} title={tt(engine)}>
                {engine === 'ollama' ? (
                  <div className="space-y-1">
                    <p className="text-small">{tt('noKeyNeeded')} — {tt('ollamaSteps')}</p>
                    <Win98Button onClick={() => testConnection(engine)} style={{ padding: '2px 8px' }}>
                      <Plug size={11} /> {tt('testConnection')}
                    </Win98Button>
                    {testStatus[engine] === 'ok' && <span className="text-small" style={{ color: '#008000' }}>✓ {tt('connected')}</span>}
                    {testStatus[engine] === 'fail' && <span className="text-small" style={{ color: '#800000' }}>✗ {tt('connectionFailed')}</span>}
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="flex gap-1">
                      <Win98Input
                        value={state.apiKeys[engine]}
                        onChange={(v) => onUpdate({ apiKeys: { ...state.apiKeys, [engine]: v } })}
                        placeholder={tt('apiKey')}
                        type={showKeys[engine] ? 'text' : 'password'}
                        className="flex-1"
                      />
                      <Win98Button onClick={() => setShowKeys((s) => ({ ...s, [engine]: !s[engine] }))} style={{ padding: '2px 6px' }}>
                        {showKeys[engine] ? <EyeOff size={12} /> : <Eye size={12} />}
                      </Win98Button>
                    </div>
                    <div className="flex gap-1 items-center">
                      <Win98Button onClick={() => testConnection(engine)} style={{ padding: '2px 8px' }}>
                        <Plug size={11} /> {tt('testConnection')}
                      </Win98Button>
                      {testStatus[engine] === 'ok' && <span className="text-small flex items-center gap-1" style={{ color: '#008000' }}><Check size={11} /> {tt('connected')}</span>}
                      {testStatus[engine] === 'fail' && <span className="text-small flex items-center gap-1" style={{ color: '#800000' }}><X size={11} /> {tt('connectionFailed')}</span>}
                    </div>
                  </div>
                )}
              </Win98Group>
            ))}
          </div>
        )}

        {tab === 'subscription' && (
          <div className="space-y-3">
            <Win98Group title={tt('currentPlan')}>
              <div className="flex items-center gap-2 mb-2">
                <Crown size={16} className={state.plan === 'free' ? 'text-gray-500' : 'text-yellow-700'} />
                <span className="font-bold text-base">{state.plan === 'free' ? tt('free') : state.plan === 'basic' ? tt('basic') : tt('pro')}</span>
              </div>
            </Win98Group>

            <Win98Group title={tt('usageStats')}>
              <div className="space-y-2">
                <div className="flex justify-between text-normal">
                  <span>{tt('messagesToday')}</span>
                  <span>{state.messagesUsedToday} / {limit}</span>
                </div>
                <Win98Progress value={state.messagesUsedToday} max={limit} />
              </div>
            </Win98Group>

            <Win98Group title={tt('upgrade')}>
              <div className="space-y-1">
                <Win98Button className="w-full" onClick={() => onUpdate({ plan: 'basic' })} disabled={state.plan === 'basic'}>
                  {tt('upgradeBasic')}
                </Win98Button>
                <Win98Button className="w-full" onClick={() => onUpdate({ plan: 'pro' })} disabled={state.plan === 'pro'}>
                  {tt('upgradePro')}
                </Win98Button>
              </div>
            </Win98Group>
          </div>
        )}

        {tab === 'appearance' && (
          <div className="space-y-3">
            <p className="font-bold mb-2">{tt('selectTheme')}</p>
            <div className="grid grid-cols-3 gap-2">
              {([
                { val: 'retro' as Theme, label: tt('themeRetro'), desc: tt('themeRetroDesc'), bg: '#c0c0c0', titlebar: '#000080', titlefg: '#fff', body: '#000' },
                { val: 'modern-dark' as Theme, label: tt('themeModernDark'), desc: tt('themeModernDarkDesc'), bg: '#000', titlebar: '#C0C0C0', titlefg: '#000', body: '#fff' },
                { val: 'modern-light' as Theme, label: tt('themeModernLight'), desc: tt('themeModernLightDesc'), bg: '#fff', titlebar: '#000', titlefg: '#fff', body: '#000' },
              ]).map((opt) => (
                <button
                  key={opt.val}
                  className={theme === opt.val ? 'win98-btn pressed' : 'win98-btn'}
                  onClick={() => onThemeChange(opt.val)}
                  style={{ padding: 0, flexDirection: 'column', alignItems: 'stretch', gap: 0, overflow: 'hidden' }}
                >
                  <div style={{ background: opt.titlebar, color: opt.titlefg, fontSize: 9, padding: '2px 4px', fontWeight: 'bold', textAlign: 'left' }}>▀ □ ×</div>
                  <div style={{ background: opt.bg, color: opt.body, padding: '8px 4px', fontSize: 10, textAlign: 'center', minHeight: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {opt.label}
                  </div>
                </button>
              ))}
            </div>
            <Win98Group title={tt('selectTheme')}>
              <p className="text-small">
                {theme === 'retro' && tt('themeRetroDesc')}
                {theme === 'modern-dark' && tt('themeModernDarkDesc')}
                {theme === 'modern-light' && tt('themeModernLightDesc')}
              </p>
            </Win98Group>
          </div>
        )}

        {tab === 'language' && (
          <div className="space-y-2">
            <p className="font-bold mb-2">{tt('selectLanguage')}</p>
            <div className="grid grid-cols-2 gap-2">
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  className={lang === l.code ? 'win98-btn pressed' : 'win98-btn'}
                  onClick={() => onLangChange(l.code)}
                  style={{ justifyContent: 'flex-start', padding: '6px 10px' }}
                >
                  <span className="text-base">{l.flag}</span>
                  <span>{l.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {tab === 'about' && (
          <div className="space-y-3">
            <Win98Group title={tt('about')}>
              <div className="text-center space-y-2">
                <div className="text-lg font-bold">ShadowChat 98</div>
                <div className="text-small">{tt('appVersion')}: 1.0.0</div>
                <div className="text-normal">{tt('madeWith')} ❤️</div>
              </div>
            </Win98Group>
            <Win98Group title="Privacy">
              <p className="text-normal leading-relaxed">{tt('privacyInfo')}</p>
            </Win98Group>
          </div>
        )}
      </div>
    </div>
  );
}
