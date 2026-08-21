import { CalendarDays, GraduationCap, Inbox, LayoutDashboard, Users } from 'lucide-react';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { Badge } from '../../components/ui/badge';
import {
  SidebarNav,
  SidebarNavItem,
  SidebarNavSection,
} from '../../components/ui/sidebar-nav';

export function SidebarNavDemo() {
  return (
    <div className="flex gap-6">
      <ExpandedSidebar />
      <div className="overflow-hidden rounded-xl border" style={{ height: 480 }}>
        <SidebarNav collapsed brand="Professional Tutoring">
          <SidebarNavSection label="Workspace">
            <SidebarNavItem href="#" icon={LayoutDashboard} active>
              Dashboard
            </SidebarNavItem>
            <SidebarNavItem href="#" icon={Inbox}>
              Requests
            </SidebarNavItem>
            <SidebarNavItem href="#" icon={CalendarDays}>
              Schedule
            </SidebarNavItem>
          </SidebarNavSection>
          <SidebarNavSection label="People">
            <SidebarNavItem href="#" icon={Users}>
              Students
            </SidebarNavItem>
            <SidebarNavItem href="#" icon={GraduationCap}>
              Tutors
            </SidebarNavItem>
          </SidebarNavSection>
        </SidebarNav>
      </div>
    </div>
  );
}

function ExpandedSidebar() {
  return (
    <div className="overflow-hidden rounded-xl border" style={{ height: 480 }}>
      <SidebarNav
        brand="Professional Tutoring"
        footer={
          <div className="flex items-center gap-3 px-2 py-1">
            <Avatar className="h-8 w-8">
              <AvatarFallback>DO</AvatarFallback>
            </Avatar>
            <div className="min-w-0 text-sm">
              <div className="truncate font-semibold text-sidebar-primary-foreground">
                Danielle Okafor
              </div>
              <div className="truncate text-xs text-sidebar-foreground/70">Staff admin</div>
            </div>
          </div>
        }
      >
        <SidebarNavSection label="Workspace">
          <SidebarNavItem href="#" icon={LayoutDashboard} active>
            Dashboard
          </SidebarNavItem>
          <SidebarNavItem
            href="#"
            icon={Inbox}
            trailing={<Badge variant="gold">7</Badge>}
          >
            Requests
          </SidebarNavItem>
          <SidebarNavItem href="#" icon={CalendarDays}>
            Schedule
          </SidebarNavItem>
        </SidebarNavSection>
        <SidebarNavSection label="People">
          <SidebarNavItem href="#" icon={Users}>
            Students
          </SidebarNavItem>
          <SidebarNavItem href="#" icon={GraduationCap}>
            Tutors
          </SidebarNavItem>
        </SidebarNavSection>
      </SidebarNav>
    </div>
  );
}
