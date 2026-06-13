import { languages, translations } from './lang/translations.js?v=1.1';

let currentLang = localStorage.getItem('ts_lang') || localStorage.getItem('lang') || 'en';
if (!translations[currentLang]) {
  currentLang = 'en';
}

function getFlagSvg(code) {
  switch (code) {
    case 'id':
      return `<svg class="w-4 h-3 inline-block rounded-sm shadow-sm border border-black/10" viewBox="0 0 3 2" style="min-width: 16px;"><rect width="3" height="1" fill="#FF0000"/><rect y="1" width="3" height="1" fill="#FFFFFF"/></svg>`;
    case 'en':
      return `<svg class="w-4 h-3 inline-block rounded-sm shadow-sm border border-black/10" viewBox="0 0 50 30" style="min-width: 16px;"><clipPath id="t"><path d="M0 0v30h50V0z"/></clipPath><path d="M0 0v30h50V0z" fill="#012169"/><path d="M0 0l50 30M50 0L0 30" stroke="#fff" stroke-width="6" clip-path="url(#t)"/><path d="M0 0l50 30M50 0L0 30" stroke="#c8102e" stroke-width="4" clip-path="url(#t)"/><path d="M25 0v30M0 15h50" stroke="#fff" stroke-width="10"/><path d="M25 0v30M0 15h50" stroke="#c8102e" stroke-width="6"/></svg>`;
    case 'fr':
      return `<svg class="w-4 h-3 inline-block rounded-sm shadow-sm border border-black/10" viewBox="0 0 3 2" style="min-width: 16px;"><rect width="1" height="2" fill="#00209F"/><rect x="1" width="1" height="2" fill="#FFFFFF"/><rect x="2" width="1" height="2" fill="#F42C3E"/></svg>`;
    case 'zh':
      return `<svg class="w-4 h-3 inline-block rounded-sm shadow-sm border border-black/10" viewBox="0 0 30 20" fill="#ee1c25" style="min-width: 16px;"><rect width="30" height="20"/><circle cx="5" cy="5" r="3" fill="#ffde00"/><polygon points="5,2.5 5.6,4.1 7.2,4.1 5.9,5.1 6.4,6.7 5,5.7 3.6,6.7 4.1,5.1 2.8,4.1 4.4,4.1" fill="#ffde00"/></svg>`;
    default:
      return '';
  }
}

function translatePage() {
  const t = translations[currentLang];
  
  // Update all elements with data-i18n attribute
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (t[key]) {
      el.textContent = t[key];
    }
  });

  // Update active language text in button
  const activeLangObj = languages.find(l => l.code === currentLang) || languages[0];
  const activeLangSpan = document.getElementById('active-lang');
  if (activeLangSpan) {
    activeLangSpan.innerHTML = `
      <div class="flex items-center gap-1.5">
        ${getFlagSvg(currentLang)}
        <span>${activeLangObj.short.toUpperCase()}</span>
      </div>
    `;
  }
}

function buildLangDropdown() {
  const dropdown = document.getElementById('lang-dropdown');
  if (!dropdown) return;
  
  dropdown.innerHTML = '';
  languages.forEach((langObj) => {
    const btn = document.createElement('button');
    btn.className = `w-full text-left px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center justify-between ${currentLang === langObj.code ? 'nm-inset text-[#0071e3]' : 'hover:bg-slate-200/50 text-slate-700'}`;
    btn.innerHTML = `
      <div class="flex items-center gap-2">
        ${getFlagSvg(langObj.code)}
        <span>${langObj.label}</span>
      </div>
      <span class="text-[9px] opacity-60 uppercase">${langObj.short}</span>
    `;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      currentLang = langObj.code;
      localStorage.setItem('ts_lang', currentLang);
      localStorage.setItem('lang', currentLang);
      translatePage();
      buildLangDropdown(); // Rebuild to update active style
      dropdown.classList.add('hidden');
    });
    dropdown.appendChild(btn);
  });
}

// Run immediately to translate on initial load
translatePage();

