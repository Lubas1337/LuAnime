'use client';

import { useSyncExternalStore } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon, Monitor, Palette, Check } from 'lucide-react';
import { useAccent, ACCENTS, type AccentName } from '@/hooks/use-accent';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const modes = [
  { value: 'light', icon: Sun, label: 'Светлая' },
  { value: 'dark', icon: Moon, label: 'Тёмная' },
  { value: 'system', icon: Monitor, label: 'Система' },
] as const;

function useMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export function ThemeSwitcher() {
  const mounted = useMounted();
  const { theme, setTheme } = useTheme();
  const { accent, setAccent } = useAccent();

  if (!mounted) return <div className="size-9" />;

  const Icon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <Icon className="size-[18px]" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-xs">Режим</DropdownMenuLabel>
          {modes.map((m) => (
            <DropdownMenuItem
              key={m.value}
              onClick={() => setTheme(m.value)}
              className="cursor-pointer"
            >
              <m.icon className="size-4" />
              <span className="flex-1">{m.label}</span>
              {theme === m.value && <Check className="size-3.5 text-primary" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-xs">Акцент</DropdownMenuLabel>
          {ACCENTS.map((a) => (
            <DropdownMenuItem
              key={a.name}
              onClick={() => setAccent(a.name as AccentName)}
              className="cursor-pointer"
            >
              <span
                className="size-3.5 rounded-full border border-border"
                style={{ backgroundColor: a.color }}
              />
              <span className="flex-1">{a.label}</span>
              {accent === a.name && <Check className="size-3.5 text-primary" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
