import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Rutas públicas que no requieren autenticación
  const publicPaths = ['/login', '/register'];
  
  // Rutas protegidas
  const protectedPaths = ['/dashboard'];
  
  const isPublicPath = publicPaths.includes(pathname);
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path));
  
  // Obtener token de las cookies o headers (si usas httpOnly cookies)
  const token = request.cookies.get('access_token')?.value;
  
  // Si está en una ruta protegida sin token, redirigir a login
  if (isProtectedPath && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // Si está en una ruta pública con token válido, redirigir al dashboard
  if (isPublicPath && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/login',
    '/register'
  ]
};