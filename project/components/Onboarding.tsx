'use client';

import { useState } from 'react';
import { LANGUAGES, t, type LangCode } from '@/lib/i18n';
import { generateUsername, type Theme } from '@/lib/store';
import { Win98Window, Win98Button, Win98Input } from '@/components/win98';
import { Lock, Users, Bot, Key, User, Shield, Zap, ExternalLink, Palette } from 'lucide-react';

export function Onboarding({ onComplete }: { onComplete: (lang: LangCode, username: string, theme: Theme) => void }) {
  const [step, setStep] = useState(0);
  const [lang, setLang] = useState<LangCode>('en');
  const [username, setUsername] = useState(generateUsername());
  const [theme, setTheme] = useState<Theme>('retro');

  const tt = (key: Parameters<typeof t>[1]) => t(lang, key);

  const steps = [
    // Screen 1: Language
    {
      title: tt('selectLanguage'),
      icon: <span className="text-base">🌐</span>,
      body: (
        <div className="grid grid-cols-2 gap-2">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              className={lang === l.code ? 'win98-btn pressed' : 'win98-btn'}
              onClick={() => setLang(l.code)}
              style={{ justifyContent: 'flex-start', padding: '6px 10px' }}
            >
              <span className="text-base">{l.flag}</span>
              <span>{l.name}</span>
            </button>
          ))}
        </div>
      ),
    },
    // Screen 2: Theme selection
    {
      title: tt('selectTheme'),
      icon: <Palette size={16} />,
      body: (
        <div className="space-y-2">
          <p className="text-normal mb-2">{tt('selectTheme')}</p>
          <div className="grid grid-cols-3 gap-2">
            {([
              { val: 'retro' as Theme, label: tt('themeRetro'), desc: tt('themeRetroDesc'), bg: '#c0c0c0', titlebar: '#000080', titlefg: '#fff', body: '#000' },
              { val: 'modern-dark' as Theme, label: tt('themeModernDark'), desc: tt('themeModernDarkDesc'), bg: '#000', titlebar: '#C0C0C0', titlefg: '#000', body: '#fff' },
              { val: 'modern-light' as Theme, label: tt('themeModernLight'), desc: tt('themeModernLightDesc'), bg: '#fff', titlebar: '#000', titlefg: '#fff', body: '#000' },
            ]).map((opt) => (
              <button
                key={opt.val}
                className={theme === opt.val ? 'win98-btn pressed' : 'win98-btn'}
                onClick={() => setTheme(opt.val)}
                style={{ padding: 0, flexDirection: 'column', alignItems: 'stretch', gap: 0, overflow: 'hidden' }}
              >
                <div style={{ background: opt.titlebar, color: opt.titlefg, fontSize: 9, padding: '2px 4px', fontWeight: 'bold', textAlign: 'left' }}>▀ □ ×</div>
                <div style={{ background: opt.bg, color: opt.body, padding: '8px 4px', fontSize: 10, textAlign: 'center', minHeight: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {opt.label}
                </div>
              </button>
            ))}
          </div>
          <div className="win98-sunken-gray p-2 mt-2">
            <p className="text-small">
              {theme === 'retro' && tt('themeRetroDesc')}
              {theme === 'modern-dark' && tt('themeModernDarkDesc')}
              {theme === 'modern-light' && tt('themeModernLightDesc')}
            </p>
          </div>
        </div>
      ),
    },
    // Screen 3: Privacy
    {
      title: tt('privacyTitle'),
      icon: <Shield size={16} />,
      body: (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Lock size={24} className="text-green-700" />
            <span className="font-bold">{tt('privacyTitle')}</span>
          </div>
          <p className="text-normal leading-relaxed">{tt('privacyBody')}</p>
          <div className="win98-sunken-gray p-2 text-small space-y-1">
            <div>✓ End-to-End Encryption (Curve25519 + AES-256-GCM)</div>
            <div>✓ No servers — peer-to-peer only</div>
            <div>✓ Local storage only — nothing leaves your device</div>
            <div>✓ Private keys in IndexedDB, encrypted with PIN</div>
          </div>
        </div>
      ),
    },
    // Screen 3: How it works
    {
      title: tt('howItWorksTitle'),
      icon: <Zap size={16} />,
      body: (
        <div className="space-y-3">
          <div className="win98-sunken-gray p-3">
            <div className="flex items-center gap-2 mb-1">
              <Users size={16} className="text-blue-800" />
              <span className="font-bold">P2P Chat</span>
            </div>
            <p className="text-normal leading-relaxed">{tt('howP2P')}</p>
          </div>
          <div className="win98-sunken-gray p-3">
            <div className="flex items-center gap-2 mb-1">
              <Bot size={16} className="text-purple-800" />
              <span className="font-bold">AI Chat</span>
            </div>
            <p className="text-normal leading-relaxed">{tt('howAI')}</p>
          </div>
        </div>
      ),
    },
    // Screen 4: Get API Key
    {
      title: tt('getApiKeyTitle'),
      icon: <Key size={16} />,
      body: (
        <div className="space-y-2">
          <p className="mb-2">{tt('getApiKeyBody')}</p>
          {[
            { name: 'Groq', url: 'https://console.groq.com', steps: tt('groqSteps'), color: '#ff6b00' },
            { name: 'OpenRouter', url: 'https://openrouter.ai', steps: tt('openrouterSteps'), color: '#6b00ff' },
            { name: 'Gemini', url: 'https://aistudio.google.com', steps: tt('geminiSteps'), color: '#0080ff' },
            { name: 'Ollama', url: 'https://ollama.com', steps: tt('ollamaSteps'), color: '#008060' },
          ].map((p) => (
            <div key={p.name} className="win98-sunken-gray p-2">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold" style={{ color: p.color }}>{p.name}</span>
                <Win98Button onClick={() => window.open(p.url, '_blank')} style={{ padding: '2px 8px' }}>
                  <ExternalLink size={11} /> {tt('openWebsite')}
                </Win98Button>
              </div>
              <p className="text-small leading-relaxed">{p.steps}</p>
            </div>
          ))}
        </div>
      ),
    },
    // Screen 5: Username
    {
      title: tt('usernameTitle'),
      icon: <User size={16} />,
      body: (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <User size={24} className="text-blue-800" />
            <span className="font-bold">{tt('usernameTitle')}</span>
          </div>
          <p className="text-normal leading-relaxed">{tt('usernameBody')}</p>
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="block mb-1">{tt('username')}</label>
              <Win98Input value={username} onChange={setUsername} placeholder={tt('usernamePlaceholder')} />
            </div>
            <Win98Button onClick={() => setUsername(generateUsername())} style={{ marginBottom: 0 }}>
              🎲 {tt('generate')}
            </Win98Button>
          </div>
        </div>
      ),
    },
  ];

  const current = steps[step];

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4" style={{ background: '#008080' }}>
      <Win98Window
        title={`ShadowChat 98 — Setup (${step + 1}/${steps.length})`}
        active
        onClose={() => {}}
        className="w-full max-w-md"
        style={{ maxWidth: 480 }}
      >
        <div className="p-4 flex flex-col gap-4" style={{ minHeight: 280 }}>
          <div className="flex items-center gap-2">
            {current.icon}
            <span className="font-bold text-base">{current.title}</span>
          </div>
          <div className="flex-1 win98-sunken-gray p-3 win98-scroll" style={{ overflowY: 'auto', maxHeight: 300 }}>
            {current.body}
          </div>
          <div className="flex justify-between">
            <Win98Button onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
              {tt('back')}
            </Win98Button>
            {step < steps.length - 1 ? (
              <Win98Button onClick={() => setStep((s) => s + 1)}>{tt('next')}</Win98Button>
            ) : (
              <Win98Button onClick={() => onComplete(lang, username, theme)}>{tt('finish')}</Win98Button>
            )}
          </div>
          <div className="flex gap-1 justify-center">
            {steps.map((_, i) => (
              <div
                key={i}
                className="win98-sunken"
                style={{
                  width: 24,
                  height: 4,
                  background: i === step ? '#000080' : '#c0c0c0',
                  border: i === step ? '1px solid #000080' : undefined,
                }}
              />
            ))}
          </div>
        </div>
      </Win98Window>
    </div>
  );
}
