import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Row } from '../parts';

export function AvatarDemo() {
  return (
    <div className="space-y-6 rounded-xl border bg-card p-6 text-card-foreground">
      <Row label="Initials (default)">
        <Avatar>
          <AvatarFallback>MR</AvatarFallback>
        </Avatar>
        <Avatar>
          <AvatarFallback>JK</AvatarFallback>
        </Avatar>
        <Avatar>
          <AvatarFallback>EV</AvatarFallback>
        </Avatar>
      </Row>
      <Row label="Sizes">
        <Avatar className="h-7 w-7">
          <AvatarFallback className="text-[10px]">SP</AvatarFallback>
        </Avatar>
        <Avatar>
          <AvatarFallback>SP</AvatarFallback>
        </Avatar>
        <Avatar className="h-12 w-12">
          <AvatarFallback className="text-sm">SP</AvatarFallback>
        </Avatar>
      </Row>
      <Row label="With image">
        <Avatar>
          <AvatarImage src="/broken-on-purpose.png" alt="Maya Robinson" />
          <AvatarFallback>MR</AvatarFallback>
        </Avatar>
      </Row>
    </div>
  );
}
