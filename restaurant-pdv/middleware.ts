import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "@/lib/session";

const staffPrefixes = ["/garcom", "/caixa"];
const adminPrefix = "/admin";

export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;

  const isAdminRoute = path.startsWith(adminPrefix) && path !== "/admin/login";
  const isStaffRoute = staffPrefixes.some((p) => path.startsWith(p));

  if (!isAdminRoute && !isStaffRoute) {
    return NextResponse.next();
  }

  const cookie = req.cookies.get("session")?.value;
  const session = await decrypt(cookie);

  if (!session || session.expiresAt < Date.now()) {
    const loginPath = isAdminRoute ? "/admin/login" : "/login";
    return NextResponse.redirect(new URL(loginPath, req.nextUrl));
  }

  if (isAdminRoute && session.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$|.*\\.svg$).*)"],
};
