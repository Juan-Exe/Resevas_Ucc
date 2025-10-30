// JavaScript para Selección de Rol

document.addEventListener('DOMContentLoaded', function() {
    const roleCards = document.querySelectorAll('.role-card');

    roleCards.forEach(card => {
        card.addEventListener('click', function() {
            const rol = this.getAttribute('data-rol');
            // Redirigir al registro con el rol seleccionado como parámetro
            window.location.href = `../Registro/index.html?rol=${rol}`;
        });
    });
});
