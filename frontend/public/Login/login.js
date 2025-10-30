document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const errorMessage = document.getElementById('error-message');
    const linkRecuperar = document.getElementById('link-recuperar');
    const modalRecuperacion = document.getElementById('modal-recuperacion');
    const emailDestinoModal = document.getElementById('email-destino-modal');

    // Manejar envío del formulario de login
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Limpiar mensaje de error
        errorMessage.classList.remove('show');
        errorMessage.textContent = '';

        // Obtener datos del formulario
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const remember = document.getElementById('remember').checked;

        // Validación básica
        if (!email || !password) {
            errorMessage.textContent = 'Por favor, complete todos los campos.';
            errorMessage.classList.add('show');
            return;
        }

        // Validar que sea correo UCC
        if (!email.endsWith('@ucc.edu.co')) {
            errorMessage.textContent = 'Debe usar su correo institucional (@ucc.edu.co)';
            errorMessage.classList.add('show');
            return;
        }

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password, remember }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // Login exitoso
                localStorage.setItem('usuario', JSON.stringify(data.usuario));

                // Redirigir según el rol del usuario
                if (data.usuario.rol === 'Administrador') {
                    window.location.href = '../Admin/index.html';
                } else {
                    window.location.href = '../index.html';
                }
            } else {
                errorMessage.textContent = data.message || 'Error al iniciar sesión. Verifique sus credenciales.';
                errorMessage.classList.add('show');
            }
        } catch (error) {
            console.error('Error en el login:', error);
            errorMessage.textContent = 'Error de conexión. Intente nuevamente.';
            errorMessage.classList.add('show');
        }
    });

    // Manejar recuperación de contraseña
    linkRecuperar.addEventListener('click', async (e) => {
        e.preventDefault();

        // Limpiar mensajes
        errorMessage.classList.remove('show');
        errorMessage.textContent = '';

        // Obtener email del input
        const email = document.getElementById('email').value.trim();

        // Validar que haya email
        if (!email) {
            errorMessage.textContent = 'Por favor, ingrese su correo institucional para recuperar su contraseña.';
            errorMessage.classList.add('show');
            return;
        }

        // Validar que sea correo UCC
        if (!email.endsWith('@ucc.edu.co')) {
            errorMessage.textContent = 'Debe usar su correo institucional (@ucc.edu.co)';
            errorMessage.classList.add('show');
            return;
        }

        try {
            // Verificar si el usuario tiene correo de recuperación
            const verificarResponse = await fetch('/api/recuperar-password/verificar-usuario', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ correo_institucional: email })
            });

            const verificarData = await verificarResponse.json();

            if (!verificarResponse.ok || !verificarData.success) {
                errorMessage.textContent = verificarData.message || 'Usuario no encontrado o sin correo de recuperación. Por favor, agregue un correo de recuperación en su perfil.';
                errorMessage.classList.add('show');
                return;
            }

            // Enviar código de verificación
            const solicitarResponse = await fetch('/api/recuperar-password/solicitar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ usuario_id: verificarData.usuario_id })
            });

            const solicitarData = await solicitarResponse.json();

            if (solicitarResponse.ok && solicitarData.success) {
                // Mostrar modal con correo censurado
                emailDestinoModal.textContent = verificarData.correo_recuperacion_censurado;
                modalRecuperacion.classList.add('show');

                // Redirigir a página de verificación después de 2 segundos
                setTimeout(() => {
                    window.location.href = `../Verificacion/index.html?email=${encodeURIComponent(email)}`;
                }, 2000);
            } else {
                errorMessage.textContent = solicitarData.message || 'Error al enviar el código. Intente nuevamente.';
                errorMessage.classList.add('show');
            }
        } catch (error) {
            console.error('Error en recuperación de contraseña:', error);
            errorMessage.textContent = 'Error de conexión. Intente nuevamente.';
            errorMessage.classList.add('show');
        }
    });
});
