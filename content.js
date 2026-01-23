// Freedium Bypass Extension - Content Script

(function() {
  'use strict';

  const FREEDIUM_BASE_URL = 'https://freedium-mirror.cfd/';

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

  // Function to create the Freedium button
  function createFreediumButton() {
    const button = document.createElement('button');
    button.className = 'freedium-button';
    button.textContent = 'Open in Freedium';
    button.title = 'Open this article in Freedium (bypass paywall)';
    
    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const currentUrl = window.location.href;
      const freediumUrl = FREEDIUM_BASE_URL + currentUrl;
      createInfoPopup(freediumUrl);
    });

    return button;
  }

  // Function to find and add button next to member-only badge using text content
  // This approach is more robust as it doesn't rely on dynamic class names
  function addButtonToMemberBadges() {
    // Use TreeWalker to find all text nodes containing "Member-only"
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          // Only accept text nodes that contain "Member-only" and have substantial content
          if (node.textContent.trim() === 'Member-only story' || 
              node.textContent.trim() === 'Member-only') {
            return NodeFilter.FILTER_ACCEPT;
          }
          return NodeFilter.FILTER_REJECT;
        }
      }
    );

    const memberOnlyNodes = [];
    while (walker.nextNode()) {
      memberOnlyNodes.push(walker.currentNode);
    }

    memberOnlyNodes.forEach(textNode => {
      // Find the parent container (go up to find a reasonable container)
      let container = textNode.parentElement;
      
      // Go up a few levels to find the badge container
      for (let i = 0; i < 5 && container; i++) {
        // Check if this container or its parent already has a button
        if (container.querySelector('.freedium-button') || 
            container.parentElement?.querySelector('.freedium-button')) {
          return;
        }
        
        // Check if this looks like the badge container (has the star SVG nearby)
        if (container.querySelector('svg') || container.previousElementSibling?.querySelector('svg')) {
          break;
        }
        container = container.parentElement;
      }

      if (!container) return;

      // Create wrapper and button
      const button = createFreediumButton();
      const wrapper = document.createElement('div');
      wrapper.className = 'freedium-wrapper';
      wrapper.appendChild(button);

      // Insert after the container
      if (container.nextSibling) {
        container.parentNode.insertBefore(wrapper, container.nextSibling);
      } else {
        container.parentNode.appendChild(wrapper);
      }
    });
  }

  // Alternative: Find by the star SVG icon color (Medium's signature yellow)
  // This is reliable because the color #FFC017 is consistent across Medium
  function addButtonByStarIcon() {
    // Find SVG paths with Medium's signature yellow color
    const starPaths = document.querySelectorAll('svg path[fill="#FFC017"]');
    
    starPaths.forEach(path => {
      // Get the SVG element and its parent
      const svg = path.closest('svg');
      if (!svg) return;

      // Find the container that includes both the star and "Member-only" text
      let container = svg.parentElement;
      let foundMemberText = false;

      // Traverse up to find the container with "Member-only" text
      for (let i = 0; i < 6 && container && container !== document.body; i++) {
        // Check for "Member-only" text in this container
        if (container.textContent?.includes('Member-only')) {
          foundMemberText = true;
          break;
        }
        container = container.parentElement;
      }

      if (!foundMemberText || !container) return;

      // Check if button already exists in the container or parent
      if (container.querySelector('.freedium-button') || 
          container.parentElement?.querySelector('.freedium-button')) {
        return;
      }

      // Create and insert the button
      const button = createFreediumButton();
      const wrapper = document.createElement('div');
      wrapper.className = 'freedium-wrapper';
      wrapper.appendChild(button);

      // Insert after the container
      if (container.nextSibling) {
        container.parentNode.insertBefore(wrapper, container.nextSibling);
      } else {
        container.parentNode.appendChild(wrapper);
      }
    });
  }

  // Additional method: Find buttons in article cards on homepage/feed
  function addButtonToArticleCards() {
    // Find all article elements
    const articles = document.querySelectorAll('article');
    
    articles.forEach(article => {
      // Check if this article has the member-only indicator
      const hasMemberBadge = article.textContent?.includes('Member-only') ||
                             article.querySelector('svg path[fill="#FFC017"]');
      
      if (!hasMemberBadge) return;
      
      // Check if button already exists
      if (article.querySelector('.freedium-button')) return;

      // Find a good insertion point - look for the metadata area
      // Usually near the author info or at the end of the article preview
      const metaArea = article.querySelector('div[data-testid]') || 
                       article.querySelector('span[data-testid]') ||
                       article.lastElementChild;

      if (!metaArea) return;

      // Check if we already added a button nearby
      if (metaArea.parentElement?.querySelector('.freedium-button')) return;

      const button = createFreediumButton();
      const wrapper = document.createElement('div');
      wrapper.className = 'freedium-wrapper';
      wrapper.appendChild(button);

      // Try to insert near the metadata
      if (metaArea.parentNode) {
        metaArea.parentNode.appendChild(wrapper);
      }
    });
  }

  // Main function to run the extension
  function init() {
    addButtonToMemberBadges();
    addButtonByStarIcon();
    addButtonToArticleCards();
  }

  // Run on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Use MutationObserver for dynamically loaded content
  const observer = new MutationObserver((mutations) => {
    let shouldCheck = false;
    
    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        shouldCheck = true;
        break;
      }
    }
    
    if (shouldCheck) {
      // Debounce the check
      clearTimeout(window.freediumTimeout);
      window.freediumTimeout = setTimeout(() => {
        init();
      }, 500);
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  console.log('Freedium Bypass Extension loaded!');
})();
