// JavaScript para Nueva Contraseña

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('nueva-password-form');
    const nuevaPasswordInput = document.getElementById('nueva-password');
    const confirmarPasswordInput = document.getElementById('confirmar-password');
    const errorMessage = document.getElementById('error-message');
    const successMessage = document.getElementById('success-message');
    const reqLength = document.getElementById('req-length');

    // Obtener email y código de la URL
    const urlParams = new URLSearchParams(window.location.search);
    const email = urlParams.get('email');
    const codigo = urlParams.get('codigo');

    if (!email || !codigo) {
        window.location.href = '../Recuperacion/index.html';
        return;
    }

    // Validación en tiempo real
    nuevaPasswordInput.addEventListener('input', () => {
        const password = nuevaPasswordInput.value;

        // Validar longitud
        if (password.length >= 8) {
            reqLength.classList.add('valid');
        } else {
            reqLength.classList.remove('valid');
        }
    });

    // Limpiar mensajes
    function limpiarMensajes() {
        errorMessage.classList.remove('show');
        successMessage.classList.remove('show');
        errorMessage.textContent = '';
        successMessage.textContent = '';
    }

    // Mostrar error
    function mostrarError(mensaje) {
        errorMessage.textContent = mensaje;
        errorMessage.classList.add('show');
    }

    // Manejar envío del formulario
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        limpiarMensajes();

        const nuevaPassword = nuevaPasswordInput.value.trim();
        const confirmarPassword = confirmarPasswordInput.value.trim();

        // Validaciones
        if (!nuevaPassword || !confirmarPassword) {
            mostrarError('Por favor, complete todos los campos.');
            return;
        }

        if (nuevaPassword.length < 8) {
            mostrarError('La contraseña debe tener al menos 8 caracteres.');
            return;
        }

        if (nuevaPassword !== confirmarPassword) {
            mostrarError('Las contraseñas no coinciden.');
            return;
        }

        try {
            const submitBtn = form.querySelector('.btn-cambiar');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Cambiando contraseña...';

            const response = await fetch('/api/recuperar-password/cambiar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email,
                    codigo,
                    nueva_password: nuevaPassword
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                successMessage.textContent = '¡Contraseña cambiada exitosamente! Redirigiendo al login...';
                successMessage.classList.add('show');

                // Redirigir al login después de 2 segundos
                setTimeout(() => {
                    window.location.href = '../Login/index.html';
                }, 2000);
            } else {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Cambiar Contraseña';

                if (response.status === 400 && data.message.includes('igual')) {
                    mostrarError('La nueva contraseña no puede ser igual a tu contraseña actual. Por favor, elige una diferente.');
                } else {
                    mostrarError(data.message || 'Error al cambiar la contraseña.');
                }
            }
        } catch (error) {
            console.error('Error al cambiar contraseña:', error);
            mostrarError('Error de conexión. Intente nuevamente.');

            const submitBtn = form.querySelector('.btn-cambiar');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Cambiar Contraseña';
        }
    });
});
