import './style.css';
import { storyBlocks, hotspots, cognitiveProcesses } from './data/story-blocks.js';

// ==========================================
// STATE
// ==========================================
const state = {
  exploredHotspots: new Set(JSON.parse(localStorage.getItem('lentesRotas_explored') || '[]')),
  calibrationDone: 0,
  currentHotspot: null,
  panelOpen: false
};

function saveState() {
  localStorage.setItem('lentesRotas_explored', JSON.stringify([...state.exploredHotspots]));
}

// ==========================================
// TYPING EFFECT
// ==========================================
function typeTitle() {
  const el = document.getElementById('typed-title');
  const text = 'LENTES ROTOS';
  let i = 0;
  const cursor = document.createElement('span');
  cursor.style.cssText = 'animation: blink 0.7s step-end infinite; border-right: 3px solid var(--crt-text);';
  el.appendChild(cursor);

  const style = document.createElement('style');
  style.textContent = '@keyframes blink { 50% { border-color: transparent; } }';
  document.head.appendChild(style);

  function type() {
    if (i < text.length) {
      el.insertBefore(document.createTextNode(text[i]), cursor);
      i++;
      setTimeout(type, 120 + Math.random() * 80);
    } else {
      setTimeout(() => cursor.remove(), 1500);
    }
  }
  setTimeout(type, 800);
}

// ==========================================
// CALIBRATION
// ==========================================
function setupCalibration() {
  const items = document.querySelectorAll('.calibration__item');

  items.forEach(item => {
    const btns = item.querySelectorAll('.calibration__btn');
    const reveal = item.querySelector('.calibration__reveal');
    let answered = false;

    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        // Deselect all buttons in this item
        btns.forEach(b => b.classList.remove('selected'));
        // Select the clicked one
        btn.classList.add('selected');

        // Show reveal
        reveal.classList.add('visible');

        // Count only once per item
        if (!answered) {
          answered = true;
          state.calibrationDone++;
          if (state.calibrationDone >= 3) {
            setTimeout(() => {
              document.getElementById('calibration-conclusion').classList.add('visible');
            }, 600);
          }
        }
      });
    });
  });
}

// ==========================================
// STORY RENDERER
// ==========================================
function renderStory() {
  const container = document.getElementById('story-container');

  storyBlocks.forEach(block => {
    const div = document.createElement('div');
    div.className = 'story-block';
    div.id = block.id;

    let content = `<div class="story-block__text">${block.html}</div>`;
    if (block.postHtml) {
      content += `<div class="story-block__text" style="margin-top:16px">${block.postHtml}</div>`;
    }

    div.innerHTML = content;
    container.appendChild(div);
  });

  // Setup intersection observer for scroll reveal
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  document.querySelectorAll('.story-block').forEach(block => observer.observe(block));

  // Mark already explored hotspots
  state.exploredHotspots.forEach(id => {
    const el = document.querySelector(`[data-hotspot="${id}"]`);
    if (el) {
      const hs = hotspots[id];
      el.classList.add('explored');
      el.setAttribute('data-process-color', hs.cognitive.primary);
    }
  });
}

// ==========================================
// LENS PANEL
// ==========================================
function openLensPanel(hotspotId) {
  const hs = hotspots[hotspotId];
  if (!hs) return;

  state.currentHotspot = hotspotId;
  state.panelOpen = true;

  const panel = document.getElementById('lens-panel');
  const literalMode = document.getElementById('lens-literal');
  const figurativeMode = document.getElementById('lens-figurative');

  // Reset to literal mode
  literalMode.style.display = '';
  figurativeMode.style.display = 'none';

  // Fill literal content
  document.getElementById('lens-phrase-literal').textContent = hs.phrase;
  document.getElementById('lens-narrator').textContent = hs.literal.narrator;
  document.getElementById('lens-description').textContent = hs.literal.description;

  // Fill figurative content
  document.getElementById('lens-phrase-figurative').textContent = hs.phrase;
  document.getElementById('lens-meaning').textContent = hs.figurative.meaning;
  document.getElementById('lens-idiom').textContent = hs.figurative.idiomType;

  // Cognitive process badge
  const badge = document.getElementById('lens-process-badge');
  const processName = cognitiveProcesses[hs.cognitive.primary]?.name || hs.cognitive.primary;
  badge.textContent = processName;
  badge.setAttribute('data-process', hs.cognitive.primary);

  if (hs.cognitive.secondary) {
    const secondaryName = cognitiveProcesses[hs.cognitive.secondary]?.name || hs.cognitive.secondary;
    badge.textContent += ` + ${secondaryName}`;
  }

  document.getElementById('lens-failure').textContent = hs.cognitive.failure;
  document.getElementById('lens-theory').textContent = hs.cognitive.theory;

  // Activate CRT overlay
  document.getElementById('crt-overlay').classList.add('active');

  // Open panel
  panel.classList.add('open');
  document.body.classList.add('panel-open');

  // Activate dashboard dot
  activateDashboardDot(hs.cognitive.primary);
  if (hs.cognitive.secondary) {
    activateDashboardDot(hs.cognitive.secondary);
  }

  // Glitch effect on the hotspot element
  const hotspotEl = document.querySelector(`[data-hotspot="${hotspotId}"]`);
  if (hotspotEl) {
    hotspotEl.classList.add('glitch-text');
    setTimeout(() => hotspotEl.classList.remove('glitch-text'), 300);
  }
}

