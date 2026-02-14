interface HufiLogoProps {
  size?: number;
  className?: string;
}

export default function HufiLogo({ size = 32, className = "" }: HufiLogoProps) {
  return (
    <img
      src="/hufiai-logo.svg"
      alt="HufiAi Logo"
      width={size}
      height={size}
      className={className}
    />
  );
}
