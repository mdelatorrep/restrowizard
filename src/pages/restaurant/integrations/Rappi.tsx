import { useEffect, useRef, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useRappiIntegration, useRappiOrders, useRappiSettlements, useRappiMenuSyncByStore } from "@/hooks/useRappiIntegration";
import { CheckCircle2, AlertCircle, Loader2, RefreshCw, Power, PauseCircle, PlayCircle, Circle, Copy, ExternalLink, XCircle } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

type StoreSyncState = { status: "idle" | "syncing" | "success" | "error"; progress: number; itemsSynced?: number; error?: string; at?: string };

export default function RappiIntegrationPage() {
  const { integration, isLoading, save, test, syncMenu, storeControl, orderAction } = useRappiIntegration();
  const orders = useRappiOrders();
  const settlements = useRappiSettlements();

  const [form, setForm] = useState({
    client_id: integration?.client_id ?? "",
    client_secret: "",
    store_ids: integration?.store_ids?.join(", ") ?? "",
    environment: (integration?.environment as "sandbox" | "production") ?? "sandbox",
    webhook_secret: integration?.webhook_secret ?? "",
  });

  const [storeForm, setStoreForm] = useState({ store_id: integration?.store_ids?.[0] ?? "", status: "open", reason: "", pause_until: "" });

  const handleSave = () => {
    save.mutate({
      client_id: form.client_id,
      client_secret: form.client_secret,
      store_ids: form.store_ids.split(",").map(s => s.trim()).filter(Boolean),
      environment: form.environment,
      webhook_secret: form.webhook_secret || undefined,
      integration_id: integration?.id,
    });
  };

  const webhookUrl = integration
    ? `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.functions.supabase.co/rappi-webhook?integration_id=${integration.id}`
    : "—";

  const hasCreds = !!integration?.client_id;
  const hasStores = !!integration?.store_ids?.length;
  const tokenOk = !!integration?.token_expires_at && new Date(integration.token_expires_at) > new Date();
  const webhookConfigured = !!integration?.webhook_secret;
  const menuSynced = !!integration?.last_sync_at;

  const steps = [
    { key: "creds", title: "Ingresa Client ID y Client Secret", desc: "Obtenlos en el portal de aliado Rappi.", done: hasCreds },
    { key: "stores", title: "Configura tus Store IDs", desc: "Identificadores de cada tienda que opera con Rappi.", done: hasStores },
    { key: "test", title: "Prueba la conexión", desc: "Verifica que las credenciales obtengan un token válido.", done: tokenOk },
    { key: "webhook", title: "Copia la URL de webhook al portal Rappi", desc: "Pega esta URL en la configuración de webhooks de Rappi y guarda el secret HMAC.", done: webhookConfigured },
    { key: "menu", title: "Sincroniza tu menú", desc: "Publica tu catálogo en al menos una tienda.", done: menuSynced },
  ];
  const completed = steps.filter(s => s.done).length;

  const copyWebhook = async () => {
    if (!integration) return;
    await navigator.clipboard.writeText(webhookUrl);
    toast.success("URL copiada al portapapeles");
  };

  if (isLoading) return <div className="p-6 flex items-center gap-2"><Loader2 className="animate-spin" /> Cargando…</div>;

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold">Integración Rappi</h1>
          <p className="text-muted-foreground text-sm">Conecta tu cuenta de aliado Rappi para sincronizar menú, recibir pedidos y conciliar liquidaciones.</p>
        </div>
        {integration && (
          <Badge variant={integration.is_active ? "default" : "secondary"} className="gap-1">
            {integration.token_expires_at && new Date(integration.token_expires_at) > new Date()
              ? <><CheckCircle2 className="w-3 h-3" /> Conectado</>
              : <><AlertCircle className="w-3 h-3" /> Sin token</>}
          </Badge>
        )}
      </div>

      <Tabs defaultValue="connection" className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-5 w-full">
          <TabsTrigger value="connection">Conexión</TabsTrigger>
          <TabsTrigger value="menu" disabled={!integration}>Menú</TabsTrigger>
          <TabsTrigger value="store" disabled={!integration}>Tienda</TabsTrigger>
          <TabsTrigger value="orders" disabled={!integration}>Pedidos</TabsTrigger>
          <TabsTrigger value="settlements" disabled={!integration}>Conciliación</TabsTrigger>
        </TabsList>

        {/* CONEXIÓN */}
        <TabsContent value="connection" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <CardTitle>Checklist de configuración</CardTitle>
                  <CardDescription>Sigue estos pasos para dejar Rappi operativo.</CardDescription>
                </div>
                <Badge variant={completed === steps.length ? "default" : "secondary"}>
                  {completed}/{steps.length} completados
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {steps.map((s, i) => (
                <div key={s.key} className="flex items-start gap-3 p-3 border rounded-lg">
                  {s.done
                    ? <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    : <Circle className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />}
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium ${s.done ? "text-muted-foreground line-through" : ""}`}>
                      {i + 1}. {s.title}
                    </p>
                    <p className="text-xs text-muted-foreground">{s.desc}</p>
                    {s.key === "test" && integration && !s.done && (
                      <Button size="sm" variant="outline" className="mt-2" onClick={() => test.mutate(integration.id)} disabled={test.isPending}>
                        {test.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                        Probar conexión
                      </Button>
                    )}
                    {s.key === "webhook" && integration && (
                      <div className="mt-2 space-y-2">
                        <code className="block p-2 bg-muted rounded text-xs break-all">{webhookUrl}</code>
                        <div className="flex gap-2 flex-wrap">
                          <Button size="sm" variant="outline" onClick={copyWebhook}>
                            <Copy className="w-4 h-4 mr-2" /> Copiar URL
                          </Button>
                          <Button size="sm" variant="ghost" asChild>
                            <a href="https://dev-portal.rappi.com/es/" target="_blank" rel="noreferrer">
                              <ExternalLink className="w-4 h-4 mr-2" /> Abrir portal Rappi
                            </a>
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Credenciales</CardTitle>
              <CardDescription>Ingresa el Client ID y Client Secret provistos por Rappi en tu portal de aliado.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Client ID</Label>
                  <Input value={form.client_id} onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Client Secret</Label>
                  <Input type="password" placeholder={integration ? "•••••• (dejar vacío para mantener)" : ""} value={form.client_secret} onChange={e => setForm(f => ({ ...f, client_secret: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Store IDs (separados por coma)</Label>
                  <Input value={form.store_ids} onChange={e => setForm(f => ({ ...f, store_ids: e.target.value }))} placeholder="900123, 900124" />
                </div>
                <div className="space-y-2">
                  <Label>Ambiente</Label>
                  <Select value={form.environment} onValueChange={(v: any) => setForm(f => ({ ...f, environment: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sandbox">Sandbox</SelectItem>
                      <SelectItem value="production">Producción</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Webhook Secret (HMAC)</Label>
                  <Input value={form.webhook_secret} onChange={e => setForm(f => ({ ...f, webhook_secret: e.target.value }))} placeholder="Opcional — para validar firmas" />
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button onClick={handleSave} disabled={save.isPending}>
                  {save.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Guardar credenciales
                </Button>
                {integration && (
                  <Button variant="outline" onClick={() => test.mutate(integration.id)} disabled={test.isPending}>
                    {test.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                    Probar conexión
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {integration && (
            <Card>
              <CardHeader>
                <CardTitle>Webhook</CardTitle>
                <CardDescription>Configura esta URL en el portal Rappi para recibir eventos en tiempo real.</CardDescription>
              </CardHeader>
              <CardContent>
                <code className="block p-3 bg-muted rounded text-xs break-all">{webhookUrl}</code>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* MENÚ */}
        <TabsContent value="menu" className="space-y-4">
          <MenuSyncSection integration={integration} syncMenu={syncMenu} />
        </TabsContent>

        {/* TIENDA */}
        <TabsContent value="store" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Control de tienda</CardTitle>
              <CardDescription>Abre, cierra o pausa la recepción de pedidos.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Store ID</Label>
                  <Select value={storeForm.store_id} onValueChange={v => setStoreForm(f => ({ ...f, store_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecciona tienda" /></SelectTrigger>
                    <SelectContent>
                      {(integration?.store_ids ?? []).map(sid => <SelectItem key={sid} value={sid}>{sid}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Estado</Label>
                  <Select value={storeForm.status} onValueChange={v => setStoreForm(f => ({ ...f, status: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Abierta</SelectItem>
                      <SelectItem value="closed">Cerrada</SelectItem>
                      <SelectItem value="paused">Pausada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {storeForm.status === "paused" && (
                  <>
                    <div className="space-y-2">
                      <Label>Motivo</Label>
                      <Textarea value={storeForm.reason} onChange={e => setStoreForm(f => ({ ...f, reason: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Reanudar en</Label>
                      <Input type="datetime-local" value={storeForm.pause_until} onChange={e => setStoreForm(f => ({ ...f, pause_until: e.target.value }))} />
                    </div>
                  </>
                )}
              </div>
              <Button onClick={() => storeControl.mutate({
                integration_id: integration!.id,
                store_id: storeForm.store_id,
                status: storeForm.status,
                reason: storeForm.reason || undefined,
                pause_until: storeForm.pause_until ? new Date(storeForm.pause_until).toISOString() : undefined,
              })} disabled={!storeForm.store_id || storeControl.isPending}>
                {storeControl.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  : storeForm.status === "open" ? <PlayCircle className="w-4 h-4 mr-2" />
                  : storeForm.status === "closed" ? <Power className="w-4 h-4 mr-2" />
                  : <PauseCircle className="w-4 h-4 mr-2" />}
                Aplicar
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PEDIDOS */}
        <TabsContent value="orders" className="space-y-3">
          {orders.isLoading && <div className="flex items-center gap-2"><Loader2 className="animate-spin w-4 h-4" /> Cargando…</div>}
          {orders.data?.length === 0 && <p className="text-sm text-muted-foreground">No hay pedidos Rappi todavía.</p>}
          {orders.data?.map((o: any) => (
            <Card key={o.id}>
              <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge>#{o.external_order_id?.slice(-6)}</Badge>
                    <Badge variant="outline">{o.order_status}</Badge>
                  </div>
                  <p className="font-medium mt-1">{o.customer_name ?? "Cliente Rappi"}</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(o.created_at), "dd/MM HH:mm")} · ${Number(o.subtotal).toLocaleString()}</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {o.order_status === "pending" && (
                    <>
                      <Button size="sm" onClick={() => orderAction.mutate({ order_id: o.id, action: "accept" })}>Aceptar</Button>
                      <Button size="sm" variant="destructive" onClick={() => orderAction.mutate({ order_id: o.id, action: "reject", reason: "No disponible" })}>Rechazar</Button>
                    </>
                  )}
                  {o.order_status === "accepted" && (
                    <Button size="sm" onClick={() => orderAction.mutate({ order_id: o.id, action: "ready" })}>Marcar listo</Button>
                  )}
                  {o.order_status === "ready" && (
                    <Button size="sm" onClick={() => orderAction.mutate({ order_id: o.id, action: "delivered" })}>Entregado</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* CONCILIACIÓN */}
        <TabsContent value="settlements" className="space-y-3">
          <Card>
            <CardHeader>
              <CardTitle>Liquidaciones Rappi</CardTitle>
              <CardDescription>Últimos 90 días.</CardDescription>
            </CardHeader>
            <CardContent>
              {settlements.isLoading && <Loader2 className="animate-spin" />}
              {settlements.data?.length === 0 && <p className="text-sm text-muted-foreground">Sin liquidaciones registradas aún.</p>}
              <div className="space-y-2">
                {settlements.data?.map((s: any) => (
                  <div key={s.id} className="flex items-center justify-between border-b py-2 text-sm">
                    <span>{s.settlement_date} · Tienda {s.store_id}</span>
                    <div className="text-right">
                      <p className="font-medium">${Number(s.net_amount).toLocaleString()} {s.currency}</p>
                      <p className="text-xs text-muted-foreground">Bruto ${Number(s.gross_amount).toLocaleString()} · Comisión ${Number(s.commission_amount).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
