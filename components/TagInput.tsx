'use client';

import { useState, type KeyboardEvent } from 'react';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
}

export default function TagInput({ tags, onChange }: TagInputProps) {
  const [input, setInput] = useState('');

  const addTag = (value: string) => {
    const tag = value.trim().toLowerCase();
    if (tag && !tags.includes(tag)) {
      onChange([...tags, tag]);
    }
    setInput('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(input);
    }
    if (e.key === 'Backspace' && !input && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };

  const removeTag = (index: number) => {
    onChange(tags.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-white/10 bg-white/5 p-2 focus-within:border-violet-500/50">
      {tags.map((tag, i) => (
        <span key={tag} className="flex items-center gap-1 rounded-full bg-violet-500/20 px-3 py-1 text-sm text-violet-300">
          {tag}
          <button type="button" onClick={() => removeTag(i)} className="ml-1 text-violet-400 hover:text-white">
            &times;
          </button>
        </span>
      ))}
      <input
        type="text"
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => input && addTag(input)}
        placeholder={tags.length === 0 ? 'Agregar tags (Enter o coma para separar)' : ''}
        className="min-w-[120px] flex-1 border-none bg-transparent text-sm text-white outline-none placeholder:text-white/30"
      />
    </div>
  );
}
