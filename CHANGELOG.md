# Cambios

Formato: [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/). Versionado semántico.

## [0.9.0] — 2026-11-14

### Agregado
- Alta guiada: del registro a sitio, carta y reservas publicados en cuatro pasos (C-07).
- Cajeros entran al POS con PIN sin correo propio; la auditoría guarda su nombre (C-05).
- Domicilio desde el sitio con pago contraentrega (C-09).
- Inscripción al programa de fidelidad desde el sitio, con autorización de datos (C-14).
- Alertas diarias de ventas e inventario, por correo y en el panel (C-10).
- Chequeo de salud `GET /functions/v1/health` (B-13).
- Integración continua en GitHub Actions (B-10).

### Cambiado
- Portada, /about y metadatos sin promesas que el producto no cumple (C-01).
- Ecosistema, módulos huérfanos y Rappi apagados con interruptores (C-02 a C-04).
- La base se reconstruye desde el repositorio: línea base, crons y seed separados (B-04).
- Canonical y Open Graph con restrowizard.co (B-18).
- npm como único gestor; Node 22 (B-12).

### Seguridad
- Accesos anónimos cerrados, lealtad pública cerrada, límite de intentos de PIN (B-01, B-02, B-08, B-33).
- Llaves privadas de pasarelas cifradas en Vault (B-07).
- Límite de pedidos web y Rappi activo solo con secreto de webhook (B-14).
- Content-Security-Policy y bloqueo de incrustación (B-15).
- Topes de IA en el copiloto (B-25).
- Dependencias de producción sin hallazgos críticos (B-16, parcial).
