'use client';

import { useEffect } from 'react';

export default function VisitorTracker() {
  useEffect(() => {
    // Check if we already tracked this session
    const sessionId = sessionStorage.getItem('tracking_session_id');
    
    if (!sessionId) {
      // Generate a new session ID (simple random string)
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
            referrer,
            url: currentUrl
          }
        })
      }).catch(err => console.error('Failed to send tracking event:', err));
    }
  }, []);

  return null; // This component doesn't render anything
}
