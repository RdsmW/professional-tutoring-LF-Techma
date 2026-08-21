import { expect, test } from "@playwright/test";
import {
  invitationAuthReturnTarget,
  invitationAuthUrls,
  invitationReturnPath,
} from "../src/lib/auth/invitation-return-path";
import { invitationRedirectUrl } from "../src/lib/family/clerk-portal-invitations";

const origin = "https://portal.example.test";
const token = "signed-invite-token";
const invitePath = `/invite/${token}`;
const inviteUrl = `${origin}${invitePath}`;

test.describe("Clerk invitation authentication return path", () => {
  test("the invitation email carries the original absolute invite URL into sign-in", () => {
    const signIn = new URL(invitationRedirectUrl(origin, token));
    expect(signIn.origin).toBe(origin);
    expect(signIn.pathname).toBe("/sign-in");
    expect(signIn.searchParams.get("redirect_url")).toBe(inviteUrl);
  });

  test("sign-up retains the original invite after a sign-in handoff", () => {
    const returnPath = invitationReturnPath(inviteUrl);
    const returnTarget = invitationAuthReturnTarget(returnPath, origin);
    const { signUpUrl } = invitationAuthUrls(returnTarget);

    expect(returnPath).toBe(invitePath);
    expect(new URL(signUpUrl, origin).searchParams.get("redirect_url")).toBe(inviteUrl);
  });

  test("sign-in retains the original invite after a sign-up handoff", () => {
    const returnPath = invitationReturnPath(inviteUrl);
    const returnTarget = invitationAuthReturnTarget(returnPath, origin);
    const { signInUrl } = invitationAuthUrls(returnTarget);

    expect(returnPath).toBe(invitePath);
    expect(new URL(signInUrl, origin).searchParams.get("redirect_url")).toBe(inviteUrl);
  });

  test("unsafe or non-invite redirect values cannot leave the application", () => {
    expect(invitationReturnPath("https://outside.example/invite/token")).toBe("/invite/token");
    expect(invitationReturnPath("https://outside.example/family")).toBe("/post-login");
    expect(invitationReturnPath("javascript:alert(1)")).toBe("/post-login");
  });
});