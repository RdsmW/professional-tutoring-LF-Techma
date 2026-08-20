---
name: Public form renderer fallbacks
description: Keeping signed public-form version continuity when stricter catalog rules invalidate legacy published content.
---

When a published public form no longer parses because catalog validation became stricter, publish a new immutable compatible baseline version before serving the form.

**Why:** Dropping the version ID in a renderer fallback produces an empty token, while retaining the old ID would sign content a family did not review. Both break version integrity.

**How to apply:** Retire the non-renderable version, create and audit a new published baseline, then issue a token only for that new version. Keep missing database records and signing configuration as unavailable states.