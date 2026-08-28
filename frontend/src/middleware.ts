import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js Edge Middleware for Role-Based Access Control (RBAC).
 * 
 * This middleware intercepts every request matching the `config.matcher` array before it hits the Next.js router.
 * It enforces strict security guardrails by verifying the presence of a JWT and validating the user's role 
 * against the requested URL path.
 * 
 * @param request - The incoming Next.js request object containing cookies and URL metadata.
 * @returns A NextResponse object that either redirects the user or allows the request to proceed.
 */
export function middleware(request: NextRequest) {
  // Extract authentication state from HTTP-only accessible cookies (set by AuthContext)
  const token = request.cookies.get('jwt')?.value;
  const role = request.cookies.get('userRole')?.value;
  const { pathname } = request.nextUrl;

  // 1. Auth Page Guards
  // Prevent logged-in users from accessing the login or registration pages to avoid infinite loops or confusing UX.
  if (pathname.startsWith('/login') || pathname.startsWith('/register')) {
    if (token) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // Define the root paths that require authentication.
  const privatePrefixes = ['/admin', '/instructor', '/student', '/content-manager', '/dashboard'];
  const isPrivateRoute = privatePrefixes.some(prefix => pathname.startsWith(prefix));

  // 2. Base Authentication Guard
  if (isPrivateRoute) {
    if (!token) {
      // Unauthenticated users attempting to access private routes are intercepted and redirected to login.
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // 3. Strict Role-Based URL Guards (RBAC)
    // The Admin role acts as a superuser, bypassing specific route restrictions for easier platform testing/management.
    const isAdmin = role === 'Admin';

    // Restrict /admin strictly to the Admin role.
    if (pathname.startsWith('/admin') && !isAdmin) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }

    // Restrict /instructor to Instructors (and Admins).
    if (pathname.startsWith('/instructor') && role !== 'Instructor' && !isAdmin) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }

    // Restrict /content-manager to Content Managers (and Admins).
    if (pathname.startsWith('/content-manager') && role !== 'Content Manager' && !isAdmin) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }

    // Restrict /student to Students (and Admins).
    if (pathname.startsWith('/student') && role !== 'Student' && !isAdmin) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  // Allow the request to proceed if all security checks pass.
  return NextResponse.next();
}

/**
 * Middleware Configuration
 * Performance optimization: Only execute this middleware on specific routes.
 * Using `:path*` ensures all nested sub-routes are also caught by the middleware.
 */
export const config = {
  matcher: [
    '/admin/:path*', 
    '/instructor/:path*', 
    '/student/:path*', 
    '/content-manager/:path*', 
    '/dashboard/:path*',
    '/login', 
    '/register'
  ],
};
