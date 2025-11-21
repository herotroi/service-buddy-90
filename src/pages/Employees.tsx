import { EmployeesTable } from '@/components/EmployeesTable';

const Employees = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Funcionários</h2>
        <p className="text-muted-foreground mt-1">Gerencie técnicos e atendentes do sistema</p>
      </div>
      <EmployeesTable />
    </div>
  );
};

export default Employees;
