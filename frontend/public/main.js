document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const selectContainer = document.querySelector('.custom-select-container');
    const selectTrigger = document.querySelector('.custom-select-trigger');
    const options = document.querySelector('.custom-options');
    const dynamicFormContainer = document.getElementById('dynamic-form-container');
    const descEsp = document.querySelector('.desc-esp');
    const noFloorSelectedLabel = document.getElementById('no-floor-selected');
    const reservarBtnContainer = document.querySelector('.btn-ctn');
    const reasonTextArea = document.getElementById('reason-textarea');

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

    // --- Descriptions and Data ---
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
                    { name: 'Salon 217', capacity: 30 },
                    { name: 'Salon 218', capacity: 30 },
                    { name: 'Salon 219', capacity: 30 },
                    { name: 'Salon 220', capacity: 30 }
                ],
                'Bloque B': [
                    { name: 'Salon 201', capacity: 30 },
                    { name: 'Salon 202', capacity: 30 },
                    { name: 'Salon 203', capacity: 30 },
                    { name: 'Salon 204', capacity: 30 },
                    { name: 'Salon 205', capacity: 30 },
                    { name: 'Salon 206', capacity: 30 }
                ]
            },
            'Laboratorio de fisica': {
                'Bloque B': [
                    { name: 'Laboratorio de fisica', capacity: 25 }
                ]
            }
        },
        '3': {
            'Salon': {
                'Bloque A': [
                    { name: 'Salon 317', capacity: 30 },
                    { name: 'Salon 318', capacity: 30 },
                    { name: 'Salon 319', capacity: 30 },
                    { name: 'Salon 320', capacity: 30 },
                    { name: 'Salon 321', capacity: 30 },
                    { name: 'Salon 322', capacity: 30 }
                ],
                'Bloque B': [
                    { name: 'Salon 301', capacity: 30 },
                    { name: 'Salon 302', capacity: 30 },
                    { name: 'Salon 303', capacity: 30 },
                    { name: 'Salon 304', capacity: 30 },
                    { name: 'Salon 305', capacity: 30 },
                    { name: 'Salon 306', capacity: 30 }
                ]
            }
        },
        '4': {
            'Salon': {
                'Bloque A': [
                    { name: 'Salon 417', capacity: 30 },
                    { name: 'Salon 418', capacity: 30 },
                    { name: 'Salon 419', capacity: 30 },
                    { name: 'Salon 420', capacity: 30 },
                    { name: 'Salon 421', capacity: 30 },
                    { name: 'Salon 422', capacity: 30 }
                ],
                'Bloque B': [
                    { name: 'Salon 401', capacity: 30 },
                    { name: 'Salon 402', capacity: 30 },
                    { name: 'Salon 403', capacity: 30 },
                    { name: 'Salon 404', capacity: 30 },
                    { name: 'Salon 405', capacity: 30 },
                    { name: 'Salon 406', capacity: 30 }
                ]
            }
        },
        '5': {
            'Salones': {
                'Bloque A': [
                    { name: 'Salon 517', capacity: 30 },
                    { name: 'Salon 518', capacity: 30 },
                    { name: 'Salon 519', capacity: 30 },
                    { name: 'Salon 520', capacity: 30 },
                    { name: 'Salon 521', capacity: 30 },
                    { name: 'Salon 522', capacity: 30 }
                ]
            },
            'Salas de informatica': {
                'Bloque B': [
                    { name: 'Sala 1', capacity: 25 },
                    { name: 'Sala 2', capacity: 25 },
                    { name: 'Sala 4', capacity: 25 }
                ]
            },
            'Laboratorio de redes': {
                'Bloque B': [
                    { name: 'Laboratorio de redes', capacity: 25 }
                ]
            }
        },
        '6': {
            'Biblioteca': {
                'Bloque A': [{ name: 'Biblioteca', capacity: 230 }]
            },
            'Salones': {
                'Bloque B': [
                    { name: 'Salon 617', capacity: 30 },
                    { name: 'Salon 618', capacity: 30 },
                    { name: 'Salon 619', capacity: 30 },
                    { name: 'Salon 620', capacity: 30 }
                ]
            }
        }
    };

    // --- Functions ---

    const hourContainer = document.querySelector('.btn-cont');

    async function fetchAndDisableHours() {
        // 1. Reset all hour buttons
        const allHourButtons = hourContainer.querySelectorAll('button');
        allHourButtons.forEach(btn => {
            btn.disabled = false;
            btn.style.color = ''; // Reset color
            btn.style.cursor = ''; // Reset cursor
        });

        // 2. Check if we have enough info to fetch
        if (!formState.date || !formState.spaceName) {
            return; // Not enough info
        }

        // 3. Fetch reserved hours
        try {
            const date = new Date(formState.date).toISOString();
            const spaceName = formState.spaceName;
            const response = await fetch(`/api/reservas?fecha=${date}&nombre_espacio=${spaceName}`);
            
            if (!response.ok) {
                console.error('Error fetching reservations');
                return;
            }

            const data = await response.json();

            if (data.success && data.reservedHours.length > 0) {
                // 4. Disable buttons for reserved hours
                allHourButtons.forEach(btn => {
                    if (data.reservedHours.includes(btn.textContent)) {
                        btn.disabled = true;
                        btn.style.color = '#727272';
                        btn.style.cursor = 'default';
                    }
                });
            }
        } catch (error) {
            console.error('Failed to fetch reserved hours:', error);
        }
    }

    async function updateDaysAvailability() {
        if (!formState.spaceName || !daySlider) return;
    
        const dayButtons = daySlider.querySelectorAll('.day-button');
        for (const button of dayButtons) {
            const buttonDate = new Date(button.dataset.date);
            try {
                const response = await fetch(`/api/reservas/disponibilidad?fecha=${buttonDate.toISOString()}&nombre_espacio=${formState.spaceName}`);
                if (!response.ok) {
                    console.error('Error fetching day availability for', buttonDate);
                    continue; 
                }
                const data = await response.json();
                if (data.success && data.count >= 5) {
                    button.disabled = true;
                } else {
                    button.disabled = false;
                }
            } catch (error) {
                console.error('Failed to fetch day availability:', error);
            }
        }
    }

    function checkFormCompletion() {
        const isFloorValid = !!formState.floor;
        const isSpaceTypeValid = !!formState.spaceType;
        
        const bloqueSelect = document.getElementById('bloque-select');
        const isBlockApplicable = bloqueSelect && !bloqueSelect.closest('.hidden-row');
        const isBlockValid = isBlockApplicable ? !!formState.block : true;

        const nombreSelect = document.getElementById('nombre-espacio-select');
        const isNombreApplicable = nombreSelect && !nombreSelect.closest('.hidden-row');
        const isNombreValid = isNombreApplicable ? !!formState.spaceName : true;

        const isDateValid = !!formState.date;
        const isHourValid = !!formState.hour;
        const isReasonValid = formState.reason && formState.reason.trim() !== '';

        if (isFloorValid && isSpaceTypeValid && isBlockValid && isNombreValid && isDateValid && isHourValid && isReasonValid) {
            reservarBtnContainer.classList.remove('hidden');
        } else {
            reservarBtnContainer.classList.add('hidden');
        }
    }

    if (selectTrigger) {
        selectTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            selectTrigger.classList.toggle('open');
            options.classList.toggle('show');
        });
    }

    const closeDropdown = () => {
        if (selectTrigger && options) {
            selectTrigger.classList.remove('open');
            options.classList.remove('show');
        }
    }

    const optionItems = document.querySelectorAll('.custom-option');
    optionItems.forEach(option => {
        if (option.getAttribute('data-value')) {
            option.addEventListener('click', () => {
                const selectedValue = option.getAttribute('data-value');
                formState.floor = selectedValue;
                // Reset dependent fields
                formState.spaceType = null;
                formState.block = null;
                formState.spaceName = null;
                if(noFloorSelectedLabel){
                    noFloorSelectedLabel.style.display = 'none';
                }
                generateForm(selectedValue);
                closeDropdown();
                checkFormCompletion();
            });
        }
    });

    function createCustomSelect(elementId, placeholder, options, onValueChange) {
        const container = document.createElement('div');
        container.className = 'dynamic-custom-select';
        container.id = elementId;

        const trigger = document.createElement('div');
        trigger.className = 'dynamic-select-trigger';

        const triggerText = document.createElement('span');
        triggerText.className = 'dynamic-trigger-text';
        triggerText.textContent = placeholder;

        const triggerArrow = document.createElement('img');
        triggerArrow.src = 'I-img/Assets svg/Down arrow.svg';
        triggerArrow.alt = 'Dropdown arrow';

        trigger.appendChild(triggerText);
        trigger.appendChild(triggerArrow);
        container.appendChild(trigger);

        const optionsContainer = document.createElement('div');
        optionsContainer.className = 'dynamic-select-options';
        container.appendChild(optionsContainer);

        const updateOptions = (newOptions) => {
            optionsContainer.innerHTML = '';
            const placeholderOption = document.createElement('div');
            placeholderOption.className = 'dynamic-select-option';
            placeholderOption.textContent = placeholder;
            placeholderOption.dataset.value = '';
            placeholderOption.addEventListener('click', (e) => {
                e.stopPropagation();
                triggerText.textContent = placeholder;
                container.classList.remove('open');
                if (onValueChange) {
                    onValueChange('', {});
                }
            });
            optionsContainer.appendChild(placeholderOption);

            newOptions.forEach(opt => {
                const optionEl = document.createElement('div');
                optionEl.className = 'dynamic-select-option';
                const optionText = typeof opt === 'object' ? opt.name : opt;
                optionEl.textContent = optionText;
                optionEl.dataset.value = optionText;

                if (typeof opt === 'object') {
                    Object.keys(opt).forEach(key => {
                        optionEl.dataset[key] = opt[key];
                    });
                }

                optionEl.addEventListener('click', (e) => {
                    e.stopPropagation();
                    triggerText.textContent = optionText;
                    container.classList.remove('open');
                    if (onValueChange) {
                        onValueChange(optionText, optionEl.dataset);
                    }
                });
                optionsContainer.appendChild(optionEl);
            });
        };

        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            document.querySelectorAll('.dynamic-custom-select.open').forEach(sel => {
                if (sel !== container) {
                    sel.classList.remove('open');
                }
            });
            container.classList.toggle('open');
        });

        updateOptions(options);

        return { element: container, updateOptions, trigger: triggerText };
    }

    function generateForm(floor) {
        dynamicFormContainer.innerHTML = '';
        dynamicFormContainer.classList.add('dynamic-form');

        const floorSpaces = spaces[floor] || {};
        const spaceTypes = Object.keys(floorSpaces);

        const tipoLabel = document.createElement('label');
        tipoLabel.textContent = 'Tipo de espacio:';
        const nombreLabel = document.createElement('label');
        nombreLabel.textContent = 'Nombre del espacio:';
        const capacidadLabel = document.createElement('label');
        capacidadLabel.textContent = 'Capacidad del espacio:';
        const capacidadP = document.createElement('p');
        capacidadP.id = 'espacio-capacidad';
        const ubicacionLabel = document.createElement('label');
        ubicacionLabel.textContent = 'Ubicacion:';
        const ubicacionP = document.createElement('p');
        ubicacionP.id = 'espacio-ubicacion';
        ubicacionP.textContent = `Piso ${floor}`;
        const bloqueLabel = document.createElement('label');
        bloqueLabel.textContent = 'Seleccion del bloque:';
        const bloqueP = document.createElement('p');
        bloqueP.id = 'espacio-bloque-text';
        const nombreP = document.createElement('p');
        nombreP.id = 'espacio-nombre-text';

        const onNombreChange = (value, dataset) => {
            formState.spaceName = value;
            capacidadP.textContent = dataset.capacity ? `${dataset.capacity} personas` : 'Seleccione un espacio';
            if (value) {
                let description = spaceDescriptions[value] || spaceDescriptions[tipoSelect.trigger.textContent] || '';
                descEsp.textContent = description;
                descEsp.classList.add('show');
            } else {
                descEsp.classList.remove('show');
            }
            fetchAndDisableHours();
            updateDaysAvailability();
            checkFormCompletion();
        };

        const nombreSelect = createCustomSelect('nombre-espacio-select', 'Seleccione un espacio', [], onNombreChange);

        const onBloqueChange = (bloque, dataset) => {
            formState.block = bloque;
            formState.spaceName = null; // Reset space name
            const tipo = (floor === '3' || floor === '4') ? 'Salon' : tipoSelect.trigger.textContent;
            if (floorSpaces[tipo] && floorSpaces[tipo][bloque]) {
                nombreSelect.updateOptions(floorSpaces[tipo][bloque]);
            } else {
                nombreSelect.updateOptions([]);
            }
            nombreSelect.trigger.textContent = 'Seleccione un espacio';
            capacidadP.textContent = 'Seleccione un espacio';
            onNombreChange('', {});
            checkFormCompletion();
        };

        const bloqueSelect = createCustomSelect('bloque-select', 'Seleccione un bloque', [], onBloqueChange);

        const tipoGroup = document.createElement('div');
        const bloqueGroup = document.createElement('div');
        const nombreGroup = document.createElement('div');
        const capacidadGroup = document.createElement('div');
        const ubicacionGroup = document.createElement('div');

        const onTipoChange = (tipo, dataset) => {
            formState.spaceType = tipo;
            formState.block = null;
            formState.spaceName = null;

            bloqueGroup.classList.add('hidden-row');
            nombreGroup.classList.add('hidden-row');

            bloqueP.style.display = 'none';
            bloqueSelect.element.style.display = 'none';
            nombreP.style.display = 'none';
            nombreSelect.element.style.display = 'none';

            if (tipo) {
                descEsp.textContent = spaceDescriptions[tipo] || '';
                descEsp.classList.add('show');
            } else {
                descEsp.classList.remove('show');
            }

            if (floor === '2') {
                if (tipo === 'Laboratorio de fisica') {
                    bloqueGroup.classList.remove('hidden-row');
                    bloqueP.textContent = 'Bloque B';
                    bloqueP.style.display = 'block';
                    nombreGroup.classList.remove('hidden-row');
                    nombreP.textContent = 'Laboratorio de fisica';
                    nombreP.style.display = 'block';
                    formState.block = 'Bloque B';
                    onNombreChange('Laboratorio de fisica', { capacity: 25 });
                } else if (tipo === 'Salon') {
                    bloqueGroup.classList.remove('hidden-row');
                    bloqueSelect.element.style.display = 'block';
                    nombreGroup.classList.remove('hidden-row');
                    nombreSelect.element.style.display = 'block';
                    bloqueSelect.updateOptions(Object.keys(floorSpaces[tipo]));
                    bloqueSelect.trigger.textContent = 'Seleccione un bloque';
                    nombreSelect.updateOptions([]);
                    nombreSelect.trigger.textContent = 'Seleccione un espacio';
                    capacidadP.textContent = 'Seleccione un espacio';
                }
            } else if (floor === '3' || floor === '4') {
                bloqueGroup.classList.remove('hidden-row');
                bloqueSelect.element.style.display = 'block';
                nombreGroup.classList.remove('hidden-row');
                nombreSelect.element.style.display = 'block';
                bloqueSelect.updateOptions(Object.keys(floorSpaces['Salon']));
                bloqueSelect.trigger.textContent = 'Seleccione un bloque';
                nombreSelect.updateOptions([]);
                nombreSelect.trigger.textContent = 'Seleccione un espacio';
                capacidadP.textContent = 'Seleccione un espacio';
            } else if (floor === '5') {
                if (tipo === 'Laboratorio de redes') {
                    bloqueGroup.classList.remove('hidden-row');
                    bloqueP.textContent = 'Bloque B';
                    bloqueP.style.display = 'block';
                    nombreGroup.classList.remove('hidden-row');
                    nombreP.textContent = 'Laboratorio de redes';
                    nombreP.style.display = 'block';
                    formState.block = 'Bloque B';
                    onNombreChange('Laboratorio de redes', { capacity: 25 });
                } else if (tipo === 'Salones' || tipo === 'Salas de informatica') {
                    const blockName = (tipo === 'Salones') ? 'Bloque A' : 'Bloque B';
                    formState.block = blockName;
                    bloqueGroup.classList.remove('hidden-row');
                    bloqueP.textContent = blockName;
                    bloqueP.style.display = 'block';
                    nombreGroup.classList.remove('hidden-row');
                    nombreSelect.element.style.display = 'block';
                    nombreP.style.display = 'none';
                    const spacesForType = floorSpaces[tipo][blockName] || [];
                    nombreSelect.updateOptions(spacesForType);
                    nombreSelect.trigger.textContent = 'Seleccione un espacio';
                    capacidadP.textContent = 'Seleccione un espacio';
                }
            } else if (floor === '6') {
                if (tipo === 'Biblioteca') {
                    bloqueGroup.classList.remove('hidden-row');
                    bloqueP.textContent = 'Bloque A';
                    bloqueP.style.display = 'block';
                    nombreGroup.classList.remove('hidden-row');
                    nombreP.textContent = 'Biblioteca';
                    nombreP.style.display = 'block';
                    formState.block = 'Bloque A';
                    onNombreChange('Biblioteca', { capacity: 230 });
                } else if (tipo === 'Salones') {
                    bloqueGroup.classList.remove('hidden-row');
                    bloqueP.textContent = 'Bloque B';
                    bloqueP.style.display = 'block';
                    nombreGroup.classList.remove('hidden-row');
                    nombreSelect.element.style.display = 'block';
                    nombreP.style.display = 'none';
                    formState.block = 'Bloque B';
                    const spacesForType = floorSpaces[tipo]['Bloque B'] || [];
                    nombreSelect.updateOptions(spacesForType);
                    nombreSelect.trigger.textContent = 'Seleccione un espacio';
                    capacidadP.textContent = 'Seleccione un espacio';
                }
            } else {
                if (tipo) {
                    nombreGroup.classList.remove('hidden-row');
                    const spacesForType = floorSpaces[tipo] || [];
                    if (Array.isArray(spacesForType)) {
                        if (spacesForType.length === 1 && tipo === 'Auditorio') {
                            nombreSelect.element.style.display = 'none';
                            nombreP.textContent = spacesForType[0].name;
                            nombreP.style.display = 'block';
                            onNombreChange(spacesForType[0].name, spacesForType[0]);
                        } else {
                            nombreSelect.element.style.display = 'block';
                            nombreP.style.display = 'none';
                            nombreSelect.updateOptions(spacesForType);
                            nombreSelect.trigger.textContent = 'Seleccione un espacio';
                            capacidadP.textContent = 'Seleccione un espacio';
                        }
                    }
                }
            }
            checkFormCompletion();
        };

        const tipoSelect = createCustomSelect('tipo-espacio-select', 'Seleccione un tipo', spaceTypes, onTipoChange);

        tipoGroup.appendChild(tipoLabel);
        if (floor === '3' || floor === '4') {
            const tipoP = document.createElement('p');
            tipoP.textContent = 'Salon';
            tipoGroup.appendChild(tipoP);
            formState.spaceType = 'Salon';
        } else {
            tipoGroup.appendChild(tipoSelect.element);
        }

        bloqueGroup.appendChild(bloqueLabel);
        bloqueGroup.appendChild(bloqueSelect.element);
        bloqueGroup.appendChild(bloqueP);

        nombreGroup.appendChild(nombreLabel);
        nombreGroup.appendChild(nombreSelect.element);
        nombreGroup.appendChild(nombreP);

        capacidadGroup.appendChild(capacidadLabel);
        capacidadGroup.appendChild(capacidadP);

        ubicacionGroup.appendChild(ubicacionLabel);
        ubicacionGroup.appendChild(ubicacionP);

        dynamicFormContainer.appendChild(tipoGroup);
        if (['2', '3', '4', '5', '6'].includes(floor)) {
            dynamicFormContainer.appendChild(bloqueGroup);
        }
        dynamicFormContainer.appendChild(nombreGroup);
        dynamicFormContainer.appendChild(capacidadGroup);
        dynamicFormContainer.appendChild(ubicacionGroup);

        if (floor === '3' || floor === '4') {
            onTipoChange('Salon', {});
        } else {
            onTipoChange('', {});
        }
        checkFormCompletion();
    }

    const monthNameEl = document.getElementById('month-name');
    const daySlider = document.querySelector('.res-fech-day');

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
    const monthSelectorTrigger = document.querySelector('.res-fech-h3-svg');
    const monthOptionsPopup = document.getElementById('month-options-popup');
    const arrowSvg = monthSelectorTrigger ? monthSelectorTrigger.querySelector('img') : null;

    const MONTH_NAMES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    const DAY_NAMES_SHORT = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];

    // Obtener la fecha actual del sistema
    const userToday = new Date();
    userToday.setHours(12, 0, 0, 0); // Establecer a mediodía para evitar problemas de zona horaria
    let selectedDate = new Date(userToday);
    formState.date = selectedDate;

    function updateDateDisplay(date) {
        if(monthNameEl) monthNameEl.textContent = MONTH_NAMES[date.getMonth()];
    }

    function populateDaySlider(baseDate) {
        if(!daySlider) return;
        daySlider.innerHTML = '';
        
        // Obtener el mes y año de la fecha base
        const targetMonth = baseDate.getMonth();
        const targetYear = baseDate.getFullYear();
        
        // Calcular el último día del mes
        const lastDayOfMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
        
        // Si estamos en el mes actual, empezar desde hoy, si no desde el día 1
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const isCurrentMonth = (targetMonth === today.getMonth() && targetYear === today.getFullYear());
        const startDay = isCurrentMonth ? baseDate.getDate() : 1;
        
        // Crear botones solo para los días del mes seleccionado
        for (let day = startDay; day <= lastDayOfMonth; day++) {
            const date = new Date(targetYear, targetMonth, day);

            const dayButton = document.createElement('button');
            dayButton.classList.add('day-button');
            dayButton.dataset.date = date.toISOString();

            const dayName = DAY_NAMES_SHORT[date.getDay()];
            const dayNumber = date.getDate();

            dayButton.innerHTML = `<span>${dayName}</span><span>${dayNumber}</span>`;

            if (date.toDateString() === selectedDate.toDateString()) {
                dayButton.classList.add('selected');
            }

            dayButton.addEventListener('click', () => {
                if (dayButton.disabled) return;
                selectedDate = new Date(dayButton.dataset.date);
                formState.date = selectedDate;
                updateDateDisplay(selectedDate);
                
                const currentSelected = daySlider.querySelector('.day-button.selected');
                if(currentSelected) currentSelected.classList.remove('selected');
                dayButton.classList.add('selected');
                fetchAndDisableHours();
                checkFormCompletion();
            });

            daySlider.appendChild(dayButton);
        }
        updateDaysAvailability();
    }

    function populateMonthSelector() {
        if(!monthOptionsPopup) return;
        monthOptionsPopup.innerHTML = '';
        const currentYear = userToday.getFullYear();
        const startMonth = userToday.getMonth();

        for (let i = startMonth; i < 12; i++) {
            const option = document.createElement('div');
            option.classList.add('custom-option');
            option.textContent = MONTH_NAMES[i];
            option.dataset.month = i;

            option.addEventListener('click', (e) => {
                e.stopPropagation();
                const newMonth = parseInt(option.dataset.month, 10);
                
                if (newMonth === startMonth) {
                    selectedDate = new Date(userToday);
                } else {
                    selectedDate = new Date(currentYear, newMonth, 1);
                }
                formState.date = selectedDate;
                
                updateDateDisplay(selectedDate);
                populateDaySlider(selectedDate);
                monthOptionsPopup.classList.remove('show');
                if(arrowSvg) arrowSvg.classList.remove('open');
                fetchAndDisableHours();
                checkFormCompletion();
            });
            monthOptionsPopup.appendChild(option);
        }
    }

    if(monthSelectorTrigger){
        monthSelectorTrigger.addEventListener('click', () => {
            if(monthOptionsPopup) monthOptionsPopup.classList.toggle('show');
            if(arrowSvg) arrowSvg.classList.toggle('open');
        });
    }

    window.addEventListener('click', (e) => {
        if (selectContainer && !selectContainer.contains(e.target)) {
            closeDropdown();
        }

        if (monthSelectorTrigger && !monthSelectorTrigger.contains(e.target) && monthOptionsPopup && !monthOptionsPopup.contains(e.target)) {
            monthOptionsPopup.classList.remove('show');
            if(arrowSvg) arrowSvg.classList.remove('open');
        }
    });

    updateDateDisplay(selectedDate);
    populateDaySlider(selectedDate);
    populateMonthSelector();
    fetchAndDisableHours();

    if (hourContainer) {
        hourContainer.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON' && !e.target.disabled) { // Check if not disabled
                const buttons = hourContainer.querySelectorAll('button');
                buttons.forEach(btn => btn.classList.remove('selected'));
                e.target.classList.add('selected');
                formState.hour = e.target.textContent;
                checkFormCompletion();
            }
        });
    }

    if (reasonTextArea) {
        reasonTextArea.addEventListener('input', (e) => {
            formState.reason = e.target.value;
            checkFormCompletion();
        });
    }

    checkFormCompletion();

    if (reservarBtnContainer) {
        reservarBtnContainer.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON') {
                e.preventDefault();

                // Obtener el usuario_id del localStorage
                const usuarioStr = localStorage.getItem('usuario');
                if (!usuarioStr) {
                    alert('Por favor, inicie sesión para hacer una reserva.');
                    window.location.href = '/Login/index.html';
                    return;
                }

                const usuario = JSON.parse(usuarioStr);

                // Agregar usuario_id al formState
                const reservaData = {
                    ...formState,
                    usuario_id: usuario.id
                };

                // Enviar los datos al backend
                fetch('/api/reservar', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(reservaData),
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        alert('¡Reserva exitosa!');
                        // Opcional: limpiar el formulario o redirigir
                        window.location.reload();
                    } else {
                        alert(`Error: ${data.message}`);
                    }
                })
                .catch(error => {
                    console.error('Error en el fetch:', error);
                    alert('Hubo un error al conectar con el servidor.');
                });
            }
        });
    }

    // Abrir automáticamente el select de pisos al cargar la página
    if (selectTrigger && options) {
        setTimeout(() => {
            selectTrigger.classList.add('open');
            options.classList.add('show');
            
            // Cerrar automáticamente después de 3 segundos si no se ha seleccionado nada
            setTimeout(() => {
                if (!formState.floor) {
                    selectTrigger.classList.remove('open');
                    options.classList.remove('show');
                }
            }, 3000);
        }, 500); // Esperar 500ms después de cargar la página para dar efecto de animación
    }
});