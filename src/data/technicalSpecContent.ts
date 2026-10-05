export interface SpecSection {
  id: string;
  title: string;
  summary: string;
  contentMarkdown: string;
}

export const TECHNICAL_SPEC_SECTIONS: SpecSection[] = [
  {
    id: 'resumen-alcance',
    title: '1. Resumen Ejecutivo y Alcance',
    summary: 'Visión general, objetivos del negocio, alcance multiplataforma y usuarios del ecosistema Kinetix.',
    contentMarkdown: `### 1.1 Objetivo del Proyecto
El objetivo del proyecto **Kinetix Functional Zone Mobile Platform** es proporcionar una solución integral de software que digitalice y automatice el ciclo de vida del atleta funcional, desde su alta en el gimnasio, control de membresías con suspensión automática, hasta el seguimiento longitudinal de su composición corporal y desempeño atlético de fuerza y resistencia cardiovascular.

### 1.2 Alcance del Sistema
* **Aplicación Móvil para Atletas (iOS & Android):**
  - Autenticación segura y perfil deportivo individual.
  - Registro mensual autónomo de métricas de composición corporal (peso, % músculo, % grasa, grasa visceral e IMC dinámico).
  - Consulta de evaluaciones físicas realizadas por entrenadores certificados (Test de Cooper, 1RM de sentadillas, peso muerto, hip thrust, press horizontal, dominadas/remo).
  - Visualización interactiva de gráficas de evolución mensual y comparador antes/después.
  - Monitoreo del estado de membresía, alertas de vencimiento y notificaciones push de cobro.
  - Almacenamiento local seguro para consulta rápida en modo offline.
* **Módulo Web/Tablet para Staff y Entrenadores:**
  - Creación y enrolamiento de atletas vía correo electrónico institucional.
  - Formulario de captura rápida para evaluaciones físicas periódicas en la zona de entrenamiento.
  - Calculadora automática de VO2Max (Cooper) y estimación 1RM (Brzycki).
  - Gestión del ciclo de vida de membresías (renovaciones, excepciones y auditoría de pagos).
* **Backend y Motor de Automatización:**
  - API RESTful escalable con arquitectura de microservicios o monolito modular.
  - Cron jobs nocturnos para detección de impagos y suspensión automática de accesos.
  - Servicio de colas para notificaciones push (FCM / APNs).

### 1.3 Perfiles de Usuario (Actores del Sistema)
1. **Atleta (Usuario Final):** Consulta su progreso, registra mediciones antropométricas mensuales y administra su membresía.
2. **Coach / Staff Físico:** Realiza pruebas de esfuerzo y fuerza, evalúa técnica, registra resultados y da de alta atletas.
3. **Administrador de Sede:** Configura planes tarifarios, audita pagos, gestiona permisos y exporta reportes consolidados.`
  },
  {
    id: 'arquitectura-stack',
    title: '2. Arquitectura de Software y Stack',
    summary: 'Diagrama conceptual, tecnologías seleccionadas para frontend móvil, backend, base de datos y DevOps.',
    contentMarkdown: `### 2.1 Diagrama de Arquitectura Global

\`\`\`
       +-------------------------------------------------------+
       |                  CLIENTES MÓVILES                     |
       |  iOS (Swift / Expo)       Android (Kotlin / Expo)     |
       |  [Local SQLite Cache]     [WatermelonDB Sync Engine]  |
       +---------------------------+---------------------------+
                                   | HTTPS / TLS 1.3 (JWT)
                                   v
       +-------------------------------------------------------+
       |               API GATEWAY / LOAD BALANCER             |
       |               (Cloudflare / AWS ALB + WAF)            |
       +---------------------------+---------------------------+
                                   |
                     +-------------+-------------+
                     |                           |
                     v                           v
       +---------------------------+   +---------------------------+
       |   REST API BACKEND        |   |   WORKER ENGINE / CRON    |
       |   Node.js (NestJS / TS)   |   |   Node.js BullMQ Worker   |
       |   * Auth & RBAC Service   |   |   * Suspensión membresías |
       |   * Body Comp Service     |   |   * Envío Notificaciones  |
       |   * Physical Test Engine  |   |   * Backups automatizados |
       |   * Membership Engine     |   |                           |
       +-------------+-------------+   +-------------+-------------+
                     |                               |
                     +---------------+---------------+
                                     |
                                     v
       +-------------------------------------------------------+
       |             CAPA DE PERSISTENCIA Y CACHÉ              |
       |  PostgreSQL 16 (Relational Core + TimescaleDB Metrics)|
       |  Redis 7 (Sesiones, Rate Limiting, Colas BullMQ)      |
       |  AWS S3 / Google Cloud Storage (Reportes PDF cifrados)|
       +-------------------------------------------------------+
\`\`\`

### 2.2 Stack Tecnológico Recomendado

| Capa | Tecnología | Justificación Técnica |
| :--- | :--- | :--- |
| **Mobile App (Cross-Platform)** | **React Native + Expo SDK 51** / TypeScript | Código único para iOS y Android con rendimiento nativo de 60fps, soporte robusto para sensores, cámara y notificaciones push. |
| **Estilos & UI Mobile** | **Tailwind CSS / NativeWind** | Consistencia visual, sistema de diseño estandarizado y diseño táctil adaptativo a pantallas iPhone y Pixel. |
| **Base de Datos Local** | **WatermelonDB / SQLite (SQLCipher)** | Cifrado en reposo en el dispositivo del usuario con capacidad offline-first y sincronización delta eficiente. |
| **Backend API** | **Node.js con NestJS (TypeScript)** | Arquitectura limpia basada en módulos, inyección de dependencias, validaciones automáticas con class-validator y documentación Swagger OpenAPI nativa. |
| **Base de Datos Principal** | **PostgreSQL 16 + TimescaleDB** | Alta integridad relacional para membresías y pagos, con particionamiento eficiente de series temporales de mediciones físicas. |
| **Caché y Mensajería** | **Redis 7 Cluster** | Manejo de colas para recordatorios push masivos y almacenamiento en memoria de tokens de sesión con expiración. |
| **Notificaciones Push** | **Firebase Cloud Messaging (FCM) + APNs** | Entrega confiable de notificaciones push en segundo plano para ambas plataformas con alta tasa de recepción. |
| **Contenedores & Hosting** | **Docker + AWS ECS Fargate / Cloud Run** | Escalabilidad automática sin servidor, aislamiento de procesos y despliegue continuo sin tiempo de inactividad (zero-downtime). |`
  },
  {
    id: 'base-de-datos',
    title: '3. Diseño de Base de Datos y Esquemas',
    summary: 'Diagrama Entidad-Relación (ERD), esquemas DDL SQL en PostgreSQL con índices y constraints de integridad.',
    contentMarkdown: `### 3.1 Modelo Entidad-Relación (ERD)

El modelo relacional garantiza integridad referencial estricta, trazabilidad de auditoría mediante timestamps y particionamiento lógico para series temporales de métricas biométricas:

\`\`\`sql
-- EXTENSIONES NECESARIAS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. TABLA DE USUARIOS Y AUTENTICACIÓN
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('athlete', 'staff', 'admin')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABLA DE PERFILES DE ATLETA / STAFF
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(30),
    avatar_url TEXT,
    birth_date DATE NOT NULL,
    gender VARCHAR(10) NOT NULL CHECK (gender IN ('male', 'female')),
    height_cm NUMERIC(5,2) NOT NULL,
    preferred_weight_unit VARCHAR(5) DEFAULT 'kg' CHECK (preferred_weight_unit IN ('kg', 'lbs')),
    emergency_contact_name VARCHAR(150),
    emergency_contact_phone VARCHAR(30),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. SEGUIMIENTO MENSUAL DE COMPOSICIÓN CORPORAL
CREATE TABLE body_composition_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recorded_at DATE NOT NULL,
    weight_kg NUMERIC(5,2) NOT NULL CHECK (weight_kg > 20 AND weight_kg < 350),
    muscle_mass_percent NUMERIC(4,2) NOT NULL CHECK (muscle_mass_percent >= 5 AND muscle_mass_percent <= 80),
    body_fat_percent NUMERIC(4,2) NOT NULL CHECK (body_fat_percent >= 3 AND body_fat_percent <= 70),
    visceral_fat_level INT NOT NULL CHECK (visceral_fat_level >= 1 AND visceral_fat_level <= 59),
    bmi NUMERIC(4,1) NOT NULL,
    bmi_category VARCHAR(30) NOT NULL,
    notes TEXT,
    recorded_by_role VARCHAR(20) NOT NULL CHECK (recorded_by_role IN ('athlete', 'staff')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ÍNDICE COMPUESTO PARA HISTORIAL Y TENDENCIAS
CREATE INDEX idx_body_comp_user_date ON body_composition_logs(user_id, recorded_at DESC);

-- 4. EVALUACIONES FÍSICAS PERIÓDICAS (STAFF)
CREATE TABLE physical_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    coach_id UUID NOT NULL REFERENCES users(id),
    evaluation_date DATE NOT NULL,
    cooper_distance_meters INT NOT NULL CHECK (cooper_distance_meters > 0 AND cooper_distance_meters < 5000),
    cooper_vo2max NUMERIC(5,2) NOT NULL,
    cooper_rating VARCHAR(30) NOT NULL,
    endurance_test_name VARCHAR(100),
    endurance_test_result VARCHAR(100),
    coach_general_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_eval_user_date ON physical_evaluations(user_id, evaluation_date DESC);

-- 5. REGISTROS DE FUERZA MÁXIMA (1RM)
CREATE TABLE strength_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evaluation_id UUID NOT NULL REFERENCES physical_evaluations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exercise_id VARCHAR(50) NOT NULL CHECK (exercise_id IN ('squats', 'deadlift', 'hip_thrust', 'horizontal_press', 'pullups_or_rows')),
    weight_lifted_kg NUMERIC(6,2) NOT NULL,
    reps_completed INT NOT NULL CHECK (reps_completed >= 1),
    estimated_1rm_kg NUMERIC(6,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_strength_user_exercise ON strength_records(user_id, exercise_id, created_at DESC);

-- 6. GESTIÓN DE PLANES Y MEMBRESÍAS
CREATE TABLE membership_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    monthly_fee NUMERIC(8,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    billing_interval_months INT DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE user_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES membership_plans(id),
    status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'expiring_soon', 'expired', 'suspended')),
    start_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    grace_period_days INT DEFAULT 5,
    last_payment_date DATE,
    auto_renew BOOLEAN DEFAULT FALSE,
    reminder_sent_at TIMESTAMPTZ,
    suspended_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_membership_status_expiry ON user_memberships(status, expiry_date);
\`\`\``
  },
  {
    id: 'api-rest-specs',
    title: '4. Especificación de Endpoints API REST',
    summary: 'Contratos OpenAPI para Auth, Composición Corporal, Evaluaciones de Fuerza, Membresías y Notificaciones.',
    contentMarkdown: `### 4.1 Principios de la API
* Formato estándar JSON con cabeceras \`Content-Type: application/json\` y \`Accept: application/json\`.
* Autenticación Bearer Token: \`Authorization: Bearer <JWT_ACCESS_TOKEN>\`.
* Códigos de respuesta HTTP semánticos (200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 422 Unprocessable Entity).
* Manejo de errores normalizado bajo el estándar **RFC 7807 (Problem Details for HTTP APIs)**.

---

### 4.2 Catálogo Principal de Endpoints

#### 1. Autenticación y Cuentas
* **POST /api/v1/auth/login**
  - **Acceso:** Público.
  - **Request Payload:**
    \`\`\`json
    {
      "email": "juan.perez@kinetix.com",
      "password": "PasswordSeguro2024!"
    }
    \`\`\`
  - **Response (200 OK):**
    \`\`\`json
    {
      "accessToken": "eyJhbGciOiJSUzI1NiIsIn...",
      "refreshToken": "d8f34a1b-...",
      "expiresIn": 900,
      "user": {
        "id": "user-001",
        "name": "Juan Pérez",
        "role": "athlete"
      }
    }
    \`\`\`

* **POST /api/v1/staff/users (Creación de Cuenta por Staff)**
  - **Acceso:** Requiere rol \`staff\` o \`admin\`.
  - **Request Payload:**
    \`\`\`json
    {
      "email": "nuevo.atleta@kinetix.com",
      "firstName": "Carlos",
      "lastName": "Mendoza",
      "birthDate": "1995-08-10",
      "gender": "male",
      "heightCm": 178,
      "planId": "plan-functional-full"
    }
    \`\`\`
  - **Comportamiento:** Genera un token de bienvenida temporal y envía un correo con el enlace para establecer su contraseña y descargar la app.

---

#### 2. Composición Corporal
* **GET /api/v1/users/:userId/body-composition**
  - **Acceso:** El propio atleta o staff.
  - **Query Params:** \`?startDate=2024-01-01&endDate=2024-04-01&limit=12\`
  - **Response (200 OK):** Colección ordenada de registros mensuales con pesos, porcentajes y cálculos de IMC.

* **POST /api/v1/users/:userId/body-composition**
  - **Acceso:** Atleta o staff.
  - **Request Payload:**
    \`\`\`json
    {
      "recordedAt": "2024-04-15",
      "weightKg": 74.8,
      "muscleMassPercent": 45.2,
      "bodyFatPercent": 11.8,
      "visceralFatLevel": 3,
      "notes": "Pesaje matutino en ayunas con bioimpedancia."
    }
    \`\`\`
  - **Response (201 Created):** Retorna el registro persistido con el IMC calculado automáticamente por el servidor (\`22.1\`) y la categoría de la OMS (\`Normal\`).

---

#### 3. Evaluaciones Físicas y Fuerza (Staff)
* **POST /api/v1/staff/evaluations**
  - **Acceso:** Solo Staff (\`coach\` / \`admin\`).
  - **Request Payload:**
    \`\`\`json
    {
      "userId": "user-001",
      "evaluationDate": "2024-03-20",
      "cooperDistanceMeters": 2800,
      "enduranceTest": {
        "name": "Remo Concept2 2000m",
        "result": "7:14 min"
      },
      "strengthRecords": [
        { "exerciseId": "squats", "weightKg": 120, "reps": 1 },
        { "exerciseId": "deadlift", "weightKg": 140, "reps": 1 },
        { "exerciseId": "hip_thrust", "weightKg": 150, "reps": 1 },
        { "exerciseId": "horizontal_press", "weightKg": 90, "reps": 1 },
        { "exerciseId": "pullups_or_rows", "weightKg": 85, "reps": 14 }
      ],
      "coachNotes": "+5kg de ganancia neta en fuerza máxima este mes."
    }
    \`\`\`
  - **Response (201 Created):** Retorna el resumen evaluativo con VO2Max estimado (\`51.3 ml/kg/min\`), rating de Cooper (\`Excelente\`) y 1RM calculado para cada ejercicio.

---

#### 4. Membresías, Cobros y Suspensión Automática
* **GET /api/v1/users/:userId/membership**
  - **Response (200 OK):**
    \`\`\`json
    {
      "status": "expiring_soon",
      "planName": "Membresía Functional Full",
      "expiryDate": "2024-04-30",
      "daysUntilExpiry": 15,
      "monthlyFee": 89.99,
      "currency": "USD",
      "gracePeriodDays": 5,
      "paymentReminderSent": true
    }
    \`\`\`

* **POST /api/v1/cron/membership-suspension (Job Automático Nocturno)**
  - **Acceso:** Clave secreta de servicio / AWS CloudWatch Events.
  - **Comportamiento:**
    1. Busca membresías con \`expiry_date + grace_period_days < CURRENT_DATE\` y estado \`!= 'suspended'\`.
    2. Cambia su estado a \`suspended\`.
    3. Revoca tokens de acceso para torniquetes físicos y reservas de clases en la app.
    4. Envía notificación push de suspensión inmediata al atleta.`
  },
  {
    id: 'reglas-algoritmos',
    title: '5. Reglas de Negocio, Fórmulas y Algoritmos',
    summary: 'Fórmulas biométricas del IMC, Test de Cooper (VO2Max), cálculo de 1RM y motor de suspensión.',
    contentMarkdown: `### 5.1 Cálculo de Índice de Masa Corporal (IMC) y Clasificación OMS
El Índice de Masa Corporal es una métrica de tamizaje validada por la Organización Mundial de la Salud (OMS).

$$IMC = \\frac{\\text{Peso (kg)}}{[\\text{Estatura (m)}]^2}$$

**Criterios de Clasificación:**
* **IMC < 18.5:** Bajo Peso
* **18.5 ≤ IMC < 25.0:** Peso Normal (Saludable)
* **25.0 ≤ IMC < 30.0:** Sobrepeso (Pre-obesidad)
* **30.0 ≤ IMC < 35.0:** Obesidad Grado I
* **35.0 ≤ IMC < 40.0:** Obesidad Grado II
* **IMC ≥ 40.0:** Obesidad Grado III (Mórbida)

*Nota Clínica:* En atletas de fuerza de Kinetix Functional Zone con alta masa muscular (p. ej. >40%), el IMC puede sugerir sobrepeso técnico; por ello, la app siempre presenta el IMC cruzado con el porcentaje de masa muscular y grasa corporal para un diagnóstico fidedigno.

---

### 5.2 Test de Cooper (12 Minutos) — Modelo Basado en Niveles (Staff & Atleta)
A solicitud de la dirección técnica de Kinetix Functional Zone, **el Test de Cooper se simplifica para la experiencia del atleta**: el staff evalúa el desempeño en pista o cinta durante 12 minutos y **asigna directamente el Nivel Alcanzado (Nivel 1 al 5)**. Este nivel es la métrica principal que se le presenta al atleta en su app móvil, acompañada de su significado funcional y recomendación de entrenamiento:

| Nivel | Denominación Oficial | Baremos de Referencia | Diagnóstico y Recomendación de Entrenamiento |
| :---: | :--- | :---: | :--- |
| **Nivel 1** | **Inicial / Adaptación** | $< 1,800\\text{ m}$ | Fase de acondicionamiento básico. Priorizar intervalos aeróbicos en Zona 2 (60-70% FCM) de 25 a 35 min. |
| **Nivel 2** | **Básico / Desarrollo** | $1,800 - 2,199\\text{ m}$ | Base funcional establecida. Tolerancia al esfuerzo continuo; incorporar series tempo de 400m con descansos activos. |
| **Nivel 3** | **Intermedio / Óptimo** | $2,200 - 2,499\\text{ m}$ | Nivel óptimo para el entrenamiento funcional continuo de alta intensidad (WODs, circuitos y HIIT). |
| **Nivel 4** | **Avanzado / Alta Resistencia**| $2,500 - 2,799\\text{ m}$ | Excelente potencia aeróbica y rápida recuperación neuromuscular entre series de levantamientos pesados. |
| **Nivel 5** | **Excelente / Élite Kinetix** | $\\ge 2,800\\text{ m}$ | Capacidad cardiorrespiratoria sobresaliente. Paso constante inferior a 4:17/km. Atleta con perfil competitivo. |

---

### 5.3 Cálculo de Fuerza Máxima Teórica (1RM) y Ratio de Fuerza Relativa
Para proteger la integridad del atleta en el box funcional sin exigir levantamientos al fallo extremo de 1 repetición pura, el entrenador puede registrar cargas submáximas (de 1 a 10 repeticiones) y el sistema aplica la **Ecuación de Brzycki**:

$$1RM = \\frac{\\text{Carga Levantada (kg)}}{1.0278 - (0.0278 \\times \\text{Repeticiones})}$$

**Mejora Kinetix — Ratio de Fuerza Relativa:**
$$\\text{Ratio} = \\frac{1RM \\, (kg)}{\\text{Peso Corporal del Atleta } (kg)}$$
* **Ratio < 1.0x:** Nivel Bronce (Funcional Base)
* **1.0x ≤ Ratio < 1.5x:** Nivel Plata (Fuerza Adaptativa)
* **1.5x ≤ Ratio < 2.0x:** Nivel Oro (Fuerza Avanzada)
* **Ratio ≥ 2.0x:** Nivel Titanio (Élite Kinetix)

---

### 5.4 Identidad Visual y Paleta Cromática Oficial de Kinetix Functional Zone
La identidad gráfica oficial de Kinetix Functional Zone transmite alto rendimiento funcional, potencia y precisión:
* **Color Primario (Azul Kinetix):** \`#0055FF\` / \`#2563EB\` — Botones de acción principales, tabs activas, gráficas de masa muscular y acentos de navegación.
* **Color Secundario (Rojo Kinetix):** \`#FF1E27\` / \`#DC2626\` — Indicadores de alta intensidad, alertas de vencimiento, perfiles de Staff/Coach y curvas de grasa corporal.
* **Fondo Dominante (Carbon Dark):** \`#0A0A0A\` / \`#121212\` — Fondo oscuro mate industrial de alto contraste que reduce la fatiga visual en el gimnasio.
* **Tipografía:** \`Syne\` (display deportivo para títulos y niveles) + \`Plus Jakarta Sans\` (cuerpo ergonómico) + \`JetBrains Mono\` (cifras tabulares de peso y 1RM).

---

### 5.5 Máquina de Estados y Regla de Suspensión de Membresías

\`\`\`
   [ ACTIVA ] 
       | (Faltan ≤ 7 días para fecha de corte)
       v
[ PRÓXIMA A VENCER (expiring_soon) ] 
       | ---> Notificación en la misma página / app: Recordatorio de Pago ($89.99)
       | (Fecha de vencimiento alcanzada sin pago)
       v
  [ EN GRACIA ] (Días 1 a 5 de tolerancia reglamentaria)
       | (Día 6 sin pago a las 00:01 AM)
       v
  [ SUSPENDIDA ] ---> Bloqueo automático de acceso y aviso prioritario en pantalla
\`\`\`

---

### 5.6 Arquitectura de Plataforma Web Kinetix & Sistema de Pagos por Colores
El sistema está diseñado como una **Plataforma Web Oficial & Progresiva** para Kinetix Functional Zone:
1. **Acceso Universal Multiplataforma:** Disponible desde cualquier navegador web (móvil y escritorio) con sincronización en tiempo real.
2. **Sistema de Pagos Codificado por Colores:**
   - 🔵 **Código Azul:** Vencimiento el día 5 de cada mes.
   - 🔴 **Código Rojo:** Vencimiento el día 15 de cada mes.
   - 🌸 **Código Rosa:** Vencimiento el día 20 de cada mes.
   - 🟢 **Código Verde:** Vencimiento el día 30 de cada mes.
3. **Control Manual de Acceso para Entrenadores:** Pausa o reactivación instantánea de membresías con 1 solo clic por parte del Coach para control total del gimnasio.
4. **Notificaciones Directas en Plataforma (In-App):** El usuario recibe recordatorios de pago y avisos de resultados de pruebas directamente en la campana de notificaciones.
5. **Validación Visual de Membresías:** Credencial digital con código de color de corte y estado de cuenta (Activa, Por Vencer o Pausada).
6. **Captura Directa de Nivel Cooper y Tests Físicos:** El entrenador asigna el Nivel alcanzado (Niveles 1 al 5), pruebas de fuerza 1RM y resistencia funcional.`
  },
  {
    id: 'seguridad-privacidad',
    title: '6. Seguridad, Privacidad y Cumplimiento Normativo',
    summary: 'Cifrado de datos de salud física, autenticación biométrica, matriz RBAC y respaldos.',
    contentMarkdown: `### 6.1 Matriz de Control de Acceso Basado en Roles (RBAC)

| Módulo / Acción | Atleta | Coach / Staff | Administrador |
| :--- | :---: | :---: | :---: |
| Consultar perfil propio y membresía | ✅ Total | ✅ Total | ✅ Total |
| Registrar composición corporal propia | ✅ Lectura/Escritura | ✅ Lectura/Escritura | ✅ Lectura/Escritura |
| Registrar composición corporal de terceros | ❌ Prohibido | ✅ Permitido | ✅ Permitido |
| Ingresar resultados de Test Cooper y 1RM | ❌ Solo Lectura | ✅ Creación y Edición | ✅ Total |
| Dar de alta atletas vía correo | ❌ Prohibido | ✅ Permitido | ✅ Total |
| Modificar costos de planes y membresías | ❌ Prohibido | ❌ Prohibido | ✅ Total |
| Ejecutar suspensión manual o excepción | ❌ Prohibido | ❌ Prohibido | ✅ Total |
| Exportar reportes clínicos y auditoría | ✅ Solo propios | ✅ Sus evaluados | ✅ Toda la sede |

### 6.2 Cifrado y Protección de Datos Biométricos
1. **Datos en Tránsito:**
   - Todo el tráfico cliente-servidor forzado sobre **TLS 1.3** con cifrado Perfect Forward Secrecy (PFS).
   - Certificate Pinning habilitado en la compilación nativa de la app móvil para prevenir ataques Man-In-The-Middle.
2. **Datos en Reposo:**
   - La base de datos PostgreSQL está protegida mediante **cifrado a nivel de bloque AES-256**.
   - Campos de identificación personal (números de teléfono, contactos de emergencia) cifrados con claves administradas en AWS KMS / Cloud KMS.
3. **Autenticación en Dispositivo:**
   - Almacenamiento seguro de tokens JWT en el **Keychain de iOS** y en el **Keystore de Android**.
   - Desbloqueo rápido mediante biometría nativa (FaceID / TouchID / BiometricPrompt).
4. **Cumplimiento de Privacidad (GDPR & LFPDPPP):**
   - Consentimiento explícito para el tratamiento de datos de salud deportiva al iniciar sesión por primera vez.
   - Botón nativo de "Exportar mis Datos" (formato JSON descargable) y "Derecho al Olvido" (anonimización permanente de historial).

### 6.3 Estrategia de Respaldo y Recuperación (Disaster Recovery)
* **RPO (Recovery Point Objective):** < 15 minutos mediante Point-In-Time-Recovery (PITR) y archivo continuo de Write-Ahead Logs (WAL).
* **RTO (Recovery Time Objective):** < 1 hora con aprovisionamiento de infraestructura como código (Terraform).
* **Pruebas Automatizadas de Restauración:** Semanalmente en entorno aislado de staging.`
  },
  {
    id: 'offline-sincronizacion',
    title: '7. Estrategia Offline-First y Notificaciones',
    summary: 'Arquitectura de base de datos local en el móvil, resolución de conflictos y notificaciones push.',
    contentMarkdown: `### 7.1 Arquitectura Offline-First
En zonas de entrenamiento subterráneas o con señal celular deficiente, la aplicación garantiza operatividad total mediante una arquitectura de persistencia local:

1. **Lectura Ininterrumpida:**
   - Todas las mediciones históricas de composición corporal, pruebas de Cooper y el estado actual de la membresía se almacenan en una base de datos local SQLite cifrada.
   - El atleta puede abrir la app y revisar sus gráficas sin conexión a internet.
2. **Cola de Mutaciones Locales (Local Mutation Queue):**
   - Si el atleta ingresa un pesaje o el coach ingresa un test físico sin señal, la acción se guarda en una cola local con estado \`pending_sync\`.
   - Tan pronto se detecta conectividad (NetInfo listener), la cola se procesa mediante peticiones idempotentes al endpoint \`/api/v1/sync/push\`.
3. **Resolución de Conflictos:**
   - Para datos antropométricos: Prioridad por timestamp de última modificación (\`Last-Write-Wins\`).
   - Para evaluaciones físicas oficiales: Prioridad de autoridad del Staff frente a ediciones locales.

### 7.2 Flujo de Notificaciones Push (Recordatorios y Avisos)
* **Plataforma:** Firebase Cloud Messaging (FCM) integrado con APNs.
* **Ciclo de Recordatorio de Membresía:**
  - **Día T-7:** *"Hola {Nombre}, tu membresía vence el {Fecha}. ¡No te quedes sin entrenar!"*
  - **Día T-3:** *"Recordatorio de Pago: Hola {Nombre}, tu membresía vence el {Fecha}. Monto a pagar: \${Monto}."*
  - **Día T+0 (Vencimiento):** *"Tu plan ha finalizado hoy. Cuentas con 5 días de gracia para renovar sin perder acceso."*
  - **Día T+5 (Último día de gracia):** *"Alerta: Tu membresía será suspendida mañana a las 00:00 si no se registra tu pago."*`
  },
  {
    id: 'cronograma-roadmap',
    title: '8. Cronograma de Implementación (12 Semanas)',
    summary: 'Plan de trabajo en 6 Sprints de 2 semanas, entregables clave, equipo requerido y presupuesto.',
    contentMarkdown: `### 8.1 Plan de Trabajo por Sprints (12 Semanas)

\`\`\`
Semanas:     | S1-S2 | S3-S4 | S5-S6 | S7-S8 | S9-S10 | S11-S12 |
------------------------------------------------------------------
Sprint 1: DB & Auth Core     [====]
Sprint 2: Composición Corporal      [====]
Sprint 3: Evaluaciones & Staff             [====]
Sprint 4: Membresías & Suspensión                 [====]
Sprint 5: Gráficas & Offline                             [====]
Sprint 6: Auditoría & Launch                                     [====]
\`\`\`

#### Desglose Detallado de Sprints:
* **Sprint 1 (Semanas 1–2) — Infraestructura, Base de Datos y Autenticación:**
  - Configuración de repositorio, Docker, PostgreSQL 16 y Redis.
  - Implementación de esquemas DDL, migraciones y endpoints de Auth JWT con RBAC.
  - Creación de cuentas por invitación de Staff.
* **Sprint 2 (Semanas 3–4) — Módulo de Composición Corporal:**
  - Formularios móviles de captura (peso, % grasa, masa muscular, visceral).
  - Algoritmo de cálculo de IMC en backend y cliente con rangos OMS.
  - Persistencia y endpoints de historial biométrico.
* **Sprint 3 (Semanas 5–6) — Pruebas Físicas y Herramientas para Entrenadores:**
  - Módulo de Test de Cooper (12 min) con cálculo de VO2Max y baremos.
  - Registro de Fuerza Máxima 1RM (Sentadillas, Peso Muerto, Hip Thrust, Press, Remo).
  - Interfaz de tablet para Staff con captura rápida durante la sesión.
* **Sprint 4 (Semanas 7–8) — Gestión de Membresías y Motor de Suspensión:**
  - Modelado de planes, estados y períodos de gracia.
  - Cron job nocturno para suspensión automática de atletas morosos.
  - Integración de notificaciones push de recordatorio (FCM / APNs).
* **Sprint 5 (Semanas 9–10) — Visualización de Progreso, Gráficas y Modo Offline:**
  - Gráficas interactivas de tendencias de fuerza y masa corporal.
  - Herramienta de comparación Antes vs Después con métricas de delta.
  - Base de datos local SQLite con sincronización automática.
  - Generación de informe de progreso exportable (PDF).
* **Sprint 6 (Semanas 11–12) — Pruebas de Carga, Seguridad y Publicación:**
  - Pruebas de penetración (pentesting) y auditoría de seguridad de datos.
  - Beta testing cerrado con atletas y coaches de Kinetix Functional Zone.
  - Publicación en Apple App Store y Google Play Store.`
  }
];
