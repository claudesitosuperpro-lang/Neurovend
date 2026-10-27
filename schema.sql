-- ============================================================
-- NEUROVEND — Schema para Supabase (PostgreSQL)
-- Ejecutar en el SQL Editor de Supabase
-- ============================================================

-- ─── USUARIOS ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS usuarios (
    id         SERIAL PRIMARY KEY,
    nombre     VARCHAR(100) NOT NULL,
    username   VARCHAR(50)  UNIQUE NOT NULL,
    password   VARCHAR(255) NOT NULL,             -- BCrypt hash
    rol        VARCHAR(20)  NOT NULL CHECK (rol IN ('dueño', 'empleado')),
    activo     BOOLEAN      NOT NULL DEFAULT TRUE,
    creado_en  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ─── PRODUCTOS ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS productos (
    id                SERIAL PRIMARY KEY,
    codigo            VARCHAR(50)    UNIQUE NOT NULL,
    nombre            VARCHAR(100)   NOT NULL,
    precio_por_kg     DECIMAL(10, 2),
    precio_por_unidad DECIMAL(10, 2),
    tipo_venta        VARCHAR(10)    NOT NULL CHECK (tipo_venta IN ('peso', 'unidad')),
    stock             DECIMAL(10, 3) NOT NULL DEFAULT 0,
    stock_habilitado  BOOLEAN        NOT NULL DEFAULT TRUE,
    activo            BOOLEAN        NOT NULL DEFAULT TRUE,
    imagen_url        TEXT,
    creado_en         TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_precio CHECK (
        (tipo_venta = 'peso'    AND precio_por_kg     IS NOT NULL AND precio_por_unidad IS NULL) OR
        (tipo_venta = 'unidad'  AND precio_por_unidad IS NOT NULL AND precio_por_kg     IS NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_productos_nombre   ON productos (nombre);
CREATE INDEX IF NOT EXISTS idx_productos_creado_en ON productos (creado_en);

-- ─── VENTAS ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ventas (
    id          SERIAL PRIMARY KEY,
    usuario_id  INTEGER      NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    fecha       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_venta DATE         NOT NULL DEFAULT CURRENT_DATE,
    total       DECIMAL(10, 2) NOT NULL DEFAULT 0,
    metodo_pago VARCHAR(20)  CHECK (metodo_pago IN ('efectivo', 'tarjeta')),
    estado      VARCHAR(20)  NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'completada'))
);

CREATE INDEX IF NOT EXISTS idx_ventas_usuario_id  ON ventas (usuario_id);
CREATE INDEX IF NOT EXISTS idx_ventas_fecha_venta ON ventas (fecha_venta);

-- ─── DETALLE VENTA ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS detalle_venta (
    id                 SERIAL PRIMARY KEY,
    venta_id           INTEGER        NOT NULL REFERENCES ventas(id) ON DELETE CASCADE,
    producto_id        INTEGER        NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
    cantidad_kg        DECIMAL(10, 3),
    cantidad_unidades  INTEGER,
    precio_unitario    DECIMAL(10, 2) NOT NULL,   -- snapshot histórico del precio al momento de venta
    subtotal           DECIMAL(10, 2) NOT NULL,
    orden              INTEGER        NOT NULL DEFAULT 0,  -- orden de inserción en la cuenta
    CONSTRAINT valid_cantidad CHECK (
        (cantidad_kg IS NOT NULL AND cantidad_unidades IS NULL) OR
        (cantidad_unidades IS NOT NULL AND cantidad_kg IS NULL)
    ),
    CONSTRAINT unique_venta_producto UNIQUE (venta_id, producto_id)
);

CREATE INDEX IF NOT EXISTS idx_detalle_venta_venta_id    ON detalle_venta (venta_id);
CREATE INDEX IF NOT EXISTS idx_detalle_venta_producto_id ON detalle_venta (producto_id);

-- ─── PAGOS ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pagos (
    id               SERIAL PRIMARY KEY,
    venta_id         INTEGER        NOT NULL UNIQUE REFERENCES ventas(id) ON DELETE CASCADE,
    monto_recibido   DECIMAL(10, 2) NOT NULL DEFAULT 0,
    cambio_devuelto  DECIMAL(10, 2) NOT NULL DEFAULT 0
);

-- ─── CONFIGURACIÓN ───────────────────────────────────────────────────────────
-- Una sola fila (id = 1 siempre)
CREATE TABLE IF NOT EXISTS configuracion (
    id                INTEGER PRIMARY KEY DEFAULT 1,
    puerto_bascula    VARCHAR(10)  NOT NULL DEFAULT 'COM3',
    baudrate_bascula  INTEGER      NOT NULL DEFAULT 9600,
    nombre_impresora  VARCHAR(100) NOT NULL DEFAULT 'Impresora Termica',
    encabezado_ticket TEXT         NOT NULL DEFAULT E'NEUROVEND\nVerdureria Rodriguez\nCalle Naranjos #2137\nTel: (+52) 3328290020\nAtendiendo Con Gusto',
    actualizado_en    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT single_row CHECK (id = 1)
);

INSERT INTO configuracion (id) VALUES (1) ON CONFLICT DO NOTHING;

-- ─── DATOS INICIALES ─────────────────────────────────────────────────────────
-- Usuario admin (password: 'Admin1234' con BCrypt — cambiar tras primer login)
-- Para generar un hash propio: en C# → BCrypt.Net.BCrypt.HashPassword("tu_password")
-- El hash abajo corresponde a 'Admin1234'
INSERT INTO usuarios (nombre, username, password, rol)
VALUES ('Administrador', 'admin', '$2a$11$hoW5R/JXnP5JT9uDaYipFOiUThltLsq0P3sA71lO9wKx2WWg4rkBW', 'dueño')
ON CONFLICT (username) DO NOTHING;
