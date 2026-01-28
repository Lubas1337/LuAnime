'use client';

import { useState } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthModalStore } from '@/lib/store/auth-modal-store';
import { useAuthStore } from '@/lib/store/auth-store';
import { login, register } from '@/lib/api/auth';

function SegmentedControl({
  value,
  onChange,
}: {
  value: 'login' | 'register';
  onChange: (value: 'login' | 'register') => void;
}) {
  return (
    <div className="relative flex p-1 bg-secondary rounded-xl">
      <div
        className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-background rounded-lg shadow-sm transition-transform duration-300 ease-out"
        style={{
          transform: value === 'login' ? 'translateX(0)' : 'translateX(100%)',
        }}
      />
      <button
        type="button"
        onClick={() => onChange('login')}
        className={`relative flex-1 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
          value === 'login' ? 'text-foreground' : 'text-muted-foreground'
        }`}
      >
        Вход
      </button>
      <button
        type="button"
        onClick={() => onChange('register')}
        className={`relative flex-1 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
          value === 'register' ? 'text-foreground' : 'text-muted-foreground'
        }`}
      >
        Регистрация
      </button>
    </div>
  );
}

function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const { setUser } = useAuthStore();
  const [formData, setFormData] = useState({ login: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await login(formData);
      if (response.profile && response.profileToken) {
        setUser(response.profile, response.profileToken);
        onSuccess();
      } else {
        setError('Неверный формат ответа от сервера');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неверный логин или пароль');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm animate-in fade-in slide-in-from-top-1 duration-200">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="modal-login" className="text-sm font-medium text-foreground">
          Логин
        </label>
        <Input
          id="modal-login"
          type="text"
          placeholder="Введите логин"
          value={formData.login}
          onChange={(e) => setFormData({ ...formData, login: e.target.value })}
          required
          disabled={isLoading}
          className="h-11 rounded-xl bg-secondary border-none focus:ring-2 focus:ring-primary/50 transition-all duration-200"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="modal-password" className="text-sm font-medium text-foreground">
          Пароль
        </label>
        <div className="relative">
          <Input
            id="modal-password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Введите пароль"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
            disabled={isLoading}
            className="h-11 rounded-xl bg-secondary border-none pr-10 focus:ring-2 focus:ring-primary/50 transition-all duration-200"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <Button
        type="submit"
        className="w-full h-11 rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-300 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Вход...
          </>
        ) : (
          'Войти'
        )}
      </Button>
    </form>
  );
}

function RegisterForm({ onSuccess }: { onSuccess: () => void }) {
  const { setUser } = useAuthStore();
  const [formData, setFormData] = useState({
    login: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    if (formData.password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов');
      return;
    }

    setIsLoading(true);

    try {
      const response = await register({
        login: formData.login,
        email: formData.email,
        password: formData.password,
      });
      if (response.profile && response.profileToken) {
        setUser(response.profile, response.profileToken);
        onSuccess();
      } else {
        setError('Неверный формат ответа от сервера');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка регистрации. Попробуйте другой логин или email.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm animate-in fade-in slide-in-from-top-1 duration-200">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="modal-reg-login" className="text-sm font-medium text-foreground">
          Логин
        </label>
        <Input
          id="modal-reg-login"
          type="text"
          placeholder="Введите логин"
          value={formData.login}
          onChange={(e) => setFormData({ ...formData, login: e.target.value })}
          required
          disabled={isLoading}
          className="h-11 rounded-xl bg-secondary border-none focus:ring-2 focus:ring-primary/50 transition-all duration-200"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="modal-reg-email" className="text-sm font-medium text-foreground">
          Email
        </label>
        <Input
          id="modal-reg-email"
          type="email"
          placeholder="Введите email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
          disabled={isLoading}
          className="h-11 rounded-xl bg-secondary border-none focus:ring-2 focus:ring-primary/50 transition-all duration-200"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="modal-reg-password" className="text-sm font-medium text-foreground">
          Пароль
        </label>
        <div className="relative">
          <Input
            id="modal-reg-password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Минимум 6 символов"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
            disabled={isLoading}
            className="h-11 rounded-xl bg-secondary border-none pr-10 focus:ring-2 focus:ring-primary/50 transition-all duration-200"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="modal-reg-confirm" className="text-sm font-medium text-foreground">
          Подтвердите пароль
        </label>
        <Input
          id="modal-reg-confirm"
          type={showPassword ? 'text' : 'password'}
          placeholder="Повторите пароль"
          value={formData.confirmPassword}
          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
          required
          disabled={isLoading}
          className="h-11 rounded-xl bg-secondary border-none focus:ring-2 focus:ring-primary/50 transition-all duration-200"
        />
      </div>

      <Button
        type="submit"
        className="w-full h-11 rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-300 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Регистрация...
          </>
        ) : (
          'Зарегистрироваться'
        )}
      </Button>
    </form>
  );
}

export function AuthModal() {
  const { isOpen, view, close, setView } = useAuthModalStore();

  const handleSuccess = () => {
    close();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <DialogContent className="sm:max-w-md rounded-2xl border-border/50 bg-background/95 backdrop-blur-xl shadow-2xl p-0 overflow-hidden">
        <div className="p-6 space-y-6">
          <DialogHeader className="space-y-3">
            <div className="flex items-center justify-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/30">
                <span className="text-xl font-bold text-primary-foreground">L</span>
              </div>
            </div>
            <DialogTitle className="text-xl text-center">
              {view === 'login' ? 'Вход в аккаунт' : 'Создание аккаунта'}
            </DialogTitle>
            <DialogDescription className="text-center">
              {view === 'login'
                ? 'Войдите, чтобы сохранять избранное и историю просмотров'
                : 'Создайте аккаунт для доступа ко всем функциям'}
            </DialogDescription>
          </DialogHeader>

          <SegmentedControl value={view} onChange={setView} />

          <div className="relative">
            <div
              className={`transition-all duration-300 ${
                view === 'login'
                  ? 'opacity-100 translate-x-0'
                  : 'opacity-0 -translate-x-4 absolute inset-0 pointer-events-none'
              }`}
            >
              {view === 'login' && <LoginForm onSuccess={handleSuccess} />}
            </div>
            <div
              className={`transition-all duration-300 ${
                view === 'register'
                  ? 'opacity-100 translate-x-0'
                  : 'opacity-0 translate-x-4 absolute inset-0 pointer-events-none'
              }`}
            >
              {view === 'register' && <RegisterForm onSuccess={handleSuccess} />}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
