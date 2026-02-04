'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ANIME_STATUS } from '@/lib/constants/catalog';

interface StatusSelectorProps {
  value?: string;
  onChange: (value?: string) => void;
}

export function StatusSelector({ value, onChange }: StatusSelectorProps) {
  return (
    <Select
      value={value || 'all'}
      onValueChange={(val) => onChange(val === 'all' ? undefined : val)}
    >
      <SelectTrigger className="min-w-[130px]">
        <SelectValue placeholder="Статус" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Все статусы</SelectItem>
        {ANIME_STATUS.map((status) => (
          <SelectItem key={status.value} value={status.value}>
            {status.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
