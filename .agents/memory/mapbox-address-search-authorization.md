---
name: Mapbox address-search authorization
description: Configuration requirement for the shared address autocomplete component.
---

The shared address autocomplete calls a public server route instead of calling Mapbox from the browser. The route forwards the request's public origin to Mapbox, and its token must authorize that origin for Geocoding or Search.

**Why:** A configured token can return HTTP 403 solely because its Mapbox URL restriction allows a different local or published domain. The application should present a friendly unavailable message rather than expose the provider error.

**How to apply:** Add the active Replit development and production origins to the token's Mapbox URL restrictions. When autocomplete is unavailable, verify the token's search permission and allowed origins through the secure secrets flow; do not request or display the token in chat.