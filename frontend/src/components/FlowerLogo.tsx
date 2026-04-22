export default function FlowerLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Diagonal petals — lighter layer behind */}
      <ellipse cx="16" cy="10" rx="3.5" ry="5.5" fill="#a78bfa" transform="rotate(45 16 16)" />
      <ellipse cx="16" cy="10" rx="3.5" ry="5.5" fill="#a78bfa" transform="rotate(135 16 16)" />
      <ellipse cx="16" cy="10" rx="3.5" ry="5.5" fill="#a78bfa" transform="rotate(225 16 16)" />
      <ellipse cx="16" cy="10" rx="3.5" ry="5.5" fill="#a78bfa" transform="rotate(315 16 16)" />
      {/* Cardinal petals — darker in front */}
      <ellipse cx="16" cy="10" rx="3.5" ry="5.5" fill="#7c3aed" />
      <ellipse cx="16" cy="10" rx="3.5" ry="5.5" fill="#7c3aed" transform="rotate(90 16 16)" />
      <ellipse cx="16" cy="10" rx="3.5" ry="5.5" fill="#7c3aed" transform="rotate(180 16 16)" />
      <ellipse cx="16" cy="10" rx="3.5" ry="5.5" fill="#7c3aed" transform="rotate(270 16 16)" />
      {/* Center */}
      <circle cx="16" cy="16" r="4" fill="#4c1d95" />
      <circle cx="16" cy="16" r="2" fill="#ede9fe" />
    </svg>
  );
}
