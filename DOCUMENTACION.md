# Documentación Técnica: Pichangas Arequipa ⚽

Plataforma web para organizar partidos de fútbol ("pichangas") y completar cupos disponibles en canchas sintéticas de Arequipa en tiempo real.

---

## 1. Stack Tecnológico

- **Framework Web & SSR:** [Astro](https://astro.build/) (`output: 'server'`)
- **UI Interactiva (Islas):** [React 19](https://react.dev/) (`@astrojs/react`)
- **Base de Datos (BaaS):** [Supabase](https://supabase.com/) (PostgreSQL + `@supabase/supabase-js`)
- **Lenguaje:** TypeScript (tipado estricto)
- **Adaptador de Despliegue:** [Vercel Serverless](https://vercel.com/) (`@astrojs/vercel`)

---

## 2. Estructura del Proyecto

```text
mi-proyecto-pichangas/
├── .env                                         # Variables de entorno de Supabase (ignorado en Git)
├── .gitignore                                   # Archivos excluidos del repositorio
├── astro.config.mjs                             # Configuración SSR, React y adaptador Vercel
├── package.json                                 # Dependencias y scripts
└── src/
    ├── lib/
    │   └── supabase.ts                          # Instancia única del cliente de Supabase
    ├── types/
    │   └── database.ts                          # Interfaces TypeScript (BD y Payloads API)
    ├── pages/
    │   ├── index.astro                          # Página principal y layout base
    │   └── api/                                 # Endpoints Serverless (Backend)
    │       ├── canchas.ts                       # GET /api/canchas
    │       └── convocatorias/
    │           ├── index.ts                     # GET y POST /api/convocatorias
    │           └── [id]/
    │               └── unirse.ts                # POST /api/convocatorias/:id/unirse
    └── components/                              # Componentes interactivos en React
        ├── AppPichangas.tsx                     # Orquestador de estado entre formulario y listado
        ├── FormNuevaConvocatoria.tsx            # Formulario para publicar una pichanga
        └── ListaConvocatorias.tsx               # Tablero con filtro por distrito y modal para unirse
```

---

## 3. Modelo de Datos (Supabase PostgreSQL)

El sistema utiliza tres tablas principales relacionadas en Supabase:

### 3.1. Tabla `canchas`
Almacena el directorio de complejos deportivos de Arequipa.
| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `id` | `BIGINT` (PK) | Identificador único autogenerado |
| `nombre` | `VARCHAR(100)` | Nombre del complejo deportivo |
| `distrito` | `VARCHAR(50)` | Distrito de Arequipa (ej. Paucarpata, Socabaya) |
| `direccion` | `TEXT` | Dirección física de referencia |
| `tipo_deporte` | `VARCHAR(30)` | Formato de cancha (ej. `Fútbol 6`, `Fútbol 7`) |
| `telefono_contacto` | `VARCHAR(20)` | Teléfono de reservas del local |
| `tarifa_hora` | `NUMERIC(6,2)` | Precio de alquiler por hora en soles (`S/`) |
| `created_at` | `TIMESTAMPTZ` | Fecha de registro |

### 3.2. Tabla `convocatorias`
Registra los partidos abiertos que buscan jugadores.
| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `id` | `BIGINT` (PK) | Identificador del partido |
| `cancha_id` | `BIGINT` (FK) | Referencia a `canchas(id)` (`ON DELETE CASCADE`) |
| `fecha` | `DATE` | Fecha del partido (`YYYY-MM-DD`) |
| `hora_inicio` | `TIME` | Hora de inicio (`HH:mm:ss`) |
| `cupos_totales` | `INT` | Cantidad de jugadores faltantes requeridos (`> 0`) |
| `cupos_confirmados` | `INT` | Jugadores ya inscritos (`<= cupos_totales`) |
| `organizador_nombre` | `VARCHAR(60)` | Nombre o apodo de quien organiza |
| `organizador_telefono`| `VARCHAR(20)` | Número de WhatsApp del organizador |
| `estado` | `VARCHAR(20)` | `'abierta'`, `'completa'` o `'cancelada'` |
| `created_at` | `TIMESTAMPTZ` | Fecha de creación |

### 3.3. Tabla `jugadores`
Registra a cada jugador que se inscribe en una convocatoria.
| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `id` | `BIGINT` (PK) | Identificador del jugador inscrito |
| `convocatoria_id` | `BIGINT` (FK) | Referencia a `convocatorias(id)` (`ON DELETE CASCADE`) |
| `nombre` | `VARCHAR(60)` | Nombre o apodo del jugador |
| `telefono` | `VARCHAR(20)` | Teléfono de contacto |
| `posicion` | `VARCHAR(30)` | Posición preferida (`Volante`, `Delantero`, `Defensa`, `Arquero`) |
| `created_at` | `TIMESTAMPTZ` | Fecha de inscripción |

---

## 4. Documentación de API Routes (Backend)

### 4.1. `GET /api/canchas`
Obtiene todas las canchas ordenadas alfabéticamente por nombre.
- **Archivo:** `src/pages/api/canchas.ts`
- **Respuesta Exitosa (`200 OK`):** `Cancha[]`

### 4.2. `GET /api/convocatorias`
Lista todas las convocatorias con `estado = 'abierta'` incluyendo los datos de la cancha asociada (`JOIN`), ordenadas por fecha y hora de inicio.
- **Archivo:** `src/pages/api/convocatorias/index.ts`
- **Query Params opcionales:** `?distrito=Paucarpata`
- **Respuesta Exitosa (`200 OK`):** `ConvocatoriaConCancha[]`

### 4.3. `POST /api/convocatorias`
Crea una nueva convocatoria de partido con `cupos_confirmados: 0` y `estado: 'abierta'`.
- **Archivo:** `src/pages/api/convocatorias/index.ts`
- **Body (`CrearConvocatoriaPayload`):**
  ```json
  {
    "cancha_id": 1,
    "fecha": "2026-11-15",
    "hora_inicio": "20:00",
    "cupos_totales": 3,
    "organizador_nombre": "Rodrigo",
    "organizador_telefono": "953713569"
  }
  ```
- **Respuestas:**
  - `201 Created`: Objeto `Convocatoria` creado.
  - `400 Bad Request`: Campos obligatorios faltantes o JSON inválido.

### 4.4. `POST /api/convocatorias/[id]/unirse`
Inscribe a un jugador en una convocatoria abierta e incrementa los cupos confirmados. Si con la inscripción se alcanza `cupos_totales`, cambia automáticamente el estado de la convocatoria a `'completa'`.
- **Archivo:** `src/pages/api/convocatorias/[id]/unirse.ts`
- **Body (`UnirseConvocatoriaPayload`):**
  ```json
  {
    "nombre": "Carlos",
    "telefono": "987654321",
    "posicion": "Delantero"
  }
  ```
- **Respuestas:**
  - `200 OK`: `{ message, cupos_restantes, estado }`
  - `404 Not Found`: Convocatoria inexistente.
  - `409 Conflict`: La convocatoria ya está completa o cerrada.

---

## 5. Arquitectura de Componentes (Frontend)

1. **`AppPichangas.tsx`**:
   - Componente raíz hidratado en `src/pages/index.astro` mediante la directiva `client:load`.
   - Mantiene el estado `refreshKey` para sincronizar automáticamente la lista de partidos cada vez que se publica una nueva convocatoria sin recargar la página.

2. **`FormNuevaConvocatoria.tsx`**:
   - Al montarse, consulta `GET /api/canchas` para poblar el selector de complejos deportivos con su tarifa por hora.
   - Envía el formulario a `POST /api/convocatorias`, muestra alertas de éxito/error y dispara el callback `onConvocatoriaCreada()`.

3. **`ListaConvocatorias.tsx`**:
   - Consulta `GET /api/convocatorias` al cargar, al cambiar el filtro de distrito o cuando cambia `refreshTrigger`.
   - Renderiza tarjetas con distrito, cupos libres restantes, fecha, hora, enlace directo al WhatsApp del organizador (`https://wa.me/...`) y botón para sumarse.
   - Gestiona el modal interactivo de inscripción que envía los datos del jugador a `POST /api/convocatorias/:id/unirse`.

---

## 6. Configuración y Ejecución Local

### 6.1. Variables de Entorno (`.env`)
En la raíz de `mi-proyecto-pichangas/.env`:
```env
PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
PUBLIC_SUPABASE_ANON_KEY=tu_clave_publica_anon
```

### 6.2. Comandos Disponibles
Ejecutar dentro de la carpeta `mi-proyecto-pichangas/`:

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo (http://localhost:4321)
npm run dev

# Compilar para producción
npm run build

# Previsualizar build de producción localmente
npm run preview
```

---

## 7. Despliegue en Vercel

1. Subir el proyecto a un repositorio en GitHub (verificando que `.env` esté excluido por `.gitignore`).
2. Importar el repositorio en [Vercel](https://vercel.com/new).
3. En la sección **Environment Variables** de Vercel, agregar:
   - `PUBLIC_SUPABASE_URL`
   - `PUBLIC_SUPABASE_ANON_KEY`
4. Hacer clic en **Deploy** (el adaptador `@astrojs/vercel` configurará automáticamente las funciones serverless para `/api/*`).

