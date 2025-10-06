"use client";

interface SubmitButtonProps {
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}

export default function SubmitButton({
  onClick,
  type = "button",
  disabled = false,
  className = "",
  children,
}: SubmitButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 bg-white text-black rounded-[16px] hover:bg-[#E87518] hover:text-white transition font-sans disabled:opacity-40 ${className}`}
    >
      {children}
    </button>
  );
}
