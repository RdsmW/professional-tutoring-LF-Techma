import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

/** Unauthenticated → sign-in. Authenticated soft hits → post-login hard nav. */
export default async function HomePage() {
  const session = await auth();
  if (!session.userId) redirect("/sign-in");
  redirect("/post-login");
}
