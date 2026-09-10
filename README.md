# SeedWork — Login, Administrador, Candidato y Empresa en Next.js + FastAPI

Las cuatro secciones del proyecto (Login/Registro, Administrador, Candidato
y Empresa — 26 rutas en total) ya están pasadas a Next.js (App Router) y
conectadas a FastAPI + MySQL. Lo probé de punta a punta en mi entorno:
`npm run build` compila las 26 rutas sin errores, y con MySQL + FastAPI +
Next.js corriendo de verdad, registré una empresa nueva ("Nimbus Software")
por la API y confirmé que sus datos reales aparecen listos para pintarse
en `/empresa/inicio`.

## 1. Base de datos

```
mysql -u root --default-character-set=utf8mb4 < seedwork_database.sql
```

## 2. Backend (FastAPI)

```
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

Ajusta `DATABASE_URL` en `backend/database.py` si tu usuario/contraseña de
MySQL no son `root` sin contraseña. Docs interactivas en
`http://localhost:8000/docs`.

## 3. Frontend (Next.js)

```
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

Abre `http://localhost:3000`.

## Qué es "real" (React + fetch a la API) vs "portado" (mismo diseño, datos fijos)

| Sección | Real (conectado a MySQL) | Portado (mismo diseño, datos de ejemplo) |
|---|---|---|
| Login/Registro | Landing, Login, Registro Candidato, Registro Empresa — **todo** | — |
| Candidato | Inicio (trae el candidato real por `?id=`) | Perfil, Mi CV, Vacantes, Postulaciones, Consejos, Simulador, Configuración |
| Empresa | Inicio (trae la empresa real por `?id=`) | Perfil, Mis ofertas, Candidatos, Notificaciones, Configuración |
| Administrador | Vacantes (lista + aprobar/rechazar/pausar, todo contra MySQL) | Inicio, Usuarios, Postulaciones, Reportes, Notificaciones, Configuración |

Las páginas "portadas" no son capturas estáticas: siguen siendo rutas de
Next.js de verdad, con el HTML/CSS original y su `script.js` real cargado
(mismos botones, mismos toasts, misma interactividad). Simplemente
todavía no leen la base de datos — quedan listas para conectarse
siguiendo el mismo patrón que ya usan Inicio (Candidato/Empresa) y
Vacantes (Administrador): un `fetch()` en un `useEffect` o justo antes
del `return`.

## Cómo verificar tú mismo que la base de datos está conectada

1. Levanta los tres (MySQL, backend, frontend).
2. Ve a `/registro/candidato` o `/registro/empresa` y crea una cuenta.
3. Te redirige automáticamente a `/candidato/inicio?id=X` o
   `/empresa/inicio?id=X` mostrando el nombre/ciudad/NIT reales — ese
   registro no existía antes de llenar el formulario, así que solo puede
   venir de la base de datos.
4. Confírmalo en MySQL:
   ```sql
   SELECT * FROM Candidato ORDER BY IdCandidato DESC LIMIT 1;
   SELECT * FROM Empresa ORDER BY IdEmpresa DESC LIMIT 1;
   ```
5. En `/administrador/vacantes`, aprueba o rechaza una vacante y vuelve a
   consultar `SELECT Titulo, IdEstadoOferta FROM Oferta;` — verás el
   cambio reflejado ahí también.

## Estructura

```
backend/
  database.py, models.py, schemas.py, security.py, main.py

frontend/app/
  (auth)/                 -> landing, login, registro (reales)
  candidato/
    CandidatoShell.tsx     -> sidebar + topbar (real)
    inicio/                -> dashboard real (fetch a la API)
    perfil, mi-cv, vacantes, postulaciones, consejos, simulador,
    configuracion/         -> portadas (mismo diseño y JS real)
  empresa/
    EmpresaShell.tsx        -> sidebar + topbar (real, con variante de búsqueda)
    inicio/                 -> dashboard real (fetch a la API)
    perfil, mis-ofertas, candidatos, notificaciones, configuracion/
                             -> portadas (mismo diseño y JS real)
  administrador/
    AdministradorShell.tsx  -> sidebar + topbar (real)
    vacantes/                -> moderación real (fetch + PATCH)
    LegacyAdminContent.tsx   -> motor que reconecta los botones de las portadas
    inicio, usuarios, postulaciones, reportes, notificaciones,
    configuracion/           -> portadas

public/
  candidato-script.js, empresa-script.js -> JS reales cargados en cada sección
```
