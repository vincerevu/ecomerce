import { ReactNode } from "react";
import Spinner from "../spinner/Spinner";

interface ButtonProps {
  children: ReactNode; // Button text or content
  size?: "sm" | "md"; // Button size
  variant?: "primary" | "outline"; // Button variant
  startIcon?: ReactNode; // Icon before the text
  endIcon?: ReactNode; // Icon after the text
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void; // Click handler
  disabled?: boolean; // Disabled state
  isLoading?: boolean; // Loading state
  className?: string; // Optional custom classes
  type?: "button" | "submit" | "reset"; // Button type
  [key: string]: any;
}

const Button: React.FC<ButtonProps> = ({
  children,
  size = "md",
  variant = "primary",
  startIcon,
  endIcon,
  onClick,
  className = "",
  disabled = false,
  isLoading = false,
  type = "button",
  ...props
}) => {
  // Size Classes
  const sizeClasses = {
    sm: "px-4 py-3 text-sm",
    md: "px-5 py-3.5 text-sm",
  };

  // Variant Classes
  const variantClasses = {
    primary:
      "bg-brand-500 text-white shadow-theme-xs hover:bg-brand-600 disabled:bg-brand-300",
    outline:
      "bg-white text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700 dark:hover:bg-white/[0.03] dark:hover:text-gray-300",
  };

  const spinnerColor = variant === "primary" ? "white" : "primary";

  return (
    <button
      type={type}
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-lg transition ${className} ${sizeClasses[size]
        } ${variantClasses[variant]} ${(disabled || isLoading) ? "cursor-not-allowed opacity-50" : ""
        }`}
      onClick={isLoading ? undefined : onClick}
      disabled={disabled || isLoading}
    >
      {isLoading && <Spinner size={size === "sm" ? "sm" : "md"} color={spinnerColor} />}
      {!isLoading && startIcon && <span className="flex items-center">{startIcon}</span>}
      {children}
      {!isLoading && endIcon && <span className="flex items-center">{endIcon}</span>}
    </button>
  );
};

export default Button;

