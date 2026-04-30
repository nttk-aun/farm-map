import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

const ADMIN_ONLY_PAGE_PATHS = ['/farm-map/add', '/farm-map/edit'];
const AUTH_WRITE_API_PREFIX = '/api/farms';

function resolveAuthSecret() {
  try {
    if (process.env.NEXTAUTH_SECRET) {
      return process.env.NEXTAUTH_SECRET;
    }
    return process.env.DATABASE_URL || 'temporary-insecure-auth-secret';
  } catch (error) {
    console.error('resolveAuthSecret error:', error);
    return 'temporary-insecure-auth-secret';
  }
}

function isAdminRole(role) {
  try {
    return String(role || '')
      .trim()
      .toLowerCase() === 'admin';
  } catch (error) {
    console.error('isAdminRole error:', error);
    return false;
  }
}

function isAdminOnlyPage(pathname) {
  try {
    return ADMIN_ONLY_PAGE_PATHS.some((path) => pathname.startsWith(path));
  } catch (error) {
    console.error('isAdminOnlyPage error:', error);
    return false;
  }
}

function isProtectedWriteApi(pathname, method) {
  try {
    if (!pathname.startsWith(AUTH_WRITE_API_PREFIX)) {
      return false;
    }
    return method !== 'GET';
  } catch (error) {
    console.error('isProtectedWriteApi error:', error);
    return false;
  }
}

function redirectToLogin(request) {
  try {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  } catch (error) {
    console.error('redirectToLogin error:', error);
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

function redirectToFarmMap(request) {
  try {
    return NextResponse.redirect(new URL('/farm-map', request.url));
  } catch (error) {
    console.error('redirectToFarmMap error:', error);
    return NextResponse.redirect(new URL('/', request.url));
  }
}

export async function middleware(request) {
  try {
    const pathname = request.nextUrl.pathname;
    const method = request.method;
    const needAdminPage = isAdminOnlyPage(pathname);
    const needAdminWriteApi = isProtectedWriteApi(pathname, method);

    if (!needAdminPage && !needAdminWriteApi) {
      return NextResponse.next();
    }

    const token = await getToken({ req: request, secret: resolveAuthSecret() });
    const isAdmin = isAdminRole(token?.role);

    if (isAdmin) {
      return NextResponse.next();
    }

    if (needAdminWriteApi) {
      return NextResponse.json({ message: 'เฉพาะแอดมินเท่านั้นที่แก้ไขข้อมูลได้' }, { status: 403 });
    }
    if (token) {
      return redirectToFarmMap(request);
    }
    return redirectToLogin(request);
  } catch (error) {
    console.error('middleware error:', error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: ['/farm-map/add/:path*', '/farm-map/edit/:path*', '/api/farms/:path*'],
};
