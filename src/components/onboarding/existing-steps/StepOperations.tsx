import { DollarSign } from 'lucide-react';
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RevenueRange } from '../existingBusinessHelpers';

interface Props {
  values: { employee_count: string; monthly_revenue_range: string };
  revenueRanges: RevenueRange[];
  onChange: (field: string, value: string) => void;
}

export function StepOperations({ values, revenueRanges, onChange }: Props) {
  return (
    <>
      <CardHeader className="text-center">
        <div className="w-16 h-16 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
          <DollarSign className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-2xl font-headline">Último paso: Tu operación</CardTitle>
        <CardDescription className="font-lato-light">
          Opcional: nos ayuda a darte mejores recomendaciones
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="employee_count">Número de empleados</Label>
          <Select
            value={values.employee_count}
            onValueChange={(value) => onChange('employee_count', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un rango" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">1-5</SelectItem>
              <SelectItem value="15">6-15</SelectItem>
              <SelectItem value="30">16-30</SelectItem>
              <SelectItem value="50">31-50</SelectItem>
              <SelectItem value="100">51-100</SelectItem>
              <SelectItem value="200">100+</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="monthly_revenue_range">Rango de ventas mensuales</Label>
          <Select
            value={values.monthly_revenue_range}
            onValueChange={(value) => onChange('monthly_revenue_range', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un rango" />
            </SelectTrigger>
            <SelectContent>
              {revenueRanges.map((range) => (
                <SelectItem key={range.value} value={range.value}>
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </>
  );
}
