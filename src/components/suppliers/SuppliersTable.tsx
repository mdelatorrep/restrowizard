import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Phone, Mail, MapPin, Star, Edit, Trash2 } from 'lucide-react';
import { InventorySupplier } from '@/hooks/useEnterpriseInventory';
import { getSupplierCategory } from './supplierCategories';

interface Props {
  suppliers: InventorySupplier[];
  onEdit: (supplier: InventorySupplier) => void;
  onDelete: (id: string) => void;
}

const renderStars = (rating: number | null) => {
  const stars = Math.round(rating || 0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={`h-3 w-3 ${i <= stars ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
      ))}
    </div>
  );
};

export function SuppliersTable({ suppliers, onEdit, onDelete }: Props) {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Proveedor</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Términos</TableHead>
              <TableHead>Entrega</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {suppliers.map(supplier => (
              <TableRow key={supplier.id} className={!supplier.is_active ? 'opacity-60' : ''}>
                <TableCell>
                  <div>
                    <p className="font-medium">{supplier.supplier_name}</p>
                    {supplier.city && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" />{supplier.city}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell><Badge variant="secondary">{getSupplierCategory(supplier)}</Badge></TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {supplier.contact_name && <p className="text-sm">{supplier.contact_name}</p>}
                    {supplier.phone && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Phone className="w-3 h-3" />{supplier.phone}
                      </p>
                    )}
                    {supplier.email && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Mail className="w-3 h-3" />{supplier.email}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {supplier.payment_terms ? (
                    <Badge variant="outline">{supplier.payment_terms.replace('_', ' ')}</Badge>
                  ) : <span className="text-muted-foreground">-</span>}
                </TableCell>
                <TableCell><span>{supplier.lead_time_days} días</span></TableCell>
                <TableCell>{renderStars(supplier.rating)}</TableCell>
                <TableCell>
                  <Badge variant={supplier.is_active ? 'default' : 'secondary'}>
                    {supplier.is_active ? 'Activo' : 'Inactivo'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => onEdit(supplier)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost" size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => { if (confirm('¿Eliminar este proveedor?')) onDelete(supplier.id); }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
