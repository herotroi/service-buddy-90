import { ServiceOrdersTable } from '@/components/ServiceOrdersTable';

const ServiceOrders = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Ordens de Serviço</h2>
        <p className="text-muted-foreground mt-1">Gerencie todas as OS do sistema</p>
      </div>
      <ServiceOrdersTable />
    </div>
  );
};

export default ServiceOrders;
