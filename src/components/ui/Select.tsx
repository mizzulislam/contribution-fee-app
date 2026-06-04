import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface Option {
  label: string;
  value: string;
}

interface SelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function Select({ options, value, onChange, placeholder = 'Pilih...', className = '' }: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        className="w-full form-input flex items-center justify-between bg-white cursor-pointer hover:border-primary/50 transition-colors text-left"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={`block truncate ${selectedOption ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 ml-2 flex-shrink-0 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-[100] w-full mt-1.5 bg-white border border-border rounded-xl shadow-lg shadow-gray-200/50 overflow-hidden py-1 animate-in fade-in slide-in-from-top-1 duration-200">
          <ul className="max-h-60 overflow-y-auto">
            {options.map((option) => (
              <li
                key={option.value}
                className={`px-4 py-2.5 text-sm cursor-pointer flex items-center justify-between transition-colors ${
                  value === option.value 
                    ? 'bg-primary-soft/80 text-primary-dark font-semibold' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
              >
                <span className="block truncate">{option.label}</span>
                {value === option.value && <Check className="w-4 h-4 text-primary ml-2 flex-shrink-0" />}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
