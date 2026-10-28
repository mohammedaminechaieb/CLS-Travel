import Link from 'next/link';
import { Logo } from '@/components/layout/logo';
import { SmartImage } from '@/components/smart-image';

const COVER = 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?auto=format&fit=crop&w=1400&q=80';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col px-4 py-8 sm:px-8">
        <Logo />
        <main id="main" className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
          {children}
        </main>
        <p className="text-center text-xs text-text-muted">
          <Link href="/" className="hover:underline">carthagoloisirs.com</Link>
        </p>
      </div>
      <div className="relative hidden lg:block" aria-hidden>
        <SmartImage src={COVER} alt="" fill sizes="50vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-primary/20" />
      </div>
    </div>
  );
}
