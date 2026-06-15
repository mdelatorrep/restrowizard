import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { usePOSContext } from "@/hooks/usePOSContext";
import { usePOSLiveMap } from "@/hooks/usePOSLiveMap";
import { usePOSSession } from "@/hooks/usePOSSession";
import { usePOSMenu } from "@/hooks/usePOSMenu";
import { usePOSOrder } from "@/hooks/usePOSOrder";
import { POSShell } from "@/components/pos-standalone/POSShell";
import { TableMap } from "@/components/pos-standalone/TableMap";
import { MenuCatalog } from "@/components/pos-standalone/MenuCatalog";
import { OrderPanel } from "@/components/pos-standalone/OrderPanel";
import { OpenSessionDialog } from "@/components/pos/OpenSessionDialog";
import { CloseSessionDialog } from "@/components/pos/CloseSessionDialog";
import { Button } from "@/components/ui/button";
import { ArrowLeft, LogOut, Power, Loader2, Wifi, WifiOff, X } from "lucide-react";
import type { RestaurantTable } from "@/hooks/usePOSTables";
import { useToast } from "@/hooks/use-toast";

export default function POSMain() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { context, loading: ctxLoading, error: ctxError } = usePOSContext(slug);
  const { currentSession, hasOpenSession, openSession, closeSession, loading: sessionLoading } =
    usePOSSession();
  const { tables, zones, orders, loading: mapLoading } = usePOSLiveMap(context?.restaurantUserId);

  const [authChecking, setAuthChecking] = useState(true);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [openDlg, setOpenDlg] = useState(false);
  const [closeDlg, setCloseDlg] = useState(false);
  const [online, setOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);

  // Auth + membership check
  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      if (!data.session) {
        navigate(`/${slug}/pos/login`, { replace: true });
        return;
      }
      if (context) {
        const uid = data.session.user.id;
        if (uid !== context.restaurantUserId) {
          const { data: staffMatch } = await supabase
            .from("staff_members")
            .select("id, pos_role")
            .eq("linked_user_id", uid)
            .eq("user_id", context.restaurantUserId)
            .maybeSingle();
          if (!staffMatch) {
            toast({
              title: "Acceso denegado",
              description: "No perteneces a este restaurante.",
              variant: "destructive",
            });
            await supabase.auth.signOut();
            navigate(`/${slug}/pos/login`, { replace: true });
            return;
          }
        }
        setAuthChecking(false);
      }
    };
    if (context) check();
    return () => {
      cancelled = true;
    };
  }, [context, slug, navigate, toast]);

  // Online/offline
  useEffect(() => {
    const onOn = () => setOnline(true);
    const onOff = () => setOnline(false);
    window.addEventListener("online", onOn);
    window.addEventListener("offline", onOff);
    return () => {
      window.removeEventListener("online", onOn);
      window.removeEventListener("offline", onOff);
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate(`/${slug}/pos/login`, { replace: true });
  };

  if (ctxLoading || authChecking || sessionLoading) {
    return (
      <div className="min-h-screen w-full bg-zinc-950 text-zinc-100 grid place-items-center">
        <Loader2 className="h-10 w-10 animate-spin opacity-60" />
      </div>
    );
  }

  if (ctxError === "not_found" || !context) {
    return (
      <div className="min-h-screen w-full bg-zinc-950 text-zinc-100 grid place-items-center p-6 text-center">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Restaurante no encontrado</h1>
          <p className="text-zinc-400">Revisa la URL e inténtalo de nuevo.</p>
        </div>
      </div>
    );
  }

  const selectedTable: RestaurantTable | null =
    tables.find((t) => t.id === selectedTableId) || null;

  const header = (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-3 min-w-0">
        {context.brand.logo_url ? (
          <img
            src={context.brand.logo_url}
            alt={context.restaurantName}
            className="h-8 w-8 object-contain"
          />
        ) : (
          <div className="h-8 w-8 rounded bg-zinc-800" />
        )}
        <div className="min-w-0">
          <div className="text-sm font-medium truncate">{context.restaurantName}</div>
          <div className="text-[10px] uppercase tracking-wider text-zinc-500">
            Portal de Ventas
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div
          className={`hidden sm:flex items-center gap-1 px-2 py-1 rounded-full text-[10px] ${
            online
              ? "bg-emerald-500/15 text-emerald-300"
              : "bg-red-500/20 text-red-300"
          }`}
        >
          {online ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
          {online ? "En línea" : "Sin conexión"}
        </div>
        {hasOpenSession ? (
          <Button
            size="sm"
            variant="ghost"
            className="text-zinc-300 hover:text-zinc-100"
            onClick={() => setCloseDlg(true)}
          >
            <Power className="h-4 w-4 mr-1" /> Cerrar caja
          </Button>
        ) : (
          <Button
            size="sm"
            className="bg-[var(--pos-accent)] text-zinc-900 hover:opacity-90"
            onClick={() => setOpenDlg(true)}
          >
            <Power className="h-4 w-4 mr-1" /> Abrir caja
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          className="text-zinc-400 hover:text-zinc-100"
          onClick={() => navigate("/r/dashboard")}
          title="Ir al portal admin"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="text-zinc-400 hover:text-zinc-100"
          onClick={handleLogout}
          title="Salir"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <POSShell context={context} header={header}>
      {!hasOpenSession ? (
        <div className="flex-1 grid place-items-center p-6">
          <div className="max-w-md text-center">
            <h2 className="text-2xl font-semibold mb-2">No hay caja abierta</h2>
            <p className="text-zinc-400 mb-6">
              Abre tu turno para empezar a tomar comandas y registrar ventas.
            </p>
            <Button
              size="lg"
              className="bg-[var(--pos-accent)] text-zinc-900 hover:opacity-90"
              onClick={() => setOpenDlg(true)}
            >
              <Power className="h-5 w-5 mr-2" /> Abrir caja
            </Button>
          </div>
        </div>
      ) : mapLoading ? (
        <div className="flex-1 grid place-items-center">
          <Loader2 className="h-8 w-8 animate-spin opacity-60" />
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          <div className={`${selectedTableId ? "hidden xl:block xl:w-[280px] shrink-0" : "flex-1 min-w-0"} border-r border-zinc-800/80 overflow-hidden`}>
            <TableMap
              tables={tables}
              zones={zones}
              orders={orders}
              selectedTableId={selectedTableId}
              onSelectTable={(t) => setSelectedTableId(t.id)}
            />
          </div>

          {selectedTableId && selectedTable && (
            <>
              <div className="flex-1 min-w-0 border-r border-zinc-800/80 flex flex-col">
                <div className="px-3 py-2 flex items-center justify-between border-b border-zinc-800/80 bg-zinc-950">
                  <div className="text-xs text-zinc-400">
                    Mesa <span className="text-zinc-100 font-semibold">{selectedTable.table_number}</span> · catálogo
                  </div>
                  <button
                    onClick={() => setSelectedTableId(null)}
                    className="text-zinc-500 hover:text-zinc-100 p-1 xl:hidden"
                    aria-label="Volver al mapa"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex-1 overflow-hidden">
                  <MenuCatalogWrapper
                    restaurantUserId={context.restaurantUserId}
                    tableId={selectedTable.id}
                  />
                </div>
              </div>
              <aside className="w-full sm:max-w-sm shrink-0 bg-zinc-900/40 hidden md:block">
                <OrderPanel
                  table={selectedTable}
                  restaurantUserId={context.restaurantUserId}
                  waiterName={null}
                  allTables={tables}
                  activeOrders={orders}
                />
              </aside>
            </>
          )}
        </div>
      )}

      <OpenSessionDialog
        open={openDlg}
        onOpenChange={setOpenDlg}
        onOpen={async (name, amount) => {
          await openSession(name, amount);
          setOpenDlg(false);
        }}
      />
      <CloseSessionDialog
        open={closeDlg}
        onOpenChange={setCloseDlg}
        session={currentSession}
        onClose={async (closingCash, notes) => {
          await closeSession(closingCash, notes);
          setCloseDlg(false);
        }}
      />
    </POSShell>
  );
}
