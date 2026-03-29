const state = {
  styles: [],
  filtered: [],
  tags: [],
  activeTags: new Set(),
  query: '',
};

const gallery = document.getElementById('gallery');
const tagFilters = document.getElementById('tagFilters');
const countEl = document.getElementById('count');
const searchInput = document.getElementById('searchInput');
const heroMedia = document.getElementById('heroMedia');
const heroSentinel = document.getElementById('heroSentinel');
const filtersEl = document.querySelector('.filters');
const filtersSpacer = document.getElementById('filtersSpacer');

const detailView = document.getElementById('detailView');
const detailBack = document.getElementById('detailBack');
const detailHeroImage = document.getElementById('detailHeroImage');
const detailTitle = document.getElementById('detailTitle');
const detailTags = document.getElementById('detailTags');
const detailPrompt = document.getElementById('detailPrompt');
const detailSource = document.getElementById('detailSource');
const detailGallery = document.getElementById('detailGallery');
const detailCopy = document.getElementById('detailCopy');

function normalize(text) {
  return text.toLowerCase();
}

function matches(style) {
  const q = normalize(state.query);
  const matchesQuery = !q || [style.title, style.prompt, style.tags.join(' ')].some((field) => normalize(field).includes(q));
  const matchesTags = state.activeTags.size === 0 || Array.from(state.activeTags).every((tag) => style.tags.includes(tag));
  return matchesQuery && matchesTags;
}

function renderTags() {
  tagFilters.innerHTML = '';
  state.tags.forEach((tag) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `tag${state.activeTags.has(tag) ? ' active' : ''}`;
    button.textContent = tag;
    button.addEventListener('click', () => {
      if (state.activeTags.has(tag)) {
        state.activeTags.delete(tag);
      } else {
        state.activeTags.add(tag);
      }
      renderTags();
      applyFilters();
    });
    tagFilters.appendChild(button);
  });
}

function renderGallery() {
  gallery.innerHTML = '';
  state.filtered.forEach((style) => {
    const { primary } = getImageSet(style);
    const link = document.createElement('a');
    link.href = `#style/${style.id}`;
    link.className = 'tile';

    const image = document.createElement('div');
    image.className = 'tile-image';
    image.style.backgroundImage = primary ? `url(${primary})` : 'linear-gradient(135deg, #4a4e8f, #2b1e3e)';

    const overlay = document.createElement('div');
    overlay.className = 'tile-overlay';

    const title = document.createElement('h3');
    title.className = 'tile-title';
    title.textContent = style.title;

    const tags = document.createElement('div');
    tags.className = 'tile-tags';
    style.tags.slice(0, 4).forEach((tag) => {
      const chip = document.createElement('span');
      chip.textContent = tag;
      tags.appendChild(chip);
    });

    overlay.appendChild(title);
    overlay.appendChild(tags);
    link.appendChild(image);
    link.appendChild(overlay);

    link.addEventListener('click', (event) => {
      event.preventDefault();
      openDetail(style);
      window.history.replaceState(null, '', `#style/${style.id}`);
    });

    gallery.appendChild(link);
  });

  requestAnimationFrame(() => {
    const tiles = document.querySelectorAll('.tile');
    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal');
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );
    tiles.forEach((tile) => observer.observe(tile));
  });
}

function applyFilters() {
  state.filtered = state.styles.filter(matches);
  countEl.textContent = state.filtered.length;
  renderGallery();
}

function updateFiltersSpacer() {
  if (!filtersEl || !filtersSpacer) return;
  if (document.body.classList.contains('filters-fixed')) {
    const height = filtersEl.offsetHeight;
    filtersSpacer.style.height = `${height}px`;
  } else {
    filtersSpacer.style.height = '0px';
  }
}

function initFiltersObserver() {
  if (!heroSentinel || !filtersEl) return;
  if (!('IntersectionObserver' in window)) {
    document.body.classList.remove('filters-fixed');
    updateFiltersSpacer();
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        document.body.classList.remove('filters-fixed');
      } else {
        document.body.classList.add('filters-fixed');
      }
      updateFiltersSpacer();
    });
  });
  observer.observe(heroSentinel);

  if ('ResizeObserver' in window) {
    const resizeObserver = new ResizeObserver(() => {
      updateFiltersSpacer();
    });
    resizeObserver.observe(filtersEl);
  } else {
    window.addEventListener('resize', updateFiltersSpacer);
  }
}

