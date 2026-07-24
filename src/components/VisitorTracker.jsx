'use client';

import { useEffect } from 'react';

export default function VisitorTracker() {
  useEffect(() => {
    // Visitor ID (Permanent across tabs and reloads)
    let visitorId = localStorage.getItem('olivka_visitor_id');
    if (!visitorId) {
      visitorId = Math.random().toString(36).substring(2, 15);
      localStorage.setItem('olivka_visitor_id', visitorId);
    }

    // Session ID (Per tab)
    const sessionId = sessionStorage.getItem('tracking_session_id');
    
    if (!sessionId) {
      const newSessionId = Math.random().toString(36).substring(2, 15);
      sessionStorage.setItem('tracking_session_id', newSessionId);

      const referrer = document.referrer || 'Direct';
      const currentUrl = window.location.href;

      // Send tracking event
      fetch('/api/tracking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event: 'new_visit',
          data: {
            session_id: newSessionId,
            visitor_id: visitorId,
            referrer,
            url: currentUrl
          }
        })
      }).catch(err => console.error('Failed to send tracking event:', err));
    }
  }, []);

  return null;
}
