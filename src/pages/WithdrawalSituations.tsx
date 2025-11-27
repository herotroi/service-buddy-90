import { WithdrawalSituationsTable } from '@/components/WithdrawalSituationsTable';
import { RetiradaInformaticaTable } from '@/components/RetiradaInformaticaTable';
import { SectorTabs } from '@/components/SectorTabs';
import { useSector } from '@/hooks/useSector';

const WithdrawalSituations = () => {
  const { sector } = useSector();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Situações de Retirada</h2>
          <p className="text-muted-foreground mt-1">
            Status de retirada - {sector === 'celulares' ? 'Celulares' : 'Informática'}
          </p>
        </div>
        <SectorTabs />
      </div>
      
      {sector === 'celulares' ? <WithdrawalSituationsTable /> : <RetiradaInformaticaTable />}
    </div>
  );
};

export default WithdrawalSituations;
