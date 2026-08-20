---
name: Mapbox address-search authorization
description: Configuration requirement for the shared address autocomplete component.
---

The shared address autocomplete calls a public server route instead of calling Mapbox from the browser. Its Mapbox public token must authorize a Geocoding or Search API request.

**Why:** A configured token can still return HTTP 403 for every Mapbox address-search endpoint. The application should present a friendly unavailable message rather than expose the provider error.

**How to apply:** When autocomplete is unavailable, verify the token's Mapbox search permission and URL restrictions through the secure secrets flow; do not request or display the token in chat.