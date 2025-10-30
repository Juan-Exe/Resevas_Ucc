// Sistema de Notificaciones para Usuarios
// Este script se ejecuta en todas las páginas excepto Login y Registro

(function() {
    // Solo ejecutar si hay un usuario logueado
    const usuarioStr = localStorage.getItem('usuario');
    if (!usuarioStr) return;

    const usuario = JSON.parse(usuarioStr);

    // No verificar notificaciones para administradores
    if (usuario.rol === 'Administrador') return;

    // Verificar notificaciones al cargar la página
    verificarNotificaciones();

    // Funciones
    async function verificarNotificaciones() {
        try {
            const response = await fetch(`/api/notificaciones/${usuario.id}`);
            const data = await response.json();

            if (response.ok && data.success && data.notificaciones.length > 0) {
                // Mostrar cada notificación
                data.notificaciones.forEach((notif, index) => {
                    setTimeout(() => {
                        mostrarNotificacion(notif);
                    }, index * 500); // Mostrar con 500ms de diferencia entre cada una
                });
            }
        } catch (error) {
            console.error('Error al verificar notificaciones:', error);
        }
    }

    function mostrarNotificacion(notificacion) {
        // Crear modal
        const modal = document.createElement('div');
        modal.className = 'notificacion-modal';
        modal.innerHTML = `
            <div class="notificacion-contenido ${notificacion.tipo}">
                <div class="notificacion-header">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                        ${notificacion.tipo === 'aceptada'
                            ? '<path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
                            : '<path d="M12 8V12M12 16H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
                        }
                    </svg>
                    <h3>${notificacion.tipo === 'aceptada' ? 'Reserva Aceptada' : 'Reserva Rechazada'}</h3>
                </div>
                <p>${notificacion.mensaje}</p>
                <button class="btn-notif-cerrar" data-id="${notificacion.id}">Entendido</button>
            </div>
        `;

        document.body.appendChild(modal);

        // Animar entrada
        setTimeout(() => modal.classList.add('show'), 10);

        // Event listener para cerrar
        const btnCerrar = modal.querySelector('.btn-notif-cerrar');
        btnCerrar.addEventListener('click', () => cerrarNotificacion(modal, notificacion.id));

        // Cerrar automáticamente después de 10 segundos
        setTimeout(() => {
            if (document.body.contains(modal)) {
                cerrarNotificacion(modal, notificacion.id);
            }
        }, 10000);
    }

    async function cerrarNotificacion(modal, notificacionId) {
        // Animar salida
        modal.classList.remove('show');

        setTimeout(() => {
            if (document.body.contains(modal)) {
                document.body.removeChild(modal);
            }
        }, 300);

        // Marcar como leída en el backend
        try {
            await fetch('/api/notificaciones/marcar-leida', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ notificacion_id: notificacionId })
            });
        } catch (error) {
            console.error('Error al marcar notificación como leída:', error);
        }
    }

    // Agregar estilos CSS dinámicamente
    if (!document.getElementById('notificaciones-styles')) {
        const styles = document.createElement('style');
        styles.id = 'notificaciones-styles';
        styles.textContent = `
            .notificacion-modal {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                opacity: 0;
                transform: translateX(400px);
                transition: all 0.3s ease;
            }

            .notificacion-modal.show {
                opacity: 1;
                transform: translateX(0);
            }

            .notificacion-contenido {
                background: white;
                border-radius: 8px;
                padding: 24px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
                max-width: 400px;
                border-left: 4px solid;
            }

            .notificacion-contenido.aceptada {
                border-left-color: #4CAF50;
            }

            .notificacion-contenido.rechazada {
                border-left-color: #F44336;
            }

            .notificacion-header {
                display: flex;
                align-items: center;
                gap: 12px;
                margin-bottom: 12px;
            }

            .notificacion-header svg {
                flex-shrink: 0;
            }

            .notificacion-contenido.aceptada svg {
                stroke: #4CAF50;
            }

            .notificacion-contenido.rechazada svg {
                stroke: #F44336;
            }

            .notificacion-header h3 {
                margin: 0;
                font-size: 18px;
                font-weight: 600;
                color: #333;
            }

            .notificacion-contenido p {
                margin: 0 0 16px 0;
                font-size: 14px;
                color: #727272;
                line-height: 1.5;
            }

            .btn-notif-cerrar {
                width: 100%;
                padding: 10px;
                background: #006FBF;
                color: white;
                border: none;
                border-radius: 5px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: background 0.2s;
                font-family: 'Lato', sans-serif;
            }

            .btn-notif-cerrar:hover {
                background: #005A9E;
            }

            @media (max-width: 768px) {
                .notificacion-modal {
                    top: 10px;
                    right: 10px;
                    left: 10px;
                }

                .notificacion-contenido {
                    max-width: none;
                }
            }
        `;
        document.head.appendChild(styles);
    }
})();
