---
name: Mapbox address-search authorization
description: Configuration requirement for the shared address autocomplete component.
---

The shared address autocomplete calls a public server route instead of calling Mapbox from the browser. The route must not forward the incoming browser `Origin` or `Referer` header to Mapbox.

**Why:** A token can be accepted by Mapbox for a direct server request but return HTTP 403 when the route forwards a Replit proxy or development origin. Forwarded browser headers make Mapbox apply an incompatible URL restriction to an otherwise valid server-side lookup.

**How to apply:** Keep the token server-side and call Mapbox without forwarded browser-origin headers. When autocomplete is unavailable, verify the token's Geocoding/Search permission through the secure secrets flow; do not request or display the token in chat.