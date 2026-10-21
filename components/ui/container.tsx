import { cn } from '@/lib/utils';

// Gutters grow to clear the notch on landscape iPhones; env() is 0 everywhere else.
export function Container({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        'mx-auto w-full max-w-site pl-[max(1.25rem,env(safe-area-inset-left))] pr-[max(1.25rem,env(safe-area-inset-right))] md:px-8 lg:px-12',
        className,
      )}
    >
      {children}
    </div>
  );
}
