import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';

export function CardDemo() {
  return (
    <div className="grid gap-6 rounded-xl border bg-card p-6 text-card-foreground lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Session summary</CardTitle>
          <CardDescription>
            Paper on Canvas, hairline Line border, 14px radius — no drop shadow.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span>Algebra II — Maya R.</span>
            <Badge variant="mint">Confirmed</Badge>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span>SAT Prep — Jordan K.</span>
            <Badge variant="gold">Pending</Badge>
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="ghost">Open schedule</Button>
        </CardFooter>
      </Card>

      <Card className="border-0 bg-accent text-accent-foreground">
        <CardHeader>
          <CardTitle className="text-lg">Feature highlight</CardTitle>
          <CardDescription className="text-accent-foreground/80">
            Gold Soft tint signals an interactive callout — gold is wayfinding,
            never a large fill.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button>Review requests</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
