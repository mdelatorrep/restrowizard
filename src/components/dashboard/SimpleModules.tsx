import { mockData } from './mockData';

export const InventoryModule = () => {
  const getStatusColor = (status: string) => {
    if (status === 'critico') return 'bg-destructive';
    if (status === 'bajo') return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="bg-card p-6 rounded-xl shadow-md">
      <h3 className="text-lg font-lato-bold text-foreground mb-4">Gestión de Inventario</h3>
      <div className="space-y-4">
        {mockData.inventory.map(item => (
          <div key={item.name}>
            <div className="flex justify-between items-center mb-1">
              <span className="font-lato-bold">{item.name}</span>
              <span className="text-sm text-muted-foreground font-lato-light">{item.stock} / {item.reorderPoint * 2}</span>
            </div>
            <div className="w-full bg-muted rounded-full h-4">
              <div
                className={`h-4 rounded-full ${getStatusColor(item.status)}`}
                style={{ width: `${(item.stock / (item.reorderPoint * 2)) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const ShiftsModule = () => (
  <div className="bg-card p-6 rounded-xl shadow-md overflow-x-auto">
    <h3 className="text-lg font-lato-bold text-foreground mb-4">Optimización de Turnos Semanales</h3>
    <table className="w-full text-sm text-left text-muted-foreground">
      <thead className="text-xs text-foreground uppercase bg-muted">
        <tr>
          <th scope="col" className="px-6 py-3">Rol</th>
          {Object.keys(mockData.shifts).map(day =>
            <th key={day} scope="col" className="px-6 py-3">{day}</th>
          )}
        </tr>
      </thead>
      <tbody>
        {['Cocinero', 'Mesero', 'Barista'].map(role => (
          <tr key={role} className="bg-background border-b">
            <th scope="row" className="px-6 py-4 font-lato-bold text-foreground whitespace-nowrap">{role}</th>
            {Object.values(mockData.shifts).map((shift: any, i) =>
              <td key={i} className="px-6 py-4 font-lato-light">{shift[role]}</td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export const TrainingModule = () => (
  <div className="bg-card p-6 rounded-xl shadow-md">
    <h3 className="text-lg font-lato-bold text-foreground mb-4">Formación (RestroLearn)</h3>
    <div className="space-y-4">
      {mockData.training.map(item => (
        <div key={item.course}>
          <div className="flex justify-between items-center mb-1">
            <span className="font-lato-bold">{item.course} - <span className="text-muted-foreground font-lato-light">{item.employee}</span></span>
            <span className="text-sm font-lato-bold text-primary">{item.progress}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2.5">
            <div className="bg-primary h-2.5 rounded-full" style={{ width: `${item.progress}%` }} />
          </div>
        </div>
      ))}
    </div>
  </div>
);
