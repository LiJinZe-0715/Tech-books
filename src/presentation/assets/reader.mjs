const toggle = document.querySelector('.toc-toggle');
const navigation = document.querySelector('.chapter-nav');
toggle?.addEventListener('click', () => {
  const expanded = toggle.getAttribute('aria-expanded') === 'true';
  toggle.setAttribute('aria-expanded', String(!expanded));
  navigation.classList.toggle('is-open', !expanded);
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && toggle) {
    toggle.setAttribute('aria-expanded', 'false');
    navigation.classList.remove('is-open');
  }
});
const sectionLinks = [...document.querySelectorAll('.section-nav nav a')];
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    const current = entries.find(entry => entry.isIntersecting);
    if (current) sectionLinks.forEach(link => link.classList.toggle('active', link.hash === `#${current.target.id}`));
  }, { rootMargin: '-15% 0px -65% 0px' });
  document.querySelectorAll('.reading-content section').forEach(section => observer.observe(section));
}
const currentChapter = document.querySelector('.chapter-nav [aria-current="page"]');
if (currentChapter) currentChapter.parentElement.parentElement.scrollTop = Math.max(0, currentChapter.offsetTop - 230);
