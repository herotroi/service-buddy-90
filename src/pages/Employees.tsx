import { EmployeesTable } from '@/components/EmployeesTable';
import { SectorTabs } from '@/components/SectorTabs';

const Employees = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Funcionários</h2>
          <p className="text-muted-foreground mt-1">Gerencie técnicos e atendentes (compartilhado)</p>
        </div>
        <SectorTabs />
      </div>
      <EmployeesTable />
    </div>
  );
};

export default Employees;
