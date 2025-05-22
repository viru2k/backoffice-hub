
# 🌱 Full Flow Extended Seed – Ejecución Automática en Docker

Este proyecto incluye una semilla completa (`full-flow-extended.seed.ts`) que genera usuarios, planes, suscripciones, productos, clientes, configuraciones de agenda y feriados iniciales.

## 🧠 ¿Cuándo se ejecuta?

La semilla se ejecuta **automáticamente** cuando se levanta el contenedor `app` (NestJS), **pero solo si la base de datos está vacía**.

## ⚙️ Lógica interna

El archivo `src/seed/full-flow-extended.seed.ts` verifica:

```ts
const existingPlans = await this.planRepo.find();
if (existingPlans.length === 0) {
  // Cargar datos semilla solo si no existen
}
```

## 🚀 Configuración en Docker

El servicio `app` en `docker-compose.yml` tiene el siguiente comando:

```yaml
command: sh -c "
  npx ts-node -r tsconfig-paths/register src/seed/full-flow-extended-runner.ts || echo '✔️ Seed opcional omitido';
  npm run start:prod
"
```

### ¿Qué hace?

1. Ejecuta la semilla.
2. Si falla porque los datos ya existen, no detiene el contenedor.
3. Inicia la app en modo producción.

## 📌 Importante

- Este seed **no borra datos existentes**, solo inserta si la tabla `subscription_plan` está vacía.
- Puedes ejecutar el seed manualmente también:
  ```bash
  npm run seed:fullflow-extended
  ```

---

> 📝 Autor: Equipo técnico de `backoffice-hub`  
> 🗓️ Última actualización: 2025-05-01



🔪 Inicialización del entorno Docker y ejecución del seed

Este proyecto utiliza Docker para levantar el entorno completo (backend + base de datos). El script de seed se ejecuta automáticamente al levantar el contenedor si la base de datos está vacía.

📁 Requisitos previos

Tener Docker y Docker Compose instalados.

Archivo .env en la raíz del proyecto con las siguientes variables:

DB_HOST=db
DB_PORT=3306
DB_USER=root
DB_PASSWORD=admin123
DB_NAME=backoffice_core
NODE_ENV=production

Asegúrate de que DB_HOST coincida con el nombre del servicio definido en docker-compose.yml.

🚀 Comando para inicializar todo

docker-compose down -v
docker-compose up --build

Este comando:

Elimina contenedores y volúmenes anteriores.

Reconstruye las imágenes.

Levanta:

db: Contenedor de MySQL con usuario root y base de datos backoffice_core.

app: Contenedor de NestJS que se conecta al contenedor db.

🔀 Flujo automático del seed

Dentro del contenedor app, el siguiente script se ejecuta como parte del proceso de arranque:

npm run seed:prod

Este script ejecuta:

ts-node src/seed/full-flow-extended-runner.ts

Este seed verifica si existen datos (por ejemplo, usuarios). Si la base está vacía, se ejecuta la carga inicial.

🔍 Verificar la conexión desde cliente externo

Puedes conectar con la base de datos usando una herramienta como DBeaver:

Host: localhost

Puerto: 3306

Usuario: root

Contraseña: admin123

Base de datos: backoffice_core

🖐 Consejos

Si hay problemas de conexión, asegúrate de que el .env, docker-compose.yml y TypeOrmModule.forRoot() estén completamente alineados.

Usa docker-compose logs app para revisar errores del backend.

Usa docker exec -it backoffice-db mysql -uroot -p para conectarte al contenedor de MySQL y verificar manualmente los datos.

### RESETEAR DOCKER CUANDO SE HACEN CAMBIOS

docker compose -down
docker compose up --build