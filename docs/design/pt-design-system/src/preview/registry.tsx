import { lazy, type ComponentType } from 'react';
import {
  ColorsPage,
  FontsPage,
  LayoutPage,
  OverviewPage,
} from './foundations';

function lazyPage(load: () => Promise<ComponentType>) {
  return lazy(async () => ({ default: await load() }));
}

const ButtonDemo = lazyPage(() =>
  import('./demos/button').then(({ ButtonDemo }) => ButtonDemo),
);
const BadgeDemo = lazyPage(() =>
  import('./demos/badge').then(({ BadgeDemo }) => BadgeDemo),
);
const CardDemo = lazyPage(() =>
  import('./demos/card').then(({ CardDemo }) => CardDemo),
);
const KpiCardDemo = lazyPage(() =>
  import('./demos/kpi-card').then(({ KpiCardDemo }) => KpiCardDemo),
);
const TableDemo = lazyPage(() =>
  import('./demos/table').then(({ TableDemo }) => TableDemo),
);
const AvatarDemo = lazyPage(() =>
  import('./demos/avatar').then(({ AvatarDemo }) => AvatarDemo),
);
const InputDemo = lazyPage(() =>
  import('./demos/input').then(({ InputDemo }) => InputDemo),
);
const SkeletonDemo = lazyPage(() =>
  import('./demos/skeleton').then(({ SkeletonDemo }) => SkeletonDemo),
);
const ProgressDemo = lazyPage(() =>
  import('./demos/progress').then(({ ProgressDemo }) => ProgressDemo),
);
const ToastDemo = lazyPage(() =>
  import('./demos/toast').then(({ ToastDemo }) => ToastDemo),
);
const PageHeaderDemo = lazyPage(() =>
  import('./demos/page-header').then(({ PageHeaderDemo }) => PageHeaderDemo),
);
const SidebarNavDemo = lazyPage(() =>
  import('./demos/sidebar-nav').then(({ SidebarNavDemo }) => SidebarNavDemo),
);
const EmptyDemo = lazyPage(() =>
  import('./demos/empty').then(({ EmptyDemo }) => EmptyDemo),
);
const FamiliesPageDemo = lazyPage(() =>
  import('./demos/families-page').then(({ FamiliesPageDemo }) => FamiliesPageDemo),
);

export type RegistryEntry = {
  id: string;
  name: string;
  description: string;
  Page: ComponentType;
};

export type NavGroup = {
  name: string;
  entries: RegistryEntry[];
};

export const DESIGN_SYSTEM = {
  title: 'Professional Tutoring Design System',
  description:
    'Midnight navy authority, gold wayfinding, and Georgia headlines — the visual language of the Professional Tutoring staff tools, extracted from the approved staff dashboard.',
} as const;

export const OVERVIEW_ENTRY: RegistryEntry = {
  id: 'overview',
  name: 'Overview',
  description: 'Tokens and components at a glance.',
  Page: OverviewPage,
};

/**
 * Professional Tutoring design system registry.
 *
 * Families follow docs/references/component-inventory.md. Chunk 1 (pilot) is
 * implemented; chunks 2–3 (avatar, input, skeleton, progress, toast,
 * page-header, sidebar-nav, empty-state) are pending and will be added here
 * as they land. Overlay families (dialogs, sheets, drawers, popovers) are
 * intentionally absent — the design mandates native confirm()/alert().
 */
export const NAV_GROUPS: NavGroup[] = [
  {
    name: 'Foundations',
    // Overview is rendered as the standalone top item by the browser shell,
    // so it is not repeated inside this group.
    entries: [
      {
        id: 'colors',
        name: 'Colors',
        description: 'Navy, gold, and semantic color roles.',
        Page: ColorsPage,
      },
      {
        id: 'fonts',
        name: 'Typography',
        description: 'Georgia display, Arial body.',
        Page: FontsPage,
      },
      {
        id: 'layout',
        name: 'Layout',
        description: 'Spacing scale and 14px radius language.',
        Page: LayoutPage,
      },
    ],
  },
  {
    name: 'Actions',
    entries: [
      {
        id: 'button',
        name: 'Button',
        description: 'Primary CTA, ghost, text, and destructive roles.',
        Page: ButtonDemo,
      },
    ],
  },
  {
    name: 'Display',
    entries: [
      {
        id: 'badge',
        name: 'Status pill',
        description: 'Soft semantic pills and subject chips.',
        Page: BadgeDemo,
      },
      {
        id: 'card',
        name: 'Card',
        description: 'Paper surfaces and gold-tinted highlights.',
        Page: CardDemo,
      },
      {
        id: 'kpi-card',
        name: 'KPI card',
        description: 'Nested-panel metric card with trend line.',
        Page: KpiCardDemo,
      },
      {
        id: 'table',
        name: 'Data table',
        description: 'Directory table with avatars, pills, and text actions.',
        Page: TableDemo,
      },
      {
        id: 'avatar',
        name: 'Avatar',
        description: 'Initials in Navy Soft wells.',
        Page: AvatarDemo,
      },
      {
        id: 'empty',
        name: 'Empty state',
        description: 'Centered Paper card with icon well and one CTA.',
        Page: EmptyDemo,
      },
    ],
  },
  {
    name: 'Forms & feedback',
    entries: [
      {
        id: 'input',
        name: 'Input',
        description: 'Surface Lift fields with gold focus rings.',
        Page: InputDemo,
      },
      {
        id: 'progress',
        name: 'Progress',
        description: 'Mint capacity bars on Canvas tracks.',
        Page: ProgressDemo,
      },
      {
        id: 'skeleton',
        name: 'Skeleton',
        description: 'Navy Soft pulse blocks mirroring real layout.',
        Page: SkeletonDemo,
      },
      {
        id: 'toast',
        name: 'Toast',
        description: 'The single sanctioned overlay, top-anchored.',
        Page: ToastDemo,
      },
    ],
  },
  {
    name: 'Navigation & structure',
    entries: [
      {
        id: 'page-header',
        name: 'Page header band',
        description: 'Gold eyebrow, Georgia title, primary CTA.',
        Page: PageHeaderDemo,
      },
      {
        id: 'sidebar-nav',
        name: 'Sidebar nav',
        description: 'Midnight Navy wall with gold icon wayfinding.',
        Page: SidebarNavDemo,
      },
    ],
  },
  {
    name: 'Pages',
    entries: [
      {
        id: 'families-page',
        name: 'Families directory',
        description: 'Full staff shell — sidebar, filter toolbar, List + Cards views, skeleton, and empty state.',
        Page: FamiliesPageDemo,
      },
    ],
  },
];

export const ALL_ENTRIES: RegistryEntry[] = NAV_GROUPS.flatMap(
  (group) => group.entries,
);
