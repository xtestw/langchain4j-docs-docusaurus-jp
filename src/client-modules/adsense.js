import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';
import AdSense from '../components/AdSense';
import React from 'react';
import ReactDOM from 'react-dom/client';

if (ExecutionEnvironment.canUseDOM) {
  // Function to calculate TOC position and update ad position
  function updateAdPosition() {
    const adContainer = document.getElementById('adsense-sidebar');
    if (!adContainer) return;

    // Find the TOC (Table of Contents) element
    // Docusaurus uses various selectors for TOC
    const tocSelectors = [
      'nav[class*="tableOfContents"]',
      'nav.table-of-contents',
      'aside[class*="toc"]',
      '.table-of-contents',
      '[class*="table-of-contents"]',
      'nav[class*="toc"]'
    ];
    
    let tocElement = null;
    for (const selector of tocSelectors) {
      tocElement = document.querySelector(selector);
      if (tocElement) break;
    }

    if (tocElement) {
      const tocRect = tocElement.getBoundingClientRect();
      const spacing = 20; // Space between TOC and ad
      
      // Since both TOC and ad are fixed, we use the bottom of TOC relative to viewport
      // TOC is typically fixed, so we calculate its bottom position
      const tocBottom = tocRect.bottom;
      
      // Set ad position below TOC (fixed position relative to viewport)
      adContainer.style.top = `${tocBottom + spacing}px`;
    } else {
      // Fallback: if no TOC found, position at default location
      adContainer.style.top = '80px';
    }
  }

  // Function to inject AdSense component
  function injectAdSense() {
    const pathname = window.location.pathname;
    
    // Only show on documentation pages (not homepage or useful-materials)
    if (pathname === '/' || pathname.startsWith('/useful-materials')) {
      const existingContainer = document.getElementById('adsense-sidebar');
      if (existingContainer) {
        existingContainer.remove();
      }
      return;
    }

    // Check if ad container already exists
    let adContainer = document.getElementById('adsense-sidebar');
    if (!adContainer) {
      adContainer = document.createElement('div');
      adContainer.id = 'adsense-sidebar';
      document.body.appendChild(adContainer);
      
      // Render AdSense component
      const root = ReactDOM.createRoot(adContainer);
      root.render(React.createElement(AdSense));
      
      // Wait for DOM to update, then calculate position
      setTimeout(() => {
        updateAdPosition();
      }, 500);
    } else {
      // Update position for existing container
      updateAdPosition();
    }
  }

  // Inject on initial load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectAdSense);
  } else {
    injectAdSense();
  }

  // Listen for navigation events (Docusaurus uses React Router)
  let lastPathname = window.location.pathname;
  
  const handleNavigation = () => {
    // Check if pathname changed
    if (window.location.pathname !== lastPathname) {
      lastPathname = window.location.pathname;
      // Remove old container
      const oldContainer = document.getElementById('adsense-sidebar');
      if (oldContainer) {
        oldContainer.remove();
      }
      // Inject new ad after a short delay
      setTimeout(injectAdSense, 300);
    } else {
      // Pathname didn't change, but content might have (e.g., hash change)
      // Update ad position
      setTimeout(updateAdPosition, 300);
    }
  };

  // Listen to popstate events (back/forward navigation)
  window.addEventListener('popstate', handleNavigation);

  // Update ad position on scroll (TOC might change size)
  let scrollTimer = null;
  window.addEventListener('scroll', () => {
    if (scrollTimer) clearTimeout(scrollTimer);
    scrollTimer = setTimeout(updateAdPosition, 150);
  });

  // Use MutationObserver to detect route changes and TOC updates in Docusaurus
  const observer = new MutationObserver(() => {
    handleNavigation();
    // Also update position when TOC might change
    setTimeout(updateAdPosition, 200);
  });

  // Observe changes to the document body
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Also check periodically as a fallback
  setInterval(handleNavigation, 500);
  
  // Update position on window resize
  window.addEventListener('resize', () => {
    setTimeout(updateAdPosition, 200);
  });
}

