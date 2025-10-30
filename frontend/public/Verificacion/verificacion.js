// JavaScript para Verificación de Código

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('verificacion-form');
    const digitInputs = document.querySelectorAll('.codigo-digit');
    const errorMessage = document.getElementById('error-message');
    const successMessage = document.getElementById('success-message');
    const btnReenviar = document.getElementById('btn-reenviar');
    const tiempoRestante = document.getElementById('tiempo-restante');

    // Obtener email de la URL
    const urlParams = new URLSearchParams(window.location.search);
    const email = urlParams.get('email');

    if (!email) {
        window.location.href = '../Recuperacion/index.html';
        return;
    }

    // Temporizador de 15 minutos
    let tiempoExpiracion = 15 * 60; // 15 minutos en segundos

    function actualizarTemporizador() {
        const minutos = Math.floor(tiempoExpiracion / 60);
        const segundos = tiempoExpiracion % 60;
        tiempoRestante.textContent = `${minutos}:${segundos.toString().padStart(2, '0')}`;

        if (tiempoExpiracion <= 0) {
            mostrarError('El código ha expirado. Por favor, solicita uno nuevo.');
            digitInputs.forEach(input => input.disabled = true);
            return;
        }

        tiempoExpiracion--;
    }

    const temporizador = setInterval(actualizarTemporizador, 1000);

    // Auto-focus y navegación entre inputs
    digitInputs.forEach((input, index) => {
        input.addEventListener('input', (e) => {
            const valor = e.target.value;

            // Solo permitir números
            if (!/^\d*$/.test(valor)) {
                e.target.value = '';
                return;
            }

            // Agregar clase cuando se llena
            if (valor) {
                input.classList.add('filled');
                // Mover al siguiente input
                if (index < digitInputs.length - 1) {
                    digitInputs[index + 1].focus();
                }
            } else {
                input.classList.remove('filled');
            }
        });

        // Manejo de borrado
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !input.value && index > 0) {
                digitInputs[index - 1].focus();
                digitInputs[index - 1].value = '';
                digitInputs[index - 1].classList.remove('filled');
            }
        });

        // Pegar código completo
        input.addEventListener('paste', (e) => {
            e.preventDefault();
            const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);

            pastedData.split('').forEach((digit, i) => {
                if (digitInputs[i]) {
                    digitInputs[i].value = digit;
                    digitInputs[i].classList.add('filled');
                }
            });

            if (pastedData.length === 6) {
                digitInputs[5].focus();
            }
        });
    });

    // Auto-focus en el primer input
    digitInputs[0].focus();

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

    // Obtener código completo
    function obtenerCodigo() {
        return Array.from(digitInputs).map(input => input.value).join('');
    }

    // Manejar envío del formulario
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        limpiarMensajes();

        const codigo = obtenerCodigo();

        if (codigo.length !== 6) {
            mostrarError('Por favor, ingresa los 6 dígitos del código.');
            return;
        }

        try {
            const submitBtn = form.querySelector('.btn-verificar');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Verificando...';

            const response = await fetch('/api/recuperar-password/verificar-codigo', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, codigo })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                clearInterval(temporizador);
                successMessage.textContent = 'Código verificado correctamente. Redirigiendo...';
                successMessage.classList.add('show');

                setTimeout(() => {
                    window.location.href = `../NuevaPassword/index.html?email=${encodeURIComponent(email)}&codigo=${codigo}`;
                }, 1500);
            } else {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Verificar Código';
                mostrarError(data.message || 'Código inválido o expirado.');

                // Limpiar inputs
                digitInputs.forEach(input => {
                    input.value = '';
                    input.classList.remove('filled');
                });
                digitInputs[0].focus();
            }
        } catch (error) {
            console.error('Error en la verificación:', error);
            mostrarError('Error de conexión. Intente nuevamente.');

            const submitBtn = form.querySelector('.btn-verificar');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Verificar Código';
        }
    });

    // Reenviar código
    btnReenviar.addEventListener('click', async () => {
        limpiarMensajes();
        btnReenviar.disabled = true;
        btnReenviar.textContent = 'Reenviando...';

        try {
            const response = await fetch('/api/recuperar-password/solicitar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                successMessage.textContent = 'Código reenviado exitosamente. Revisa tu correo.';
                successMessage.classList.add('show');

                // Reiniciar temporizador
                tiempoExpiracion = 15 * 60;

                // Limpiar inputs
                digitInputs.forEach(input => {
                    input.value = '';
                    input.classList.remove('filled');
                    input.disabled = false;
                });
                digitInputs[0].focus();

                setTimeout(() => {
                    btnReenviar.disabled = false;
                    btnReenviar.textContent = 'Reenviar código';
                }, 30000); // Permitir reenvío después de 30 segundos
            } else {
                mostrarError(data.message || 'Error al reenviar el código.');
                btnReenviar.disabled = false;
                btnReenviar.textContent = 'Reenviar código';
            }
        } catch (error) {
            console.error('Error al reenviar código:', error);
            mostrarError('Error de conexión. Intente nuevamente.');
            btnReenviar.disabled = false;
            btnReenviar.textContent = 'Reenviar código';
        }
    });
});
