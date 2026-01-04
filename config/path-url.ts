



export const protectedRoutes = ["/dashboard", "/vault", "/settings"];

export const publicRoutes = ["/", "/login", "/register", "/forgot-password", "/reset-password"];

export const redirectUrl = "/auth/login";

export const homeUrl = "/dashboard";

export const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000";

export const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";