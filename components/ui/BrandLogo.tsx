import React from "react";

export function BrandLogoIcon({
  className = "w-5 h-5",
  size,
  color,
}: {
  className?: string;
  size?: number;
  color?: string;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill={color || "currentColor"}
      className={className}
      style={size ? { width: size, height: size } : undefined}
      aria-hidden="true"
    >
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
  );
}

export function BrandLogoBadge({
  size = "md",
  className = "",
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizeClasses = {
    sm: "h-7 w-7 rounded-lg",
    md: "h-8 w-8 sm:h-9 sm:w-9 rounded-xl",
    lg: "h-10 w-10 sm:h-12 sm:w-12 rounded-2xl",
  };
  const iconSizes = {
    sm: 14,
    md: 18,
    lg: 24,
  };

  return (
    <span
      className={`inline-flex items-center justify-center bg-[#292a23] text-[#f4ce00] shadow-xs shrink-0 ${sizeClasses[size]} ${className}`}
    >
      <BrandLogoIcon size={iconSizes[size]} color="#f4ce00" />
    </span>
  );
}
