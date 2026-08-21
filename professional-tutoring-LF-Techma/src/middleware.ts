import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/health(.*)",
  "/invite(.*)",
  "/api/invite(.*)",
  "/register/academic-year-tutoring(.*)",
  "/api/public/ay-tutoring-registration(.*)",
  "/api/public/ay-tutoring-availability(.*)",
  "/api/public/ay-tutoring-payment(.*)",
  "/api/public/address-autocomplete(.*)",
  "/api/stripe/webhook(.*)",
  // The same-app scheduler authenticates this endpoint with BILLING_JOB_SECRET.
  "/api/internal/billing/collect-due(.*)",
]);

/** Bootstrap authenticates inside the route so unauth clients get JSON 401, not a Clerk rewrite. */
const isBootstrapRoute = createRouteMatcher(["/api/bootstrap(.*)"]);

export default clerkMiddleware(async (auth, request) => {
  if (isPublicRoute(request) || isBootstrapRoute(request)) {
    return;
  }
  await auth.protect();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
