---
name: Same-app Reserved VM billing scheduler
description: Deployment and middleware constraints for the internal billing scheduler.
---

The billing scheduler is part of the existing web deployment: the Reserved VM supervisor starts Next.js and invokes the protected collector over loopback. The internal route must bypass Clerk session middleware but keep its own billing-secret check.

**Why:** Replit's Scheduled deployment is run-and-stop and cannot replace the public web app or Stripe webhook. Clerk middleware otherwise rewrites the scheduler's unauthenticated loopback request before the billing-secret authorization runs.

**How to apply:** Keep the scheduler neutral and let a dispatcher select collection sources. Treat the deployment target change as incomplete until the app is republished; the live deployment can remain Autoscale after source configuration is updated.