document.addEventListener('DOMContentLoaded', () => {
    // Elementos del DOM
    const perfilVista = document.getElementById('perfil-vista');
    const perfilEdicion = document.getElementById('perfil-edicion');
    const btnEditar = document.getElementById('btn-editar');
    const btnCancelar = document.getElementById('btn-cancelar');
    const formEditar = document.getElementById('form-editar-perfil');
    const nuevaImagenInput = document.getElementById('nueva-imagen');
    const errorMessage = document.getElementById('error-message');
    const successMessage = document.getElementById('success-message');

    // Modal de recomendación
    const modalRecomendacion = document.getElementById('modal-recomendacion');
    const btnAgregarCorreo = document.getElementById('btn-agregar-correo');
    const btnDespues = document.getElementById('btn-despues');

    let usuarioActual = null;
    let imagenCambiada = false;

    // Cargar datos del usuario
    function cargarDatosUsuario() {
        const usuarioStr = localStorage.getItem('usuario');
        if (usuarioStr) {
            usuarioActual = JSON.parse(usuarioStr);
            mostrarDatosVista();
            cargarDatosFormulario();
            verificarCorreoRecuperacion();
        }
    }

    // Verificar si debe mostrar modal de recomendación
    function verificarCorreoRecuperacion() {
        // Key única por usuario y sesión
        const modalKey = `modal_recuperacion_mostrado_${usuarioActual.id}_sesion`;
        const modalMostrado = sessionStorage.getItem(modalKey);
        const tieneCorreoRecuperacion = usuarioActual.correo_recuperacion;

        // Mostrar modal una vez por sesión si no tiene correo de recuperación
        if (!modalMostrado && !tieneCorreoRecuperacion) {
            setTimeout(() => {
                modalRecomendacion.classList.add('show');
            }, 1000); // Esperar 1 segundo después de cargar la página
        }
    }

    // Botón "Agregar Ahora" - Abre el modo de edición
    btnAgregarCorreo.addEventListener('click', () => {
        modalRecomendacion.classList.remove('show');

        // Marcar como mostrado para esta sesión y este usuario
        const modalKey = `modal_recuperacion_mostrado_${usuarioActual.id}_sesion`;
        sessionStorage.setItem(modalKey, 'true');

        // Cambiar a modo edición y enfocar el campo de correo de recuperación
        perfilVista.classList.add('hidden');
        perfilEdicion.classList.remove('hidden');

        setTimeout(() => {
            document.getElementById('correo-recuperacion').focus();
            document.getElementById('correo-recuperacion').scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
    });

    // Botón "Recordar Después"
    btnDespues.addEventListener('click', () => {
        modalRecomendacion.classList.remove('show');

        // Marcar como mostrado para esta sesión y este usuario
        const modalKey = `modal_recuperacion_mostrado_${usuarioActual.id}_sesion`;
        sessionStorage.setItem(modalKey, 'true');
    });

    // Mostrar datos en la vista
    function mostrarDatosVista() {
        const fotoPerfil = usuarioActual.imagen_perfil === 'default-avatar.svg' || usuarioActual.imagen_perfil === 'default-avatar.jpg'
            ? '../I-img/default-avatar.svg'
            : `../I-img/uploads/${usuarioActual.imagen_perfil}`;

        document.getElementById('foto-perfil-vista').src = fotoPerfil;
        document.getElementById('nombre-vista').textContent = usuarioActual.nombre_completo;
        document.getElementById('usuario-vista').textContent = `@${usuarioActual.nombre_usuario}`;
        document.getElementById('email-vista').textContent = usuarioActual.email;
        document.getElementById('rol-vista').textContent = usuarioActual.rol || 'Estudiante';
    }

    // Cargar datos en el formulario
    function cargarDatosFormulario() {
        const fotoPerfil = usuarioActual.imagen_perfil === 'default-avatar.svg' || usuarioActual.imagen_perfil === 'default-avatar.jpg'
            ? '../I-img/default-avatar.svg'
            : `../I-img/uploads/${usuarioActual.imagen_perfil}`;

        document.getElementById('foto-perfil-edicion').src = fotoPerfil;
        document.getElementById('nombre-completo').value = usuarioActual.nombre_completo;
        document.getElementById('nombre-usuario').value = usuarioActual.nombre_usuario;
        document.getElementById('email').value = usuarioActual.email;
        document.getElementById('correo-recuperacion').value = usuarioActual.correo_recuperacion || '';
    }

    // Cambiar a modo edición
    btnEditar.addEventListener('click', () => {
        perfilVista.classList.add('hidden');
        perfilEdicion.classList.remove('hidden');
        limpiarMensajes();
    });

    // Cancelar edición
    btnCancelar.addEventListener('click', () => {
        perfilEdicion.classList.add('hidden');
        perfilVista.classList.remove('hidden');
        cargarDatosFormulario();
        limpiarCamposPassword();
        limpiarMensajes();
        imagenCambiada = false;
    });

    // Preview de nueva imagen
    nuevaImagenInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                document.getElementById('foto-perfil-edicion').src = e.target.result;
                imagenCambiada = true;
            };
            reader.readAsDataURL(file);
        }
    });

    // Guardar cambios
    formEditar.addEventListener('submit', async (e) => {
        e.preventDefault();
        limpiarMensajes();

        const nombreCompleto = document.getElementById('nombre-completo').value.trim();
        const nombreUsuario = document.getElementById('nombre-usuario').value.trim();
        const correoRecuperacion = document.getElementById('correo-recuperacion').value.trim();
        const passwordActual = document.getElementById('password-actual').value;
        const passwordNueva = document.getElementById('password-nueva').value;
        const passwordConfirmar = document.getElementById('password-confirmar').value;

        // Validaciones
        if (!nombreCompleto || !nombreUsuario) {
            mostrarError('Por favor, complete todos los campos obligatorios.');
            return;
        }

        // Validar cambio de contraseña SOLO si se quiere cambiar
        const quiereCambiarPassword = passwordNueva || passwordConfirmar;
        
        if (quiereCambiarPassword) {
            if (!passwordActual) {
                mostrarError('Debes ingresar tu contraseña actual para cambiarla.');
                return;
            }
            if (!passwordNueva || !passwordConfirmar) {
                mostrarError('Debes completar la nueva contraseña y su confirmación.');
                return;
            }
            if (passwordNueva.length < 6) {
                mostrarError('La nueva contraseña debe tener al menos 6 caracteres.');
                return;
            }
            if (passwordNueva !== passwordConfirmar) {
                mostrarError('Las contraseñas nuevas no coinciden.');
                return;
            }
        }
        
        // Si solo se llenó la contraseña actual, limpiarla
        if (passwordActual && !passwordNueva && !passwordConfirmar) {
            document.getElementById('password-actual').value = '';
        }

        // Preparar datos
        const formData = new FormData();
        formData.append('nombre_completo', nombreCompleto);
        formData.append('nombre_usuario', nombreUsuario);
        formData.append('correo_recuperacion', correoRecuperacion);

        // Solo enviar contraseñas si se quiere cambiar
        if (quiereCambiarPassword && passwordActual && passwordNueva) {
            formData.append('password_actual', passwordActual);
            formData.append('password_nueva', passwordNueva);
        }

        if (imagenCambiada && nuevaImagenInput.files[0]) {
            formData.append('imagen_perfil', nuevaImagenInput.files[0]);
        }

        try {
            const submitBtn = formEditar.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Guardando...';

            const response = await fetch('/api/actualizar-perfil', {
                method: 'PUT',
                headers: {
                    'user-data': JSON.stringify(usuarioActual)
                },
                body: formData
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // Actualizar localStorage
                localStorage.setItem('usuario', JSON.stringify(data.usuario));
                usuarioActual = data.usuario;

                // Actualizar vista
                mostrarDatosVista();
                
                // Actualizar sidebar
                const imgSidebar = document.querySelector('.res-prof-img img');
                const labelsSidebar = document.querySelectorAll('.res-prof-lab label');
                if (imgSidebar) {
                    const rutaImagen = data.usuario.imagen_perfil === 'default-avatar.svg' || data.usuario.imagen_perfil === 'default-avatar.jpg'
                        ? '../I-img/default-avatar.svg'
                        : `../I-img/uploads/${data.usuario.imagen_perfil}`;
                    imgSidebar.src = rutaImagen;
                }
                if (labelsSidebar.length >= 2) {
                    labelsSidebar[0].textContent = data.usuario.nombre_completo;
                    labelsSidebar[1].textContent = data.usuario.nombre_usuario;
                }

                mostrarExito('¡Perfil actualizado exitosamente!');
                limpiarCamposPassword();
                imagenCambiada = false;

                setTimeout(() => {
                    perfilEdicion.classList.add('hidden');
                    perfilVista.classList.remove('hidden');
                }, 2000);
            } else {
                mostrarError(data.message || 'Error al actualizar el perfil.');
            }

            submitBtn.disabled = false;
            submitBtn.textContent = 'Guardar Cambios';

        } catch (error) {
            console.error('Error:', error);
            mostrarError('Error de conexión. Intente nuevamente.');
            const submitBtn = formEditar.querySelector('button[type="submit"]');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Guardar Cambios';
        }
    });

    // Funciones auxiliares
    function limpiarMensajes() {
        errorMessage.classList.remove('show');
        successMessage.classList.remove('show');
        errorMessage.textContent = '';
        successMessage.textContent = '';
    }

    function mostrarError(mensaje) {
        errorMessage.textContent = mensaje;
        errorMessage.classList.add('show');
        successMessage.classList.remove('show');
    }

    function mostrarExito(mensaje) {
        successMessage.textContent = mensaje;
        successMessage.classList.add('show');
        errorMessage.classList.remove('show');
    }

    function limpiarCamposPassword() {
        document.getElementById('password-actual').value = '';
        document.getElementById('password-nueva').value = '';
        document.getElementById('password-confirmar').value = '';
    }

    // Cargar datos al iniciar
    cargarDatosUsuario();
});
