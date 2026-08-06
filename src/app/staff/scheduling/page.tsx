"use client";

import { useState } from "react";
import { ComingStageNote, PageIntro, Panel } from "@/components/ui";

const COURSES = [
  { name: "SAT/ACT First Class", timing: "Sundays · Sep–May", capacity: "Enrollment open" },
  { name: "The Express", timing: "Tuesdays · Dec–Jun", capacity: "Enrollment open" },
  { name: "Summer Master Class", timing: "Mon morning / Wed evening", capacity: "Planned" },
];

export default function StaffSchedulingPage() {
  const [mode, setMode] = useState<"Week" | "Courses">("Week");

  return (
    <>
      <PageIntro
        eyebrow="Staff Operations · Scheduling"
        title="Scheduling"
        description="Sunday–Saturday week board for tutoring, with Courses nested here (not a top-level Staff menu)."
      />

      <section className="segmented">
        {(["Week", "Courses"] as const).map((item) => (
          <button key={item} type="button" className={mode === item ? "active" : ""} onClick={() => setMode(item)}>
            {item}
          </button>
        ))}
      </section>

      {mode === "Week" ? (
        <Panel title="Weekly calendar" eyebrow="Stage 1 shell">
          <div className="schedule-board">
            <div className="schedule-corner">
              <strong>Time</strong>
              <small>ET</small>
            </div>
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="day-head">
                <strong>{day}</strong>
                <small>Week view</small>
              </div>
            ))}
            {["9:00", "11:00", "1:00", "3:15", "5:15", "7:15"].map((time) => (
              <div className="schedule-row" key={time}>
                <div className="time-cell">{time}</div>
                {Array.from({ length: 7 }).map((_, index) => (
                  <button key={`${time}-${index}`} type="button" className="slot-card open">
                    <strong>Open</strong>
                    <small>Create booking later</small>
                  </button>
                ))}
              </div>
            ))}
          </div>
          <ComingStageNote feature="Staff booking, event detail, and capacity-safe holds" />
        </Panel>
      ) : (
        <Panel title="SAT/ACT courses" eyebrow="Nested under Scheduling">
          <section className="course-grid">
            {COURSES.map((course) => (
              <article key={course.name} className="course-card">
                <span className="pill">{course.capacity}</span>
                <span className="course-kicker">SAT / ACT program</span>
                <h3>{course.name}</h3>
                <div>
                  <small>Scheduling pattern</small>
                  <strong>{course.timing}</strong>
                </div>
                <button type="button">Open Course Roster →</button>
              </article>
            ))}
          </section>
          <ComingStageNote feature="Course roster, manage enrollment, archive rules" />
        </Panel>
      )}
    </>
  );
}
