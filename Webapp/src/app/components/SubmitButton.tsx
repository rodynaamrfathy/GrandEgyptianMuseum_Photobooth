"use client";

export interface SubmitButtonProps {
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
  "aria-label"?: string;
}

export default function SubmitButton({
  onClick,
  type = "button",
  disabled = false,
  className = "",
  children,
  "aria-label": ariaLabel,
}: SubmitButtonProps): JSX.Element {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`px-4 py-2 bg-white text-black rounded-[16px] hover:bg-[#E87518] hover:text-white transition font-greta-sans disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-orange-300 ${className}`}
    >
      {children}
    </button>
  );
}