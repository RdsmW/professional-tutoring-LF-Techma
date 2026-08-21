import { Inbox } from 'lucide-react';
import { Button } from '../../components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '../../components/ui/empty';

export function EmptyDemo() {
  return (
    <div className="rounded-xl border bg-background p-6">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Inbox />
          </EmptyMedia>
          <EmptyTitle>No pending requests</EmptyTitle>
          <EmptyDescription>
            New tutoring requests will appear here as soon as families submit
            them.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button>Add a request manually</Button>
        </EmptyContent>
      </Empty>
    </div>
  );
}
