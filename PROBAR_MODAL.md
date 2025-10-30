# 🧪 Cómo probar el Modal de Recomendación

El modal aparece cuando se cumplen TODAS estas condiciones:
1. ✅ El usuario NO tiene correo de recuperación en la BD
2. ✅ Es la primera vez que ve el modal (no existe `modal_recuperacion_mostrado` en localStorage)

## 📋 Opción 1: Probar con tu usuario actual

### Paso 1: Limpiar localStorage
1. Abre el navegador
2. Presiona **F12** (DevTools)
3. Ve a la pestaña **Console**
4. Escribe y ejecuta:
```javascript
localStorage.removeItem('modal_recuperacion_mostrado');
```

### Paso 2: Eliminar el correo de recuperación de la BD
1. Abre **phpMyAdmin**
2. Ve a la tabla `usuarios`
3. Busca tu usuario (`juan.arrietah@ucc.edu.co`)
4. Edita el registro
5. Pon `correo_recuperacion` = **NULL**
6. Guarda

### Paso 3: Cerrar sesión y volver a entrar
1. Cierra sesión en el sistema
2. Vuelve a iniciar sesión
3. Ve al **Perfil**
4. **¡Debería aparecer el modal!**

---

## 📋 Opción 2: Crear un usuario de prueba sin correo de recuperación

### Paso 1: Registrar un nuevo usuario
1. Ve a la página de registro
2. Selecciona rol (Estudiante o Profesor)
3. Regístrate con datos de prueba:
   - Correo: `test.usuario@ucc.edu.co`
   - Contraseña: `test12345`

### Paso 2: Iniciar sesión con el usuario nuevo
1. Inicia sesión con el usuario de prueba
2. Ve al **Perfil**
3. **¡El modal debería aparecer automáticamente!**

---

## 🔍 Verificar si el modal está funcionando

Si no aparece el modal, abre la consola (F12) y verifica:

### 1. Verifica que el usuario NO tenga correo de recuperación:
```javascript
let usuario = JSON.parse(localStorage.getItem('usuario'));
console.log('Correo recuperación:', usuario.correo_recuperacion);
// Debe mostrar: undefined o null
```

### 2. Verifica que el flag del modal NO exista:
```javascript
console.log('Modal mostrado:', localStorage.getItem('modal_recuperacion_mostrado'));
// Debe mostrar: null
```

### 3. Verifica que el modal exista en el DOM:
```javascript
console.log('Modal existe:', document.getElementById('modal-recomendacion'));
// Debe mostrar el elemento HTML
```

### 4. Forzar la aparición del modal (para pruebas):
```javascript
document.getElementById('modal-recomendacion').classList.add('show');
```

---

## ✅ Funcionamiento esperado del modal:

### Cuando aparece:
- Fondo oscuro semitransparente
- Caja blanca centrada con:
  - Icono naranja de advertencia
  - Título: "Seguridad de tu Cuenta"
  - Texto explicativo
  - 3 beneficios en lista
  - 2 botones: "Agregar Ahora" y "Recordar Después"

### Al dar click en "Agregar Ahora":
1. Modal desaparece
2. Cambia a modo de edición del perfil
3. Campo "Correo de Recuperación" se enfoca automáticamente
4. Se guarda `modal_recuperacion_mostrado = true` en localStorage

### Al dar click en "Recordar Después":
1. Modal desaparece
2. Se guarda `modal_recuperacion_mostrado = true` en localStorage
3. No se volverá a mostrar

---

## 🐛 Solución de problemas

### Problema: El modal no aparece
**Causa 1:** Ya se mostró antes
- **Solución:** Ejecutar en consola: `localStorage.removeItem('modal_recuperacion_mostrado');`

**Causa 2:** El usuario YA tiene correo de recuperación
- **Solución:** Eliminar el correo de recuperación en la BD o usar otro usuario

**Causa 3:** Error en JavaScript
- **Solución:** Abrir consola (F12) y ver si hay errores en rojo

### Problema: El modal aparece pero los botones no funcionan
**Solución:** Abrir consola (F12) y verificar errores. Asegurarse que `perfil.js` esté cargado.

### Problema: El modal aparece cada vez que entro al perfil
**Causa:** El localStorage no se está guardando
- **Solución:** Verificar que el navegador permita localStorage
- Ejecutar en consola: `localStorage.setItem('test', 'valor');`
- Luego: `console.log(localStorage.getItem('test'));`

---

## 📸 Captura de pantalla esperada

El modal debería verse así:

```
┌─────────────────────────────────────────────┐
│  ⚠️                                          │
│  Seguridad de tu Cuenta                     │
│                                              │
│  Te recomendamos agregar un correo de       │
│  recuperación para proteger tu cuenta.      │
│                                              │
│  Con un correo de recuperación podrás:      │
│  • Recuperar tu contraseña si la olvidas    │
│  • Mantener tu cuenta segura                │
│  • Recibir notificaciones importantes       │
│                                              │
│  [Agregar Ahora]  [Recordar Después]        │
└─────────────────────────────────────────────┘
```

---

## ✅ Checklist de verificación

- [ ] Modal aparece 1 segundo después de cargar el perfil
- [ ] Modal solo aparece si NO hay correo de recuperación
- [ ] Modal solo aparece UNA VEZ (no se repite)
- [ ] Botón "Agregar Ahora" cambia a modo edición
- [ ] Campo de correo de recuperación se enfoca automáticamente
- [ ] Botón "Recordar Después" cierra el modal
- [ ] Modal no aparece si ya se mostró antes
- [ ] Modal no aparece si ya existe correo de recuperación
