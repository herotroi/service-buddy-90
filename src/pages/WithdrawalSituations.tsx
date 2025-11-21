import { WithdrawalSituationsTable } from '@/components/WithdrawalSituationsTable';

const WithdrawalSituations = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Situações de Retirada</h2>
        <p className="text-muted-foreground mt-1">Gerencie os status de retirada dos aparelhos</p>
      </div>
      <WithdrawalSituationsTable />
    </div>
  );
};

export default WithdrawalSituations;
