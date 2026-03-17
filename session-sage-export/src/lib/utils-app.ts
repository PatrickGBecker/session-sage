export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function formatDate(dateStr?: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

export const COMMON_KEYS = [
  'A', 'Am', 'Bb', 'Bm', 'B', 'C', 'Cm', 'D', 'Dm',
  'Eb', 'Em', 'E', 'F', 'F#m', 'G', 'Gm',
  'Adorian', 'Bdorian', 'Cdorian', 'Ddorian', 'Edorian', 'Gdorian',
  'Amixolydian', 'Dmixolydian', 'Gmixolydian',
];

export const TEMPOS = ['Slow', 'Moderate', 'Lively', 'Fast'];
