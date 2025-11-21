import { SituationsTable } from '@/components/SituationsTable';

const Situations = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Situações do Serviço</h2>
        <p className="text-muted-foreground mt-1">Gerencie os status e cores das ordens de serviço</p>
      </div>
      <SituationsTable />
    </div>
  );
};

export default Situations;
