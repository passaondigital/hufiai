interface HufiLogoProps {
  size?: number;
  className?: string;
}

export default function HufiLogo({ size = 32, className = "" }: HufiLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 500 500"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M150 300C200 200 280 180 350 220C400 245 430 300 435 370C440 450 390 510 310 530C230 550 170 520 140 470C110 420 100 360 150 300Z"
        fill="hsl(var(--primary))"
      />
      <path d="M260 175L300 100L335 175Z" fill="hsl(var(--primary))" />
      <circle cx="100" cy="320" r="18" fill="hsl(var(--primary))" />
      <circle cx="70" cy="370" r="18" fill="hsl(var(--primary))" />
      <circle cx="90" cy="420" r="18" fill="hsl(var(--primary))" />
      <line x1="118" y1="320" x2="190" y2="320" stroke="hsl(var(--primary))" strokeWidth="14" />
      <line x1="88" y1="370" x2="190" y2="370" stroke="hsl(var(--primary))" strokeWidth="14" />
      <line x1="108" y1="420" x2="200" y2="420" stroke="hsl(var(--primary))" strokeWidth="14" />
    </svg>
  );
}
