document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const selectContainer = document.querySelector('.custom-select-container');
    const selectTrigger = document.querySelector('.custom-select-trigger');
    const dynamicFormContainer = document.getElementById('dynamic-form-container');
    const descEsp = document.querySelector('.desc-esp');
    const guardarBtn = document.getElementById('guardar-btn');
    const reasonTextArea = document.getElementById('reason-textarea');
    const monthNameEl = document.getElementById('month-name');
    const daySlider = document.querySelector('.res-fech-day');
    const hourContainer = document.querySelector('.btn-cont');

    // --- Form State ---
    const formState = {
        floor: null,
        spaceType: null,
        block: null,
        spaceName: null,
        date: null,
        hour: null,
        reason: null,
    };

    // --- Data (Copied from main.js) ---
    const spaceDescriptions = {
        'Salon': 'Este espacio es perfecto para el aprendizaje, cuenta con dos tableros y un proyector para una experiencia de aprendizaje completa.',
        'Salones': 'Este espacio es perfecto para el aprendizaje, cuenta con dos tableros y un proyector para una experiencia de aprendizaje completa.',
        'Salas de informatica': 'Equipada con computadores de alto rendimiento, ideal para todas las actividades universitarias que requieran software especializado.',
        'Laboratorio de fisica': 'Un laboratorio completo con todo el equipamiento necesario para realizar prácticas de física.',
        'Laboratorio de redes': 'Todo lo necesario para las practicas de redes.',
        'Canchas': 'Espacio al aire libre para practicar deportes y recreación.',
        'Auditorio': 'Un espacio amplio para eventos, conferencias y presentaciones.',
        'Biblioteca': 'Un lugar tranquilo para estudiar, con acceso a una gran variedad de libros y recursos.'
    };

    const spaces = {
        '1': {
            'Auditorio': [{ name: 'Auditorio', capacity: 250 }],
            'Canchas': [
                { name: 'Cancha de futbol', capacity: 22 },
                { name: 'Cancha de voleybol', capacity: 12 }
            ]
        },
        '2': {
            'Salon': {
                'Bloque A': [
                    { name: 'Salon 217', capacity: 30 }, { name: 'Salon 218', capacity: 30 },
                    { name: 'Salon 219', capacity: 30 }, { name: 'Salon 220', capacity: 30 }
                ],
                'Bloque B': [
                    { name: 'Salon 201', capacity: 30 }, { name: 'Salon 202', capacity: 30 },
                    { name: 'Salon 203', capacity: 30 }, { name: 'Salon 204', capacity: 30 },
                    { name: 'Salon 205', capacity: 30 }, { name: 'Salon 206', capacity: 30 }
                ]
            },
            'Laboratorio de fisica': { 'Bloque B': [{ name: 'Laboratorio de fisica', capacity: 25 }] }
        },
        '3': {
            'Salon': {
                'Bloque A': [
                    { name: 'Salon 317', capacity: 30 }, { name: 'Salon 318', capacity: 30 },
                    { name: 'Salon 319', capacity: 30 }, { name: 'Salon 320', capacity: 30 },
                    { name: 'Salon 321', capacity: 30 }, { name: 'Salon 322', capacity: 30 }
                ],
                'Bloque B': [
                    { name: 'Salon 301', capacity: 30 }, { name: 'Salon 302', capacity: 30 },
                    { name: 'Salon 303', capacity: 30 }, { name: 'Salon 304', capacity: 30 },
                    { name: 'Salon 305', capacity: 30 }, { name: 'Salon 306', capacity: 30 }
                ]
            }
        },
        '4': {
            'Salon': {
                'Bloque A': [
                    { name: 'Salon 417', capacity: 30 }, { name: 'Salon 418', capacity: 30 },
                    { name: 'Salon 419', capacity: 30 }, { name: 'Salon 420', capacity: 30 },
                    { name: 'Salon 421', capacity: 30 }, { name: 'Salon 422', capacity: 30 }
                ],
                'Bloque B': [
                    { name: 'Salon 401', capacity: 30 }, { name: 'Salon 402', capacity: 30 },
                    { name: 'Salon 403', capacity: 30 }, { name: 'Salon 404', capacity: 30 },
                    { name: 'Salon 405', capacity: 30 }, { name: 'Salon 406', capacity: 30 }
                ]
            }
        },
        '5': {
            'Salones': { 'Bloque A': [
                    { name: 'Salon 517', capacity: 30 }, { name: 'Salon 518', capacity: 30 },
                    { name: 'Salon 519', capacity: 30 }, { name: 'Salon 520', capacity: 30 },
                    { name: 'Salon 521', capacity: 30 }, { name: 'Salon 522', capacity: 30 }
                ]
            },
            'Salas de informatica': { 'Bloque B': [
                    { name: 'Sala 1', capacity: 25 }, { name: 'Sala 2', capacity: 25 }, { name: 'Sala 4', capacity: 25 }
                ]
            },
            'Laboratorio de redes': { 'Bloque B': [{ name: 'Laboratorio de redes', capacity: 25 }] }
        },
        '6': {
            'Biblioteca': { 'Bloque A': [{ name: 'Biblioteca', capacity: 230 }] },
            'Salones': { 'Bloque B': [
                    { name: 'Salon 617', capacity: 30 }, { name: 'Salon 618', capacity: 30 },
                    { name: 'Salon 619', capacity: 30 }, { name: 'Salon 620', capacity: 30 }
                ]
            }
        }
    };

    // --- Calendar Variables ---
    const MONTH_NAMES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    const DAY_NAMES_SHORT = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];
    let selectedDate;

    // --- Functions ---

    const getReservaId = () => {
        const params = new URLSearchParams(window.location.search);
        return params.get('id');
    };

    async function fetchAndDisableHours() {
        const allHourButtons = hourContainer.querySelectorAll('button');
        allHourButtons.forEach(btn => {
            btn.disabled = false;
        });

        if (!formState.date || !formState.spaceName) return;

        try {
            const date = new Date(formState.date).toISOString();
            const spaceName = formState.spaceName;
            const response = await fetch(`/api/reservas?fecha=${date}&nombre_espacio=${spaceName}`);
            if (!response.ok) throw new Error('Error fetching reservations');
            
            const data = await response.json();
            if (data.success && data.reservedHours.length > 0) {
                allHourButtons.forEach(btn => {
                    if (data.reservedHours.includes(btn.textContent) && btn.textContent !== formState.hour) {
                        btn.disabled = true;
                    }
                });
            }
        } catch (error) {
            console.error('Failed to fetch reserved hours:', error);
        }
    }

    function updateDateDisplay(date) {
        if (monthNameEl) monthNameEl.textContent = MONTH_NAMES[date.getMonth()];
    }

    function populateDaySlider(baseDate) {
        if (!daySlider) return;
        daySlider.innerHTML = '';
        for (let i = 0; i < 30; i++) {
            const date = new Date(baseDate);
            date.setDate(baseDate.getDate() + i);

            const dayButton = document.createElement('button');
            dayButton.classList.add('day-button');
            dayButton.dataset.date = date.toISOString();
            dayButton.innerHTML = `<span>${DAY_NAMES_SHORT[date.getDay()]}</span><span>${date.getDate()}</span>`;

            if (selectedDate && date.toDateString() === selectedDate.toDateString()) {
                dayButton.classList.add('selected');
            }

            dayButton.addEventListener('click', () => {
                if (dayButton.disabled) return;
                selectedDate = new Date(dayButton.dataset.date);
                formState.date = selectedDate;
                updateDateDisplay(selectedDate);
                
                const currentSelected = daySlider.querySelector('.day-button.selected');
                if (currentSelected) currentSelected.classList.remove('selected');
                dayButton.classList.add('selected');
                fetchAndDisableHours();
            });
            daySlider.appendChild(dayButton);
        }
        const selectedButton = daySlider.querySelector('.day-button.selected');
        if (selectedButton) {
            selectedButton.scrollIntoView({ behavior: 'smooth', inline: 'center' });
        }
    }

    function generateAndPopulateForm(reserva) {
        dynamicFormContainer.innerHTML = '';
        dynamicFormContainer.classList.add('dynamic-form');

        const { piso, tipo_espacio, bloque, nombre_espacio } = reserva;
        const spaceData = spaces[piso]?.[tipo_espacio]?.[bloque]?.find(s => s.name === nombre_espacio) || 
                          spaces[piso]?.[tipo_espacio]?.find(s => s.name === nombre_espacio);

        const createInfoRow = (label, value) => {
            const row = document.createElement('div');
            const labelEl = document.createElement('label');
            labelEl.textContent = label;
            const valueEl = document.createElement('p');
            valueEl.textContent = value;
            row.appendChild(labelEl);
            row.appendChild(valueEl);
            return row;
        };

        dynamicFormContainer.appendChild(createInfoRow('Tipo de espacio:', tipo_espacio));
        if (bloque) {
            dynamicFormContainer.appendChild(createInfoRow('Bloque:', bloque));
        }
        dynamicFormContainer.appendChild(createInfoRow('Nombre del espacio:', nombre_espacio));
        dynamicFormContainer.appendChild(createInfoRow('Capacidad del espacio:', spaceData ? `${spaceData.capacity} personas` : 'N/A'));
        dynamicFormContainer.appendChild(createInfoRow('Ubicacion:', `Piso ${piso}`));

        const description = spaceDescriptions[nombre_espacio] || spaceDescriptions[tipo_espacio] || '';
        descEsp.textContent = description;
        descEsp.classList.add('show');
    }

    const cargarReserva = async (id) => {
        try {
            const response = await fetch(`/api/reservas/${id}`);
            if (!response.ok) throw new Error('Error al cargar la reserva');
            
            const data = await response.json();
            if (!data.success) throw new Error(data.message);
            
            const reserva = data.reserva;

            formState.floor = reserva.piso;
            formState.spaceType = reserva.tipo_espacio;
            formState.block = reserva.bloque;
            formState.spaceName = reserva.nombre_espacio;
            formState.reason = reserva.motivo;
            formState.hour = reserva.hora;
            const reservationDate = new Date(reserva.fecha);
            const userTimezoneOffset = reservationDate.getTimezoneOffset() * 60000;
            selectedDate = new Date(reservationDate.getTime() + userTimezoneOffset);
            formState.date = selectedDate;

            const floorLabelContainer = document.querySelector('.res-form-cont');
            if(floorLabelContainer) {
                floorLabelContainer.innerHTML = `<label style="font-weight: 500;">Piso: ${reserva.piso}</label>`;
                const trigger = floorLabelContainer.querySelector('.custom-select-trigger');
                if(trigger) trigger.style.display = 'none';
            }

            generateAndPopulateForm(reserva);
            reasonTextArea.value = reserva.motivo;

            const userToday = new Date('2025-10-16T12:00:00');
            updateDateDisplay(selectedDate);
            populateDaySlider(userToday);

            await fetchAndDisableHours();
            const allHourButtons = hourContainer.querySelectorAll('button');
            allHourButtons.forEach(btn => {
                if (btn.textContent === reserva.hora) {
                    btn.classList.add('selected');
                }
            });

        } catch (error) {
            console.error('Error:', error);
            dynamicFormContainer.innerHTML = `<p style="color: red;">Error al cargar los datos. ${error.message}</p>`;
        }
    };

    // --- Event Listeners ---
    let isDown = false;
    let startX;
    let scrollLeft;

    if (daySlider) {
        daySlider.addEventListener('mousedown', (e) => {
            isDown = true;
            daySlider.classList.add('active');
            startX = e.pageX - daySlider.offsetLeft;
            scrollLeft = daySlider.scrollLeft;
            e.preventDefault();
        });
        daySlider.addEventListener('mouseleave', () => {
            isDown = false;
            daySlider.classList.remove('active');
        });
        daySlider.addEventListener('mouseup', () => {
            isDown = false;
            daySlider.classList.remove('active');
        });
        daySlider.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - daySlider.offsetLeft;
            const walk = (x - startX) * 2;
            daySlider.scrollLeft = scrollLeft - walk;
        });
    }

    if (hourContainer) {
        hourContainer.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON' && !e.target.disabled) {
                const buttons = hourContainer.querySelectorAll('button');
                buttons.forEach(btn => btn.classList.remove('selected'));
                e.target.classList.add('selected');
                formState.hour = e.target.textContent;
            }
        });
    }

    if (reasonTextArea) {
        reasonTextArea.addEventListener('input', (e) => {
            formState.reason = e.target.value;
        });
    }

    if (guardarBtn) {
        guardarBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const reservaId = getReservaId();

            const selectedDayEl = daySlider.querySelector('.day-button.selected');
            if (selectedDayEl) {
                formState.date = new Date(selectedDayEl.dataset.date);
            }

            const dataToUpdate = {
                motivo: formState.reason,
                horario: formState.hour,
                dia: formState.date.toISOString(),
            };

            try {
                const response = await fetch(`/api/reservas/${reservaId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(dataToUpdate),
                });

                const result = await response.json();
                if (result.success) {
                    alert('Reserva actualizada con éxito.');
                    window.location.href = '../Gestion/index.html';
                } else {
                    throw new Error(result.message || 'Error al actualizar la reserva');
                }
            } catch (error) {
                console.error('Error al guardar:', error);
                alert(`Error: ${error.message}`);
            }
        });
    }

    // --- Initial Load ---
    const reservaId = getReservaId();
    if (reservaId) {
        cargarReserva(reservaId);
    } else {
        dynamicFormContainer.innerHTML = '<p>ID de reserva no encontrado.</p>';
    }
});
