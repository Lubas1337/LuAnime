import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Mock user storage (in production, use a database)
const MOCK_USERS: Record<string, { password: string; user: { id: number; login: string; email: string; avatar: string } }> = {};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { login, password } = body;

    if (!login || !password) {
      return NextResponse.json(
        { error: 'Логин и пароль обязательны' },
        { status: 400 }
      );
    }

    // Check mock users first
    const mockUser = MOCK_USERS[login.toLowerCase()];
    if (mockUser && mockUser.password === password) {
      const token = `mock_token_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      return NextResponse.json({
        profileToken: token,
        profile: mockUser.user,
      });
    }

    // For demo: allow any login with password "demo" or matching login
    if (password === 'demo' || password === login) {
      const token = `mock_token_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      return NextResponse.json({
        profileToken: token,
        profile: {
          id: Math.floor(Math.random() * 100000),
          login: login,
          email: `${login}@example.com`,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${login}`,
        },
      });
    }

    return NextResponse.json(
      { error: 'Неверный логин или пароль' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
