import React, { useState, useEffect, useRef } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectWithOtherProps {
  options: readonly SelectOption[] | SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  otherPlaceholder?: string;
  className?: string;
  disabled?: boolean;
  /** The value that triggers the "other" input (defaults to 'otro' or 'otra') */
  otherTriggerValues?: string[];
}

/**
 * A Select component that shows a text input when "Other" is selected.
 * Supports custom values that don't match any predefined option.
 */
export function SelectWithOther({
  options,
  value,
  onChange,
  placeholder = 'Selecciona una opción',
  otherPlaceholder = 'Especifica aquí...',
  className,
  disabled = false,
  otherTriggerValues = ['otro', 'otra', 'other'],
}: SelectWithOtherProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Check if current value is a predefined option (excluding "other" triggers)
  const isKnownOption = options.some(
    (opt) => opt.value === value && !otherTriggerValues.includes(opt.value)
  );
  
  // Check if value is an "other" trigger
  const isOtherTrigger = otherTriggerValues.includes(value);
  
  // Show custom input if: value is an other trigger, OR value exists but isn't a known option
  const [showCustomInput, setShowCustomInput] = useState(
    isOtherTrigger || (!!value && !isKnownOption)
  );
  const [customValue, setCustomValue] = useState(
    isOtherTrigger ? '' : (!isKnownOption && value ? value : '')
  );
  
  // The select value should be the actual value if it's a known option,
  // otherwise show "otro" or similar
  const selectValue = isKnownOption ? value : (options.find(o => otherTriggerValues.includes(o.value))?.value || '');

  // Sync state when value prop changes externally
  useEffect(() => {
    const known = options.some(
      (opt) => opt.value === value && !otherTriggerValues.includes(opt.value)
    );
    const isTrigger = otherTriggerValues.includes(value);
    
    if (known) {
      setShowCustomInput(false);
      setCustomValue('');
    } else if (isTrigger) {
      setShowCustomInput(true);
      setCustomValue('');
    } else if (value) {
      setShowCustomInput(true);
      setCustomValue(value);
    }
  }, [value, options, otherTriggerValues]);

  // Focus and scroll to input when it appears (after a short delay for mobile)
  useEffect(() => {
    if (showCustomInput && inputRef.current) {
      // Small delay to ensure the Select dropdown is fully closed
      const timer = setTimeout(() => {
        inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        inputRef.current?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [showCustomInput]);

  const handleSelectChange = (newValue: string) => {
    if (otherTriggerValues.includes(newValue)) {
      setShowCustomInput(true);
      setCustomValue('');
      // Don't call onChange yet - wait for custom input
    } else {
      setShowCustomInput(false);
      setCustomValue('');
      onChange(newValue);
    }
  };

  const handleCustomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newCustomValue = e.target.value;
    setCustomValue(newCustomValue);
    // Only update parent if there's actual content
    if (newCustomValue.trim()) {
      onChange(newCustomValue.trim());
    }
  };

  const handleCustomInputBlur = () => {
    // If custom input is empty, reset to empty state
    if (!customValue.trim()) {
      onChange('');
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      <Select
        value={selectValue}
        onValueChange={handleSelectChange}
        disabled={disabled}
      >
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent position="popper" sideOffset={4}>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {showCustomInput && (
        <Input
          ref={inputRef}
          value={customValue}
          onChange={handleCustomInputChange}
          onBlur={handleCustomInputBlur}
          placeholder={otherPlaceholder}
          disabled={disabled}
          className="mt-2"
        />
      )}
    </div>
  );
}
