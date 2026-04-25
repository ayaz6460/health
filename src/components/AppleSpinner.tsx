export default function AppleSpinner({ size = 20, color = '#86868b' }: { size?: number; color?: string }) {
  return (
    <div className="apple-spinner" style={{ '--s': `${size}px`, '--c': color } as React.CSSProperties}>
      <i /><i /><i /><i /><i /><i /><i /><i />
    </div>
  );
}
