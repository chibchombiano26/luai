import Image from 'next/image';
import { Bot, User } from 'lucide-react';

type AvatarRole = 'assistant' | 'user';
type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

const SIZE_CLASS_BY_KEY: Record<AvatarSize, string> = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-16 w-16',
  xl: 'h-24 w-24',
};

const SIZE_PX_BY_KEY: Record<AvatarSize, number> = {
  sm: 32,
  md: 40,
  lg: 64,
  xl: 96,
};

function joinClasses(...values: Array<string | null | undefined | false>): string {
  return values.filter(Boolean).join(' ');
}

export function AvatarBadge({
  role,
  imageUrl,
  size = 'md',
  alt,
  className,
}: {
  role: AvatarRole;
  imageUrl?: string | null;
  size?: AvatarSize;
  alt?: string;
  className?: string;
}) {
  const sizeClassName = SIZE_CLASS_BY_KEY[size];
  const pixelSize = SIZE_PX_BY_KEY[size];
  const defaultAlt = role === 'assistant' ? 'Avatar de la AI' : 'Avatar del usuario';

  if (imageUrl) {
    return (
      <div
        className={joinClasses(
          'relative overflow-hidden rounded-full border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900',
          sizeClassName,
          className
        )}
      >
        <Image
          src={imageUrl}
          alt={alt ?? defaultAlt}
          width={pixelSize}
          height={pixelSize}
          unoptimized
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  const Icon = role === 'assistant' ? Bot : User;
  const iconClassName = size === 'sm' ? 'h-5 w-5' : size === 'md' ? 'h-6 w-6' : size === 'lg' ? 'h-8 w-8' : 'h-10 w-10';

  return (
    <div
      className={joinClasses(
        'flex items-center justify-center rounded-full border',
        role === 'assistant'
          ? 'border-blue-200 bg-blue-100 text-blue-600 dark:border-blue-900/70 dark:bg-blue-900/30'
          : 'border-zinc-200 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200',
        sizeClassName,
        className
      )}
      aria-label={alt ?? defaultAlt}
    >
      <Icon className={iconClassName} />
    </div>
  );
}
