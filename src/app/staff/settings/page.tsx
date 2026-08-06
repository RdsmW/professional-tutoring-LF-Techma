import { ComingStageNote, PageIntro, Panel } from "@/components/ui";
import { APP_TIMEZONE } from "@/lib/constants";

export default function StaffSettingsPage() {
  return (
    <>
      <PageIntro
        eyebrow="Staff Operations · Settings"
        title="Settings"
        description="Configuration for terms, policies, and staff access expands later. App timezone is fixed for Stage 1."
      />
      <Panel title="Foundation settings" eyebrow="Stage 1">
        <div className="policy-grid">
          <div>
            <h3>Timezone</h3>
            <p>{APP_TIMEZONE}</p>
          </div>
          <div>
            <h3>Authentication</h3>
            <p>Clerk · role via publicMetadata.role = staff | family</p>
          </div>
          <div>
            <h3>Database</h3>
            <p>Supabase Postgres via DATABASE_URL + Drizzle (portable to Replit)</p>
          </div>
          <div>
            <h3>Design source</h3>
            <p>professional-tutoring-mockup (unchanged reference)</p>
          </div>
        </div>
        <ComingStageNote feature="Price books, policy versions, feature flags admin UI" />
      </Panel>
    </>
  );
}
