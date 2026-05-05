import { useAuthStore } from '../store/auth.store';

interface UserAvatarProps {
  size?: number;
  className?: string;
}

export function UserAvatar({ size = 8, className = '' }: UserAvatarProps) {
  const { user } = useAuthStore();

  const sizeClass = `w-${size} h-${size}`;

  if (user?.avatar) {
    return (
      <img
        src={user.avatar}
        alt={user.name}
        className={`${sizeClass} rounded-full object-cover flex-shrink-0 ${className}`}
      />
    );
  }

  return (
    <div className={`${sizeClass} rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold flex-shrink-0 ${className}`}
      style={{ fontSize: `${size * 0.4}px` }}
    >
      {user?.name?.charAt(0).toUpperCase() ?? 'A'}
    </div>
  );
}
