export function ConnectionIndicator({
  label,
  status,
}: {
  label: string;
  status: "ok" | "down" | "unknown";
}) {
  const text = status === "ok" ? "Connecté" : status === "down" ? "Injoignable" : "Vérification…";
  const color =
    status === "ok" ? "bg-success" : status === "down" ? "bg-destructive" : "bg-muted-foreground";

  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-background/40 px-3 py-2.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="flex items-center gap-2 text-xs">
        <span className={`size-2 rounded-full ${color}`} aria-hidden />
        <span className="text-foreground">{text}</span>
      </span>
    </div>
  );
}
