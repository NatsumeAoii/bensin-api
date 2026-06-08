import { useId } from "react";
import { Search, X } from "lucide-react";

interface SearchFilterProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
}

export function SearchFilter({
  value,
  onChange,
  placeholder = "Cari provinsi...",
  label = "Cari provinsi",
}: SearchFilterProps) {
  const inputId = useId();
  const hasValue = value.length > 0;

  return (
    <div className="relative">
      <label htmlFor={inputId} className="sr-only">
        {label}
      </label>

      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
        <Search
          size={18}
          className="text-stone-400 dark:text-stone-500"
          aria-hidden="true"
        />
      </div>

      <input
        id={inputId}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={100}
        className="w-full rounded-xl border border-stone-200 bg-white py-3 pl-11 pr-12 text-sm text-stone-900 placeholder-stone-400 shadow-sm transition-all focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-400/20 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 dark:placeholder-stone-500 dark:focus:border-orange-500 dark:focus:ring-orange-500/20"
      />

      {hasValue && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Hapus pencarian"
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-stone-400 transition-colors hover:text-stone-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 dark:text-stone-500 dark:hover:text-stone-300"
        >
          <X size={16} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