function renderHeroMosaic() {
  heroMedia.innerHTML = '';
  const images = [];
  state.styles.forEach((style) => {
    const { primary } = getImageSet(style);
    if (primary) images.push(primary);
  });
  images.slice(0, 18).forEach((src, index) => {
    const tile = document.createElement('div');
    tile.className = 'tile';
    tile.style.backgroundImage = `url(${src})`;
    tile.style.gridColumn = `span ${index % 5 === 0 ? 3 : 2}`;
    tile.style.gridRow = `span ${index % 4 === 0 ? 2 : 1}`;
    heroMedia.appendChild(tile);
  });
}

function openDetail(style) {
  const { primary, rest } = getImageSet(style);
  detailTitle.textContent = style.title;
  detailHeroImage.src = primary || '';
  detailHeroImage.alt = style.title;
  detailPrompt.textContent = style.prompt;
  detailCopy.classList.remove('copied');
  detailCopy.textContent = 'Copy Prompt';
  detailTags.innerHTML = '';
  style.tags.forEach((tag) => {
    const span = document.createElement('span');
    span.textContent = tag;
    detailTags.appendChild(span);
  });

  detailGallery.innerHTML = '';
  rest.forEach((src) => {
    const img = document.createElement('img');
    img.src = src;
    img.alt = style.title;
    img.addEventListener('click', () => {
      detailHeroImage.src = src;
      detailHeroImage.alt = style.title;
      detailHeroImage.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    detailGallery.appendChild(img);
  });

  if (style.source) {
    detailSource.href = style.source;
    detailSource.style.display = 'inline-flex';
  } else {
    detailSource.style.display = 'none';
  }

  detailView.hidden = false;
  document.body.classList.add('detail-open');
}

function getImageSet(style) {
  const images = Array.isArray(style.images) ? style.images.filter(Boolean) : [];
  if (images.length === 0) return { primary: '', rest: [] };
  const local = images.find((src) => src.startsWith('assets/'));
  const primary = local || images[0];
  const rest = images.filter((src) => src !== primary);
  return { primary, rest };
}

function closeDetail() {
  detailView.hidden = true;
  document.body.classList.remove('detail-open');
  window.history.replaceState(null, '', '#');
}

async function handleCopyPrompt() {
  const text = detailPrompt.textContent || '';
  if (!text) return;
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    detailCopy.classList.add('copied');
    detailCopy.textContent = 'Copied';
    setTimeout(() => {
      detailCopy.classList.remove('copied');
      detailCopy.textContent = 'Copy Prompt';
    }, 1600);
  } catch (err) {
    console.error('Copy failed', err);
  }
}

function handleHash() {
  const hash = window.location.hash.replace('#', '');
  if (!hash.startsWith('style/')) {
    closeDetail();
    return;
  }
  const id = hash.replace('style/', '');
  const style = state.styles.find((item) => item.id === id);
  if (style) {
    openDetail(style);
  }
}

function attachParallax() {
  window.addEventListener('scroll', () => {
    const offset = Math.min(window.scrollY * 0.2, 120);
    heroMedia.style.transform = `translateY(${offset}px)`;
  });
}

searchInput.addEventListener('input', (event) => {
  state.query = event.target.value;
  applyFilters();
});

detailBack.addEventListener('click', () => {
  closeDetail();
});

detailCopy.addEventListener('click', () => {
  handleCopyPrompt();
});

window.addEventListener('hashchange', handleHash);

initFiltersObserver();

fetch('data/styles.json')
  .then((res) => res.json())
  .then((data) => {
    state.styles = data.styles || [];
    const tagSet = new Set();
    state.styles.forEach((style) => {
      style.tags.forEach((tag) => tagSet.add(tag));
    });
    state.tags = Array.from(tagSet).sort();
    renderHeroMosaic();
    renderTags();
    applyFilters();
    updateFiltersSpacer();
    handleHash();
    attachParallax();
  })
  .catch((err) => {
    console.error('Failed to load styles', err);
  });
