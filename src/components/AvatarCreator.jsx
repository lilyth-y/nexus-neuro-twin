
import React, { useEffect, useRef } from 'react';

const AvatarCreator = ({ onAvatarExported, onCancel }) => {
  const subdomain = 'demo'; // Replace with your own subdomain if you have one
  const iframeUrl = `https://${subdomain}.readyplayer.me/avatar?frameApi`;
  const iframeRef = useRef(null);

  useEffect(() => {
    const handleMessage = (event) => {
      const source = event.srcElement || event.originalEvent?.source;
      if (source !== iframeRef.current?.contentWindow) return;

      try {
        const json = JSON.parse(event.data);

        // Ready Player Me Event: v1.avatar.exported
        if (json.source === 'readyplayerme' && json.eventName === 'v1.avatar.exported') {
          console.log('Avatar URL:', json.data.url);
          onAvatarExported(json.data.url);
        }
      } catch (error) {
        // Ignore non-JSON messages
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onAvatarExported]);

  return (
    <div className="avatar-creator-overlay">
      <div className="avatar-creator-header">
        <button onClick={onCancel} className="btn btn-secondary glass-effect">Close</button>
      </div>
      <iframe
        ref={iframeRef}
        src={iframeUrl}
        allow="camera *; microphone *"
        className="avatar-creator-iframe"
        title="Avatar Creator"
      />
    </div>
  );
};

export default AvatarCreator;
