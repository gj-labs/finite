import { NextResponse } from "next/server";
import { withAuth } from "next-auth/middleware";

// With REQUIRE_LOGIN=true, everything needs a signed-in, allow-listed Google account
// except the login page and auth endpoints. Otherwise the app is open (e.g. for judging).
const gate = withAuth({ pages: { signIn: "/login" } });

export default process.env.REQUIRE_LOGIN === "true" ? gate : () => NextResponse.next();

export const config = {
  matcher: ["/((?!api/auth|login|_next/static|_next/image|favicon.ico).*)"],
};
