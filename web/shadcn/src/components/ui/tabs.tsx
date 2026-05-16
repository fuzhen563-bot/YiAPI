import * as React from 'react';
import { cn } from '@/lib/utils';

const TabsContext = React.createContext<{ value: string; onChange: (v: string) => void } | null>(null);

interface TabsProps {
  value: string;
  onValueChange: (v: string) => void;
  children: React.ReactNode;
  className?: string;
}

function Tabs({ value, onValueChange, children, className }: TabsProps) {
  return <TabsContext.Provider value={{ value, onChange: onValueChange }}>
    <div className={cn('space-y-2', className)}>{children}</div>
  </TabsContext.Provider>;
}

function TabsList({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('flex gap-1 bg-muted p-1 rounded-lg w-fit', className)}>{children}</div>;
}

function TabsTrigger({ value, children, className }: { value: string; children: React.ReactNode; className?: string }) {
  const ctx = React.useContext(TabsContext);
  const active = ctx?.value === value;
  return (
    <button onClick={() => ctx?.onChange(value)}
      className={cn('px-3 py-1.5 text-sm font-medium rounded-md transition-all',
        active ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground',
        className
      )}>
      {children}
    </button>
  );
}

function TabsContent({ value, children, className }: { value: string; children: React.ReactNode; className?: string }) {
  const ctx = React.useContext(TabsContext);
  if (ctx?.value !== value) return null;
  return <div className={className}>{children}</div>;
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
