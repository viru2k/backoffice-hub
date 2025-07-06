¡Por supuesto! He generado el contenido completo y actualizado para tu archivo README.md.

Debido a un problema temporal con la herramienta para escribir archivos directamente, no puedo crear el archivo en tu repositorio, pero aquí tienes el contenido final y pulido para que lo copies y lo pegues en tu README.md.

Backoffice Hub API
Backoffice Hub es una API modular y escalable construida con NestJS, diseñada para servir como el backend de un sistema SaaS. Proporciona funcionalidades de autenticación, gestión de usuarios, productos, stock, clientes y una agenda completa.

Tabla de Contenidos
Prerrequisitos
Configuración del Entorno
Cómo Levantar el Proyecto con Docker (Recomendado)
Gestión de la Base de Datos
Opción A: Reseteo Completo (Para ejecutar el Seed)
Opción B: Limpieza Rápida de Tablas (Truncate)
Desarrollo Local (Sin Docker para la App)
Documentación de la API (Swagger)
Credenciales del Seed
Prerrequisitos
Para levantar y trabajar con este proyecto, necesitarás tener instalado en tu sistema:

Docker
Docker Compose
Node.js (v18 o superior, solo si deseas correr la aplicación fuera de Docker para desarrollo local)
Un cliente de API como Postman o Insomnia para probar los endpoints.
Un cliente de base de datos SQL como DBeaver, TablePlus o MySQL Workbench (opcional, para inspeccionar la base de datos).
Configuración del Entorno
El proyecto utiliza variables de entorno para su configuración. Antes de iniciar, crea un archivo .env en la raíz del proyecto. Puedes copiar el contenido de .env.example si existe, o usar la siguiente plantilla:

.env

Fragmento de código

# Puerto en el que correrá la aplicación
PORT=3000

# Base de Datos
DB_HOST=db
DB_PORT=3306
DB_USER=root
DB_PASSWORD=admin123
DB_NAME=backoffice_core

# Secret para JWT
JWT_SECRET=superSecretClaveJWT123
Estos valores coinciden con los definidos en docker-compose.yml.

Cómo Levantar el Proyecto con Docker (Recomendado)
Este es el método preferido para asegurar un entorno consistente y reproducible.

1. Construir y Levantar los Servicios
Ejecuta el siguiente comando en la raíz del proyecto:

Bash

docker-compose up --build -d
--build: Fuerza la reconstrucción de la imagen de la aplicación (app) si ha habido cambios en el código o en el Dockerfile.
-d: Ejecuta los contenedores en segundo plano (detached mode).
2. ¿Qué hace este comando?
Inicia dos servicios definidos en docker-compose.yml:
db: Un contenedor con una base de datos MySQL 8.0.
app: Un contenedor con la aplicación de NestJS.
En el primer arranque (o después de una limpieza completa), el servicio app ejecutará automáticamente el script de seed para poblar la base de datos con datos de prueba.
Una vez que el seed finaliza, la aplicación NestJS se inicia en modo de producción.
3. Verificar el Estado
Para ver los logs de la aplicación en tiempo real:
Bash

docker-compose logs -f app
Para detener todos los servicios:
Bash

docker-compose down
Gestión de la Base de Datos
Hay dos maneras principales de limpiar la base de datos.

Opción A: Reseteo Completo (Para ejecutar el Seed)
Este método es ideal si quieres empezar desde cero y que el script de seed se vuelva a ejecutar.

Bash

docker-compose down -v
El flag -v (o --volumes) es crucial, ya que elimina el volumen de Docker donde persisten los datos de MySQL. Al volver a levantar los servicios con docker-compose up, la base de datos estará vacía y el seed se ejecutará.

Opción B: Limpieza Rápida de Tablas (Truncate)
Si solo quieres borrar los datos de todas las tablas pero mantener la estructura y el volumen de Docker, puedes ejecutar un script SQL.

Conéctate a la base de datos. Puedes usar un cliente de base de datos gráfico con los siguientes datos:

Host: localhost
Puerto: 3306
Usuario: root
Contraseña: admin123
Base de datos: backoffice_core
Ejecuta el siguiente script SQL: Este script deshabilita temporalmente la verificación de claves foráneas, vacía todas las tablas y la vuelve a habilitar.

SQL

SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE agenda_config;
TRUNCATE TABLE appointment;
TRUNCATE TABLE appointment_product_log;
TRUNCATE TABLE client;
TRUNCATE TABLE failed_notification ;
TRUNCATE TABLE holiday;
TRUNCATE TABLE notification ;
TRUNCATE TABLE product;
TRUNCATE TABLE product_price_history;
TRUNCATE TABLE stock_movement;
TRUNCATE TABLE subscription;
TRUNCATE TABLE subscription_plan;
TRUNCATE TABLE subscription_plan_feature;
TRUNCATE TABLE user;

SET FOREIGN_KEY_CHECKS = 1;

-- Añade más tablas aquí si es necesario en el futuro

SET FOREIGN_KEY_CHECKS = 1;
Desarrollo Local (Sin Docker para la App)
Si prefieres ejecutar la aplicación NestJS directamente en tu máquina para un desarrollo más rápido con hot-reloading.

Inicia solo la base de datos con Docker:

Bash

docker-compose up -d db
Configura tu entorno local: Crea un archivo .env.development en la raíz del proyecto con la siguiente configuración:

Fragmento de código

DB_HOST=localhost # Apunta a la base de datos Docker expuesta en tu máquina
PORT=3001 # Opcional: usa un puerto diferente para no colisionar con la app de Docker
# ... resto de las variables (DB_USER, DB_PASSWORD, etc.)
Instala las dependencias:

Bash

npm install
Ejecuta la aplicación en modo de desarrollo:

Bash

npm run start:dev
La aplicación se reiniciará automáticamente cada vez que guardes un cambio en un archivo.

Documentación de la API (Swagger)
Una vez que la aplicación esté corriendo, puedes acceder a la documentación interactiva de la API generada por Swagger UI en la siguiente URL:

http://localhost:3000/api

(Reemplaza 3000 por el puerto que hayas configurado si es diferente).

Credenciales del Seed
El script de seed crea dos cuentas de administrador con las que puedes probar la aplicación. También crea un sub-usuario para la cuenta de la peluquería.


Correo Electrónico	Contraseña	Plan	Rol
peluqueria@glamour.com	12345678	Starter	Admin
estilista@glamour.com	12345678	(Heredado)	Sub-Usuario
oftalmologia@vision.com	12345678	Professional	Admin