# Verification — Student Form Usability

## Completed Checks

- TypeScript completed successfully.
- The Academic Year public registration, billing-schedule, and Path A finalization suite completed with 11 passed and 1 conditional scenario skipped.
- The production build completed successfully.
- The Student step regression check confirms:
  - concise First name and Last name labels;
  - required Phone and Email fields;
  - no Student-prefixed labels for those four fields;
  - a consistent three-column layout:
    - First name, Last name, Gender;
    - School, Grade, Graduation year;
    - Birthdate, Phone, Email;
  - an Address section heading without the redundant Student prefix.
- Public Academic Year registration payloads now include a student email in regression coverage.
- Server-side validation rejects a missing student email.

## Address Lookup Observation

- The browser no longer sends direct requests to Mapbox.
- The application now uses a public server route for address lookup and returns a friendly unavailable message rather than exposing Mapbox's raw Forbidden response.
- The currently configured Mapbox public token returned HTTP 403 Forbidden for requests from unapproved Replit origins.
- When the lookup route forwarded the token's approved `http://localhost:3000` origin, Mapbox returned HTTP 200 with five normalized address suggestions. This confirms that the token supports address search and is blocked only by its URL restrictions.