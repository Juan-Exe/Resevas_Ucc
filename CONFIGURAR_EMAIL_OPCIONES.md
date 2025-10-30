# Opciones para Enviar Emails Automáticos

## El sistema YA está programado para:
✅ Generar código de 6 dígitos automáticamente
✅ Enviar el código a CUALQUIER email (Gmail, Outlook, Hotmail, etc.)
✅ El usuario solo recibe el email y verifica el código

## Solo falta: Configurar UN correo del SISTEMA (solo TÚ, una vez)

---

## 🚀 OPCIÓN 1: Gmail (RECOMENDADA - Gratis)

**Ventajas:**
- Gratis
- Confiable
- 5 minutos de configuración

**Pasos:**
1. Ve a https://myaccount.google.com/apppasswords
2. Genera contraseña para "Sistema Reservas UCC"
3. Copia la contraseña (16 caracteres)
4. Pégala en `backend/server.js` línea 31
5. ¡Listo! Envía a cualquier email del mundo

---

## 🚀 OPCIÓN 2: Outlook/Hotmail (Gratis)

**Configuración:**
```javascript
const transporter = nodemailer.createTransport({
    service: 'hotmail',
    auth: {
        user: 'tu-correo@outlook.com',
        pass: 'tu-contraseña'
    }
});
```

---

## 🚀 OPCIÓN 3: SendGrid (Profesional - Gratis hasta 100 emails/día)

**Ventajas:**
- Sin configuración de 2 pasos
- Más confiable para producción
- No usa tu correo personal

**Pasos:**
1. Regístrate en https://sendgrid.com (gratis)
2. Genera un API Key
3. Usa esta configuración:

```javascript
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey('TU_API_KEY_AQUI');

// Luego en el código de envío:
await sgMail.send({
    to: usuario.correo_recuperacion,
    from: 'noreply@sistemaucc.com',
    subject: 'Código de Recuperación',
    html: mailOptions.html
});
```

---

## 🚀 OPCIÓN 4: Gmail SMTP (Sin contraseña de aplicación)

Si no puedes activar la verificación en 2 pasos, usa:

```javascript
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: 'juandiegoarrietaherrera@gmail.com',
        pass: 'tu-contraseña-normal'
    },
    tls: {
        rejectUnauthorized: false
    }
});
```

**ADVERTENCIA:** Google puede bloquear esto por seguridad. Necesitarás:
- Activar "Acceso de aplicaciones menos seguras" en tu cuenta de Google
- O usar la opción 1 (contraseña de aplicación) que es más segura

---

## 📊 Comparación

| Opción | Facilidad | Costo | Confiabilidad | Tiempo Setup |
|--------|-----------|-------|---------------|--------------|
| Gmail (App Password) | ⭐⭐⭐⭐⭐ | Gratis | ⭐⭐⭐⭐⭐ | 5 min |
| Outlook | ⭐⭐⭐⭐ | Gratis | ⭐⭐⭐⭐ | 3 min |
| SendGrid | ⭐⭐⭐ | Gratis* | ⭐⭐⭐⭐⭐ | 10 min |
| Gmail sin 2FA | ⭐⭐ | Gratis | ⭐⭐ | 2 min |

---

## 🎯 Mi Recomendación

**Para desarrollo/pruebas:** Gmail con contraseña de aplicación (Opción 1)
**Para producción:** SendGrid (Opción 3)

---

## ❓ Preguntas Frecuentes

**P: ¿Los usuarios necesitan configurar algo?**
R: ¡NO! Solo TÚ configuras el sistema UNA VEZ. Los usuarios solo reciben el email.

**P: ¿Funciona con cualquier email del usuario?**
R: ¡SÍ! Gmail, Outlook, Hotmail, Yahoo, etc. Todos funcionan.

**P: ¿Cuántos emails puedo enviar?**
R: Gmail: ~500/día, Outlook: ~300/día, SendGrid: 100/día (gratis)

**P: ¿Es seguro?**
R: Sí. Las contraseñas de aplicación son específicas para una app y se pueden revocar en cualquier momento.
