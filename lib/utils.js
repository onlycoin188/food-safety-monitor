import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const fmt = n => (n == null ? '-' : Number(n).toLocaleString('ko-KR'));
export const dot = d => (d ? d.replaceAll('-', '.') : '-');
export const kstTime = iso => {
  const d = new Date(new Date(iso).getTime() + 9 * 36e5).toISOString();
  return `${d.slice(0, 10).replaceAll('-', '.')} ${d.slice(11, 16)}`;
};
