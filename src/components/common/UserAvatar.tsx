import React, { useState } from 'react';

interface UserAvatarProps {
  name?: string;
  avatarUrl?: string | null;
  role?: string;
  staffRole?: string;
  className?: string;
  sizeClassName?: string;
  textClassName?: string;
}

export const getInitials = (name?: string): string => {
  if (!name) return 'K';
  // Strip parentheses and brackets e.g. "Leslie (Dueña & Coach)" -> "Leslie"
  const clean = name.replace(/\([^)]*\)/g, '').replace(/\[[^\]]*\]/g, '').trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'K';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const isStockOrInvalidAvatar = (url?: string | null): boolean => {
  if (!url || typeof url !== 'string' || url.trim() === '') return true;
  const lower = url.toLowerCase();
  return (
    lower.includes('images.unsplash.com') ||
    lower.includes('kinetix_avatar') ||
    lower.includes('placeholder')
  );
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  name = 'Atleta',
  avatarUrl,
  role = 'athlete',
  staffRole,
  className = '',
  sizeClassName = 'w-9 h-9',
  textClassName = 'text-xs',
}) => {
  const [imgError, setImgError] = useState(false);

  const hasValidCustomPhoto = !imgError && !isStockOrInvalidAvatar(avatarUrl);
  const initials = getInitials(name);

  if (hasValidCustomPhoto && avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        onError={() => setImgError(true)}
        className={`${sizeClassName} rounded-xl object-cover border border-neutral-700/80 shrink-0 ${className}`}
      />
    );
  }

  // Color theme according to role
  const isOwner = staffRole === 'owner' || role === 'owner';
  const isCoach = role === 'staff' && !isOwner;

  let colorClasses = 'bg-gradient-to-br from-neutral-900 to-neutral-800 text-blue-400 border-neutral-700/80';
  if (isOwner) {
    colorClasses = 'bg-gradient-to-br from-neutral-900 via-neutral-900 to-red-950/80 text-red-400 border-red-800/50';
  } else if (isCoach) {
    colorClasses = 'bg-gradient-to-br from-neutral-900 via-neutral-900 to-amber-950/80 text-amber-400 border-amber-800/50';
  }

  return (
    <div
      className={`${sizeClassName} rounded-xl border flex items-center justify-center font-mono font-bold select-none shrink-0 shadow-sm ${colorClasses} ${className}`}
      title={name}
    >
      <span className={textClassName}>{initials}</span>
    </div>
  );
};
