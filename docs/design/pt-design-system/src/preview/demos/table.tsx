import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';

const STUDENTS = [
  { name: 'Maya Robinson', grade: 'Grade 10', subject: 'Algebra II', tutor: 'D. Okafor', status: 'mint', statusLabel: 'Active' },
  { name: 'Jordan Kim', grade: 'Grade 12', subject: 'SAT Prep', tutor: 'S. Whitfield', status: 'gold', statusLabel: 'Pending' },
  { name: 'Elena Vasquez', grade: 'Grade 11', subject: 'Chemistry', tutor: 'D. Okafor', status: 'harbor', statusLabel: 'Prospect' },
  { name: 'Sam Patel', grade: 'Grade 9', subject: 'Geometry', tutor: 'M. Laurent', status: 'rose', statusLabel: 'Overdue' },
] as const;

function Initials({ name }: { name: string }) {
  const initials = name.split(' ').map((part) => part[0]).join('');
  return (
    <span className="flex h-[33px] w-[33px] shrink-0 items-center justify-center rounded-full bg-secondary text-[11px] font-bold text-secondary-foreground">
      {initials}
    </span>
  );
}

export function TableDemo() {
  return (
    <div className="rounded-xl border bg-card p-6 text-card-foreground">
      <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Tutor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {STUDENTS.map((student) => (
              <TableRow key={student.name}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Initials name={student.name} />
                    <div>
                      <div className="font-bold">{student.name}</div>
                      <div className="text-xs text-muted-foreground">{student.grade}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="violet">{student.subject}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{student.tutor}</TableCell>
                <TableCell>
                  <Badge variant={student.status}>{student.statusLabel}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm">Open</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
      </Table>
    </div>
  );
}
