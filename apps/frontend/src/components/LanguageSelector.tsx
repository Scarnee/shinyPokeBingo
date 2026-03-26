import React from 'react';
import { Language } from '../api/bingo';

interface LanguageSelectorProps {
  languages: Language[];
  selected: string;
  onChange: (code: string) => void;
}

export function LanguageSelector({ languages, selected, onChange }: LanguageSelectorProps) {
  return (
    <div className="flex flex-wrap gap-1">
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => onChange(lang.code)}
          className={`
            px-2 py-1 rounded text-xs font-medium transition-all
            ${selected === lang.code
              ? 'bg-purple-600 text-white border border-purple-500'
              : 'bg-gray-700 text-gray-400 border border-gray-600 hover:border-purple-400 hover:text-white'}
          `}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );
}
