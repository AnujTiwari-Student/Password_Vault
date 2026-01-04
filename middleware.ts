import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import authConfig from "./lib/auth.config";
import { homeUrl, redirectUrl } from "./config/path-url";

console.log("Middleware loaded with authConfig", authConfig);

const { auth } = NextAuth(authConfig);
export default auth(async function middleware(req) {
  const url = req.nextUrl.clone();
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  console.log("User is logged in:", isLoggedIn);
  console.log("Route", nextUrl.pathname);

  if (url.pathname === "/dashboard" && !isLoggedIn) {
    return NextResponse.redirect(new URL(redirectUrl, req.url));
  }

  // if( isLoggedIn && (url.pathname === "/auth/login" || url.pathname === "/")) {
  //   return NextResponse.redirect(new URL(homeUrl, req.url));
  // }

  let role = "owner";
  if (url.pathname.startsWith("/auth/login")) role = "owner";
  else if (url.pathname.startsWith("/auth/admin")) role = "admin";

  const res = NextResponse.next();
  res.cookies.set("user-role", role, { path: "/" });

  if (url.pathname === "/") {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  return res;
});

export const config = {
  matcher: ['/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)','/(api|trpc)(.*)', '/api/graphql'],
  runtime: 'nodejs',
}