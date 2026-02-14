interface HufiLogoProps {
  size?: number;
  className?: string;
}

export default function HufiLogo({ size = 32, className = "" }: HufiLogoProps) {
  return (
    <img
      src="/hufiai-icon.svg"
      alt="HufiAi"
      width={size}
      height={size}
      className={className}
    />
  );
}