function switchToFigurative() {
  const literalMode = document.getElementById('lens-literal');
  const figurativeMode = document.getElementById('lens-figurative');

  // Deactivate CRT
  document.getElementById('crt-overlay').classList.remove('active');

  // Transition
  literalMode.style.display = 'none';
  figurativeMode.style.display = '';

  // Mark hotspot as explored
  if (state.currentHotspot) {
    state.exploredHotspots.add(state.currentHotspot);
    saveState();

    const hs = hotspots[state.currentHotspot];
    const el = document.querySelector(`[data-hotspot="${state.currentHotspot}"]`);
    if (el) {
      el.classList.add('explored');
      el.setAttribute('data-process-color', hs.cognitive.primary);
    }

    updateProgress();
  }
}

function closeLensPanel() {
  const panel = document.getElementById('lens-panel');
  panel.classList.remove('open');
  document.body.classList.remove('panel-open');
  document.getElementById('crt-overlay').classList.remove('active');
  state.currentHotspot = null;

  // Deactivate all dashboard dots
  document.querySelectorAll('.dashboard__dot').forEach(d => d.classList.remove('active'));

  // Delay resetting panelOpen to avoid race conditions with CSS transitions
  setTimeout(() => {
    state.panelOpen = false;
  }, 450);
}

// ==========================================
// DASHBOARD
// ==========================================
function activateDashboardDot(process) {
  const dot = document.querySelector(`.dashboard__dot[data-process="${process}"]`);
  if (dot) dot.classList.add('active');
}

function updateProgress() {
  const total = Object.keys(hotspots).length;
  const explored = state.exploredHotspots.size;

  document.querySelector('.dashboard__status-text').textContent = `${explored} / ${total}`;
}

function setupDashboardVisibility() {
  const dashboard = document.getElementById('cognitive-dashboard');
  const readingSection = document.getElementById('section-prelecture');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        dashboard.classList.add('visible');
      }
    });
  }, { threshold: 0.1 });

  if (readingSection) observer.observe(readingSection);

  // Also show on scroll past landing
  window.addEventListener('scroll', () => {
    if (window.scrollY > window.innerHeight * 0.7) {
      dashboard.classList.add('visible');
    }
  }, { passive: true });
}

// ==========================================
// COGNITIVE MAP
// ==========================================
function renderCognitiveMap() {
  const container = document.getElementById('cognitive-grid');

  const columns = {
    decodificacion: {
      title: 'Decodificación',
      status: 'Éxito total',
      entries: ['El narrador decodifica perfectamente todas las palabras. Su acceso léxico es impecable. El problema es de orden superior.']
    },
    interpretacion: {
      title: 'Interpretación',
      status: 'Fracaso crítico',
      entries: []
    },
    integracion: {
      title: 'Integración',
      status: 'Esquemas erróneos',
      entries: []
    },
    evaluacion: {
      title: 'Evaluación',
      status: 'Clímax del absurdo',
      entries: []
    }
  };

  // Populate from hotspots
  Object.values(hotspots).forEach(hs => {
    const entry = hs.phrase;
    if (columns[hs.cognitive.primary]) {
      columns[hs.cognitive.primary].entries.push(entry);
    }
    if (hs.cognitive.secondary && columns[hs.cognitive.secondary]) {
      columns[hs.cognitive.secondary].entries.push(`(+) ${entry}`);
    }
  });

  Object.entries(columns).forEach(([process, data]) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'cognitive-accordion';
    wrapper.setAttribute('data-process', process);

    const btn = document.createElement('button');
    btn.className = 'cognitive-accordion__btn';
    btn.innerHTML = `
      <span class="cognitive-accordion__dot"></span>
      <span class="cognitive-accordion__title">${data.title}</span>
      <span class="cognitive-accordion__status">${data.status}</span>
      <span class="cognitive-accordion__arrow">+</span>
    `;

    const panel = document.createElement('div');
    panel.className = 'cognitive-accordion__panel';
    panel.innerHTML = data.entries.map(e =>
      `<div class="cognitive-entry">${e}</div>`
    ).join('');

    btn.addEventListener('click', () => {
      const isOpen = wrapper.classList.contains('open');
      // Close all
      container.querySelectorAll('.cognitive-accordion').forEach(a => a.classList.remove('open'));
      // Toggle clicked
      if (!isOpen) wrapper.classList.add('open');
    });

    wrapper.appendChild(btn);
    wrapper.appendChild(panel);
    container.appendChild(wrapper);
  });
}

// ==========================================
// SCROLL TO SECTION
// ==========================================
function setupNavigation() {
  const btnStart = document.getElementById('btn-start');
  if (btnStart) {
    btnStart.addEventListener('click', () => {
      document.getElementById('section-prelecture').scrollIntoView({ behavior: 'smooth' });
    });
  }
}

// ==========================================
// HOTSPOT CLICK HANDLERS
// ==========================================
function setupHotspotClicks() {
  document.addEventListener('click', (e) => {
    const hotspot = e.target.closest('.hotspot');
    if (hotspot && !state.panelOpen) {
      const id = hotspot.getAttribute('data-hotspot');
      if (id) openLensPanel(id);
    }
  });
}

// ==========================================
// PANEL CONTROLS
// ==========================================
function setupPanelControls() {
  document.getElementById('lens-close').addEventListener('click', closeLensPanel);
  document.getElementById('btn-correct-lens').addEventListener('click', switchToFigurative);
  document.getElementById('btn-close-analysis').addEventListener('click', closeLensPanel);

  // Close on backdrop click
  document.addEventListener('click', (e) => {
    if (state.panelOpen && e.target === document.body) {
      closeLensPanel();
    }
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && state.panelOpen) {
      closeLensPanel();
    }
  });
}

// ==========================================
// INIT
// ==========================================
function init() {
  typeTitle();
  setupCalibration();
  renderStory();
  renderCognitiveMap();
  setupHotspotClicks();
  setupPanelControls();
  setupDashboardVisibility();
  setupNavigation();
  updateProgress();
}

document.addEventListener('DOMContentLoaded', init);
