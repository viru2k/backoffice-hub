# Datos de Prueba - Backoffice Hub

## Peluquería Glamour
- Email principal: peluqueria@glamour.com
- Password: 12345678
- Subusuarios:
  - Email: recepcion@glamour.com / Password: 12345678
  - Email: tecnica@glamour.com / Password: 12345678

### Productos
- Shampoo
- Tinte
- Peine

### Stock Inicial
- 100 unidades cada uno

### Turnos
- Corte de cabello
- Coloración

## Clínica Oftalmológica Visión
- Email principal: oftalmologia@vision.com
- Password: 12345678
- Subusuarios:
  - Email: recepcion@vision.com / Password: 12345678
  - Email: asistente@vision.com / Password: 12345678

### Productos
- Lentes de contacto
- Solución para lentes
- Gotas oftálmicas

### Stock Inicial
- 200 unidades cada uno

### Turnos
- Consulta médica
- Control de visión


### lanzar seed 

 npm run seed:fullflow-extended

 ### limpiar database

 SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE agenda_config;
TRUNCATE TABLE appointment;
TRUNCATE TABLE appointment_product_log;
TRUNCATE TABLE client;
TRUNCATE TABLE holiday;
TRUNCATE TABLE product;
TRUNCATE TABLE product_price_history;
TRUNCATE TABLE stock_movement;
TRUNCATE TABLE subscription;
TRUNCATE TABLE subscription_plan;
TRUNCATE TABLE subscription_plan_feature;
TRUNCATE TABLE user;





SET FOREIGN_KEY_CHECKS = 1;
