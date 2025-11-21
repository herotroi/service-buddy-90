import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { LogOut, Plus, Settings } from 'lucide-react';
import { ServiceOrdersTable } from '@/components/ServiceOrdersTable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Dashboard = () => {
  const { signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('orders');

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary rounded-lg">
                <Settings className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Assistência Técnica</h1>
                <p className="text-sm text-muted-foreground">Sistema de Gestão de OS</p>
              </div>
            </div>
            <Button onClick={signOut} variant="outline" size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="orders">Ordens de Serviço</TabsTrigger>
            <TabsTrigger value="employees">Funcionários</TabsTrigger>
            <TabsTrigger value="situations">Situações</TabsTrigger>
            <TabsTrigger value="withdrawal">Retirada</TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Ordens de Serviço</h2>
                <p className="text-muted-foreground">Gerencie todas as OS do sistema</p>
              </div>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova OS
              </Button>
            </div>
            <ServiceOrdersTable />
          </TabsContent>

          <TabsContent value="employees">
            <div className="text-center py-12">
              <h3 className="text-lg font-semibold mb-2">Módulo de Funcionários</h3>
              <p className="text-muted-foreground">Em desenvolvimento...</p>
            </div>
          </TabsContent>

          <TabsContent value="situations">
            <div className="text-center py-12">
              <h3 className="text-lg font-semibold mb-2">Módulo de Situações</h3>
              <p className="text-muted-foreground">Em desenvolvimento...</p>
            </div>
          </TabsContent>

          <TabsContent value="withdrawal">
            <div className="text-center py-12">
              <h3 className="text-lg font-semibold mb-2">Módulo de Situações de Retirada</h3>
              <p className="text-muted-foreground">Em desenvolvimento...</p>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;
