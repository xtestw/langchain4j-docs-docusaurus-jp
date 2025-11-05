import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';
import AdSense from '../components/AdSense';
import React from 'react';
import ReactDOM from 'react-dom/client';

if (ExecutionEnvironment.canUseDOM) {
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
    }
  };

  // Listen to popstate events (back/forward navigation)
  window.addEventListener('popstate', handleNavigation);

  // Use MutationObserver to detect route changes in Docusaurus
  const observer = new MutationObserver(() => {
    handleNavigation();
  });

  // Observe changes to the document body
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Also check periodically as a fallback
  setInterval(handleNavigation, 500);
}

