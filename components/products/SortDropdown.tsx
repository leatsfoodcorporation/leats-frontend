'use client';

import { useState, useRef, useEffect } from 'react';
import { IconChevronDown } from '@tabler/icons-react';

interface SortOption {
  value: string;
  label: string;
}

interface SortDropdownProps {
  options: SortOption[];
  value: string;
  onChange: (value: string) => void;
}

export default function SortDropdown({ options, value, onChange }: SortDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value === value) || options[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between gap-2 border rounded px-3 py-1.5 text-sm bg-white transition-colors min-w-[170px] ${
          isOpen ? 'border-[#e63946] ring-1 ring-[#e63946]' : 'border-gray-300 hover:border-[#e63946]'
        }`}
      >
        <span className="truncate text-gray-700">{selectedOption.label}</span>
        <IconChevronDown 
          size={16} 
          className={`text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-full min-w-[170px] bg-white border border-gray-100 rounded shadow-lg z-20 py-1 max-h-60 overflow-y-auto">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                value === option.value 
                  ? 'bg-red-50 text-[#e63946] font-medium' 
                  : 'text-gray-700 hover:bg-gray-50 hover:text-[#e63946]'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
