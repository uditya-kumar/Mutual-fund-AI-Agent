interface StatusMessageProps {
  text: string;
}

/** Animated "thinking / working" indicator shown while the agent responds. */
export function StatusMessage({ text }: StatusMessageProps) {
  return (
    <div className="status-message">
      <div className="spinner" />
      <span>{text}</span>
    </div>
  );
}
