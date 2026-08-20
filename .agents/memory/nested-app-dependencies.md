---
name: Nested app dependencies
description: Dependency repair and validation behavior for the nested web application.
---

The workspace contains a nested web application, and package-repair tooling may act on the workspace root rather than that app.

**Why:** Root-level installation does not restore the nested app's local module resolution, leaving builds unable to find its locked dependencies.

**How to apply:** When the app's dependency tree is incomplete, restore it from the nested application's lockfile, then run its checks from that directory.