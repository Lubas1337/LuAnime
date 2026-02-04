'use client';

import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { YEARS } from '@/lib/constants/catalog';

interface YearSelectorProps {
  variant: 'single' | 'range';
  year?: number;
  yearFrom?: number;
  yearTo?: number;
  onYearChange?: (year?: number) => void;
  onYearRangeChange?: (from?: number, to?: number) => void;
}

export function YearSelector({
  variant,
  year,
  yearFrom,
  yearTo,
  onYearChange,
  onYearRangeChange,
}: YearSelectorProps) {
  if (variant === 'single') {
    return (
      <Select
        value={year ? String(year) : 'all'}
        onValueChange={(value) => onYearChange?.(value === 'all' ? undefined : Number(value))}
      >
        <SelectTrigger className="min-w-[120px]">
          <SelectValue placeholder="Год" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Все годы</SelectItem>
          {YEARS.map((y) => (
            <SelectItem key={y} value={String(y)}>
              {y}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Select
        value={yearFrom ? String(yearFrom) : 'all'}
        onValueChange={(value) =>
          onYearRangeChange?.(value === 'all' ? undefined : Number(value), yearTo)
        }
      >
        <SelectTrigger className="min-w-[100px]">
          <SelectValue placeholder="От" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">От</SelectItem>
          {YEARS.map((y) => (
            <SelectItem key={y} value={String(y)} disabled={yearTo !== undefined && y > yearTo}>
              {y}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className="text-muted-foreground">—</span>
      <Select
        value={yearTo ? String(yearTo) : 'all'}
        onValueChange={(value) =>
          onYearRangeChange?.(yearFrom, value === 'all' ? undefined : Number(value))
        }
      >
        <SelectTrigger className="min-w-[100px]">
          <SelectValue placeholder="До" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">До</SelectItem>
          {YEARS.map((y) => (
            <SelectItem key={y} value={String(y)} disabled={yearFrom !== undefined && y < yearFrom}>
              {y}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
