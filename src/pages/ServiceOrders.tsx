import { ServiceOrdersTable } from '@/components/ServiceOrdersTable';
import { ServiceOrdersInformaticaTable } from '@/components/ServiceOrdersInformaticaTable';
import { SectorTabs } from '@/components/SectorTabs';
import { useSector } from '@/hooks/useSector';

const ServiceOrders = () => {
  const { sector } = useSector();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Ordens de Serviço</h2>
          <p className="text-muted-foreground mt-1">
            Gerencie todas as OS do setor de {sector === 'celulares' ? 'Celulares' : 'Informática'}
          </p>
        </div>
        <SectorTabs />
      </div>
      
      {sector === 'celulares' ? (
        <ServiceOrdersTable />
      ) : (
        <ServiceOrdersInformaticaTable />
      )}
    </div>
  );
};

export default ServiceOrders;
