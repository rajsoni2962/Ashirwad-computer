import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  verifyPassword,
  hashPassword,
  createSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
} from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Username and password are required.' },
        { status: 400 }
      );
    }

    const cleanUsername = username.trim();

    // Find user by username or email, with cryptographic admin fallback if DB has a cold-start timeout
    let user: any = null;
    try {
      user = await db.user.findFirst({
        where: {
          OR: [
            {
              username: {
                equals: cleanUsername,
                mode: 'insensitive',
              },
            },
            {
              email: {
                equals: cleanUsername,
                mode: 'insensitive',
              },
            },
          ],
        },
      });
    } catch (dbErr: any) {
      console.warn('Database lookup warning during login, checking primary admin hash:', dbErr?.message);
      const isAdminIdentifier =
        cleanUsername.toLowerCase() === 'admin' ||
        cleanUsername.toLowerCase() === 'rajsoni2962@gmail.com';
      if (isAdminIdentifier) {
        user = {
          id: 'cmvmvk05i0000ujf83fpdyfu5',
          username: 'admin',
          name: 'Raj Soni',
          email: 'rajsoni2962@gmail.com',
          role: 'admin',
          password:
            'scrypt$e74e904cef4556d8262afbc675c12084$062568868e72f8306d6d74d8cf2e8ca623b7d77e38f160ca9710a35ce8d9e53f500bfc4160d1b8a9e226a890a62e6fbfa037ebafc9ac513ac538392fc1ea9097',
        };
      } else {
        throw dbErr;
      }
    }

    if (!user) {
      // Timing attack mitigation
      verifyPassword(password, 'scrypt$dummy$123456');
      return NextResponse.json(
        { success: false, error: 'Invalid username or password.' },
        { status: 401 }
      );
    }

    const isValid = verifyPassword(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid username or password.' },
        { status: 401 }
      );
    }

    // Auto-upgrade legacy plaintext password to secure scrypt hash
    if (!user.password.startsWith('scrypt$')) {
      try {
        const secureHash = hashPassword(password);
        await db.user.update({
          where: { id: user.id },
          data: { password: secureHash },
        });
      } catch (err) {
        console.warn('Non-fatal: failed to upgrade legacy password hash:', err);
      }
    }

    // Create session token
    const token = createSessionToken({
      id: user.id,
      username: user.username,
      role: user.role,
    });

    const response = NextResponse.json({
      success: true,
      message: 'Login successful.',
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    });

    // Set secure HTTP-only cookie
    const isProduction = process.env.NODE_ENV === 'production';
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE_SECONDS,
    });

    return response;
  } catch (error: any) {
    console.error('Error during login:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error during login.' },
      { status: 500 }
    );
  }
}
