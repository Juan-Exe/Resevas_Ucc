# Sistema de Reservas UCC

Sistema web para la gestión y reserva de espacios académicos de la **Universidad Cooperativa de Colombia** — salones, auditorios, laboratorios y canchas.

## Stack tecnológico

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![MariaDB](https://img.shields.io/badge/MariaDB-003545?style=for-the-badge&logo=mariadb&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Nodemailer](https://img.shields.io/badge/Nodemailer-22B573?style=for-the-badge&logo=gmail&logoColor=white)
![Adminer](https://img.shields.io/badge/Adminer-34A0EF?style=for-the-badge&logo=adminer&logoColor=white)

---

## Funcionalidades

- Registro e inicio de sesión con correo institucional `@ucc.edu.co`
- Roles: **Estudiante**, **Profesor** y **Administrador**
- Reserva de espacios por piso, tipo, bloque, fecha y franja horaria
- Panel de administración para aceptar o rechazar reservas
- Sistema de notificaciones en tiempo real
- Recuperación de contraseña por email (código de verificación)
- Perfil de usuario con foto personalizable

---

## Requisitos previos

- [Docker](https://www.docker.com/get-started) y [Docker Compose](https://docs.docker.com/compose/install/) instalados
- Cuenta de Gmail con [App Password](https://myaccount.google.com/apppasswords) habilitada *(para el envío de correos)*

---

## Instalación y ejecución

### 1. Clona el repositorio

```bash
git clone https://github.com/Juan-Exe/Resevas_Ucc.git
cd Resevas_Ucc
```

### 2. Configura las variables de entorno

Copia el archivo de ejemplo y edítalo con tus datos:

```bash
cp .env.example .env
```

Abre `.env` y completa los valores:

```env
# Base de datos
DB_HOST=db
DB_PORT=3306
DB_NAME=reservas_ucc
DB_USER=ucc_user
DB_PASSWORD=ucc_password
DB_ROOT_PASSWORD=root_password

# Email — crea una App Password en https://myaccount.google.com/apppasswords
EMAIL_USER=tu_correo@gmail.com
EMAIL_PASS=tu_app_password_de_16_caracteres

# Sesiones — cámbialo por una cadena larga y aleatoria
SESSION_SECRET=cambia_esto_por_una_clave_secreta_larga
```

> **Cómo obtener una App Password de Gmail:**
> 1. Ve a [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
> 2. Selecciona **Otra (nombre personalizado)** y ponle un nombre (ej. `Reservas UCC`)
> 3. Copia las 16 letras generadas y pégalas en `EMAIL_PASS`

### 3. Levanta los contenedores

```bash
docker compose up -d
```

Esto levantará automáticamente:
| Servicio | URL |
|---|---|
| Aplicación web | http://localhost:3000 |
| Adminer (gestor DB) | http://localhost:8080 |

> La primera vez, Docker importará automáticamente `reservas_ucc.sql` con toda la estructura y datos de ejemplo. Puede tardar unos segundos.

### 4. Accede a la aplicación

Abre **http://localhost:3000** en tu navegador.

---

## Acceso a la base de datos con Adminer

1. Abre **http://localhost:8080**
2. Completa el formulario:

| Campo | Valor |
|---|---|
| Motor | MySQL |
| Servidor | `db:3306` |
| Usuario | el valor de `DB_USER` en tu `.env` |
| Contraseña | el valor de `DB_PASSWORD` en tu `.env` |
| Base de datos | `reservas_ucc` |

---

## Usuario de prueba incluido

| Rol | Usuario | Contraseña | Correo |
|---|---|---|---|
| Administrador | `admin` | `Admin123` | admin@ucc.edu.co |

> Para probar el flujo completo, registra un usuario nuevo con cualquier correo `@ucc.edu.co`.

---

## Configurar la recuperación de contraseña

El sistema envía un código de verificación por email cuando un usuario olvida su contraseña. Para que funcione necesitas una **App Password de Gmail**:

1. Activa la **verificación en dos pasos** en tu cuenta Google si no la tienes
2. Ve a [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Crea una nueva App Password con el nombre `Reservas UCC`
4. Copia las **16 letras** que genera Google
5. Pégalas en tu `.env`:
   ```env
   EMAIL_USER=tu_correo@gmail.com
   EMAIL_PASS=abcd efgh ijkl mnop   ← las 16 letras (sin espacios)
   ```

> Sin esta configuración el sistema funciona normalmente, pero el botón "Olvidé mi contraseña" dará error al intentar enviar el correo.

Para usarla, el usuario debe haber registrado un **correo de recuperación** en su perfil antes de olvidar la contraseña.

---

## Roles y funcionalidades

### Estudiante / Profesor

- Registrarse con correo `@ucc.edu.co`
- Hacer reservas de espacios (ver sección abajo)
- Ver el historial y estado de sus reservas
- Recibir notificaciones cuando una reserva es aceptada o rechazada
- Editar su perfil y foto
- Agregar un correo de recuperación en su perfil
- Recuperar su contraseña por email si la olvidó

### Administrador

- Ver **todas** las reservas del sistema (pendientes, aceptadas, rechazadas)
- **Aceptar o rechazar** solicitudes de reserva pendientes
- Al responder, el usuario recibe una notificación automática
- Acceder al panel de administración en `/Admin`
- Gestionar usuarios: ver listado, cambiar roles y desactivar cuentas

---

## Cómo hacer una reserva

1. Inicia sesión con tu correo institucional `@ucc.edu.co`
2. En la pantalla principal selecciona el **piso** del edificio
3. Elige el **tipo de espacio** (Salón, Auditorio, Laboratorio, Cancha)
4. Selecciona la **fecha** y la **franja horaria** disponible
5. Escribe el **motivo** de la reserva y haz clic en **Reservar**
6. Tu solicitud queda en estado **Pendiente** hasta que un administrador la apruebe
7. Recibirás una **notificación** dentro del sistema cuando sea aceptada o rechazada

> Los espacios ya reservados en una franja horaria aparecen bloqueados y no se pueden seleccionar.

---

## Detener los contenedores

```bash
# Detener sin borrar datos
docker compose down

# Detener y borrar también la base de datos
docker compose down -v
```

---

## Estructura del proyecto

```
Resevas_Ucc/
├── backend/
│   └── server.js          # API REST con Express
├── frontend/
│   └── public/            # HTML, CSS, JS del cliente
│       ├── index.html     # Pantalla de reservas
│       ├── Login/
│       ├── Registro/
│       ├── Gestion/       # Panel de gestión de reservas
│       ├── Admin/         # Panel de administración
│       └── Perfil/
├── reservas_ucc.sql       # Dump completo de MariaDB
├── docker-compose.yml
├── Dockerfile
├── .env.example           # Plantilla de variables de entorno
└── package.json
```

---

## Licencia

Este proyecto fue desarrollado como proyecto de portafolio personal por **Juan Diego Arrieta Herrera**.
