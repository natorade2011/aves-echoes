/* ==========================================================================
   Aves & Echoes — Interactive Frontend Engine
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  /* --------------------------------------------------------------------------
     1. Mock Databases (Pre-baked Premium Blog Posts & Field Guide)
     -------------------------------------------------------------------------- */
  let BLOG_POSTS = [];

  async function fetchBlogPosts() {
    try {
      const response = await fetch('posts.json');
      if (!response.ok) throw new Error('Failed to load blog database');
      BLOG_POSTS = await response.json();
      renderBlogGrid();
    } catch (err) {
      console.error("Error loading blog posts:", err);
      // Premium user-friendly error fallback
      blogGrid.innerHTML = `
        <div class="empty-state-card glass-panel" style="grid-column: 1 / -1; max-width: 500px; margin: 2rem auto;">
          <div class="empty-img-wrapper" style="border-color: rgba(220, 50, 50, 0.3);">
            <img class="empty-img" src="images/sightings_placeholder.png" alt="Database connection error indicator">
          </div>
          <h3>Chronicles Not Synchronized</h3>
          <p>We encountered an issue reading the local JSON database file. Please verify that posts.json is present in the root directory.</p>
        </div>
      `;
    }
  }

  const FIELD_GUIDE = [
    {
      name: 'Common Loon',
      scientific: 'Gavia immer',
      category: 'Waterfowl',
      size: '70 - 90 cm',
      diet: 'Small fish, crustaceans',
      habitat: 'Deep lakes',
      image: 'images/common_loon.png',
      callName: 'Haunting Wail',
      callUrl: 'https://www.xeno-canto.org/sounds/uploaded/RVKNMDHXXE/XC735438-Loon%20wail%20XC.mp3',
      description: 'A large, heavy-bodied waterbird with a black head, white neck band, and checkered back. Renowned for its primeval vocalizations that carry for miles.'
    },
    {
      name: 'Blackburnian Warbler',
      scientific: 'Setophaga fusca',
      category: 'Songbirds',
      size: '11 - 13 cm',
      diet: 'Caterpillars, insects',
      habitat: 'Conifer tops',
      image: 'images/warbler.png',
      callName: 'High-Pitch Squeak',
      callUrl: 'https://www.xeno-canto.org/sounds/uploaded/OOECBDNLWD/XC729221-Blackburnian-Warbler-20220601-090209.mp3',
      description: 'A tiny canopy specialist with a striking, flame-orange throat. They build nests in high evergreen spires and migrate vast distances.'
    },
    {
      name: 'Peregrine Falcon',
      scientific: 'Falco peregrinus',
      category: 'Raptors',
      size: '36 - 58 cm',
      diet: 'Pigeons, songbirds',
      habitat: 'Skyscrapers, cliffs',
      image: 'images/peregrine_falcon.png',
      callName: 'Kak-Kak Alarm',
      callUrl: 'https://www.xeno-canto.org/sounds/uploaded/TNVKKJQDQC/XC743209-Falco-peregrinus_20220815_091535.mp3',
      description: 'The world\'s fastest raptor, boasting blue-grey wings, a black hood, and powerful yellow talons. Expert at high-altitude diving stoops.'
    }
  ];

  /* --------------------------------------------------------------------------
     2. DOM Element Selectors
     -------------------------------------------------------------------------- */
  // Navigation elements
  const mainHeader = document.getElementById('main-header');
  const navBtns = document.querySelectorAll('.nav-btn');
  const appViews = document.querySelectorAll('.app-view');
  const heroExploreBtn = document.getElementById('hero-cta-explore');
  const heroLogBtn = document.getElementById('hero-cta-log');
  const brandLogo = document.getElementById('brand-logo');
  const footerLinks = document.querySelectorAll('.footer-link-btn');

  // Theme switcher elements
  const themeToggle = document.getElementById('theme-toggle');

  // Blog Chronicles elements
  const blogGrid = document.getElementById('blog-grid');
  const filterBtns = document.querySelectorAll('.filter-btn');
  const articleDetailView = document.getElementById('article-detail-view');
  const blogView = document.getElementById('blog-view');

  // Field Guide elements
  const guideGrid = document.getElementById('guide-grid');
  const guideSearch = document.getElementById('guide-search');

  // Sighting Journal elements
  const sightingsGrid = document.getElementById('sightings-grid');
  const btnOpenSightingModal = document.getElementById('btn-open-sighting-modal');
  const btnCloseSightingModal = document.getElementById('btn-close-sighting-modal');
  const btnCancelSighting = document.getElementById('btn-cancel-sighting');
  const sightingDialog = document.getElementById('sighting-dialog');
  const sightingForm = document.getElementById('sighting-form');
  const photoSelect = document.getElementById('sighting-photo-select');
  const customFileGroup = document.getElementById('custom-file-group');
  const sightingFile = document.getElementById('sighting-file');
  const filePreviewBox = document.getElementById('file-preview-box');
  const filePreviewImg = document.getElementById('file-preview-img');
  const btnRemoveFile = document.getElementById('btn-remove-file');

  // Floating Audio Widget
  const audioWidget = document.getElementById('audio-widget');
  const widgetPhoto = document.getElementById('widget-photo');
  const widgetName = document.getElementById('widget-name');
  const widgetPlayToggle = document.getElementById('widget-play-toggle');

  /* --------------------------------------------------------------------------
     3. Global Audio Soundboard Manager
     -------------------------------------------------------------------------- */
  const globalAudio = new Audio();
  let activeAudioBird = null; // Stores currently playing bird object

  function playBirdCall(bird) {
    if (activeAudioBird && activeAudioBird.name === bird.name) {
      // Toggle play/pause if clicking the same bird
      if (globalAudio.paused) {
        globalAudio.play();
        updateAudioUI(true);
      } else {
        globalAudio.pause();
        updateAudioUI(false);
      }
    } else {
      // Stop previous bird, load and play the new bird call
      globalAudio.src = bird.callUrl;
      activeAudioBird = bird;
      
      // Attempt to play
      globalAudio.play()
        .then(() => {
          updateAudioUI(true);
        })
        .catch(err => {
          console.error("Audio playback error:", err);
          alert("Unable to stream bird call audio. Please verify your internet connection.");
          hideAudioWidget();
        });
    }
  }

  function updateAudioUI(isPlaying) {
    if (!activeAudioBird) return;

    // Show floating widget
    audioWidget.classList.remove('hidden');
    
    // Set widget info
    widgetName.textContent = activeAudioBird.name;
    widgetPhoto.style.backgroundImage = `url('${activeAudioBird.image}')`;
    
    // Set play/pause icon states
    if (isPlaying) {
      widgetPlayToggle.innerHTML = `
        <svg class="icon-pause" viewBox="0 0 24 24" fill="currentColor">
          <rect x="6" y="4" width="4" height="16"></rect>
          <rect x="14" y="4" width="4" height="16"></rect>
        </svg>
      `;
      audioWidget.classList.add('playing');
      
      // Animate corresponding guide card play buttons
      document.querySelectorAll('.guide-audio-btn').forEach(btn => {
        const name = btn.getAttribute('data-bird');
        if (name === activeAudioBird.name) {
          btn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16"></rect>
              <rect x="14" y="4" width="4" height="16"></rect>
            </svg>
          `;
          btn.style.boxShadow = '0 0 15px rgba(var(--accent-rgb), 0.5)';
        } else {
          resetGuideCardBtn(btn);
        }
      });
    } else {
      widgetPlayToggle.innerHTML = `
        <svg class="icon-play" viewBox="0 0 24 24" fill="currentColor">
          <polygon points="5 3 19 12 5 21 5 3"></polygon>
        </svg>
      `;
      audioWidget.classList.remove('playing');
      
      // Stop pulsing guide cards
      document.querySelectorAll('.guide-audio-btn').forEach(btn => {
        resetGuideCardBtn(btn);
      });
    }
  }

  function resetGuideCardBtn(btn) {
    btn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="currentColor">
        <polygon points="5 3 19 12 5 21 5 3"></polygon>
      </svg>
    `;
    btn.style.boxShadow = 'var(--shadow-md)';
  }

  function hideAudioWidget() {
    audioWidget.classList.add('hidden');
    audioWidget.classList.remove('playing');
    activeAudioBird = null;
    globalAudio.pause();
    document.querySelectorAll('.guide-audio-btn').forEach(btn => {
      resetGuideCardBtn(btn);
    });
  }

  // Audio widget click interactions
  widgetPlayToggle.addEventListener('click', () => {
    if (activeAudioBird) {
      if (globalAudio.paused) {
        globalAudio.play();
        updateAudioUI(true);
      } else {
        globalAudio.pause();
        updateAudioUI(false);
      }
    }
  });

  globalAudio.addEventListener('ended', () => {
    updateAudioUI(false);
  });

  /* --------------------------------------------------------------------------
     4. SPA Tab-Switching Router & Header Scroll Fallback
     -------------------------------------------------------------------------- */
  function navigateSPA(targetViewId) {
    // Hide details view automatically when swapping primary sections
    articleDetailView.classList.add('hidden');
    blogView.classList.remove('hidden');

    // Switch active navigation button styling
    navBtns.forEach(btn => {
      if (btn.getAttribute('data-target') === targetViewId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Switch visibility of views
    appViews.forEach(view => {
      if (view.id === `${targetViewId}-view`) {
        view.classList.remove('hidden');
      } else {
        view.classList.add('hidden');
      }
    });

    // Scroll smoothly to top of main content wrapper
    const scrollTarget = targetViewId === 'blog' ? 0 : document.querySelector('.content-wrapper').offsetTop - 100;
    window.scrollTo({
      top: scrollTarget,
      behavior: 'smooth'
    });
  }

  // Add click listeners to header navigation buttons
  navBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const target = e.currentTarget.getAttribute('data-target');
      navigateSPA(target);
    });
  });

  // Footer navigation buttons
  footerLinks.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const target = e.currentTarget.getAttribute('data-target');
      navigateSPA(target);
    });
  });

  // Hero CTA listeners
  heroExploreBtn.addEventListener('click', () => {
    navigateSPA('blog');
  });

  heroLogBtn.addEventListener('click', () => {
    navigateSPA('journal');
    setTimeout(() => {
      openSightingModal();
    }, 450);
  });

  // Logo home navigation
  brandLogo.addEventListener('click', (e) => {
    e.preventDefault();
    navigateSPA('blog');
  });

  // Header Shrink JS Fallback for unsupported browsers (Firefox)
  if (!CSS.supports('(animation-timeline: scroll()) and (animation-range: 0% 100%)')) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 60) {
        mainHeader.classList.add('shrunk');
      } else {
        mainHeader.classList.remove('shrunk');
      }
    });
  }

  /* --------------------------------------------------------------------------
     5. Dark / Light Theme Manager
     -------------------------------------------------------------------------- */
  // Load initial theme from localStorage or default to dark
  const savedTheme = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);

  themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  });

  /* --------------------------------------------------------------------------
     6. Blog Chronicles Render Engine (Grid & Dynamic Details)
     -------------------------------------------------------------------------- */
  function renderBlogGrid(filter = 'all') {
    blogGrid.innerHTML = '';
    
    const filteredPosts = filter === 'all' 
      ? BLOG_POSTS 
      : BLOG_POSTS.filter(post => post.category === filter);

    filteredPosts.forEach(post => {
      const card = document.createElement('article');
      card.className = 'blog-card glass-panel';
      card.id = `card-${post.id}`;
      
      // Dynamic HTML contents
      card.innerHTML = `
        <div class="blog-card-img-wrapper">
          <img class="blog-card-img" src="${post.image}" alt="Photograph of ${post.title}">
          <span class="blog-card-tag">${post.tag}</span>
        </div>
        <div class="blog-card-content">
          <div class="blog-card-meta">
            <span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              ${post.readingTime}
            </span>
            <span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              ${post.date}
            </span>
          </div>
          <h3 class="blog-card-title">${post.title}</h3>
          <p class="blog-card-excerpt">${post.excerpt}</p>
          <div class="blog-card-footer">
            <div class="author-block">
              <img class="author-avatar" src="${post.authorAvatar}" alt="Avatar of ${post.author}">
              <span class="author-name">${post.author}</span>
            </div>
            <span class="read-more-link">
              Read Article
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </span>
          </div>
        </div>
      `;

      // Set up click action to open detail view
      card.addEventListener('click', () => {
        showArticleDetail(post);
      });

      blogGrid.appendChild(card);
    });
  }

  // Set up category buttons filtering
  filterBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      filterBtns.forEach(b => b.classList.remove('active'));
      e.currentTarget.classList.add('active');
      const filterVal = e.currentTarget.getAttribute('data-filter');
      renderBlogGrid(filterVal);
    });
  });

  // Render Full Article Detail Page (Using View Transitions)
  function showArticleDetail(post) {
    const cardElement = document.getElementById(`card-${post.id}`);
    
    // Set dynamic view transition targets
    if (cardElement) {
      const cardImg = cardElement.querySelector('.blog-card-img');
      const cardTitle = cardElement.querySelector('.blog-card-title');
      
      if (cardImg) cardImg.style.viewTransitionName = 'detail-hero';
      if (cardTitle) cardTitle.style.viewTransitionName = 'detail-title';
    }

    // Prepare detail container DOM structure
    articleDetailView.innerHTML = `
      <div class="article-detail-container">
        <button class="detail-back-btn" id="btn-back-to-blog" aria-label="Go back to articles list">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Back to Chronicles
        </button>

        <header class="detail-header-panel">
          <span class="detail-category">${post.tag}</span>
          <h2 class="detail-title" id="detail-heading" tabindex="-1">${post.title}</h2>
          <div class="detail-meta-wrapper">
            <div class="author-block">
              <img class="author-avatar" src="${post.authorAvatar}" alt="Avatar of ${post.author}">
              <span class="author-name">Written by <strong>${post.author}</strong></span>
            </div>
            <span>Published ${post.date}</span>
            <span>&bull;</span>
            <span>${post.readingTime}</span>
          </div>
        </header>

        <div class="detail-hero-img-wrapper">
          <img class="detail-hero-img" src="${post.image}" alt="${post.title} hero photograph">
        </div>

        <div class="detail-body-wrapper">
          <div class="detail-text-content">
            ${post.content}
          </div>
          
          <aside class="detail-sidebar">
            <div class="sidebar-card glass-panel">
              <h4>Avian Taxonomy</h4>
              <ul class="species-facts-list">
                <li>
                  <span>Scientific Name</span>
                  <span><em>${post.speciesFacts.scientific}</em></span>
                </li>
                <li>
                  <span>Core Habitat</span>
                  <span>${post.speciesFacts.habitat}</span>
                </li>
                <li>
                  <span>Approx. Wingspan</span>
                  <span>${post.speciesFacts.wingspan}</span>
                </li>
                <li>
                  <span>Conservation Status</span>
                  <span><strong style="color:var(--accent);">${post.speciesFacts.status}</strong></span>
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    `;

    // Connect detail hero transition names
    const detailImg = articleDetailView.querySelector('.detail-hero-img');
    const detailTitle = articleDetailView.querySelector('.detail-title');
    if (detailImg) detailImg.style.viewTransitionName = 'detail-hero';
    if (detailTitle) detailTitle.style.viewTransitionName = 'detail-title';

    // SPA view transitions execution block
    const performSwap = () => {
      blogView.classList.add('hidden');
      articleDetailView.classList.remove('hidden');
      window.scrollTo({ top: 0, behavior: 'auto' });
    };

    if (!document.startViewTransition) {
      performSwap();
      // Accessibility routing: route focus to the newly revealed heading
      document.getElementById('detail-heading')?.focus();
      connectDetailBackButton(post.id);
    } else {
      const transition = document.startViewTransition(() => {
        performSwap();
      });
      
      transition.finished.finally(() => {
        document.getElementById('detail-heading')?.focus();
        connectDetailBackButton(post.id);
      });
    }
  }

  function connectDetailBackButton(originalCardId) {
    const btnBack = document.getElementById('btn-back-to-blog');
    
    btnBack.addEventListener('click', () => {
      const performBackSwap = () => {
        articleDetailView.classList.add('hidden');
        blogView.classList.remove('hidden');
        
        // Scroll exactly to the card that was clicked
        const originalCard = document.getElementById(`card-${originalCardId}`);
        if (originalCard) {
          originalCard.scrollIntoView({ behavior: 'auto', block: 'center' });
        }
      };

      if (!document.startViewTransition) {
        performBackSwap();
        document.getElementById('main-heading')?.focus();
        cleanupTransitionNames(originalCardId);
      } else {
        const transition = document.startViewTransition(() => {
          performBackSwap();
        });
        
        transition.finished.finally(() => {
          document.getElementById('main-heading')?.focus();
          cleanupTransitionNames(originalCardId);
        });
      }
    });
  }

  function cleanupTransitionNames(cardId) {
    // Clean up style definitions to prevent collisions in future clicks
    const originalCard = document.getElementById(`card-${cardId}`);
    if (originalCard) {
      const cardImg = originalCard.querySelector('.blog-card-img');
      const cardTitle = originalCard.querySelector('.blog-card-title');
      if (cardImg) cardImg.style.viewTransitionName = '';
      if (cardTitle) cardTitle.style.viewTransitionName = '';
    }
    
    const detailImg = articleDetailView.querySelector('.detail-hero-img');
    const detailTitle = articleDetailView.querySelector('.detail-title');
    if (detailImg) detailImg.style.viewTransitionName = '';
    if (detailTitle) detailTitle.style.viewTransitionName = '';
  }

  /* --------------------------------------------------------------------------
     7. Field Guide & Reference Soundboard Engine
     -------------------------------------------------------------------------- */
  function renderFieldGuide(searchQuery = '') {
    guideGrid.innerHTML = '';
    const query = searchQuery.toLowerCase().trim();

    const filteredBirds = FIELD_GUIDE.filter(bird => {
      return bird.name.toLowerCase().includes(query) || 
             bird.scientific.toLowerCase().includes(query) || 
             bird.category.toLowerCase().includes(query) ||
             bird.habitat.toLowerCase().includes(query);
    });

    filteredBirds.forEach(bird => {
      const card = document.createElement('div');
      card.className = 'guide-card glass-panel';
      
      card.innerHTML = `
        <div class="guide-img-wrapper">
          <img class="guide-img" src="${bird.image}" alt="Vibrant picture of ${bird.name}">
          <button class="guide-audio-btn" data-bird="${bird.name}" aria-label="Play vocalization of ${bird.name}">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
          </button>
        </div>
        <div class="guide-card-content">
          <div class="guide-card-header">
            <span class="guide-latin">${bird.scientific}</span>
            <h3>${bird.name}</h3>
          </div>
          <p style="font-size: 0.85rem; color:var(--text-muted); line-height: 1.5; margin-bottom: 1rem;">
            ${bird.description}
          </p>
          <div class="guide-stats">
            <span>
              <span class="label">Habitat</span>
              <span class="val">${bird.habitat}</span>
            </span>
            <span>
              <span class="label">Category</span>
              <span class="val">${bird.category}</span>
            </span>
            <span>
              <span class="label">Primary Diet</span>
              <span class="val">${bird.diet}</span>
            </span>
            <span>
              <span class="label">Avg Size</span>
              <span class="val">${bird.size}</span>
            </span>
          </div>
        </div>
      `;

      // Connect audio play click
      const audioBtn = card.querySelector('.guide-audio-btn');
      audioBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        playBirdCall(bird);
      });

      guideGrid.appendChild(card);
    });

    // If an audio is currently active, ensure the UI matches the playing state
    if (activeAudioBird) {
      const isPlaying = !globalAudio.paused;
      updateAudioUI(isPlaying);
    }
  }

  // Filter search keypress with debounce
  let searchDebounceTimeout = null;
  guideSearch.addEventListener('input', (e) => {
    clearTimeout(searchDebounceTimeout);
    searchDebounceTimeout = setTimeout(() => {
      renderFieldGuide(e.target.value);
    }, 250);
  });

  /* --------------------------------------------------------------------------
     8. Sightings Journal Engine (LocalStorage & Base64 Files)
     -------------------------------------------------------------------------- */
  // Initial demo sightings (if local storage is completely empty)
  const INITIAL_SIGHTINGS = [
    {
      id: 'demo-sighting-1',
      species: 'Northern Cardinal',
      date: '2026-05-15',
      location: 'Central Park (Woodland Trail)',
      photo: 'sightings_placeholder', // matches placeholders key or base64
      notes: 'Spotted a brilliant male cardinal calling from a low dogwood branch. Feathers were a stunning vermilion. Responsive to adjacent song cycles.'
    }
  ];

  function getSightingsFromStorage() {
    const rawData = localStorage.getItem('sighting-logs');
    if (!rawData) {
      localStorage.setItem('sighting-logs', JSON.stringify(INITIAL_SIGHTINGS));
      return INITIAL_SIGHTINGS;
    }
    return JSON.parse(rawData);
  }

  function saveSightingsToStorage(sightings) {
    localStorage.setItem('sighting-logs', JSON.stringify(sightings));
  }

  function renderSightingsGrid() {
    sightingsGrid.innerHTML = '';
    const sightings = getSightingsFromStorage();

    if (sightings.length === 0) {
      // Render beautiful empty state
      sightingsGrid.innerHTML = `
        <div class="empty-state-card glass-panel">
          <div class="empty-img-wrapper">
            <img class="empty-img" src="images/sightings_placeholder.png" alt="Empty Sighting Journal layout">
          </div>
          <h3>Your Sighting Log is Empty</h3>
          <p>Every journey begins with a single observation. Head into nature, observe our feathered friends, and log your very first bird sighting today!</p>
          <button class="btn-empty-action shadow-hover" id="btn-empty-log-now">
            Record Sighting
          </button>
        </div>
      `;

      // Connect click to open modal
      document.getElementById('btn-empty-log-now').addEventListener('click', openSightingModal);
      return;
    }

    sightings.forEach(sighting => {
      const card = document.createElement('div');
      card.className = 'sighting-card glass-panel';
      card.id = `sighting-${sighting.id}`;

      // Pick image source
      let imgSrc = 'images/sightings_placeholder.png';
      if (sighting.photo === 'common_loon') imgSrc = 'images/common_loon.png';
      else if (sighting.photo === 'warbler') imgSrc = 'images/warbler.png';
      else if (sighting.photo === 'peregrine_falcon') imgSrc = 'images/peregrine_falcon.png';
      else if (sighting.photo && sighting.photo.startsWith('data:image')) {
        imgSrc = sighting.photo; // Base64 uploaded image
      }

      // Convert date to reader-friendly format
      const dateOptions = { year: 'numeric', month: 'short', day: 'numeric' };
      const formattedDate = new Date(sighting.date + 'T00:00:00').toLocaleDateString('en-US', dateOptions);

      card.innerHTML = `
        <div class="sighting-img-wrapper">
          <img class="sighting-img" src="${imgSrc}" alt="Sighting photograph of ${sighting.species}">
          <button class="sighting-delete-btn" data-id="${sighting.id}" aria-label="Delete sighting observation">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
          </button>
        </div>
        <div class="sighting-content">
          <div class="sighting-meta">
            <span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              ${formattedDate}
            </span>
            <span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              ${sighting.location}
            </span>
          </div>
          <h3 class="sighting-title">${sighting.species}</h3>
          <p class="sighting-notes">${sighting.notes || 'No field notes logged for this observation.'}</p>
        </div>
      `;

      // Connect delete click with fade out animation
      const deleteBtn = card.querySelector('.sighting-delete-btn');
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idToDelete = e.currentTarget.getAttribute('data-id');
        deleteSighting(idToDelete);
      });

      sightingsGrid.appendChild(card);
    });
  }

  function deleteSighting(id) {
    if (confirm("Are you sure you want to delete this field observation? This cannot be undone.")) {
      const card = document.getElementById(`sighting-${id}`);
      if (card) {
        // Fade out animation before removing from DOM
        card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        card.style.opacity = '0';
        card.style.transform = 'scale(0.9)';
        
        setTimeout(() => {
          let sightings = getSightingsFromStorage();
          sightings = sightings.filter(s => s.id !== id);
          saveSightingsToStorage(sightings);
          renderSightingsGrid();
        }, 300);
      }
    }
  }

  /* --------------------------------------------------------------------------
     9. Sighting Dialog Modal interactions
     -------------------------------------------------------------------------- */
  function openSightingModal() {
    // Reset form states
    sightingForm.reset();
    customFileGroup.classList.add('hidden');
    filePreviewBox.classList.add('hidden');
    filePreviewImg.src = '';
    
    // Default the date to today in HSL local format
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('sighting-date').value = today;

    // Open native dialog modal
    sightingDialog.showModal();
  }

  function closeSightingModal() {
    sightingDialog.close();
  }

  // Photo option selector toggles upload file zone
  photoSelect.addEventListener('change', (e) => {
    if (e.target.value === 'custom') {
      customFileGroup.classList.remove('hidden');
    } else {
      customFileGroup.classList.add('hidden');
    }
  });

  // Base64 file reader preview logic
  sightingFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Image file size is too large. Please select an image under 2MB.");
        sightingFile.value = '';
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        filePreviewImg.src = event.target.result;
        filePreviewBox.classList.remove('hidden');
      };
      reader.readAsDataURL(file);
    }
  });

  // Remove uploaded file preview
  btnRemoveFile.addEventListener('click', (e) => {
    e.preventDefault();
    sightingFile.value = '';
    filePreviewImg.src = '';
    filePreviewBox.classList.add('hidden');
  });

  // Open & close events
  btnOpenSightingModal.addEventListener('click', openSightingModal);
  btnCloseSightingModal.addEventListener('click', closeSightingModal);
  btnCancelSighting.addEventListener('click', closeSightingModal);

  // Form submission
  sightingForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const species = document.getElementById('sighting-species').value.trim();
    const date = document.getElementById('sighting-date').value;
    const location = document.getElementById('sighting-location').value.trim();
    const photoOpt = photoSelect.value;
    const notes = document.getElementById('sighting-notes').value.trim();

    // Secondary validation checks
    if (!species || !date || !location) {
      alert("Please fill in all mandatory field parameters.");
      return;
    }

    let photoVal = 'sightings_placeholder';
    if (photoOpt === 'custom') {
      if (filePreviewImg.src && filePreviewImg.src.startsWith('data:image')) {
        photoVal = filePreviewImg.src; // Base64 data
      } else {
        alert("Please upload a local image file or select one of the representative photographs.");
        return;
      }
    } else {
      photoVal = photoOpt; // Name of static photograph
    }

    const newSighting = {
      id: 'sighting-' + Date.now(),
      species,
      date,
      location,
      photo: photoVal,
      notes
    };

    const sightings = getSightingsFromStorage();
    sightings.unshift(newSighting);
    saveSightingsToStorage(sightings);
    
    // Redraw observations
    renderSightingsGrid();
    
    // Close modal
    closeSightingModal();
  });

  /* --------------------------------------------------------------------------
     9.5. Owner Publishing Companion Logic (Git-as-a-CMS)
     -------------------------------------------------------------------------- */
  // Owner Publishing Companion Selectors
  const adminCmsLink = document.getElementById('admin-cms-link');
  const cmsDialog = document.getElementById('cms-dialog');
  const btnCloseCmsModal = document.getElementById('btn-close-cms-modal');
  const btnCancelCms = document.getElementById('btn-cancel-cms');
  const cmsForm = document.getElementById('cms-form');

  // Production Guard: Automatically hide the Owner Portal link if the site is loaded on a live public domain
  const isLocal = window.location.hostname === 'localhost' || 
                  window.location.hostname === '127.0.0.1' || 
                  window.location.hostname === '[::1]' || 
                  window.location.protocol === 'file:';
  if (!isLocal && adminCmsLink) {
    adminCmsLink.style.display = 'none';
  }
  
  const cmsTabEditor = document.getElementById('cms-tab-editor');
  const cmsTabOutput = document.getElementById('cms-tab-output');
  const cmsPanelEditor = document.getElementById('cms-panel-editor');
  const cmsPanelOutput = document.getElementById('cms-panel-output');
  
  const cmsPhoto = document.getElementById('cms-photo');
  const cmsPhotoDropZone = document.getElementById('cms-photo-drop-zone');
  const cmsDropZoneText = document.getElementById('cms-drop-zone-text');
  const cmsPreviewBox = document.getElementById('cms-preview-box');
  const cmsPreviewImg = document.getElementById('cms-preview-img');
  const btnCmsRemoveFile = document.getElementById('btn-cms-remove-file');
  
  const cmsImageFilename = document.getElementById('cms-image-filename');
  const cmsCodeOutput = document.getElementById('cms-code-output');
  const btnCopyCmsCode = document.getElementById('btn-copy-cms-code');
  const btnBackEditor = document.getElementById('btn-back-editor');
  const btnFinishCms = document.getElementById('btn-finish-cms');

  let cmsUploadedImageData = null; // Store base64 data for download and preview
  let cmsUploadedFileType = 'png'; // Store original file extension

  function openCmsModal() {
    if (!isLocal) {
      alert("Access Denied: The Owner Publishing Companion is only available in local development (localhost).");
      return;
    }
    cmsForm.reset();
    resetCmsPanels();
    cmsDialog.showModal();
  }
  
  function closeCmsModal() {
    cmsDialog.close();
  }
  
  function resetCmsPanels() {
    cmsTabEditor.classList.add('active');
    cmsTabOutput.classList.remove('active');
    cmsTabOutput.disabled = true;
    cmsPanelEditor.classList.remove('hidden');
    cmsPanelOutput.classList.add('hidden');
    
    // Reset file preview
    cmsPhoto.value = '';
    cmsPreviewImg.src = '';
    cmsPreviewBox.classList.add('hidden');
    cmsDropZoneText.classList.remove('hidden');
    cmsUploadedImageData = null;
    cmsUploadedFileType = 'png';
  }

  // Event listeners to toggle the CMS Dialog modal
  adminCmsLink.addEventListener('click', (e) => {
    e.preventDefault();
    openCmsModal();
  });
  
  btnCloseCmsModal.addEventListener('click', closeCmsModal);
  btnCancelCms.addEventListener('click', closeCmsModal);
  btnFinishCms.addEventListener('click', closeCmsModal);

  // Tab switching from navigation header tabs
  cmsTabEditor.addEventListener('click', () => {
    if (!cmsPanelEditor.classList.contains('hidden')) return;
    // Emulate clicking "Back to Form" to cleanly pop off draft prepends
    btnBackEditor.click();
  });

  // Base64 file reader preview logic
  cmsPhoto.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Image file size is too large. Please select a photograph under 5MB.");
        cmsPhoto.value = '';
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        cmsPreviewImg.src = event.target.result;
        cmsPreviewBox.classList.remove('hidden');
        cmsDropZoneText.classList.add('hidden');
        cmsUploadedImageData = event.target.result;
        cmsUploadedFileType = file.type.split('/')[1] || 'png';
      };
      reader.readAsDataURL(file);
    }
  });

  // Remove uploaded file preview
  btnCmsRemoveFile.addEventListener('click', (e) => {
    e.preventDefault();
    cmsPhoto.value = '';
    cmsPreviewImg.src = '';
    cmsPreviewBox.classList.add('hidden');
    cmsDropZoneText.classList.remove('hidden');
    cmsUploadedImageData = null;
    cmsUploadedFileType = 'png';
  });

  // Helper function to slugify text string
  function slugify(text) {
    return text
      .toString()
      .toLowerCase()
      .normalize('NFD') // decompose combined graphemes
      .replace(/[\u0300-\u036f]/g, '') // remove diacritics
      .replace(/\s+/g, '-') // replace spaces with -
      .replace(/[^\w\-]+/g, '') // remove all non-word chars
      .replace(/\-\-+/g, '-') // replace multiple - with single -
      .replace(/^-+/, '') // trim - from start
      .replace(/-+$/, ''); // trim - from end
  }

  // Trigger base64 media asset download
  function downloadImage(base64Data, filename) {
    const link = document.createElement('a');
    link.href = base64Data;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // CMS Form submission: optimizes assets & generates database JSON
  cmsForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const title = document.getElementById('cms-title').value.trim();
    const tag = document.getElementById('cms-tag').value.trim();
    const category = document.getElementById('cms-category').value;
    const readingTime = document.getElementById('cms-reading-time').value.trim();
    const author = document.getElementById('cms-author').value.trim();
    const authorAvatar = document.getElementById('cms-author-avatar').value.trim() || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=100';
    const scientific = document.getElementById('cms-scientific').value.trim();
    const habitat = document.getElementById('cms-habitat').value.trim();
    const wingspan = document.getElementById('cms-wingspan').value.trim();
    const status = document.getElementById('cms-status').value.trim();
    const excerpt = document.getElementById('cms-excerpt').value.trim();
    const content = document.getElementById('cms-content').value.trim();

    // Verify photograph is uploaded
    if (!cmsUploadedImageData) {
      alert("A feature photograph is required to publish a chronicle.");
      return;
    }

    // Slugification names
    const imageSlug = slugify(title);
    const extension = cmsUploadedFileType || 'png';
    const imageFilename = `${imageSlug}.${extension}`;
    const imagePath = `images/${imageFilename}`;

    // Establish the structured database article profile
    const newPost = {
      id: imageSlug,
      category: category,
      tag: tag,
      title: title,
      excerpt: excerpt,
      date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
      author: author,
      authorAvatar: authorAvatar,
      readingTime: readingTime,
      image: imagePath,
      speciesFacts: {
        scientific: scientific,
        habitat: habitat,
        wingspan: wingspan,
        status: status
      },
      content: content
    };

    // Prepend to active memory cache and redraw the blog grid instantly for live preview testing
    BLOG_POSTS.unshift(newPost);
    renderBlogGrid();

    // Format stringified, beautifully spaced JSON database
    const updatedDatabaseString = JSON.stringify(BLOG_POSTS, null, 2);
    cmsCodeOutput.value = updatedDatabaseString;
    cmsImageFilename.textContent = imageFilename;

    // Trigger instant browser download of optimized bird photo asset
    downloadImage(cmsUploadedImageData, imageFilename);

    // Swap panel to output dashboard
    cmsTabEditor.classList.remove('active');
    cmsTabOutput.classList.add('active');
    cmsTabOutput.disabled = false;
    cmsPanelEditor.classList.add('hidden');
    cmsPanelOutput.classList.remove('hidden');
  });

  // "Back to Form" button logic
  btnBackEditor.addEventListener('click', () => {
    // Pop off the dynamic draft prepend so it doesn't double-prepend if they make adjustments and click generate again
    if (BLOG_POSTS.length > 0) {
      BLOG_POSTS.shift();
      renderBlogGrid();
    }
    
    cmsTabEditor.classList.add('active');
    cmsTabOutput.classList.remove('active');
    cmsTabOutput.disabled = true;
    cmsPanelEditor.classList.remove('hidden');
    cmsPanelOutput.classList.add('hidden');
  });

  // Clipboard copy action with state transitions & micro-animations
  btnCopyCmsCode.addEventListener('click', () => {
    cmsCodeOutput.select();
    navigator.clipboard.writeText(cmsCodeOutput.value)
      .then(() => {
        // Toggle copied animation status
        btnCopyCmsCode.classList.add('copied');
        btnCopyCmsCode.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <span>Copied!</span>
        `;
        
        setTimeout(() => {
          btnCopyCmsCode.classList.remove('copied');
          btnCopyCmsCode.innerHTML = `
            <svg class="icon-copy" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            <span>Copy Code</span>
          `;
        }, 2000);
      })
      .catch(err => {
        console.error("Clipboard copy failure:", err);
        alert("Clipboard copy blocked. Please manually select all JSON code in the box and press Cmd+C / Ctrl+C.");
      });
  });

  /* --------------------------------------------------------------------------
     10. Initial Grid Render Commands
     -------------------------------------------------------------------------- */
  fetchBlogPosts();
  renderFieldGuide();
  renderSightingsGrid();

});
