'use client';

import { useState, useEffect } from 'react';

interface SearchBarProps {
  onSearch: (query: string, tags: string) => void;
  initialQuery?: string;
  initialTags?: string;
}

export default function SearchBar({ onSearch, initialQuery = '', initialTags = '' }: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);
  const [tags, setTags] = useState(initialTags);

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(query, tags);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, tags, onSearch]);

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <div className="relative flex-1">
        <svg className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Buscar por nombre o descripcion..."
          className="w-full rounded-lg border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-white outline-none placeholder:text-white/30 focus:border-violet-500/50"
        />
      </div>
      <input
        type="text"
        value={tags}
        onChange={e => setTags(e.target.value)}
        placeholder="Filtrar por tags (separados por coma)"
        className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-white/30 focus:border-violet-500/50 sm:w-72"
      />
    </div>
  );
}
