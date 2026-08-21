import { CheckCircle2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Toaster } from '../../components/ui/toaster';
import { useToast } from '../../hooks/use-toast';

/** Mint icon well that leads a success toast. */
function MintWell() {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#eaf7f2] text-[#2f6f5e]">
      <CheckCircle2 size={18} aria-hidden />
    </span>
  );
}

export function ToastDemo() {
  const { toast } = useToast();
  return (
    <div className="space-y-6 rounded-xl border bg-card p-6 text-card-foreground">
      <div className="flex flex-wrap gap-3">
        <Button
          variant="outline"
          onClick={() =>
            toast({
              title: 'Session confirmed',
              description: (
                <span className="flex items-center gap-3">
                  <MintWell />
                  <span>Maya R. — Algebra II, Thu 4:00 PM with D. Okafor.</span>
                </span>
              ),
            })
          }
        >
          Show success toast
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            toast({
              variant: 'destructive',
              title: 'Could not save',
              description: 'The session time is no longer available.',
            })
          }
        >
          Show destructive toast
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Toasts are the only overlay in the system — destructive confirmations
        use native confirm().
      </p>
      <Toaster />
    </div>
  );
}
