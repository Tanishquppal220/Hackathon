let lastScroll = 0;
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('nav');
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > lastScroll && currentScroll > 50) {
        navbar.classList.add('hide');
    } else {
        navbar.classList.remove('hide');
    }
    lastScroll = currentScroll;
});
