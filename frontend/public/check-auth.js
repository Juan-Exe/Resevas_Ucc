// Middleware de autenticación para proteger páginas
// Este script debe incluirse en todas las páginas que requieran login

(function() {
    'use strict';

    // Verificar si estamos en una página pública (Login o Registro)
    const paginasPublicas = ['/Login/', '/Registro/'];
    const rutaActual = window.location.pathname;
    
    const esPaginaPublica = paginasPublicas.some(pagina => rutaActual.includes(pagina));

    // Si no es una página pública, verificar autenticación
    if (!esPaginaPublica) {
        const usuario = localStorage.getItem('usuario');
        
        if (!usuario) {
            // No hay sesión, redirigir al login
            window.location.href = '/Login/index.html';
            return;
        }

        try {
            const usuarioData = JSON.parse(usuario);

            // Verificar que los datos del usuario sean válidos
            if (!usuarioData.id || !usuarioData.nombre_usuario) {
                localStorage.removeItem('usuario');
                window.location.href = '/Login/index.html';
                return;
            }

            // Si es administrador y está en la página principal de reservas, redirigir al panel admin
            if (usuarioData.rol === 'Administrador' && rutaActual === '/index.html') {
                window.location.href = '/Admin/index.html';
                return;
            }

            // Si NO es administrador y está en el panel admin, redirigir a reservas
            if (usuarioData.rol !== 'Administrador' && rutaActual.includes('/Admin/')) {
                window.location.href = '/index.html';
                return;
            }

            // Actualizar la interfaz con los datos del usuario
            actualizarPerfilUsuario(usuarioData);
            
        } catch (error) {
            console.error('Error al parsear datos de usuario:', error);
            localStorage.removeItem('usuario');
            window.location.href = '/Login/index.html';
        }
    }

    function actualizarPerfilUsuario(usuario) {
        // Actualizar imagen de perfil
        const imgPerfil = document.querySelector('.res-prof-img img');
        if (imgPerfil) {
            const rutaImagen = usuario.imagen_perfil === 'default-avatar.svg' || usuario.imagen_perfil === 'default-avatar.jpg'
                ? '/I-img/default-avatar.svg' 
                : `/I-img/uploads/${usuario.imagen_perfil}`;
            imgPerfil.src = rutaImagen;
            imgPerfil.alt = usuario.nombre_completo;
        }

        // Actualizar labels de perfil
        const labels = document.querySelectorAll('.res-prof-lab label');
        if (labels.length >= 2) {
            labels[0].textContent = usuario.nombre_completo;
            labels[1].textContent = usuario.nombre_usuario;
        }
    }

    // Función global para cerrar sesión
    window.cerrarSesion = function() {
        if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
            fetch('/api/logout', { method: 'POST' })
                .then(response => response.json())
                .then(data => {
                    localStorage.removeItem('usuario');
                    window.location.href = '/Login/index.html';
                })
                .catch(error => {
                    console.error('Error al cerrar sesión:', error);
                    localStorage.removeItem('usuario');
                    window.location.href = '/Login/index.html';
                });
        }
    };

})();
