import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { ServiceOrdersTable } from '@/components/ServiceOrdersTable';

const ServiceOrders = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Ordens de Serviço</h2>
          <p className="text-muted-foreground mt-1">Gerencie todas as OS do sistema</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nova OS
        </Button>
      </div>
      <ServiceOrdersTable />
    </div>
  );
};

export default ServiceOrders;
