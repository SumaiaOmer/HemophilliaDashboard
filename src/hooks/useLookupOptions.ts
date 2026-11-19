import { useEffect, useState } from 'react';
import { LookupsService } from '../services/lookups';

export interface LookupOption {
  value: string;
  label: string;
}

export const useLookupOptions = (types: string[]): Record<string, LookupOption[]> => {
  const [options, setOptions] = useState<Record<string, LookupOption[]>>({});

  useEffect(() => {
    let active = true;

    LookupsService.getAll().then(items => {
      const requestedTypes = new Map(types.map(type => [type.trim().toLowerCase(), type]));
      const results: Record<string, LookupOption[]> = {};

      items.forEach(item => {
        const name = item.name.trim();
        const itemType = item.type.trim();
        if (
          item.isActive === false ||
          !name ||
          !itemType ||
          name.toLowerCase() === itemType.toLowerCase()
        ) return;

        const type = requestedTypes.get(itemType.toLowerCase()) ?? requestedTypes.get(name.toLowerCase());
        if (!type) return;

        const isCategoryInName = !requestedTypes.has(itemType.toLowerCase());
        const rawOption = isCategoryInName ? itemType : name;
        const separator = rawOption.indexOf('|');
        const option = separator < 0
          ? {
            value: rawOption,
            label: isCategoryInName ? item.description?.trim() || rawOption : rawOption,
          }
          : { value: rawOption.slice(0, separator).trim(), label: rawOption.slice(separator + 1).trim() };
        if (!option.value || !option.label) return;
        (results[type] ??= []).push(option);
      });

      if (active) setOptions(results);
    }).catch(error => {
      console.error('Error fetching lookup dropdown options:', error);
    });

    return () => {
      active = false;
    };
  }, [types]);

  return options;
};

export const getLookupOptions = (
  options: Record<string, LookupOption[]>,
  type: string,
  fallback: LookupOption[]
): LookupOption[] => options[type]?.length ? options[type] : fallback;

export const toLookupOptions = (values: string[]): LookupOption[] =>
  values.map(value => {
    const separator = value.indexOf('|');
    return separator < 0
      ? { value, label: value }
      : { value: value.slice(0, separator), label: value.slice(separator + 1) };
  });
