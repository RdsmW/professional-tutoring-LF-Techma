import { Button } from '../../components/ui/button';
import { PageHeader } from '../../components/ui/page-header';

export function PageHeaderDemo() {
  return (
    <div className="space-y-6 rounded-xl border bg-background p-6">
      <PageHeader
        eyebrow="Staff · Overview"
        title="Good morning, Danielle"
        description="Here's what needs your attention across leads, sessions, and tutor capacity today."
        actions={<Button>New session</Button>}
      />
      <PageHeader
        eyebrow="Students"
        title="Student directory"
        actions={
          <>
            <Button variant="outline">Export</Button>
            <Button>Add student</Button>
          </>
        }
      />
    </div>
  );
}
