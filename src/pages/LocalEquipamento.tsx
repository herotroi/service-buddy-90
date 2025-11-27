import { LocalEquipamentoTable } from '@/components/LocalEquipamentoTable';

const LocalEquipamento = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Local do Equipamento</h2>
        <p className="text-muted-foreground mt-1">
          Gerencie os locais onde os equipamentos ficam armazenados (Informática)
        </p>
      </div>
      <LocalEquipamentoTable />
    </div>
  );
};

export default LocalEquipamento;
