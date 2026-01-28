import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { login, email, password } = body;

    if (!login || !email || !password) {
      return NextResponse.json(
        { error: 'Все поля обязательны для заполнения' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Пароль должен содержать минимум 6 символов' },
        { status: 400 }
      );
    }

    // For demo: simulate successful registration
    const token = `mock_token_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    return NextResponse.json({
      profileToken: token,
      profile: {
        id: Math.floor(Math.random() * 100000),
        login: login,
        email: email,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${login}`,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
