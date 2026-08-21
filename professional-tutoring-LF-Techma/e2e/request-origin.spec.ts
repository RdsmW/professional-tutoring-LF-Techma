import { expect, test } from "@playwright/test";
import { invitationRedirectOrigin } from "../src/lib/http/request-origin";

test.describe("invitation redirect origin", () => {
  test("uses the configured canonical application origin", () => {
    const previousOrigin = process.env.CLERK_INVITATION_REDIRECT_ORIGIN;
    process.env.CLERK_INVITATION_REDIRECT_ORIGIN = "https://public-origin.replit.dev";

    try {
      expect(invitationRedirectOrigin()).toBe("https://public-origin.replit.dev");
    } finally {
      if (previousOrigin === undefined) {
        delete process.env.CLERK_INVITATION_REDIRECT_ORIGIN;
      } else {
        process.env.CLERK_INVITATION_REDIRECT_ORIGIN = previousOrigin;
      }
    }
  });

  test("rejects a missing, non-HTTPS, or non-origin configuration", () => {
    const previousOrigin = process.env.CLERK_INVITATION_REDIRECT_ORIGIN;

    try {
      delete process.env.CLERK_INVITATION_REDIRECT_ORIGIN;
      expect(() => invitationRedirectOrigin()).toThrow(/must be configured/i);

      process.env.CLERK_INVITATION_REDIRECT_ORIGIN = "http://public-origin.replit.dev";
      expect(() => invitationRedirectOrigin()).toThrow(/must use HTTPS/i);

      process.env.CLERK_INVITATION_REDIRECT_ORIGIN = "https://public-origin.replit.dev/invite";
      expect(() => invitationRedirectOrigin()).toThrow(/only the HTTPS application origin/i);
    } finally {
      if (previousOrigin === undefined) {
        delete process.env.CLERK_INVITATION_REDIRECT_ORIGIN;
      } else {
        process.env.CLERK_INVITATION_REDIRECT_ORIGIN = previousOrigin;
      }
    }
  });
});