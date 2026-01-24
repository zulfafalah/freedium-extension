// Freedium Bypass Extension - Content Script
// Using fixed overlay button approach - doesn't depend on Medium's DOM structure

(function () {
  'use strict';

  const FREEDIUM_BASE_URL = 'https://freedium-mirror.cfd/';

  // Inject styles for the overlay button
  function injectStyles() {
    if (document.getElementById('freedium-overlay-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'freedium-overlay-styles';
    styles.textContent = `
      /* Floating Overlay Button - Fixed Position */
      .freedium-overlay-container {
        position: fixed;
        top: 80px;
        right: 20px;
        z-index: 999999;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 8px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }

      .freedium-overlay-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 16px;
        background: #2563eb;
        color: white;
        border: none;
        border-radius: 20px;
        cursor: pointer;
        font-size: 13px;
        font-weight: 600;
        box-shadow: 0 2px 8px rgba(37, 99, 235, 0.3);
        transition: all 0.2s ease;
      }

      .freedium-overlay-btn:hover {
        background: #1d4ed8;
        box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4);
        transform: translateY(-1px);
      }

      .freedium-overlay-btn:active {
        transform: translateY(0);
      }

      .freedium-overlay-btn-icon {
        font-size: 16px;
      }

      .freedium-overlay-btn-text {
        white-space: nowrap;
      }


      /* Popup Overlay */
      .freedium-popup-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999999;
        animation: freedium-fade-in 0.2s ease;
      }

      @keyframes freedium-fade-in {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      .freedium-popup {
        background: #ffffff;
        border-radius: 16px;
        padding: 0;
        max-width: 420px;
        width: 90%;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        animation: freedium-slide-up 0.3s ease;
        overflow: hidden;
      }

      @keyframes freedium-slide-up {
        from {
          opacity: 0;
          transform: translateY(20px) scale(0.95);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      .freedium-popup-header {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 20px 24px;
        background: #2563eb;
        color: white;
      }

      .freedium-popup-icon {
        font-size: 28px;
      }

      .freedium-popup-header h3 {
        margin: 0;
        color: #fff;
        font-size: 18px;
        font-weight: 700;
        letter-spacing: -0.3px;
      }

      .freedium-popup-body {
        padding: 24px;
      }

      .freedium-popup-desc {
        color: #374151;
        font-size: 14px;
        line-height: 1.6;
        margin: 0 0 20px 0;
      }

      .freedium-popup-desc strong {
        color: #1d4ed8;
      }

      .freedium-popup-info {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .freedium-info-item {
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding: 12px 14px;
        background: #f1f5f9;
        border-radius: 10px;
      }

      .freedium-info-label {
        font-size: 12px;
        font-weight: 600;
        color: #475569;
      }

      .freedium-info-value {
        font-size: 13px;
        color: #334155;
        line-height: 1.5;
      }

      .freedium-popup-footer {
        display: flex;
        gap: 10px;
        padding: 16px 24px;
        background: #f8fafc;
        border-top: 1px solid #e2e8f0;
        justify-content: flex-end;
      }

      .freedium-popup-btn {
        padding: 10px 20px;
        border-radius: 10px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        border: none;
        font-family: inherit;
      }

      .freedium-popup-btn-secondary {
        background: #e2e8f0;
        color: #475569;
      }

      .freedium-popup-btn-secondary:hover {
        background: #cbd5e1;
      }

      .freedium-popup-btn-primary {
        background: #2563eb;
        color: white;
        box-shadow: 0 2px 8px rgba(37, 99, 235, 0.3);
      }

      .freedium-popup-btn-primary:hover {
        background: #1d4ed8;
        box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4);
        transform: translateY(-1px);
      }

      /* Badge indicator */
      .freedium-badge {
        position: absolute;
        top: -4px;
        right: -4px;
        background: #ffc017;
        color: #000;
        font-size: 10px;
        padding: 2px 6px;
        border-radius: 10px;
        font-weight: 600;
        animation: freedium-pulse 2s infinite;
      }

      @keyframes freedium-pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
      }

      /* Drag handle */
      .freedium-drag-handle {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 100%;
        cursor: move;
        z-index: -1;
      }
    `;
    document.head.appendChild(styles);
  }

  // Check if current page is a Medium article
  function isMediumArticle() {
    const url = window.location.href;
    const hostname = window.location.hostname;

    // Check for Medium domains
    const isMediumDomain = hostname === 'medium.com' ||
      hostname.endsWith('.medium.com') ||
      document.querySelector('meta[property="al:android:app_name"][content="Medium"]') !== null;

    // Check if it's an article page (has article content or specific URL patterns)
    const hasArticleContent = document.querySelector('article') !== null ||
      url.includes('/p/') ||
      /\/[a-f0-9]{12}$/.test(url) ||
      /\/[a-f0-9]{12}\?/.test(url);

    return isMediumDomain && hasArticleContent;
  }

  // Check if article has member-only content
  function hasMemberOnlyContent() {
    // Check for "Member-only" text
    const hasText = document.body.textContent.includes('Member-only');

    // Check for the yellow star SVG (Medium's signature)
    const hasStar = document.querySelector('svg path[fill="#FFC017"]') !== null;

    // Check for paywall modal or lock icon
    const hasPaywall = document.querySelector('[data-testid="paywall"]') !== null ||
      document.querySelector('.meteredContent') !== null;

    return hasText || hasStar || hasPaywall;
  }

  // Create the fixed overlay button
  function createOverlayButton() {
    // Remove existing overlay if any
    const existing = document.getElementById('freedium-overlay');
    if (existing) existing.remove();

    const container = document.createElement('div');
    container.id = 'freedium-overlay';
    container.className = 'freedium-overlay-container';

    // Get saved position
    const savedTop = localStorage.getItem('freedium-top');
    const savedRight = localStorage.getItem('freedium-right');

    if (savedTop) container.style.top = savedTop;
    if (savedRight) container.style.right = savedRight;

    const memberOnly = hasMemberOnlyContent();

    container.innerHTML = `
      <div style="position: relative;">
        <button class="freedium-overlay-btn" id="freedium-main-btn">
          <span class="freedium-overlay-btn-icon">🔓</span>
          <span class="freedium-overlay-btn-text">Open in Freedium</span>
        </button>
        ${memberOnly ? '<span class="freedium-badge">★</span>' : ''}
      </div>
    `;

    document.body.appendChild(container);

    // Main button click
    const mainBtn = container.querySelector('#freedium-main-btn');
    mainBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const currentUrl = window.location.href;
      const freediumUrl = FREEDIUM_BASE_URL + currentUrl;
      createInfoPopup(freediumUrl);
    });


    // Make draggable
    makeDraggable(container);
  }

  // Make the overlay draggable
  function makeDraggable(element) {
    let isDragging = false;
    let startX, startY, startRight, startTop;

    const onMouseDown = (e) => {
      if (e.target.tagName === 'BUTTON') return;

      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      startRight = parseInt(element.style.right) || 20;
      startTop = parseInt(element.style.top) || 80;

      e.preventDefault();
    };

    const onMouseMove = (e) => {
      if (!isDragging) return;

      const deltaX = startX - e.clientX;
      const deltaY = e.clientY - startY;

      const newRight = Math.max(10, Math.min(window.innerWidth - 200, startRight + deltaX));
      const newTop = Math.max(10, Math.min(window.innerHeight - 60, startTop + deltaY));

      element.style.right = newRight + 'px';
      element.style.top = newTop + 'px';
    };

    const onMouseUp = () => {
      if (isDragging) {
        isDragging = false;
        // Save position
        localStorage.setItem('freedium-right', element.style.right);
        localStorage.setItem('freedium-top', element.style.top);
      }
    };

    element.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  // Function to create the info popup
  function createInfoPopup(freediumUrl) {
    // Remove existing popup if any
    const existingPopup = document.querySelector('.freedium-popup-overlay');
    if (existingPopup) {
      existingPopup.remove();
    }

    const overlay = document.createElement('div');
    overlay.className = 'freedium-popup-overlay';

    const popup = document.createElement('div');
    popup.className = 'freedium-popup';
    popup.innerHTML = `
      <div class="freedium-popup-header">
        <span class="freedium-popup-icon">🔓</span>
        <h3>Freedium Bypass Extension</h3>
      </div>
      <div class="freedium-popup-body">
        <p class="freedium-popup-desc">
          This extension helps you read <strong>Medium Member-only</strong> articles 
          for free using the <strong>Freedium Mirror</strong> service.
        </p>
        <div class="freedium-popup-info">
          <div class="freedium-info-item">
            <span class="freedium-info-label">📖 What is Freedium?</span>
            <span class="freedium-info-value">Freedium is a mirror service that allows free access to paid Medium articles.</span>
          </div>
          <div class="freedium-info-item">
            <span class="freedium-info-label">🌐 Source</span>
            <span class="freedium-info-value">freedium-mirror.cfd</span>
          </div>
          <div class="freedium-info-item">
            <span class="freedium-info-label">⚠️ Disclaimer</span>
            <span class="freedium-info-value">This extension is not affiliated with Medium. Use wisely for educational purposes.</span>
          </div>
        </div>
      </div>
      <div class="freedium-popup-footer">
        <button class="freedium-popup-btn freedium-popup-btn-secondary" id="freedium-close-btn">Close</button>
        <button class="freedium-popup-btn freedium-popup-btn-primary" id="freedium-open-btn">Open in Freedium</button>
      </div>
    `;

    overlay.appendChild(popup);
    document.body.appendChild(overlay);

    // Event listeners
    const closeBtn = popup.querySelector('#freedium-close-btn');
    const openBtn = popup.querySelector('#freedium-open-btn');

    closeBtn.addEventListener('click', () => {
      overlay.remove();
    });

    openBtn.addEventListener('click', () => {
      window.open(freediumUrl, '_blank');
      overlay.remove();
    });

    // Close on overlay click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.remove();
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', function escHandler(e) {
      if (e.key === 'Escape') {
        overlay.remove();
        document.removeEventListener('keydown', escHandler);
      }
    });
  }

  // Main initialization function
  function init() {
    // Only show on Medium article pages
    if (!isMediumArticle()) {
      console.log('Freedium: Not a Medium article page, skipping...');
      return;
    }

    injectStyles();
    createOverlayButton();
  }

  // Run on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Handle SPA navigation (Medium uses client-side routing)
  let lastUrl = window.location.href;
  const urlObserver = new MutationObserver(() => {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      // Re-initialize after URL change
      setTimeout(init, 500);
    }
  });

  urlObserver.observe(document.body, {
    childList: true,
    subtree: true
  });

  console.log('Freedium Bypass Extension loaded! (Overlay Mode)');
})();
