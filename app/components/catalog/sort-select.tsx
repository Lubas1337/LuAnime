'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SORT_OPTIONS, type CatalogCategory } from '@/lib/constants/catalog';

interface SortSelectProps {
  category: CatalogCategory;
  value: string;
  onChange: (value: string) => void;
}

export function SortSelect({ category, value, onChange }: SortSelectProps) {
  const options = SORT_OPTIONS[category];

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="min-w-[160px]">
        <SelectValue placeholder="Сортировка" />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