document.addEventListener('DOMContentLoaded', () => {
  translatePage();
  buildLangDropdown();

  // Hide login button if token exists (already logged in)
  const token = localStorage.getItem('token');
  const loginBtn = document.getElementById('login-btn');
  if (token && loginBtn) {
    loginBtn.style.display = 'none';
  }

  // Initialize Lenis Smooth Scroll
  let lenisInstance = null;
  if (window.Lenis) {
    lenisInstance = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.5,
      infinite: false,
    });

    function raf(time) {
      lenisInstance.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  }

  // Intercept anchor link clicks for smooth Lenis scrolling
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const targetId = this.getAttribute('href');
      const targetEl = document.querySelector(targetId);
      if (targetEl && lenisInstance) {
        lenisInstance.scrollTo(targetEl, { offset: 0, duration: 1.2 });
      } else if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // Track scroll position to update navbar height and progress bar indicator
  const nav = document.getElementById('main-nav');
  const progressBar = document.getElementById('scroll-progress');

  const animSections = [
    { id: 'simulator' },
    { id: 'regions' },
    { id: 'exchanges' },
    { id: 'bots' },
    { id: 'features' },
    { id: 'pricing' },
    { id: 'security' },
    { id: 'compliance' },
    { id: 'community' },
    { id: 'about' }
  ];

  const handleScroll = () => {
    const scrollY = window.scrollY;
    // Shrink navbar padding on scroll
    if (scrollY > 50) {
      if (nav) {
        nav.classList.remove('py-4');
        nav.classList.add('py-2.5', 'shadow-md', 'bg-[#e6effb]/98');
      }
    } else {
      if (nav) {
        nav.classList.remove('py-2.5', 'shadow-md', 'bg-[#e6effb]/98');
        nav.classList.add('py-4');
      }
    }

    // Update progress bar width
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (scrollHeight > 0 && progressBar) {
      const scrollPercent = (scrollY / scrollHeight) * 100;
      progressBar.style.width = `${scrollPercent}%`;
    }

    // Dynamic staggered slide transforms for inner children (desktop only)
    const isDesktop = window.innerWidth >= 768;
    const viewportHeight = window.innerHeight;

    animSections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (!el) return;

      // Calculate entering progress based on original offsetTop
      const offsetTop = el.offsetTop;
      let progress = (scrollY - (offsetTop - viewportHeight)) / viewportHeight;
      progress = Math.max(0, Math.min(1, progress));

      const children = el.querySelectorAll('.anim-child');
      children.forEach((child) => {
        if (!isDesktop) {
          child.style.transform = '';
          child.style.opacity = '';
          return;
        }

        const animType = child.getAttribute('data-anim') || 'slide-up';
        const start = parseFloat(child.getAttribute('data-anim-start') || '0');
        const end = parseFloat(child.getAttribute('data-anim-end') || '1');

        // Calculate staggered child progress
        let childProgress = (progress - start) / (end - start);
        childProgress = Math.max(0, Math.min(1, childProgress));

        const factor = 1 - childProgress; // goes from 1 to 0
        child.style.opacity = childProgress;

        if (animType === 'slide-left') {
          child.style.transform = `translateX(${-factor * 120}px)`;
        } else if (animType === 'slide-right') {
          child.style.transform = `translateX(${factor * 120}px)`;
        } else if (animType === 'slide-up') {
          child.style.transform = `translateY(${factor * 100}px)`;
        } else if (animType === 'fade') {
          child.style.transform = '';
        }
      });
    });

    // Section-level parallax translate-up (slow-mo) for sticky overlays (desktop only)
    const stickySectionIds = ['home', 'simulator', 'regions', 'exchanges', 'bots', 'features', 'pricing', 'security', 'compliance', 'community'];
    stickySectionIds.forEach((id, index) => {
      const el = document.getElementById(id);
      if (!el) return;

      if (!isDesktop) {
        el.style.transform = '';
        return;
      }

      const nextId = stickySectionIds[index + 1];
      const nextEl = nextId ? document.getElementById(nextId) : null;
      if (nextEl) {
        const nextOffsetTop = nextEl.offsetTop;
        let coverProgress = (scrollY - (nextOffsetTop - viewportHeight)) / viewportHeight;
        coverProgress = Math.max(0, Math.min(1, coverProgress));

        // When the next section is entering, translate this section up slowly and scale down slightly
        if (coverProgress > 0) {
          const translateY = -coverProgress * 120;
          const scale = 1 - (coverProgress * 0.02);
          el.style.transform = `translateY(${translateY}px) scale(${scale})`;
          el.style.transformOrigin = 'center top';
        } else {
          el.style.transform = 'translateY(0px) scale(1)';
        }
      } else {
        el.style.transform = 'translateY(0px) scale(1)';
      }
    });
  };

  if (lenisInstance) {
    lenisInstance.on('scroll', handleScroll);
  } else {
    window.addEventListener('scroll', handleScroll);
  }
  window.addEventListener('resize', handleScroll);
  // Run once initially to position correctly
  handleScroll();

  const dropdownButtons = document.querySelectorAll('.nav-dropdown-btn');
  const dropdowns = document.querySelectorAll('.nav-dropdown');
  const langDropdown = document.getElementById('lang-dropdown');

  dropdownButtons.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const targetId = btn.getAttribute('data-target');
      const targetDropdown = document.getElementById(targetId);
      
      // Close all other dropdowns
      dropdowns.forEach((dd) => {
        if (dd !== targetDropdown) {
          dd.classList.add('hidden');
        }
      });
      
      // Also close language dropdown if open
      if (langDropdown) langDropdown.classList.add('hidden');
      
      // Toggle current
      if (targetDropdown) {
        targetDropdown.classList.toggle('hidden');
      }
    });
  });

  // Language Dropdown Toggle
  const langBtn = document.getElementById('lang-btn');
  if (langBtn && langDropdown) {
    langBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      // Close all nav dropdowns
      dropdowns.forEach((dd) => dd.classList.add('hidden'));
      langDropdown.classList.toggle('hidden');
    });
  }

  // Click outside to close everything
  document.addEventListener('click', () => {
    dropdowns.forEach((dd) => dd.classList.add('hidden'));
    if (langDropdown) {
      langDropdown.classList.add('hidden');
    }
  });

  // Back to Top Button Logic
  const backToTopBtn = document.getElementById('back-to-top');
  if (backToTopBtn) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 400) {
        backToTopBtn.classList.remove('opacity-0', 'pointer-events-none');
        backToTopBtn.classList.add('opacity-100');
      } else {
        backToTopBtn.classList.remove('opacity-100');
        backToTopBtn.classList.add('opacity-0', 'pointer-events-none');
      }
    });

    backToTopBtn.addEventListener('click', () => {
      if (lenisInstance) {
        lenisInstance.scrollTo(0, { duration: 1.2 });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }
});
