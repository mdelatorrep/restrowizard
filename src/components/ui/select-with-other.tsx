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

  const otherOptionValue =
    options.find((o) => otherTriggerValues.includes(o.value))?.value ?? '';
  
  // Local select state: we must NOT derive select "value" only from the external `value`
  // because when user chooses "other" we intentionally clear external value until they type.
  const [selectValue, setSelectValue] = useState(() => {
    if (!value) return '';
    if (isKnownOption) return value;
    if (isOtherTrigger) return value;
    return otherOptionValue;
  });

  // Show custom input if: value is an other trigger, OR value exists but isn't a known option
  const [showCustomInput, setShowCustomInput] = useState(
    isOtherTrigger || (!!value && !isKnownOption)
  );
  const [customValue, setCustomValue] = useState(
    isOtherTrigger ? '' : (!isKnownOption && value ? value : '')
  );

  // Sync state when value prop changes externally
  useEffect(() => {
    const known = options.some(
      (opt) => opt.value === value && !otherTriggerValues.includes(opt.value)
    );
    const isTrigger = otherTriggerValues.includes(value);

    // Keep select UI in sync with external value.
    // IMPORTANT: if external value is empty, show placeholder (""), unless we're currently in "other" mode.
    if (!value) {
      if (!showCustomInput) setSelectValue('');
    } else if (known) {
      setSelectValue(value);
    } else if (isTrigger) {
      setSelectValue(value);
    } else {
      setSelectValue(otherOptionValue);
    }
    
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
  }, [value, options, otherTriggerValues, otherOptionValue, showCustomInput]);

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
    setSelectValue(newValue);
    if (otherTriggerValues.includes(newValue)) {
      setShowCustomInput(true);
      setCustomValue('');
      // Clear external value: user MUST type the custom value.
      onChange('');
    } else {
      setShowCustomInput(false);
      setCustomValue('');
      onChange(newValue);
    }
  };

  const handleCustomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newCustomValue = e.target.value;
    setCustomValue(newCustomValue);
    // Keep parent always in sync (empty string included)
    onChange(newCustomValue.trim());
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
        value={selectValue || undefined}
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
