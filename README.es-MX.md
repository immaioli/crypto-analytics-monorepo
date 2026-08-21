<div align="center">
  <h1>🚀 Dashboard Analítico de Cripto</h1>

  <p>
    <strong>Plataforma de nivel empresarial para rastreo, comparación y análisis del mercado de criptomonedas.</strong>
  </p>

  <p>
    🌍 <a href="README.md">English</a> | 
    🇧🇷 <a href="README.pt-BR.md">Português</a> | 
    🇲🇽 <a href="README.es-MX.md">Español</a>
  </p>

  <p>
    <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" />
    <img alt="NestJS" src="https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" />
    <img alt="Next.js" src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" />
    <img alt="Tailwind CSS" src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" />
  </p>

  <p align="center">
    <a href="https://crypto.maioli.dev.br" target="_blank">
      <img src="https://img.shields.io/badge/Demostración_en_Vivo-crypto.maioli.dev.br-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Demostración en Vivo" />
    </a>
  </p>
</div>

---

## 📖 Visión General

El **Dashboard Analítico de Cripto** es una aplicación web de alto rendimiento diseñada para proporcionar resúmenes del mercado en tiempo real y comparaciones detalladas de monedas lado a lado. Construido con un enfoque en la **resiliencia, velocidad y arquitectura limpia**, agrega datos de múltiples proveedores de primer nivel (Binance, CoinGecko, CoinPaprika) para garantizar el máximo tiempo de actividad (uptime) y la precisión de los datos.

## ✨ Características Principales

- **📊 Resumen del Mercado:** Visualiza las 7 monedas de mayor volumen y las 7 con mayores ganancias en tiempo real.
- **⚖️ Comparación Lado a Lado:** Compara hasta 5 criptomonedas simultáneamente con datos normalizados.
- **🛡️ Resiliencia Empresarial:** Implementa los patrones **Circuit Breaker** y **Strategy**. Si el proveedor de datos principal (Binance) falla o limita las peticiones (rate-limit), el sistema recurre de manera fluida a proveedores secundarios (CoinGecko/CoinPaprika) sin interrumpir la solicitud del usuario.
- **⚡ Caché de Degradación Elegante:** Utiliza una capa de caché inteligente. Si el clúster distribuido de Redis no está disponible (`ECONNREFUSED`), el sistema realiza un fallback automático a una caché en memoria, evitando bloqueos al iniciar el servidor.
- **🤖 Pruebas E2E Automatizadas:** Scripts integrados de Playwright para inspección visual automatizada de la UI y verificación de datos.

## 🏗️ Arquitectura y Stack Tecnológico

Este proyecto está estructurado como un **Monorepo** para separar responsabilidades mientras se comparten tipos y utilidades.

### 🧱 Estructura del Monorepo

```text
dashboard-cripto/
├── apps/
│   ├── api/       # NestJS Backend (Agregación de Datos y Caché)
│   └── web/       # Next.js / React Frontend (Tailwind UI)
├── packages/
│   └── shared-types/ # Interfaces TypeScript compartidas
└── test-playwright.mjs # Script de verificación E2E
```

### 🛠️ Stack Tecnológico
- **Frontend:** React, Next.js, Tailwind CSS.
- **Backend:** NestJS, RxJS (HttpService), Cache-Manager.
- **Testing:** Playwright (Automatización UI/Headless).
- **Herramientas:** npm workspaces, Prettier, ESLint.

## 🚀 Cómo Empezar

### Requisitos Previos
- Node.js (v18 o superior)
- npm (v9 o superior)

### Instalación

1. Clona el repositorio:
   ```bash
   git clone https://github.com/tu-org/dashboard-cripto.git
   cd dashboard-cripto
   ```

2. Instala las dependencias para todos los espacios de trabajo (workspaces):
   ```bash
   npm install
   ```

### Ejecutando el Proyecto

**1. Iniciar la API (Backend):**
```bash
npm run start:dev --workspace=@dashboard-cripto/api
```
*La API se ejecutará en `http://localhost:3001` (o el puerto configurado).*

**2. Iniciar la Aplicación Web (Frontend):**
```bash
npm run dev --workspace=@dashboard-cripto/web
```
*La UI estará disponible en `http://localhost:3000`.*

### Ejecutar Pruebas E2E
Para verificar visualmente los componentes de la interfaz y la carga de datos:
```bash
node test-playwright.mjs
```

## ⚙️ Variables de Entorno

Crea un archivo `.env` en los directorios `apps/api` y `apps/web`.

**Backend (`apps/api/.env`):**
```env
PORT=3001
# Opcional: Si se omite, recurre a caché en memoria
REDIS_HOST=localhost 
REDIS_PORT=6379
```

**Frontend (`apps/web/.env.local`):**
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## 🧠 Decisiones Arquitectónicas (Resumen ADR)

*   **¿Por qué Múltiples Proveedores?** Las APIs cripto son notoriamente volátiles. Depender únicamente de una API genera puntos únicos de fallo. Usamos Binance para datos de liquidez masiva y CoinGecko/CoinPaprika para metadatos ricos (como imágenes en HD) y soporte de contingencia.
*   **¿Por qué restringir a 5 monedas en comparación?** Renderizar gráficos pesados en SVG/Canvas para decenas de activos provoca bloqueos masivos en el hilo principal de la UI (jank). Restringir a 5 garantiza un desplazamiento fluido a 60fps y una legibilidad clara.

## 🤝 Contribuyendo
1. Haz un Fork del Proyecto.
2. Crea tu Rama de Característica (`git checkout -b feature/CaracteristicaIncreible`).
3. Confirma tus Cambios (`git commit -m 'Añade alguna CaracteristicaIncreible'`).
4. Sube la Rama (`git push origin feature/CaracteristicaIncreible`).
5. Abre un Pull Request. Asegúrate de que todas las pruebas de Playwright pasen y de seguir estrictamente los principios de Clean Code.

## 📜 Licencia
Distribuido bajo la Licencia MIT. Ver `LICENSE` para más información.

