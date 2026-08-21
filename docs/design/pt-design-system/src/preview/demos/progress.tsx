import { Progress } from '../../components/ui/progress';

const TUTORS = [
  { name: 'D. Okafor', load: 90 },
  { name: 'S. Whitfield', load: 62 },
  { name: 'M. Laurent', load: 35 },
] as const;

export function ProgressDemo() {
  return (
    <div className="space-y-5 rounded-xl border bg-card p-6 text-card-foreground">
      {TUTORS.map((tutor) => (
        <div key={tutor.name} className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="font-bold">{tutor.name}</span>
            <span className="text-muted-foreground">{tutor.load}% booked</span>
          </div>
          <Progress value={tutor.load} />
        </div>
      ))}
    </div>
  );
}
