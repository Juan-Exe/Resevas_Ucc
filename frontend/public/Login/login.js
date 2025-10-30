document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const errorMessage = document.getElementById('error-message');

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
                window.location.href = '../index.html';
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
});
