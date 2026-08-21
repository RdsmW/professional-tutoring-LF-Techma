import { Badge } from '../../components/ui/badge';
import { Row } from '../parts';

export function BadgeDemo() {
  return (
    <div className="space-y-6 rounded-xl border bg-card p-6 text-card-foreground">
      <Row label="Semantic status pills">
        <Badge variant="mint">Confirmed</Badge>
        <Badge variant="gold">Pending</Badge>
        <Badge variant="harbor">Prospect</Badge>
        <Badge variant="rose">Overdue</Badge>
        <Badge variant="navy">12 waiting</Badge>
      </Row>
      <Row label="Subject / tag chips">
        <Badge variant="violet">Algebra II</Badge>
        <Badge variant="violet">SAT Prep</Badge>
        <Badge variant="violet">Chemistry</Badge>
      </Row>
      <Row label="Base variants">
        <Badge>Default</Badge>
        <Badge variant="secondary">Secondary</Badge>
        <Badge variant="outline">Outline</Badge>
        <Badge variant="destructive">Destructive</Badge>
      </Row>
    </div>
  );
}
