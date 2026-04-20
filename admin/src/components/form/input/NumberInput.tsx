import type React from "react";

interface NumberInputProps {
    id?: string;
    name?: string;
    placeholder?: string;
    value?: number | string;
    onChange?: (val: number | string) => void;
    className?: string;
    min?: number;
    max?: number;
    step?: number;
    disabled?: boolean;
}

const NumberInput: React.FC<NumberInputProps> = ({
    id,
    name,
    placeholder,
    value = "",
    onChange,
    className = "",
    min,
    max,
    step = 1,
    disabled = false,
}) => {
    const handleIncrement = () => {
        if (disabled) return;
        const current = Number(value) || 0;
        const next = current + step;
        if (max !== undefined && next > max) return;
        onChange?.(next);
    };

    const handleDecrement = () => {
        if (disabled) return;
        const current = Number(value) || 0;
        const next = current - step;
        if (min !== undefined && next < min) return;
        onChange?.(next);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange?.(e.target.value);
    };

    return (
        <div
            className={`relative h-11 w-full rounded-lg border border-gray-300 bg-transparent shadow-theme-xs focus-within:border-brand-300 focus-within:ring-3 focus-within:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:focus-within:border-brand-800 transition-colors ${className} ${disabled ? "opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-800" : "bg-white dark:bg-gray-900"
                }`}
        >
            <input
                type="number"
                id={id}
                name={name}
                placeholder={placeholder}
                value={value}
                onChange={handleChange}
                min={min}
                max={max}
                step={step}
                disabled={disabled}
                className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none h-full w-full bg-transparent pl-4 pr-10 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-hidden dark:text-white/90 dark:placeholder:text-white/30 rounded-lg"
            />

            <div className="absolute right-1 top-1 bottom-1 flex flex-col justify-between w-6 rounded border border-gray-200 dark:border-gray-800 overflow-hidden bg-white dark:bg-gray-900 pointer-events-auto">
                <button
                    type="button"
                    onClick={handleIncrement}
                    disabled={disabled}
                    className="flex flex-1 items-center justify-center bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-700 dark:bg-white/[0.03] dark:hover:bg-white/[0.08] dark:text-gray-400 dark:hover:text-white transition-colors"
                >
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M2.5 6.5L5 4L7.5 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
                <div className="h-[1px] bg-gray-200 dark:bg-gray-800 w-full" />
                <button
                    type="button"
                    onClick={handleDecrement}
                    disabled={disabled}
                    className="flex flex-1 items-center justify-center bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-700 dark:bg-white/[0.03] dark:hover:bg-white/[0.08] dark:text-gray-400 dark:hover:text-white transition-colors"
                >
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M7.5 4L5 6.5L2.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default NumberInput;
