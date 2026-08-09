import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/health(.*)",
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
