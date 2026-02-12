interface PopoverFooterProps {
  version: string;
}

export function PopoverFooter({ version }: PopoverFooterProps) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 border-t border-border/30">
      <span className="text-[10px] text-muted-foreground/60 font-mono">{version}</span>
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-1.5 text-[10px] text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
          <input type="checkbox" className="rounded border-border w-3 h-3 accent-primary" />
          Open on Startup
        </label>
        <button className="text-[10px] text-muted-foreground hover:text-destructive transition-colors font-medium">
          Quit
        </button>
      </div>
    </div>
  );
}
