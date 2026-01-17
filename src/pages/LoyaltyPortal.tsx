import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Crown, 
  Search, 
  Star, 
  Gift, 
  Coins, 
  ChevronRight,
  Store,
  Loader2,
  Mail,
  Phone,
  Sparkles
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface LoyaltyProgram {
  id: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  current_points: number;
  lifetime_points: number;
  total_spent: number;
  total_orders: number;
  loyalty_code: string;
  restaurant_name: string | null;
  user_id: string;
  tier: {
    id: string;
    name: string;
    color: string;
    min_points: number;
  } | null;
}

const LoyaltyPortal = () => {
  const navigate = useNavigate();
  const [searchType, setSearchType] = useState<'email' | 'phone'>('email');
  const [searchValue, setSearchValue] = useState('');
  const [programs, setPrograms] = useState<LoyaltyProgram[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchValue.trim()) return;

    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      const column = searchType === 'email' ? 'customer_email' : 'customer_phone';
      
      const { data, error: queryError } = await supabase
        .from('loyalty_customers')
        .select(`
          id,
          customer_name,
          customer_email,
          customer_phone,
          current_points,
          lifetime_points,
          total_spent,
          total_orders,
          loyalty_code,
          restaurant_name,
          user_id,
          tier:loyalty_tiers(id, name, color, min_points)
        `)
        .eq(column, searchValue.trim().toLowerCase())
        .eq('is_active', true);

      if (queryError) throw queryError;

      if (data) {
        setPrograms(data.map(p => ({
          ...p,
          total_spent: Number(p.total_spent),
          tier: p.tier as LoyaltyProgram['tier']
        })));
      }
    } catch (err) {
      console.error('Error searching loyalty programs:', err);
      setError('Error al buscar. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const goToProgram = (loyaltyCode: string) => {
    navigate(`/mi-fidelidad/${loyaltyCode}`);
  };

  const totalPoints = programs.reduce((sum, p) => sum + p.current_points, 0);
  const totalOrders = programs.reduce((sum, p) => sum + p.total_orders, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-6 pb-16">
        <div className="max-w-lg mx-auto text-center">
          <Crown className="w-12 h-12 mx-auto mb-3 opacity-90" />
          <h1 className="text-2xl font-bold mb-1">Mis Programas de Fidelidad</h1>
          <p className="opacity-80">Encuentra todos tus puntos y recompensas</p>
        </div>
      </div>

      {/* Search Card */}
      <div className="max-w-lg mx-auto px-4 -mt-10 pb-8">
        <Card className="shadow-lg mb-6">
          <CardContent className="p-6">
            <Tabs value={searchType} onValueChange={(v) => setSearchType(v as 'email' | 'phone')}>
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email
                </TabsTrigger>
                <TabsTrigger value="phone" className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Teléfono
                </TabsTrigger>
              </TabsList>

              <form onSubmit={handleSearch}>
                <div className="flex gap-2">
                  <Input
                    type={searchType === 'email' ? 'email' : 'tel'}
                    placeholder={searchType === 'email' ? 'tu@email.com' : '+52 555 123 4567'}
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="submit" disabled={loading || !searchValue.trim()}>
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </form>
            </Tabs>

            {error && (
              <p className="text-sm text-destructive mt-3">{error}</p>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        {searched && !loading && (
          <>
            {programs.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h2 className="text-lg font-semibold mb-2">No encontramos programas</h2>
                  <p className="text-muted-foreground text-sm">
                    No hay programas de fidelidad asociados a este {searchType === 'email' ? 'correo' : 'teléfono'}.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {/* Summary */}
                <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Programas activos</p>
                        <p className="text-2xl font-bold">{programs.length}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Puntos totales</p>
                        <p className="text-2xl font-bold text-primary">{totalPoints.toLocaleString()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <p className="text-sm text-muted-foreground px-1">
                  <Sparkles className="w-4 h-4 inline mr-1" />
                  Cada programa es independiente. Los puntos no se acumulan entre restaurantes.
                </p>

                {/* Program List */}
                {programs.map((program) => (
                  <Card 
                    key={program.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => goToProgram(program.loyalty_code)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        {/* Restaurant Icon */}
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <Store className="w-6 h-6 text-primary" />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold truncate">
                              {program.restaurant_name || 'Restaurante'}
                            </h3>
                            {program.tier && (
                              <Badge 
                                className="text-white text-xs shrink-0"
                                style={{ backgroundColor: program.tier.color }}
                              >
                                {program.tier.name}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Coins className="w-4 h-4 text-yellow-500" />
                              {program.current_points.toLocaleString()} pts
                            </span>
                            <span className="flex items-center gap-1">
                              <Gift className="w-4 h-4 text-primary" />
                              {program.total_orders} órdenes
                            </span>
                          </div>
                        </div>

                        {/* Arrow */}
                        <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {/* Initial state */}
        {!searched && (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Crown className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-lg font-semibold mb-2">Busca tus programas</h2>
              <p className="text-muted-foreground text-sm">
                Ingresa tu email o teléfono para ver todos tus programas de fidelidad en diferentes restaurantes.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default LoyaltyPortal;
