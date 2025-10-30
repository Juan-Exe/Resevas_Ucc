document.addEventListener('DOMContentLoaded', () => {
    const reservasContainer = document.querySelector('.res-gest-cont');

    // Eliminar el contenido estático que sirve de ejemplo
    const staticContent = document.querySelector('.res-flo-svg');
    if (staticContent) {
        staticContent.remove();
    }

    const fetchAndDisplayReservas = async () => {
        try {
            const response = await fetch('/api/todas-las-reservas');
            if (!response.ok) {
                throw new Error(`La respuesta de la red no fue exitosa (${response.status})`);
            }
            const data = await response.json();

            if (data.success && data.reservas) {
                reservasContainer.innerHTML = '<h1>Gestión de reservas</h1>'; // Limpia el contenedor y añade el título

                // Obtener la fecha actual (solo la parte de la fecha, sin hora)
                const hoy = new Date();
                hoy.setHours(0, 0, 0, 0);

                // Filtrar solo las reservas futuras (desde hoy en adelante)
                const reservasFuturas = data.reservas.filter(reserva => {
                    const fechaReserva = new Date(reserva.fecha);
                    fechaReserva.setHours(0, 0, 0, 0);
                    return fechaReserva >= hoy;
                });

                if (reservasFuturas.length === 0) {
                    reservasContainer.innerHTML += '<p>No hay reservas para mostrar.</p>';
                } else {
                    reservasFuturas.forEach(reserva => {
                        // Lógica para el piso y el bloque
                        let pisoBloqueLabel = `Piso: ${reserva.piso}`;
                        if (reserva.bloque) {
                            const bloqueLimpio = reserva.bloque.replace('Bloque ', '');
                            pisoBloqueLabel += ` / Bloque: ${bloqueLimpio}`;
                        }

                        // 1. Crear el div para el piso/bloque
                        const floorBlockDiv = document.createElement('div');
                        floorBlockDiv.classList.add('res-flo-svg');
                        floorBlockDiv.innerHTML = `
                            <label>${pisoBloqueLabel}</label>
                            <img src="../I-img/Assets svg/Down arrow.svg" alt="">
                        `;
                        reservasContainer.appendChild(floorBlockDiv);

                        // 2. Crear el div con la información de la reserva
                        const reservaElement = document.createElement('div');
                        reservaElement.classList.add('res-inf-cont');
                        reservaElement.setAttribute('data-id', reserva.id);

                        const fecha = new Date(reserva.fecha);
                        const mes = fecha.toLocaleDateString('es-ES', { month: 'long', timeZone: 'UTC' });
                        const dia = fecha.getUTCDate();

                        reservaElement.innerHTML = `
                            <div class="res-aul-mth-day-cont">
                                <label class="aul">${reserva.nombre_espacio}</label>
                                <label class="mth">${mes}</label>
                                <label class="day">${dia}</label>
                            </div>
                            <div class="res-hor-cont">
                                <label>${reserva.hora}</label>
                            </div>
                            <div class="ges-lkn-cont">
                                <a href="../Edicion/index.html?id=${reserva.id}">Editar</a> - 
                                <a href="#" class="link-cancelar">Cancelar</a>
                            </div>
                        `;
                        reservasContainer.appendChild(reservaElement);
                    });

                    // Añadir el párrafo final después de todas las reservas
                    const finalParagraph = document.createElement('div');
                    finalParagraph.classList.add('parr-cont');
                    finalParagraph.innerHTML = '<p>No tiene mas reservas agendadas</p>';
                    reservasContainer.appendChild(finalParagraph);
                }
            } else {
                throw new Error(data.message || 'Error al obtener las reservas.');
            }
        } catch (error) {
            console.error('Ha ocurrido un error detallado:', error);
            reservasContainer.innerHTML = `
                <h1>Gestión de reservas</h1>
                <p style="color: red;">Error al cargar las reservas. Intente de nuevo.</p>
                <p style="font-size: 0.8em; color: #555;">Sugerencia: Abra la consola del desarrollador (F12) para ver los detalles del error.</p>
            `;
        }
    };

    // Event listener para cancelar reservas (usando delegación de eventos)
    reservasContainer.addEventListener('click', async (e) => {
        if (e.target.classList.contains('link-cancelar')) {
            e.preventDefault(); // Prevenir la navegación del enlace
            const reservaItem = e.target.closest('.res-inf-cont');
            const reservaId = reservaItem.getAttribute('data-id');

            if (confirm('¿Estás seguro de que deseas cancelar esta reserva?')) {
                try {
                    const response = await fetch(`/api/reservas/${reservaId}`, {
                        method: 'DELETE'
                    });

                    const result = await response.json();

                    if (response.ok && result.success) {
                        // Eliminar tanto el cuadro de info como el de piso/bloque que le precede
                        const floorBlockDiv = reservaItem.previousElementSibling;
                        if (floorBlockDiv && floorBlockDiv.classList.contains('res-flo-svg')) {
                            floorBlockDiv.remove();
                        }
                        reservaItem.remove();
                        
                        alert('Reserva cancelada con éxito.');
                        
                        // Si se eliminó la última reserva, mostrar mensaje
                        if (document.querySelectorAll('.res-inf-cont').length === 0) {
                            const parrCont = document.querySelector('.parr-cont');
                            if(parrCont) parrCont.remove();
                            
                            reservasContainer.innerHTML += '<p>No hay reservas para mostrar.</p>';
                        }
                    } else {
                        throw new Error(result.message || 'Error al cancelar la reserva.');
                    }
                } catch (error) {
                    console.error('Error al cancelar la reserva:', error);
                    alert(`Error: ${error.message}`);
                }
            }
        }
    });

    // Carga inicial de las reservas
    fetchAndDisplayReservas();
});
