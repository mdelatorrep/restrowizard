#!/usr/bin/env python3
"""Genera docs/referencia/edge-functions.md y docs/referencia/logica-en-base.md
desde el código (B-24, B-30). Correr tras cambiar funciones o migraciones:
    python3 scripts/gen-reference-docs.py
"""
import re, pathlib, collections, datetime

ROOT = pathlib.Path(__file__).resolve().parent.parent
FN = ROOT / "supabase" / "functions"
MIG = sorted((ROOT / "supabase" / "migrations").glob("*.sql"))
OUT = ROOT / "docs" / "referencia"
OUT.mkdir(parents=True, exist_ok=True)
today = datetime.date.today().isoformat()

# --- Edge functions ---------------------------------------------------------
cfg = (ROOT / "supabase" / "config.toml").read_text()
verify = dict(re.findall(r'\[functions\.([\w-]+)\]\s*\nverify_jwt\s*=\s*(true|false)', cfg))
rows = []
for d in sorted(p for p in FN.iterdir() if p.is_dir() and not p.name.startswith("_")):
    src = "\n".join(f.read_text(errors="ignore") for f in d.rglob("*.ts"))
    if "requireCron" in src: auth = "Secreto de cron"
    elif re.search(r"getUser\(|requireAuth|requireUser", src): auth = "Sesión de usuario"
    elif "x-rappi-signature" in src.lower() or "hmac" in src.lower(): auth = "Firma HMAC"
    else: auth = "Pública"
    ai = "Sí" if re.search(r"ai-gateway|ai-sdk-gateway|LOVABLE_API_KEY|streamText|generateText", src) else ""
    tables = sorted(set(re.findall(r'\.from\(["\'](\w+)["\']\)', src)))
    first = next((l.strip("/ ").strip() for l in src.splitlines() if l.strip().startswith("//")), "")
    rows.append((d.name, auth, verify.get(d.name, "true (por defecto)"), ai, ", ".join(tables[:6]) + (" …" if len(tables) > 6 else ""), first[:110]))
md = [f"# Funciones edge\n\nGenerado por `scripts/gen-reference-docs.py` el {today}. No editar a mano.\n",
      f"{len(rows)} funciones en `supabase/functions/`. *Autenticación* es lo que exige el código; `verify_jwt` es la configuración de `supabase/config.toml` (la llave pública pasa `verify_jwt`, así que no cuenta como autenticación).\n",
      "| Función | Autenticación | verify_jwt | IA | Tablas que toca | Descripción |", "| --- | --- | --- | --- | --- | --- |"]
md += [f"| `{r[0]}` | {r[1]} | {r[2]} | {r[3]} | {r[4]} | {r[5]} |" for r in rows]
(OUT / "edge-functions.md").write_text("\n".join(md) + "\n")

# --- Lógica en la base ------------------------------------------------------
sql = "\n".join(p.read_text() for p in MIG)
funcs = {}
for m in re.finditer(r"CREATE OR REPLACE FUNCTION public\.(\w+)\((.*?)\)\s*\n?\s*RETURNS (.*?)\n(.*?)AS \$(\w*)\$", sql, re.S):
    name, args, ret, attrs = m.group(1), m.group(2), m.group(3).strip(), m.group(4)
    funcs[name] = ("SECURITY DEFINER" in attrs, ret.split()[0] if ret else "")
trigs = re.findall(r"CREATE TRIGGER (\w+) (BEFORE|AFTER|INSTEAD OF) (.*?) ON public\.(\w+) .*?EXECUTE FUNCTION public\.(\w+)\(", sql)
DOMAINS = [("POS y caja", r"^pos_|cash|tip|order|kitchen|table"), ("Inventario y recetas", r"inventor|recipe|supplier|purchase|stock"),
           ("Finanzas", r"financ|expense|payable|invoice|settlement|account|bank"), ("Fidelización y feedback", r"loyal|feedback|review|campaign"),
           ("Equipo y permisos", r"team|role|permission|staff|shift|owner_ids|module_access"), ("Sitio, menú y reservas", r"website|menu|reserv|delivery"),
           ("Rappi y agregadores", r"rappi|aggregat"), ("Demo", r"demo"), ("Auditoría y registros", r"audit|log|debug|notification|alert"),
           ("IA y conocimiento", r"knowledge|copilot|ai_|embedding|match_")]
def domain(name):
    for d, rx in DOMAINS:
        if re.search(rx, name): return d
    return "Otros"
by_dom = collections.defaultdict(list)
for t in trigs:
    by_dom[domain(t[3] + " " + t[4])].append(t)
md = [f"# Lógica que vive en la base\n\nGenerado por `scripts/gen-reference-docs.py` el {today} desde `supabase/migrations/`. No editar a mano.\n",
      f"{len(funcs)} funciones en `public` ({sum(1 for v in funcs.values() if v[0])} SECURITY DEFINER) y {len(trigs)} triggers. "
      "Varias reglas de negocio que mueven dinero (inventario por venta, propinas, puntos de lealtad, auditoría inmutable del POS) se ejecutan aquí y no en el código de la app; "
      "cualquier cambio en ellas va por migración y con prueba en `supabase/tests/sql/`. El criterio de qué va en la base y qué en la app está en [ADR-0001](../adr/0001-logica-en-base.md).\n"]
for d, _ in DOMAINS + [("Otros", "")]:
    items = by_dom.get(d)
    if not items: continue
    md.append(f"\n## {d}\n\n| Tabla | Trigger | Momento | Evento | Función | SECURITY DEFINER |\n| --- | --- | --- | --- | --- | --- |")
    for name, when, ev, tbl, fn in sorted(items, key=lambda x: (x[3], x[0])):
        sd = "Sí" if funcs.get(fn, (False,))[0] else ""
        md.append(f"| {tbl} | {name} | {when} | {ev.replace(' OR ', ' / ')} | `{fn}` | {sd} |")
md.append("\n## Funciones invocables (RPC)\n\nFunciones que no son de trigger, por dominio.\n")
trig_fns = {t[4] for t in trigs}
rpc = collections.defaultdict(list)
for n, (sd, ret) in sorted(funcs.items()):
    if n in trig_fns or ret == "trigger": continue
    rpc[domain(n)].append((n, sd, ret))
for d, _ in DOMAINS + [("Otros", "")]:
    if d in rpc:
        md.append(f"- **{d}:** " + ", ".join(f"`{n}`{' (SD)' if sd else ''}" for n, sd, ret in rpc[d]))
(OUT / "logica-en-base.md").write_text("\n".join(md) + "\n")
print(f"edge-functions.md: {len(rows)} funciones · logica-en-base.md: {len(funcs)} funciones, {len(trigs)} triggers")
