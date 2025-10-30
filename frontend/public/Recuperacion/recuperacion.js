// JavaScript para Recuperación de Contraseña - 2 Pasos

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('recuperacion-form');
    const emailInput = document.getElementById('email');
    const errorMessage = document.getElementById('error-message');
    const successMessage = document.getElementById('success-message');
    const modal = document.getElementById('modal-enviando');
    const emailCensurado = document.getElementById('email-censored');

    // Pasos
    const paso1 = document.getElementById('paso-1');
    const paso2 = document.getElementById('paso-2');

    // Botones
    const btnVerificar = document.getElementById('btn-verificar');
    const btnEnviarCodigo = document.getElementById('btn-enviar-codigo');
    const btnVolver = document.getElementById('btn-volver');

    // Display del correo de recuperación
    const correoRecuperacionDisplay = document.getElementById('correo-recuperacion-display');

    let emailActual = '';
    let correoRecuperacion = '';

    // Función para censurar email
    function censurarEmail(email) {
        const partes = email.split('@');
        if (partes.length !== 2) return email;

        const usuario = partes[0];
        const dominio = partes[1];

        // Censurar parte del usuario
        const usuarioCensurado = usuario.length > 2
            ? usuario[0] + '*'.repeat(usuario.length - 2) + usuario[usuario.length - 1]
            : usuario;

        // Censurar parte del dominio
        const dominioPartes = dominio.split('.');
        const dominioCensurado = dominioPartes.map((parte, index) => {
            if (index === 0 && parte.length > 2) {
                return parte[0] + '*'.repeat(parte.length - 2) + parte[parte.length - 1];
            }
            return parte;
        }).join('.');

        return `${usuarioCensurado}@${dominioCensurado}`;
    }

    // Limpiar mensajes
    function limpiarMensajes() {
        errorMessage.classList.remove('show');
        successMessage.classList.remove('show');
        errorMessage.innerHTML = '';
        successMessage.textContent = '';
    }

    // Mostrar error
    function mostrarError(mensaje) {
        errorMessage.innerHTML = mensaje;
        errorMessage.classList.add('show');
    }

    // PASO 1: Verificar correo y obtener correo de recuperación
    btnVerificar.addEventListener('click', async () => {
        limpiarMensajes();

        const email = emailInput.value.trim();

        // Validar email institucional
        if (!email.endsWith('@ucc.edu.co')) {
            mostrarError('Debe usar su correo institucional (@ucc.edu.co)');
            return;
        }

        try {
            btnVerificar.disabled = true;
            btnVerificar.textContent = 'Verificando...';

            // Verificar si el usuario existe y tiene correo de recuperación
            const response = await fetch('/api/recuperar-password/verificar-usuario', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // Usuario tiene correo de recuperación
                emailActual = email;
                correoRecuperacion = data.correo_recuperacion;

                // Mostrar correo censurado en el paso 2
                correoRecuperacionDisplay.textContent = censurarEmail(correoRecuperacion);

                // Cambiar al paso 2
                paso1.classList.remove('paso-activo');
                paso1.classList.add('paso-oculto');
                paso2.classList.remove('paso-oculto');
                paso2.classList.add('paso-activo');

            } else {
                btnVerificar.disabled = false;
                btnVerificar.textContent = 'Verificar Correo';

                if (response.status === 404) {
                    mostrarError('No se encontró un usuario con ese correo institucional.');
                } else if (response.status === 400) {
                    // Usuario no tiene correo de recuperación
                    mostrarError(`
                        <strong>⚠️ No tienes un correo de recuperación registrado.</strong><br><br>
                        Para poder recuperar tu contraseña, primero debes:<br>
                        1. Iniciar sesión con tu contraseña actual<br>
                        2. Ir a tu Perfil<br>
                        3. Agregar un correo de recuperación personal<br><br>
                        <a href="../Login/index.html" style="color: #006FBF; font-weight: 600; text-decoration: underline;">← Volver al login</a>
                    `);
                } else {
                    mostrarError(data.message || 'Error al verificar el correo.');
                }
            }
        } catch (error) {
            console.error('Error al verificar:', error);
            mostrarError('Error de conexión. Intente nuevamente.');
            btnVerificar.disabled = false;
            btnVerificar.textContent = 'Verificar Correo';
        }
    });

    // Botón volver al paso 1
    btnVolver.addEventListener('click', () => {
        paso2.classList.remove('paso-activo');
        paso2.classList.add('paso-oculto');
        paso1.classList.remove('paso-oculto');
        paso1.classList.add('paso-activo');

        btnVerificar.disabled = false;
        btnVerificar.textContent = 'Verificar Correo';
        limpiarMensajes();
    });

    // PASO 2: Enviar código al correo de recuperación
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        limpiarMensajes();

        try {
            btnEnviarCodigo.disabled = true;
            btnEnviarCodigo.textContent = 'Enviando código...';

            const response = await fetch('/api/recuperar-password/solicitar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email: emailActual })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // Mostrar modal con email censurado
                emailCensurado.textContent = `A: ${censurarEmail(data.email_destino)}`;
                modal.classList.add('show');

                // Esperar 2 segundos y redirigir a verificación
                setTimeout(() => {
                    window.location.href = `../Verificacion/index.html?email=${encodeURIComponent(emailActual)}`;
                }, 2000);
            } else {
                btnEnviarCodigo.disabled = false;
                btnEnviarCodigo.textContent = 'Enviar Código de Verificación';
                mostrarError(data.message || 'Error al enviar el código de verificación.');
            }
        } catch (error) {
            console.error('Error al enviar código:', error);
            mostrarError('Error de conexión. Intente nuevamente.');
            btnEnviarCodigo.disabled = false;
            btnEnviarCodigo.textContent = 'Enviar Código de Verificación';
        }
    });
});
