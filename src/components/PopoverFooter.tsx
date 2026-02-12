interface PopoverFooterProps {
  version: string;
  onQuit: () => void;
}

export function PopoverFooter({ version, onQuit }: PopoverFooterProps) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 border-t border-border/30">
      <span className="text-[10px] text-muted-foreground/60 font-mono">{version}</span>
      <div className="flex items-center gap-3">
        <button
          onClick={onQuit}
          className="text-[10px] text-muted-foreground hover:text-destructive transition-colors font-medium"
        >
          Quit
        </button>
      </div>
    </div>
  );
}
