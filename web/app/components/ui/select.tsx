import * as React from "react"
import { cn } from "../../lib/utils"

interface SelectProps {
  children: React.ReactNode;
  onValueChange?: (value: string) => void;
  defaultValue?: string;
  value?: string;
}

interface SelectTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

interface SelectContentProps {
  children: React.ReactNode;
}

interface SelectItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
  children: React.ReactNode;
}

interface SelectValueProps {
  placeholder?: string;
  children?: React.ReactNode;
}

const SelectContext = React.createContext<{
  value?: string;
  displayText?: string;
  onValueChange?: (value: string, displayText: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  items: Map<string, string>;
  registerItem: (value: string, displayText: string) => void;
}>({
  isOpen: false,
  setIsOpen: () => {},
  items: new Map(),
  registerItem: () => {},
});

const Select: React.FC<SelectProps> = ({ children, onValueChange, defaultValue, value }) => {
  const [internalValue, setInternalValue] = React.useState(defaultValue || "");
  const [displayText, setDisplayText] = React.useState("");
  const [isOpen, setIsOpen] = React.useState(false);
  const [items, setItems] = React.useState(new Map<string, string>());

  // Use controlled value if provided, otherwise use internal state
  const currentValue = value !== undefined ? value : internalValue;

  const registerItem = React.useCallback((itemValue: string, itemDisplayText: string) => {
    setItems(prev => {
      if (prev.get(itemValue) === itemDisplayText) {
        return prev; // No change needed
      }
      return new Map(prev.set(itemValue, itemDisplayText));
    });
  }, []);

  // Update display text when value changes or items are registered
  React.useEffect(() => {
    if (currentValue && items.has(currentValue)) {
      const newDisplayText = items.get(currentValue) || "";
      if (newDisplayText !== displayText) {
        setDisplayText(newDisplayText);
      }
    }
  }, [currentValue, items, displayText]);

  const handleValueChange = React.useCallback((newValue: string, newDisplayText: string) => {
    if (value === undefined) {
      setInternalValue(newValue);
    }
    setDisplayText(newDisplayText);
    onValueChange?.(newValue);
    setIsOpen(false);
  }, [value, onValueChange]);

  const setIsOpenMemo = React.useCallback((open: boolean) => {
    setIsOpen(open);
  }, []);

  return (
    <SelectContext.Provider value={{ 
      value: currentValue, 
      displayText,
      onValueChange: handleValueChange, 
      isOpen, 
      setIsOpen: setIsOpenMemo,
      items,
      registerItem
    }}>
      <div className="relative">
        {children}
      </div>
    </SelectContext.Provider>
  );
};

const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ className, children, ...props }, ref) => {
    const { isOpen, setIsOpen } = React.useContext(SelectContext);
    
    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        onClick={() => setIsOpen(!isOpen)}
        {...props}
      >
        {children}
        <svg className="h-4 w-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    );
  }
);
SelectTrigger.displayName = "SelectTrigger";

const SelectValue: React.FC<SelectValueProps> = ({ placeholder, children }) => {
  const { value, displayText } = React.useContext(SelectContext);
  
  // If children are provided (custom display), use them
  if (children) {
    return <span>{children}</span>;
  }
  
  // If there's a display text, use it; otherwise use value or placeholder
  if (displayText) {
    return <span>{displayText}</span>;
  }
  
  if (value) {
    return <span>{value}</span>;
  }
  
  return <span className="text-gray-500">{placeholder}</span>;
};

const SelectContent: React.FC<SelectContentProps> = ({ children }) => {
  const { isOpen } = React.useContext(SelectContext);
  
  if (!isOpen) return null;
  
  return (
    <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-auto rounded-md border border-gray-300 bg-white shadow-lg">
      {children}
    </div>
  );
};

const SelectItem = React.forwardRef<HTMLButtonElement, SelectItemProps>(
  ({ className, children, value, ...props }, ref) => {
    const { onValueChange, registerItem } = React.useContext(SelectContext);
    
    // Register this item when component mounts
    React.useEffect(() => {
      const displayText = typeof children === 'string' ? children : value;
      registerItem(value, displayText);
    }, [value, children, registerItem]);
    
    const handleClick = React.useCallback(() => {
      const displayText = typeof children === 'string' ? children : value;
      onValueChange?.(value, displayText);
    }, [value, children, onValueChange]);
    
    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          "w-full px-3 py-2 text-left text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none",
          className
        )}
        onClick={handleClick}
        {...props}
      >
        {children}
      </button>
    );
  }
);
SelectItem.displayName = "SelectItem";

export {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
};
