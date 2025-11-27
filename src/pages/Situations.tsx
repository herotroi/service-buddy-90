import { SituationsTable } from '@/components/SituationsTable';
import { SituacaoInformaticaTable } from '@/components/SituacaoInformaticaTable';
import { SectorTabs } from '@/components/SectorTabs';
import { useSector } from '@/hooks/useSector';

const Situations = () => {
  const { sector } = useSector();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Situações do Serviço</h2>
          <p className="text-muted-foreground mt-1">
            Status das OS - {sector === 'celulares' ? 'Celulares' : 'Informática'}
          </p>
        </div>
        <SectorTabs />
      </div>
      
      {sector === 'celulares' ? <SituationsTable /> : <SituacaoInformaticaTable />}
    </div>
  );
};

export default Situations;
