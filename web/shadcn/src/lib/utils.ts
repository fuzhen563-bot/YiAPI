import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatQuota(quota: number): string {
  return (quota / 1000000).toFixed(2);
}

export function renderQuota(quota: number, displayInCurrency?: boolean): string {
  if (displayInCurrency) return `¥${formatQuota(quota)}`;
  return quota.toLocaleString();
}

export function formatTimestamp(ts: number): string {
  return new Date(ts * 1000).toLocaleString();
}
