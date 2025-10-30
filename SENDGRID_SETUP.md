# 🚀 Configuración con SendGrid (Recomendación de Gemini)

SendGrid es un servicio profesional para enviar emails desde aplicaciones.
Es GRATIS hasta 100 emails/día (suficiente para empezar).

## 📝 Pasos para configurar SendGrid:

### 1. Crear cuenta en SendGrid
1. Ve a: https://signup.sendgrid.com/
2. Regístrate con tu correo
3. Verifica tu email
4. Completa el formulario (pon que es para "Educational Project")

### 2. Generar API Key
1. Una vez dentro, ve a: **Settings** > **API Keys**
2. Click en **Create API Key**
3. Nombre: "Sistema Reservas UCC"
4. Permisos: **Full Access**
5. Click **Create & View**
6. **COPIA LA API KEY** (solo la verás una vez)

### 3. Instalar dependencia en tu proyecto
```bash
cd backend
npm install @sendgrid/mail
```

### 4. Crear archivo .env
Crea un archivo llamado `.env` en la carpeta `backend`:

```
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=noreply@tudominio.com
```

### 5. Modificar server.js

En lugar de usar Nodemailer, usa SendGrid:

```javascript
// Al inicio del archivo, después de los otros requires
require('dotenv').config();
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Elimina o comenta toda la configuración de transporter de Nodemailer

// En el endpoint de solicitar código, reemplaza esta parte:
// await transporter.sendMail(mailOptions);

// Por esta:
const msg = {
    to: usuario.correo_recuperacion,  // El correo del usuario
    from: process.env.EMAIL_FROM || 'noreply@sistemaucc.com',
    subject: 'Código de Recuperación de Contraseña - UCC',
    html: `
        <div style="font-family: 'Lato', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #006FBF; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 24px;">Sistema de Reservas UCC</h1>
            </div>
            <div style="background-color: #f5f5f5; padding: 40px; border-radius: 0 0 8px 8px;">
                <h2 style="color: #333; margin-top: 0;">Hola, ${usuario.nombre_completo}</h2>
                <p style="color: #666; font-size: 16px; line-height: 1.6;">
                    Recibimos una solicitud para recuperar tu contraseña. Usa el siguiente código de verificación:
                </p>
                <div style="background-color: white; padding: 20px; text-align: center; border-radius: 8px; margin: 30px 0;">
                    <div style="font-size: 36px; font-weight: bold; color: #006FBF; letter-spacing: 8px;">
                        ${codigo}
                    </div>
                </div>
                <p style="color: #666; font-size: 14px; line-height: 1.6;">
                    Este código expirará en <strong>15 minutos</strong>.
                </p>
                <p style="color: #666; font-size: 14px; line-height: 1.6;">
                    Si no solicitaste este código, puedes ignorar este mensaje.
                </p>
                <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                <p style="color: #999; font-size: 12px; text-align: center;">
                    Universidad Cooperativa de Colombia<br>
                    Sistema de Reservas
                </p>
            </div>
        </div>
    `
};

await sgMail.send(msg);
console.log('✅ Email enviado a:', usuario.correo_recuperacion);
```

### 6. Agregar .env al .gitignore
Crea un archivo `.gitignore` en la raíz del proyecto:
```
.env
node_modules/
```

## ✅ Ventajas de SendGrid:

- ✅ **100 emails/día gratis** (vs 500 de Gmail, pero sin riesgo de bloqueo)
- ✅ **No necesitas contraseña de aplicación**
- ✅ **Mejor entregabilidad** (menos spam)
- ✅ **Estadísticas** (puedes ver qué emails se abrieron)
- ✅ **Profesional** (no expones tu correo personal)
- ✅ **Escalable** (si creces, solo cambias de plan)

## 🎯 Cómo funciona:

```
Usuario pone correo de recuperación: ejemplo@gmail.com
      ↓
Sistema genera código: 123456
      ↓
SendGrid envía email:
  FROM: noreply@sistemaucc.com (tu dominio)
  TO: ejemplo@gmail.com (el correo del USUARIO)
      ↓
Usuario recibe el email en su bandeja
```

## ❓ Preguntas frecuentes:

**P: ¿SendGrid envía a cualquier correo?**
R: Sí, Gmail, Outlook, Hotmail, Yahoo, etc.

**P: ¿El usuario necesita configurar algo?**
R: NO. Solo pone su email y recibe el código.

**P: ¿Es gratis?**
R: Sí, hasta 100 emails/día para siempre.

**P: ¿Puedo usar mi dominio personalizado?**
R: Sí, pero necesitas verificarlo en SendGrid primero.

## 🔄 Comparación: Gmail vs SendGrid

| Característica | Gmail | SendGrid |
|---------------|-------|----------|
| Configuración | 5 min | 10 min |
| Emails/día | 500 | 100 (gratis) |
| Entregabilidad | Media | Alta |
| Bloqueos | Posibles | Raros |
| Profesional | No | Sí |
| Escalable | No | Sí |
| Estadísticas | No | Sí |
