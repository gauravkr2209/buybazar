type DemoBadgeProps = {
  label?: string;
};

export default function DemoBadge({ label = "DEMO DATA" }: DemoBadgeProps) {
  return (
    <span className="demo-badge">
      <span className="demo-badge__dot" aria-hidden="true" />
      {label}
    </span>
  );
}
