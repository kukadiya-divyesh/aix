import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

const FeedbackContext = createContext(null);

export const useFeedback = () => useContext(FeedbackContext);

// Audio base64 for subtle shimmer (placeholder, in real apps we'd use mp3 files)
const SHIMMER_SOUND = 'https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3';

export const FeedbackProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [confirmData, setConfirmData] = useState(null);

  const playShimmer = () => {
    const audio = new Audio(SHIMMER_SOUND);
    audio.volume = 0.3;
    audio.play().catch(() => {}); // Browser may block autoplay without interaction
  };

  const showNotification = useCallback((message, type = 'success') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    playShimmer();
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  }, []);

  const confirm = useCallback((title, message) => {
    return new Promise((resolve) => {
      setConfirmData({ title, message, resolve });
    });
  }, []);

  const handleConfirm = (value) => {
    if (confirmData) {
      confirmData.resolve(value);
      setConfirmData(null);
    }
  };

  return (
    <FeedbackContext.Provider value={{ showNotification, confirm }}>
      {children}
      
      {/* Notifications Portal */}
      <div style={{ position: 'fixed', top: '2rem', right: '2rem', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '1rem', width: '350px' }}>
        {notifications.map(n => (
          <div 
            key={n.id} 
            className="glass animate-slide-in"
            style={{ 
              padding: '1rem 1.5rem', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '1rem', 
              borderLeft: `5px solid ${n.type === 'success' ? 'var(--success)' : n.type === 'error' ? 'var(--error)' : '#3b82f6'}`,
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              animation: 'slideIn 0.3s ease-out'
            }}
          >
            {n.type === 'success' && <CheckCircle color="var(--success)" size={24} />}
            {n.type === 'error' && <AlertCircle color="var(--error)" size={24} />}
            {n.type === 'info' && <Info color="#3b82f6" size={24} />}
            <div style={{ flex: 1, fontSize: '14px', fontWeight: 600 }}>{n.message}</div>
            <X 
              size={18} 
              style={{ cursor: 'pointer', color: 'var(--text-muted)' }} 
              onClick={() => setNotifications(prev => prev.filter(nx => nx.id !== n.id))} 
            />
          </div>
        ))}
      </div>

      {/* Confirmation Dialog Overlay */}
      {confirmData && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass animate-slide-up" style={{ padding: '2.5rem', maxWidth: '450px', width: '100%', textAlign: 'center', backgroundColor: '#ffffff', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '1rem', color: 'var(--text-main)' }}>{confirmData.title}</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '1.1rem' }}>{confirmData.message}</p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                className="btn btn-primary" 
                style={{ flex: 1, padding: '1rem' }} 
                onClick={() => handleConfirm(true)}
              >
                Yes, Continue
              </button>
              <button 
                className="btn" 
                style={{ flex: 1, padding: '1rem', background: '#f1f5f9', color: '#475569', border: '1px solid rgba(0,0,0,0.1)' }} 
                onClick={() => handleConfirm(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </FeedbackContext.Provider>
  );
};
