/** Shared stroke-icon set: 24px grid, currentColor, 2px stroke. Replaces emoji glyphs so icon weight matches the app's typography and renders identically across platforms. */
type IconProps = { className?: string };
const base = {
  width: '1em', height: '1em', viewBox: '0 0 24 24', fill: 'none' as const,
  stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
  'aria-hidden': true as const, focusable: false as const,
};

export const IconSun = ({ className }: IconProps) => <svg {...base} className={className}>
  <circle cx="12" cy="12" r="4" />
  <path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
</svg>;

export const IconMap = ({ className }: IconProps) => <svg {...base} className={className}>
  <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z" /><path d="M9 4v14M15 6v14" />
</svg>;

export const IconUser = ({ className }: IconProps) => <svg {...base} className={className}>
  <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-6 8-6s8 2 8 6" />
</svg>;

export const IconPlay = ({ className }: IconProps) => <svg {...base} className={className}><path d="M7 4l12 8-12 8V4Z" /></svg>;

export const IconMasks = ({ className }: IconProps) => <svg {...base} className={className}>
  <circle cx="9" cy="9" r="6" /><circle cx="9.6" cy="7.5" r=".6" fill="currentColor" stroke="none" /><circle cx="12.4" cy="7.5" r=".6" fill="currentColor" stroke="none" /><path d="M8 11.5c1 1 3 1 4 0" />
  <circle cx="16" cy="16" r="6" /><circle cx="14.4" cy="14.5" r=".6" fill="currentColor" stroke="none" /><circle cx="17.6" cy="14.5" r=".6" fill="currentColor" stroke="none" /><path d="M14 19c1-1 3-1 4 0" />
</svg>;

export const IconBookOpen = ({ className }: IconProps) => <svg {...base} className={className}>
  <path d="M12 6c-1.5-1.3-3.5-2-6-2v13c2.5 0 4.5.7 6 2 1.5-1.3 3.5-2 6-2V4c-2.5 0-4.5.7-6 2Z" /><path d="M12 6v13" />
</svg>;

export const IconLightbulb = ({ className }: IconProps) => <svg {...base} className={className}>
  <path d="M9 18h6M10 21h4" /><path d="M12 3a6 6 0 0 0-3 11.2c.6.4 1 1.1 1 1.8h4c0-.7.4-1.4 1-1.8A6 6 0 0 0 12 3Z" />
</svg>;

export const IconNotepad = ({ className }: IconProps) => <svg {...base} className={className}>
  <rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 3v2M15 3v2M8 10h8M8 14h8M8 18h5" />
</svg>;

export const IconChat = ({ className }: IconProps) => <svg {...base} className={className}><path d="M21 12a7 7 0 0 1-7 7H8l-4 3 1-4.5A7 7 0 1 1 21 12Z" /></svg>;

export const IconPencil = ({ className }: IconProps) => <svg {...base} className={className}>
  <path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3Z" /><path d="M14 6l4 4" />
</svg>;

export const IconCheck = ({ className }: IconProps) => <svg {...base} className={className}><path d="M4 12l5 5L20 6" /></svg>;

export const IconClipboard = ({ className }: IconProps) => <svg {...base} className={className}>
  <rect x="6" y="4" width="12" height="17" rx="2" /><rect x="9" y="2.5" width="6" height="3" rx="1" /><path d="M9 11h6M9 15h6" />
</svg>;

export const IconRefresh = ({ className }: IconProps) => <svg {...base} className={className}>
  <path d="M3 12a9 9 0 0 1 15-6.7L21 8" /><path d="M21 3v5h-5" />
  <path d="M21 12a9 9 0 0 1-15 6.7L3 16" /><path d="M3 21v-5h5" />
</svg>;

export const IconBook = ({ className }: IconProps) => <svg {...base} className={className}>
  <rect x="4" y="4" width="4" height="16" rx="1" /><rect x="10" y="4" width="4" height="16" rx="1" /><path d="M17 5l3 .6-2.6 15.4-3-.6Z" />
</svg>;

export const IconLifeBuoy = ({ className }: IconProps) => <svg {...base} className={className}>
  <circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4" /><path d="M5.6 5.6l3.3 3.3M18.4 5.6l-3.3 3.3M5.6 18.4l3.3-3.3M18.4 18.4l-3.3-3.3" />
</svg>;

export const IconSettings = ({ className }: IconProps) => <svg {...base} className={className}>
  <circle cx="12" cy="12" r="3" />
  <path d="M19.4 13a7.9 7.9 0 0 0 0-2l2-1.5-2-3.4-2.4 1a8 8 0 0 0-1.7-1L15 3h-4l-.4 2.6a8 8 0 0 0-1.7 1l-2.4-1-2 3.4L6.5 11a7.9 7.9 0 0 0 0 2l-2 1.5 2 3.4 2.4-1a8 8 0 0 0 1.7 1L9 21h4l.4-2.6a8 8 0 0 0 1.7-1l2.4 1 2-3.4Z" />
</svg>;

export const IconLock = ({ className }: IconProps) => <svg {...base} className={className}>
  <rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" />
</svg>;
