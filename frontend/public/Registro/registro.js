document.addEventListener('DOMContentLoaded', () => {
    const registroForm = document.getElementById('registro-form');
    const errorMessage = document.getElementById('error-message');
    const successMessage = document.getElementById('success-message');
    const imagenInput = document.getElementById('imagen_perfil');
    const preview = document.getElementById('preview');
    const rolDisplay = document.getElementById('rol-display');
    const rolInput = document.getElementById('rol');

    // Obtener el rol de la URL
    const urlParams = new URLSearchParams(window.location.search);
    const rol = urlParams.get('rol');

    // Verificar si hay un rol seleccionado
    if (!rol || (rol !== 'Estudiante' && rol !== 'Profesor')) {
        // Si no hay rol o no es válido, redirigir a la página de selección
        window.location.href = '../SeleccionRol/index.html';
        return;
    }

    // Mostrar el rol seleccionado
    rolDisplay.textContent = `Registrándote como: ${rol}`;
    rolInput.value = rol;

    // Preview de imagen
    imagenInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                preview.src = e.target.result;
                preview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        } else {
            preview.style.display = 'none';
        }
    });

    registroForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Limpiar mensajes
        errorMessage.classList.remove('show');
        successMessage.classList.remove('show');
        errorMessage.textContent = '';
        successMessage.textContent = '';

        // Obtener datos del formulario
        const nombreCompleto = document.getElementById('nombre_completo').value.trim();
        const nombreUsuario = document.getElementById('nombre_usuario').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm_password').value;
        const imagenFile = imagenInput.files[0];

        // Validaciones
        if (!nombreCompleto || !nombreUsuario || !email || !password || !confirmPassword) {
            errorMessage.textContent = 'Por favor, complete todos los campos obligatorios.';
            errorMessage.classList.add('show');
            return;
        }

        if (!email.endsWith('@ucc.edu.co')) {
            errorMessage.textContent = 'Debe usar su correo institucional (@ucc.edu.co)';
            errorMessage.classList.add('show');
            return;
        }

        if (password.length < 6) {
            errorMessage.textContent = 'La contraseña debe tener al menos 6 caracteres.';
            errorMessage.classList.add('show');
            return;
        }

        if (password !== confirmPassword) {
            errorMessage.textContent = 'Las contraseñas no coinciden.';
            errorMessage.classList.add('show');
            return;
        }

        // Preparar datos para enviar
        const formData = new FormData();
        formData.append('nombre_completo', nombreCompleto);
        formData.append('nombre_usuario', nombreUsuario);
        formData.append('email', email);
        formData.append('password', password);
        formData.append('rol', rolInput.value);

        if (imagenFile) {
            formData.append('imagen_perfil', imagenFile);
        }

        try {
            const submitBtn = registroForm.querySelector('.btn-registro');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Creando cuenta...';

            const response = await fetch('/api/registro', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (response.ok && data.success) {
                successMessage.textContent = '¡Cuenta creada exitosamente! Redirigiendo al login...';
                successMessage.classList.add('show');
                
                setTimeout(() => {
                    window.location.href = '../Login/index.html';
                }, 2000);
            } else {
                errorMessage.textContent = data.message || 'Error al crear la cuenta.';
                errorMessage.classList.add('show');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Crear Cuenta';
            }
        } catch (error) {
            console.error('Error en el registro:', error);
            errorMessage.textContent = 'Error de conexión. Intente nuevamente.';
            errorMessage.classList.add('show');
            
            const submitBtn = registroForm.querySelector('.btn-registro');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Crear Cuenta';
        }
    });
});
