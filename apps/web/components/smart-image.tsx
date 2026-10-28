'use client';

import Image, { type ImageProps } from 'next/image';
import { useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * next/image avec repli élégant (dégradé méditerranéen) si l'image est absente ou en erreur.
 */
export function SmartImage({ src, alt, className, ...props }: Omit<ImageProps, 'src'> & { src?: string | null }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={cn('bg-gradient-to-br from-primary via-primary/80 to-accent/70', props.fill && 'absolute inset-0', className)}
      />
    );
  }
  return <Image src={src} alt={alt} className={className} onError={() => setFailed(true)} {...props} />;
}
