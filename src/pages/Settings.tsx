import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

const Settings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [fullName, setFullName] = useState('');
  const [osStartNumber, setOsStartNumber] = useState('1');

  // Fetch user profile
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .maybeSingle();
      
      if (error) throw error;
      if (data) {
        setFullName(data.full_name || '');
      }
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch system settings
  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['system-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('key', 'os_starting_number')
        .maybeSingle();
      
      if (error) throw error;
      if (data) {
        setOsStartNumber(data.value);
      }
      return data;
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (newFullName: string) => {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: newFullName })
        .eq('id', user?.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast({
        title: 'Sucesso',
        description: 'Perfil atualizado com sucesso!',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar perfil: ' + error.message,
        variant: 'destructive',
      });
    },
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (startNumber: string) => {
      const numValue = parseInt(startNumber, 10);
      if (isNaN(numValue) || numValue < 1) {
        throw new Error('Número inicial deve ser maior que 0');
      }

      const { error } = await supabase
        .from('system_settings')
        .upsert({ 
          key: 'os_starting_number', 
          value: startNumber 
        }, {
          onConflict: 'key'
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
      toast({
        title: 'Sucesso',
        description: 'Configurações atualizadas com sucesso!',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar configurações: ' + error.message,
        variant: 'destructive',
      });
    },
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(fullName);
  };

  const handleSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettingsMutation.mutate(osStartNumber);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Configurações</h2>
        <p className="text-muted-foreground mt-1">Gerencie suas preferências e configurações do sistema</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          <TabsTrigger value="system">Sistema</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informações do Perfil</CardTitle>
              <CardDescription>Atualize suas informações pessoais</CardDescription>
            </CardHeader>
            <CardContent>
              {profileLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <form onSubmit={handleProfileSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">
                      O email não pode ser alterado
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fullName">Nome Completo</Label>
                    <Input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Seu nome completo"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    disabled={updateProfileMutation.isPending}
                    className="w-full sm:w-auto"
                  >
                    {updateProfileMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      'Salvar Alterações'
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações do Sistema</CardTitle>
              <CardDescription>Configure o comportamento do sistema</CardDescription>
            </CardHeader>
            <CardContent>
              {settingsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <form onSubmit={handleSettingsSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="osStartNumber">Número Inicial das OS</Label>
                    <Input
                      id="osStartNumber"
                      type="number"
                      min="1"
                      value={osStartNumber}
                      onChange={(e) => setOsStartNumber(e.target.value)}
                      placeholder="1"
                    />
                    <p className="text-xs text-muted-foreground">
                      Define a partir de qual número as novas ordens de serviço serão criadas. O valor padrão é 1.
                    </p>
                  </div>

                  <Button 
                    type="submit" 
                    disabled={updateSettingsMutation.isPending}
                    className="w-full sm:w-auto"
                  >
                    {updateSettingsMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      'Salvar Configurações'
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
