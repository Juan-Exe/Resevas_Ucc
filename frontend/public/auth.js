// auth.js - Script para manejar la autenticación en todas las páginas

// Función para obtener el usuario actual de localStorage
function getUsuarioActual() {
    const usuarioStr = localStorage.getItem('usuario');
    return usuarioStr ? JSON.parse(usuarioStr) : null;
}

// Función para actualizar el perfil en el header
function actualizarPerfilHeader() {
    const usuario = getUsuarioActual();
    
    if (!usuario) {
        // Redirigir al login si no hay sesión
        if (!window.location.pathname.includes('/Login/') && !window.location.pathname.includes('/Registro/')) {
            window.location.href = '/Login/index.html';
        }
        return;
    }

    // Actualizar imagen de perfil
    const imgPerfil = document.querySelector('.res-prof-img img');
    if (imgPerfil) {
        const rutaImagen = usuario.imagen_perfil.includes('default') 
            ? 'I-img/default-avatar.jpg' 
            : `I-img/uploads/${usuario.imagen_perfil}`;
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

// Función para cerrar sesión
function cerrarSesion() {
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

// Verificar sesión al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    // No verificar en páginas de login y registro
    if (window.location.pathname.includes('/Login/') || window.location.pathname.includes('/Registro/')) {
        return;
    }

    actualizarPerfilHeader();
});
