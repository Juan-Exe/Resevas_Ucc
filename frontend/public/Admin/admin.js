document.addEventListener('DOMContentLoaded', () => {
    // Verificar que el usuario sea administrador
    const usuarioStr = localStorage.getItem('usuario');
    if (!usuarioStr) {
        window.location.href = '../Login/index.html';
        return;
    }

    const usuario = JSON.parse(usuarioStr);
    if (usuario.rol !== 'Administrador') {
        alert('Acceso denegado. Solo administradores pueden acceder a esta página.');
        window.location.href = '../index.html';
        return;
    }

    // Elementos del DOM
    const reservasList = document.getElementById('reservas-list');
    const totalPendientes = document.getElementById('total-pendientes');
    const btnRefresh = document.getElementById('btn-refresh');
    const btnLogout = document.getElementById('btn-logout');
    const messageContainer = document.getElementById('message-container');

    // Actualizar sidebar
    document.getElementById('sidebar-nombre').textContent = usuario.nombre_completo;
    document.getElementById('sidebar-usuario').textContent = usuario.nombre_usuario;
    if (usuario.imagen_perfil && usuario.imagen_perfil !== 'default-avatar.svg') {
        document.getElementById('sidebar-foto').src = `../I-img/uploads/${usuario.imagen_perfil}`;
    }

    // Cargar reservas al iniciar
    cargarReservas();

    // Event listeners
    btnRefresh.addEventListener('click', cargarReservas);
    btnLogout.addEventListener('click', cerrarSesion);

    // Función para cargar reservas pendientes
    async function cargarReservas() {
        try {
            mostrarLoading(true);
            ocultarMensaje();

            const response = await fetch('/api/admin/reservas/pendientes');
            const data = await response.json();

            if (response.ok && data.success) {
                totalPendientes.textContent = data.reservas.length;
                mostrarReservas(data.reservas);
            } else {
                mostrarError('Error al cargar reservas: ' + (data.message || 'Error desconocido'));
                mostrarReservas([]);
            }
        } catch (error) {
            console.error('Error al cargar reservas:', error);
            mostrarError('Error de conexión al cargar reservas.');
            mostrarReservas([]);
        }
    }

    // Función para mostrar reservas
    function mostrarReservas(reservas) {
        mostrarLoading(false);

        if (reservas.length === 0) {
            reservasList.innerHTML = `
                <div class="empty-state">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M9 11H15M9 15H15M21 12C21 13.78 21 14.67 20.74 15.37C20.5073 15.9831 20.1203 16.5263 19.6136 16.9468C19.107 17.3673 18.4977 17.6511 17.85 17.77C17.11 18 16.21 18 14.43 18H9.57C7.79 18 6.89 18 6.15 17.77C5.50228 17.6511 4.89301 17.3673 4.38638 16.9468C3.87974 16.5263 3.49275 15.9831 3.26 15.37C3 14.67 3 13.78 3 12V8.2C3 7.08 3 6.52 3.218 6.092C3.40974 5.71569 3.71569 5.40974 4.092 5.218C4.52 5 5.08 5 6.2 5H17.8C18.92 5 19.48 5 19.908 5.218C20.2843 5.40974 20.5903 5.71569 20.782 6.092C21 6.52 21 7.08 21 8.2V12Z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <h3>No hay reservas pendientes</h3>
                    <p>Todas las solicitudes han sido procesadas</p>
                </div>
            `;
            return;
        }

        reservasList.innerHTML = reservas.map(reserva => crearTarjetaReserva(reserva)).join('');

        // Agregar event listeners a los botones
        document.querySelectorAll('.btn-aceptar').forEach(btn => {
            btn.addEventListener('click', () => responderReserva(btn.dataset.id, 'aceptada'));
        });

        document.querySelectorAll('.btn-rechazar').forEach(btn => {
            btn.addEventListener('click', () => responderReserva(btn.dataset.id, 'rechazada'));
        });
    }

    // Función para crear tarjeta de reserva
    function crearTarjetaReserva(reserva) {
        const fechaFormateada = formatearFecha(reserva.fecha);
        const fechaCreacion = formatearFechaHora(reserva.fecha_creacion);

        // Construir ubicación completa
        let ubicacion = `Piso ${reserva.piso}`;
        if (reserva.bloque) {
            ubicacion += ` - ${reserva.bloque}`;
        }

        // Manejar reservas sin usuario asignado (reservas antiguas)
        const nombreUsuario = reserva.nombre_completo || 'Usuario no registrado';
        const nombreCuenta = reserva.nombre_usuario || 'N/A';
        const correoUsuario = reserva.correo_institucional || 'No disponible';
        const rolUsuario = reserva.rol || 'Sin rol';

        return `
            <div class="reserva-card" data-id="${reserva.id}">
                <div class="reserva-header">
                    <div class="reserva-info">
                        <h3 class="reserva-titulo">${reserva.nombre_espacio}</h3>
                        <p class="reserva-usuario">
                            <strong>Solicitado por:</strong> ${nombreUsuario} (@${nombreCuenta})
                        </p>
                        <span class="reserva-rol">${rolUsuario}</span>
                    </div>
                </div>

                <div class="reserva-detalles">
                    <div class="detalle-item">
                        <span class="detalle-label">Tipo de Espacio</span>
                        <span class="detalle-valor">${reserva.tipo_espacio}</span>
                    </div>
                    <div class="detalle-item">
                        <span class="detalle-label">Ubicación</span>
                        <span class="detalle-valor">${ubicacion}</span>
                    </div>
                    <div class="detalle-item">
                        <span class="detalle-label">Fecha</span>
                        <span class="detalle-valor">${fechaFormateada}</span>
                    </div>
                    <div class="detalle-item">
                        <span class="detalle-label">Horario</span>
                        <span class="detalle-valor">${reserva.hora}</span>
                    </div>
                    <div class="detalle-item">
                        <span class="detalle-label">Correo</span>
                        <span class="detalle-valor">${correoUsuario}</span>
                    </div>
                    <div class="detalle-item">
                        <span class="detalle-label">Fecha de Solicitud</span>
                        <span class="detalle-valor">${fechaCreacion}</span>
                    </div>
                </div>

                <div class="reserva-motivo">
                    <p>Motivo de la reserva:</p>
                    <div class="motivo-texto">${reserva.motivo || 'Sin motivo especificado'}</div>
                </div>

                <div class="reserva-acciones">
                    <button class="btn-accion btn-rechazar" data-id="${reserva.id}">
                        Rechazar
                    </button>
                    <button class="btn-accion btn-aceptar" data-id="${reserva.id}">
                        Aceptar
                    </button>
                </div>
            </div>
        `;
    }

    // Función para responder a una reserva
    async function responderReserva(reservaId, accion) {
        const accionTexto = accion === 'aceptada' ? 'aceptar' : 'rechazar';

        if (!confirm(`¿Estás seguro de ${accionTexto} esta reserva?`)) {
            return;
        }

        try {
            // Deshabilitar botones de la tarjeta
            const card = document.querySelector(`.reserva-card[data-id="${reservaId}"]`);
            const botones = card.querySelectorAll('.btn-accion');
            botones.forEach(btn => btn.disabled = true);

            const response = await fetch('/api/admin/reservas/responder', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    reserva_id: reservaId,
                    accion: accion,
                    admin_id: usuario.id
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                mostrarExito(`Reserva ${accion === 'aceptada' ? 'aceptada' : 'rechazada'} exitosamente.`);

                // Eliminar la tarjeta con animación
                card.style.transition = 'opacity 0.3s, transform 0.3s';
                card.style.opacity = '0';
                card.style.transform = 'scale(0.95)';

                setTimeout(() => {
                    card.remove();

                    // Actualizar contador
                    const totalActual = parseInt(totalPendientes.textContent) - 1;
                    totalPendientes.textContent = totalActual;

                    // Si no quedan más reservas, mostrar empty state
                    if (totalActual === 0) {
                        mostrarReservas([]);
                    }
                }, 300);
            } else {
                botones.forEach(btn => btn.disabled = false);
                mostrarError(data.message || 'Error al procesar la reserva.');
            }
        } catch (error) {
            console.error('Error al responder reserva:', error);
            const card = document.querySelector(`.reserva-card[data-id="${reservaId}"]`);
            const botones = card.querySelectorAll('.btn-accion');
            botones.forEach(btn => btn.disabled = false);
            mostrarError('Error de conexión al procesar la reserva.');
        }
    }

    // Funciones auxiliares
    function mostrarLoading(show) {
        if (show) {
            reservasList.innerHTML = `
                <div class="loading-spinner">
                    <div class="spinner"></div>
                    <p>Cargando reservas...</p>
                </div>
            `;
        }
    }

    function mostrarMensaje(mensaje, tipo) {
        messageContainer.innerHTML = `<div class="message ${tipo} show">${mensaje}</div>`;
        setTimeout(() => ocultarMensaje(), 5000);
    }

    function mostrarExito(mensaje) {
        mostrarMensaje(mensaje, 'success');
    }

    function mostrarError(mensaje) {
        mostrarMensaje(mensaje, 'error');
    }

    function ocultarMensaje() {
        messageContainer.innerHTML = '';
    }

    function formatearFecha(fecha) {
        const date = new Date(fecha + 'T00:00:00');
        const opciones = { year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString('es-ES', opciones);
    }

    function formatearFechaHora(fechaHora) {
        const date = new Date(fechaHora);
        const opciones = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return date.toLocaleDateString('es-ES', opciones);
    }

    function cerrarSesion() {
        if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
            localStorage.removeItem('usuario');
            sessionStorage.clear();
            window.location.href = '../Login/index.html';
        }
    }
});
