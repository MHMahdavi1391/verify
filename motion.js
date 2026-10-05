(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var card = document.getElementById('card');
  if (card) card.classList.add('animate__animated', 'animate__fadeInUp');
  if (window.gsap && card) gsap.from(card, { y: 22, opacity: 0, duration: 0.8, ease: 'power3.out' });
})();
