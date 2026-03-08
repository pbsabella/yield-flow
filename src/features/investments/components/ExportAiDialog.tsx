"use client";

import { useState } from "react";
import { Download, Copy } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { buildAiContext } from "@/lib/domain/ai-context";
import { toISODate } from "@/lib/domain/date";
import type { EnrichedSummary } from "@/features/portfolio/hooks/usePortfolioData";
import type { MonthlyAllowance } from "@/types";
import type { Preferences } from "@/lib/hooks/usePreferences";

const DEFAULT_PROMPT =
  "Given the portfolio snapshot below, suggest next best actions. Consider: upcoming maturities that need renewal decisions, bank concentration vs. the insurance limit, and reinvestment opportunities given current market rates.";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  summaries: EnrichedSummary[];
  monthlyAllowance: MonthlyAllowance[];
  preferences: Preferences;
};

export function ExportAiDialog({
  open,
  onOpenChange,
  summaries,
  monthlyAllowance,
  preferences,
}: Props) {
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [marketRates, setMarketRates] = useState("");

  function getMarkdown() {
    return buildAiContext({
      summaries,
      monthlyAllowance,
      preferences,
      today: toISODate(new Date()),
      prompt,
      marketRates,
    });
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(getMarkdown());
      toast.success("Copied to clipboard");
      onOpenChange(false);
    } catch {
      toast.error("Copy failed — try the Download button instead");
    }
  }

  function handleDownload() {
    try {
      const today = toISODate(new Date());
      const blob = new Blob([getMarkdown()], { type: "text/markdown; charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `yieldflow-context-${today}.md`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("File downloaded");
      onOpenChange(false);
    } catch {
      toast.error("Download failed — try copying instead");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90dvh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle>Export for AI</DialogTitle>
          <DialogDescription>
            Edit the prompt and optionally add current bank rates before copying.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-stack-lg py-2 overflow-y-auto flex-1 min-h-0">
          <div className="space-y-1.5">
            <Label htmlFor="ai-prompt">Prompt</Label>
            <Textarea
              id="ai-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              className="resize-y text-sm max-h-48"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="market-rates">
              Current TD rates offered by banks{" "}
              <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Textarea
              id="market-rates"
              placeholder={"e.g. Bank A: 3mo 4.5%, 6mo 5.0%, 12mo 5.25%\nBank B: 6mo 4.75%, 12mo 5.0%"}
              value={marketRates}
              onChange={(e) => setMarketRates(e.target.value)}
              rows={3}
              className="resize-y text-sm max-h-48"
            />
            <p className="text-xs text-muted-foreground">
              Helps the AI compare your locked-in rates against what banks currently offer.
            </p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground shrink-0">
          AI can make mistakes. Always verify calculations and recommendations before acting.
        </p>

        <DialogFooter className="gap-2 shrink-0">
          <Button variant="outline" onClick={handleDownload} className="gap-1.5">
            <Download className="size-4" />
            Download .md
          </Button>
          <Button onClick={handleCopy} className="gap-1.5">
            <Copy className="size-4" />
            Copy to clipboard
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
