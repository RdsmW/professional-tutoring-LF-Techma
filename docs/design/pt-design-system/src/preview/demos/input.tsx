import { Input } from '../../components/ui/input';
import { Row } from '../parts';

export function InputDemo() {
  return (
    <div className="space-y-6 rounded-xl border bg-card p-6 text-card-foreground">
      <Row label="Default">
        <Input aria-label="Student name" placeholder="Student name" className="max-w-sm" />
      </Row>
      <Row label="With value">
        <Input aria-label="Student name" defaultValue="Maya Robinson" className="max-w-sm" />
      </Row>
      <Row label="Types">
        <Input type="email" aria-label="Parent email" placeholder="parent@email.com" className="max-w-sm" />
        <Input type="number" aria-label="Sessions per week" placeholder="Sessions per week" className="max-w-sm" />
      </Row>
      <Row label="Disabled">
        <Input disabled aria-label="Locked field" placeholder="Locked field" className="max-w-sm" />
      </Row>
    </div>
  );
}
