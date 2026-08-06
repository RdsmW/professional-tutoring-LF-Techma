import { ComingStageNote, PageIntro, Panel } from "@/components/ui";

const COURSES = [
  { name: "First Class", detail: "9-month · Sundays" },
  { name: "The Express", detail: "6-month · Tuesdays" },
  { name: "Summer Master Class", detail: "Summer cohort" },
];

export default function FamilyEnrollCoursesPage() {
  return (
    <>
      <PageIntro
        eyebrow="Family Portal · Enroll in Courses"
        title="Enroll in Courses"
        description="Fixed SAT/ACT cohorts with course-specific enrollment and billing. No tutor matching for courses."
      />
      <Panel title="Program options" eyebrow="Stage 1 shell">
        <div className="choice-grid">
          {COURSES.map((course) => (
            <button key={course.name} type="button" className="choice-card">
              <span className="choice-check" />
              <strong>{course.name}</strong>
              <p>{course.detail}</p>
              <small>Select in Stage 2</small>
            </button>
          ))}
        </div>
        <ComingStageNote feature="Course details, billing preview, review, and confirmation" />
      </Panel>
    </>
  );
}
