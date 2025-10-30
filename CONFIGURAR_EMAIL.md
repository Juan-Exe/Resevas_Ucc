# 📧 Configuración de Email para Recuperación de Contraseña

## ⚠️ IMPORTANTE: Debes configurar el email antes de usar el sistema de recuperación

### 📝 Paso 1: Obtener Contraseña de Aplicación de Gmail

1. Ve a tu cuenta de Google: https://myaccount.google.com/security
2. Asegúrate de tener activada la **Verificación en 2 pasos**
3. Busca "Contraseñas de aplicaciones" (App Passwords)
4. Selecciona:
   - Aplicación: **Correo**
   - Dispositivo: **Otro (personalizado)** → Escribe "Sistema Reservas UCC"
5. Google te dará una contraseña de 16 caracteres → **Cópiala**

### 📝 Paso 2: Configurar en server.js

Abre el archivo `backend/server.js` y busca las líneas 14-19:

```javascript
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'tu-correo@gmail.com',      // ← CAMBIA ESTO
        pass: 'tu-contraseña-app'          // ← PEGA LA CONTRASEÑA DE APLICACIÓN AQUÍ
    }
});
```

**Ejemplo:**
```javascript
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'juan.arrieta@gmail.com',           // Tu correo personal de Gmail
        pass: 'abcd efgh ijkl mnop'               // La contraseña de 16 caracteres que copiaste
    }
});
```

### 📝 Paso 3: Reiniciar el servidor

```bash
# Detén el servidor (Ctrl + C)
# Inicia nuevamente
node backend/server.js
```

## ✅ Verificar que funciona

1. Ejecuta el SQL de la base de datos (database/recuperacion_contraseña.sql)
2. Agrega un correo de recuperación en tu perfil de usuario
3. Ve a "¿Olvidaste tu contraseña?" en el login
4. Ingresa tu correo institucional
5. Deberías recibir un email con el código de 6 dígitos

## 🔐 Cómo funciona el sistema

1. **Usuario olvida contraseña** → Click en "¿Olvidaste tu contraseña?"
2. **Ingresa correo institucional** → Backend verifica que tenga correo de recuperación
3. **Backend genera código aleatorio de 6 dígitos** → Ejemplo: 482916
4. **Código se guarda en BD** con fecha de expiración (15 minutos)
5. **Nodemailer envía email** al correo de recuperación del usuario
6. **Usuario recibe email** con código de 6 dígitos
7. **Usuario ingresa código** en la página de verificación
8. **Backend valida código** (que no esté usado y no haya expirado)
9. **Usuario crea nueva contraseña** (diferente a la actual)
10. **Backend cambia contraseña** y marca código como usado

## 📧 Plantilla del Email que se envía

El usuario recibirá un email profesional con:
- Header azul con "Sistema de Reservas UCC"
- Saludo personalizado con su nombre
- Código de 6 dígitos grande y destacado
- Aviso de expiración en 15 minutos
- Footer con "Universidad Cooperativa de Colombia"

## 🛠️ Alternativas a Gmail

Si no quieres usar Gmail, puedes usar otros servicios:

### Outlook/Hotmail:
```javascript
service: 'hotmail',
auth: {
    user: 'tu-correo@outlook.com',
    pass: 'tu-contraseña'
}
```

### Yahoo:
```javascript
service: 'yahoo',
auth: {
    user: 'tu-correo@yahoo.com',
    pass: 'tu-contraseña-app'  // También requiere contraseña de aplicación
}
```

### Otro servidor SMTP:
```javascript
host: 'smtp.tuservidor.com',
port: 587,
secure: false,
auth: {
    user: 'tu-correo@tudominio.com',
    pass: 'tu-contraseña'
}
```

## ⚠️ Notas de Seguridad

- **NUNCA** compartas tu contraseña de aplicación
- **NUNCA** subas el archivo server.js a GitHub con las credenciales
- Considera usar variables de entorno (.env) para producción
- La contraseña de aplicación solo funciona con esa aplicación específica
- Si la contraseña se compromete, puedes revocarla desde tu cuenta de Google

## ✅ TODO LISTO

Una vez configurado, el sistema de recuperación de contraseña estará 100% funcional:
- ✅ Modal de recomendación en Perfil
- ✅ Campo de correo de recuperación
- ✅ Página de solicitud de código
- ✅ Generación automática de código de 6 dígitos
- ✅ Envío de email con el código
- ✅ Página de verificación de código (con temporizador)
- ✅ Página de nueva contraseña
- ✅ Validación de contraseña diferente a la actual
- ✅ Todo con la misma estética del proyecto
