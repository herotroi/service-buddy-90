import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Smartphone, Eye, EyeOff } from 'lucide-react';

// Security: Input validation functions
const validateEmail = (email: string): string | null => {
  const trimmed = email?.trim() || '';
  if (!trimmed) return 'Email é obrigatório';
  if (trimmed.length > 255) return 'Email muito longo';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) return 'Email inválido';
  return null;
};

const validatePassword = (password: string): string | null => {
  if (!password) return 'Senha é obrigatória';
  if (password.length < 6) return 'Senha deve ter no mínimo 6 caracteres';
  if (password.length > 72) return 'Senha muito longa';
  return null;
};

const validateFullName = (name: string): string | null => {
  const trimmed = name?.trim() || '';
  if (!trimmed) return 'Nome é obrigatório';
  if (trimmed.length < 2) return 'Nome deve ter no mínimo 2 caracteres';
  if (trimmed.length > 100) return 'Nome muito longo';
  const nameRegex = /^[a-zA-ZÀ-ÿ\s'-]+$/;
  if (!nameRegex.test(trimmed)) return 'Nome contém caracteres inválidos';
  return null;
};

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const clearErrors = () => setErrors({});

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    clearErrors();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = (formData.get('email') as string)?.trim();
    const password = formData.get('password') as string;

    // Security: Validate inputs
    const fieldErrors: Record<string, string> = {};
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    
    if (emailError) fieldErrors.email = emailError;
    if (passwordError) fieldErrors.password = passwordError;
    
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await signIn(email, password);

      if (error) {
        // Security: Generic error messages to prevent user enumeration
        if (error.message?.includes('Invalid login credentials')) {
          toast.error('Email ou senha incorretos');
        } else if (error.message?.includes('Email not confirmed')) {
          toast.error('Por favor, confirme seu email antes de fazer login');
        } else {
          toast.error('Erro ao fazer login. Tente novamente.');
        }
      } else {
        toast.success('Login realizado com sucesso!');
        navigate('/');
      }
    } catch (err) {
      toast.error('Erro ao fazer login. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    clearErrors();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = (formData.get('email') as string)?.trim();
    const password = formData.get('password') as string;
    const fullName = (formData.get('fullName') as string)?.trim();

    // Security: Validate inputs
    const fieldErrors: Record<string, string> = {};
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    const nameError = validateFullName(fullName);
    
    if (emailError) fieldErrors.email = emailError;
    if (passwordError) fieldErrors.password = passwordError;
    if (nameError) fieldErrors.fullName = nameError;
    
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await signUp(email, password, fullName);

      if (error) {
        if (error.message?.includes('already registered') || error.message?.includes('already been registered')) {
          toast.error('Este email já está cadastrado');
        } else if (error.message?.includes('Password')) {
          toast.error('Senha muito fraca. Use uma senha mais forte.');
        } else {
          toast.error('Erro ao criar conta. Tente novamente.');
        }
      } else {
        toast.success('Conta criada com sucesso!');
        navigate('/');
      }
    } catch (err) {
      toast.error('Erro ao criar conta. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary rounded-xl">
              <Smartphone className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Sistema de Assistência Técnica</CardTitle>
          <CardDescription>Gerencie ordens de serviço de celulares</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full" onValueChange={clearErrors}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Cadastrar</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    name="email"
                    type="email"
                    placeholder="seu@email.com"
                    required
                    disabled={isLoading}
                    autoComplete="email"
                    className={errors.email ? 'border-destructive' : ''}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Senha</Label>
                  <div className="relative">
                    <Input
                      id="signin-password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      required
                      disabled={isLoading}
                      autoComplete="current-password"
                      className={errors.password ? 'border-destructive pr-10' : 'pr-10'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password}</p>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Entrando...' : 'Entrar'}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Nome Completo</Label>
                  <Input
                    id="signup-name"
                    name="fullName"
                    type="text"
                    placeholder="Seu nome completo"
                    required
                    disabled={isLoading}
                    autoComplete="name"
                    className={errors.fullName ? 'border-destructive' : ''}
                  />
                  {errors.fullName && (
                    <p className="text-sm text-destructive">{errors.fullName}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    name="email"
                    type="email"
                    placeholder="seu@email.com"
                    required
                    disabled={isLoading}
                    autoComplete="email"
                    className={errors.email ? 'border-destructive' : ''}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Senha</Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      disabled={isLoading}
                      autoComplete="new-password"
                      className={errors.password ? 'border-destructive pr-10' : 'pr-10'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Mínimo de 6 caracteres
                  </p>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Criando conta...' : 'Criar Conta'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
