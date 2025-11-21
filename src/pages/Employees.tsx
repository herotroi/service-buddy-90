import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

const Employees = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Funcionários</h2>
          <p className="text-muted-foreground mt-1">Gerencie técnicos e atendentes</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Novo Funcionário
        </Button>
      </div>

      <div className="flex items-center justify-center h-[400px] rounded-lg border-2 border-dashed bg-muted/10">
        <div className="text-center space-y-2">
          <h3 className="text-xl font-semibold">Módulo em Desenvolvimento</h3>
          <p className="text-muted-foreground">
            Cadastro e gestão de funcionários será implementado em breve
          </p>
        </div>
      </div>
    </div>
  );
};

export default Employees;
