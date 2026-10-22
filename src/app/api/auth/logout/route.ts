import { cookies } from "next/headers";

export async function POST() {
  (await cookies()).set("__session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return Response.json({ signedOut: true });
}
