---
name: Non-production availability fixtures
description: Keeping test scheduling capacity deterministic without changing runtime availability semantics.
---

Seed Academic Year availability fixtures only through an explicit test setup flag, and deactivate them in test teardown. Public availability queries and finalization checks must remain read-only.

**Why:** Re-enabling or expanding a synthetic slot during an availability lookup silently converts a full slot into a bookable one, defeating hold and capacity validation.

**How to apply:** Let test setup establish active fixture rows with initial safe capacity. Tests can simulate saturation and must observe the normal unavailable result; cleanup removes the fixture from public results without deleting exercised records.