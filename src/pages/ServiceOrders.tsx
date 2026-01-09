import { ServiceOrdersTable } from '@/components/ServiceOrdersTable';
import { ServiceOrdersInformaticaTable } from '@/components/ServiceOrdersInformaticaTable';
import { SectorTabs } from '@/components/SectorTabs';
import { useSector } from '@/hooks/useSector';

const ServiceOrders = () => {
  const { sector } = useSector();

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground truncate">Ordens de Serviço</h2>
            <p className="text-sm text-muted-foreground mt-0.5 sm:mt-1">
              Gerencie as OS - {sector === 'celulares' ? 'Celulares' : 'Informática'}
            </p>
          </div>
          <SectorTabs />
        </div>
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
