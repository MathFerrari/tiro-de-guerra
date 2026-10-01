import { InputHTMLAttributes, SelectHTMLAttributes, forwardRef } from "react";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className = "", ...props }, ref) => (
    <input
      ref={ref}
      className={`w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-military-dark placeholder:text-gray-400 focus:border-military-green-mid focus:outline-none focus:ring-1 focus:ring-military-green-mid ${className}`}
      {...props}
    />
  )
);
Input.displayName = "Input";

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className = "", children, ...props }, ref) => (
    <select
      ref={ref}
      className={`w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-military-dark focus:border-military-green-mid focus:outline-none focus:ring-1 focus:ring-military-green-mid ${className}`}
      {...props}
    >
      {children}
    </select>
  )
);
Select.displayName = "Select";

export function Label({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1 block text-sm font-medium text-military-green-dark">
      {children}
    </label>
  );
}
