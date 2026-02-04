'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RATING_OPTIONS } from '@/lib/constants/catalog';

interface RatingSelectorProps {
  value?: number;
  onChange: (value?: number) => void;
}

export function RatingSelector({ value, onChange }: RatingSelectorProps) {
  return (
    <Select
      value={value ? String(value) : '0'}
      onValueChange={(val) => onChange(val === '0' ? undefined : Number(val))}
    >
      <SelectTrigger className="min-w-[100px]">
        <SelectValue placeholder="Рейтинг" />
      </SelectTrigger>
      <SelectContent>
        {RATING_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={String(option.value)}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
