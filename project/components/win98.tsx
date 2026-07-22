'use client';

import React from 'react';
import { cn } from '@/lib/utils';

// ===== Window =====
export function Win98Window({
  title,
  children,
  className,
  active = true,
  onClose,
  onMinimize,
  onMaximize,
  icon,
  style,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
  active?: boolean;
  onClose?: () => void;
  onMinimize?: () => void;
  onMaximize?: () => void;
  icon?: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div className={cn('win98-window', className)} style={style}>
      <div className={cn('win98-titlebar', !active && 'inactive')}>
        <div className="flex items-center gap-1 overflow-hidden">
          {icon}
          <span className="truncate">{title}</span>
        </div>
        <div className="win98-titlebar-buttons">
          {onMinimize && (
            <button className="win98-titlebar-btn" onClick={onMinimize} title="Minimize">
              <span style={{ borderBottom: '2px solid currentColor', width: '6px', display: 'inline-block', height: '2px', marginBottom: '2px' }} />
            </button>
          )}
          {onMaximize && (
            <button className="win98-titlebar-btn" onClick={onMaximize} title="Maximize">
              <span style={{ border: '1px solid currentColor', width: '8px', height: '6px', display: 'inline-block' }} />
            </button>
          )}
          {onClose && (
            <button className="win98-titlebar-btn" onClick={onClose} title="Close" style={{ fontWeight: 'bold' }}>
              ×
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-hidden flex flex-col">{children}</div>
    </div>
  );
}

// ===== Button =====
export function Win98Button({
  children,
  onClick,
  className,
  disabled,
  pressed,
  type = 'button',
  style,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  pressed?: boolean;
  type?: 'button' | 'submit';
  style?: React.CSSProperties;
}) {
  return (
    <button
      type={type}
      className={cn('win98-btn', pressed && 'pressed', className)}
      onClick={onClick}
      disabled={disabled}
      style={style}
    >
      {children}
    </button>
  );
}

// ===== Input =====
export function Win98Input({
  value,
  onChange,
  placeholder,
  className,
  type = 'text',
  onKeyDown,
  style,
  maxLength,
}: {
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  className?: string;
  type?: string;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  style?: React.CSSProperties;
  maxLength?: number;
}) {
  return (
    <input
      type={type}
      className={cn('win98-input', className)}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
      onKeyDown={onKeyDown}
      style={style}
      maxLength={maxLength}
    />
  );
}

// ===== Textarea =====
export function Win98Textarea({
  value,
  onChange,
  placeholder,
  className,
  onKeyDown,
  rows = 3,
}: {
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  className?: string;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  rows?: number;
}) {
  return (
    <textarea
      className={cn('win98-textarea', className)}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
      onKeyDown={onKeyDown}
      rows={rows}
    />
  );
}

// ===== Checkbox =====
export function Win98Checkbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange?: (v: boolean) => void;
  label?: React.ReactNode;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <input
        type="checkbox"
        className="win98-checkbox"
        checked={checked}
        onChange={(e) => onChange?.(e.target.checked)}
      />
      {label && <span>{label}</span>}
    </label>
  );
}

// ===== Radio =====
export function Win98Radio({
  checked,
  onChange,
  label,
  name,
}: {
  checked: boolean;
  onChange?: () => void;
  label?: React.ReactNode;
  name?: string;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <input
        type="radio"
        className="win98-radio"
        checked={checked}
        onChange={onChange}
        name={name}
      />
      {label && <span>{label}</span>}
    </label>
  );
}

// ===== Select =====
export function Win98Select({
  value,
  onChange,
  options,
  className,
}: {
  value: string;
  onChange?: (v: string) => void;
  options: { value: string; label: string }[];
  className?: string;
}) {
  return (
    <select
      className={cn('win98-select', className)}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

// ===== Group Box =====
export function Win98Group({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('win98-group', className)}>
      <div className="win98-group-title">{title}</div>
      {children}
    </div>
  );
}

// ===== Tabs =====
export function Win98Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: string; label: string; icon?: React.ReactNode }[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="win98-tabs">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={cn('win98-tab', active === tab.id && 'active')}
          onClick={() => onChange(tab.id)}
        >
          <span className="flex items-center gap-1">
            {tab.icon}
            {tab.label}
          </span>
        </div>
      ))}
    </div>
  );
}

// ===== Progress Bar =====
export function Win98Progress({ value, max = 100 }: { value: number; max?: number }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="win98-progress">
      <div className="win98-progress-fill" style={{ width: `${pct}%` }} />
    </div>
  );
}
