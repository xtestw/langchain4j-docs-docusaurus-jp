import React, { useEffect, useRef } from 'react';

export default function AdSense() {
  const adRef = useRef(null);

  useEffect(() => {
    // Initialize ad after a short delay to ensure script is loaded
    const timer = setTimeout(() => {
      try {
        if (window.adsbygoogle && adRef.current) {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
        }
      } catch (e) {
        console.error('AdSense error:', e);
      }
    }, 500);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  return (
    <div className="adsense-container" ref={adRef}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client="ca-pub-1217509255829092"
        data-ad-slot="5883488891"
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}

