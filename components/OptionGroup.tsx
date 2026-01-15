
import React from 'react';

interface OptionGroupProps {
  label: string;
  options: string[];
  currentValue: string;
  onChange: (val: string) => void;
}

const OptionGroup: React.FC<OptionGroupProps> = ({ label, options, currentValue, onChange }) => {
  return (
    <div className="mb-6">
      <label className="block text-xs uppercase tracking-widest text-gray-500 mb-3">{label}</label>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={`py-3 px-4 text-xs tracking-wider transition-all border ${
              currentValue === opt 
              ? 'bg-white text-black border-white' 
              : 'bg-transparent text-gray-400 border-white/10 hover:border-white/30'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
};

export default OptionGroup;
