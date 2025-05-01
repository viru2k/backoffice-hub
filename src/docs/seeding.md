
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
