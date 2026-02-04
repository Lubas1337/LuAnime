'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { COUNTRIES } from '@/lib/constants/catalog';

interface CountrySelectorProps {
  value?: number;
  onChange: (value?: number) => void;
}

export function CountrySelector({ value, onChange }: CountrySelectorProps) {
  return (
    <Select
      value={value ? String(value) : 'all'}
      onValueChange={(val) => onChange(val === 'all' ? undefined : Number(val))}
    >
      <SelectTrigger className="min-w-[140px]">
        <SelectValue placeholder="Страна" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Все страны</SelectItem>
        {COUNTRIES.map((country) => (
          <SelectItem key={country.id} value={String(country.id)}>
            {country.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
