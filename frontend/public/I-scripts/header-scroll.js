// ========================================
// HEADER SCROLL HIDE/SHOW
// ========================================

let lastScrollTop = 0;
let isScrolling;
const header = document.querySelector('.header-ucc');
const scrollThreshold = 100; // Píxeles que debe hacer scroll antes de ocultar el header

window.addEventListener('scroll', function() {
    // Limpiar timeout anterior
    clearTimeout(isScrolling);

    // Obtener posición actual del scroll
    let scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    // Solo ejecutar si ha pasado el umbral mínimo
    if (scrollTop > scrollThreshold) {
        if (scrollTop > lastScrollTop) {
            // Scrolling hacia abajo - ocultar header
            header.classList.add('header-hidden');
        } else {
            // Scrolling hacia arriba - mostrar header
            header.classList.remove('header-hidden');
        }
    } else {
        // Si está cerca del top, siempre mostrar
        header.classList.remove('header-hidden');
    }

    // Guardar la posición actual
    lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;

    // Detectar cuando el usuario deja de hacer scroll
    isScrolling = setTimeout(function() {
        // Si está muy arriba, asegurar que el header esté visible
        if (scrollTop <= scrollThreshold) {
            header.classList.remove('header-hidden');
        }
    }, 100);
});
