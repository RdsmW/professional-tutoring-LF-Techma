# Verification — Student Form Usability

## Completed Checks

- TypeScript completed successfully.
- The Academic Year public registration, billing-schedule, and Path A finalization suite completed with 11 passed and 1 conditional scenario skipped.
- The production build completed successfully.
- The Student step regression check confirms:
  - concise First name and Last name labels;
  - required Phone and Email fields;
  - no Student-prefixed labels for those four fields;
  - a three-field contact row containing Birthdate, Phone, and Email.
- Public Academic Year registration payloads now include a student email in regression coverage.
- Server-side validation rejects a missing student email.

## Address Lookup Observation

- The browser no longer sends direct requests to Mapbox.
- The application now uses a public server route for address lookup and returns a friendly unavailable message rather than exposing Mapbox's raw Forbidden response.
- The currently configured Mapbox public token returned HTTP 403 Forbidden for Mapbox Geocoding v5, Geocoding v6, and Search Box lookups. The token is configured and has a public-token format, but its current permissions do not permit address-search requests.