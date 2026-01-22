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

  // Function to find and add button next to member-only badge
  function addButtonToMemberBadges() {
    // Find all member-only story badges
    const badges = document.querySelectorAll('div.hx.r.hy.ho.hz.fc.aq');
    
    badges.forEach(badge => {
      // Check if button already added
      if (badge.parentElement && badge.parentElement.querySelector('.freedium-button')) {
        return;
      }

      // Also check for the text content to be sure it's the right element
      const textElement = badge.querySelector('p');
      if (textElement && textElement.textContent.includes('Member-only')) {
        const button = createFreediumButton();
        
        // Create a wrapper to keep button next to badge
        const wrapper = document.createElement('div');
        wrapper.className = 'freedium-wrapper';
        
        // Insert wrapper after the badge
        badge.parentNode.insertBefore(wrapper, badge.nextSibling);
        wrapper.appendChild(button);
      }
    });
  }

  // Alternative: Find by the star SVG icon (more reliable)
  function addButtonByStarIcon() {
    // Find SVG with the star pattern (yellow #FFC017 color)
    const starSvgs = document.querySelectorAll('svg path[fill="#FFC017"]');
    
    starSvgs.forEach(svg => {
      const parentDiv = svg.closest('div.hx, div[class*="hx"]');
      if (!parentDiv) return;

      // Check if it contains "Member-only" text
      const memberText = parentDiv.querySelector('p');
      if (!memberText || !memberText.textContent.includes('Member-only')) return;

      // Check if button already exists
      if (parentDiv.parentElement && parentDiv.parentElement.querySelector('.freedium-button')) {
        return;
      }

      const button = createFreediumButton();
      
      // Insert button after the badge div
      if (parentDiv.nextSibling) {
        parentDiv.parentNode.insertBefore(button, parentDiv.nextSibling);
      } else {
        parentDiv.parentNode.appendChild(button);
      }
    });
  }

  // Main function to run the extension
  function init() {
    addButtonToMemberBadges();
    addButtonByStarIcon();
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
