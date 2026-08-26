import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Extract cookies
  const token = request.cookies.get('jwt')?.value;
  const role = request.cookies.get('userRole')?.value;
  const { pathname } = request.nextUrl;

  // 1. Prevent logged-in users from accessing Auth pages
  if (pathname.startsWith('/login') || pathname.startsWith('/register')) {
    if (token) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // 2. Base Authentication Check for all private routes
  const privatePrefixes = ['/admin', '/instructor', '/student', '/content-manager', '/dashboard'];
  const isPrivateRoute = privatePrefixes.some(prefix => pathname.startsWith(prefix));

  if (isPrivateRoute) {
    if (!token) {
      // Not logged in, send to login page
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // 3. Strict Role-Based URL Guards
    // Admins are granted universal override access in the UI for ease of testing/management
    const isAdmin = role === 'Admin';

    if (pathname.startsWith('/admin') && !isAdmin) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }

    if (pathname.startsWith('/instructor') && role !== 'Instructor' && !isAdmin) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }

    if (pathname.startsWith('/content-manager') && role !== 'Content Manager' && !isAdmin) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }

    if (pathname.startsWith('/student') && role !== 'Student' && !isAdmin) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  return NextResponse.next();
}

// Ensure middleware only runs on these specific paths to save performance
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
