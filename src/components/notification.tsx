import React, { useEffect, useState } from 'react';

interface Notification {
  message: string;
  read: boolean;
}

const NotificationBell: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [pendingMarkRead, setPendingMarkRead] = useState(false);

  async function fetchNotifications() {
    const res = await fetch('/api/notifications');
    const data = await res.json();
    setNotifications(data.notifications);
    setHasUnread(data.notifications.some((n: Notification) => !n.read));
  }

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
  }, []);

  // Okundu bildirimi sadece açıldığında ve okunmamış varsa yapılacak
  const handleBellClick = async () => {
    setOpen((v) => !v);
    if (!open && hasUnread && !pendingMarkRead) {
      setPendingMarkRead(true);
      await fetch('/api/notifications/read', { method: 'POST' });
      await fetchNotifications();
      setPendingMarkRead(false);
    }
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={handleBellClick}
        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
        aria-label="Bildirimler"
      >
        <span style={{ fontSize: 24 }}>🔔</span>
        {hasUnread && !open && (
          <span style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: 12,
            height: 12,
            background: 'red',
            borderRadius: '50%',
            display: 'inline-block',
            border: '2px solid white',
          }} />
        )}
      </button>
      {open && (
        <div style={{
          position: 'absolute',
          right: 0,
          top: 32,
          background: 'white',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          borderRadius: 8,
          minWidth: 220,
          zIndex: 1000,
          padding: 8,
        }}>
          <strong>Bildirimler</strong>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {notifications.length === 0 && <li>Hiç bildirim yok.</li>}
            {notifications.map((n, i) => (
              <li key={i} style={{
                background: n.read ? '#f5f5f5' : '#e6f7ff',
                margin: '4px 0',
                padding: '6px 8px',
                borderRadius: 4,
                fontWeight: n.read ? 'normal' : 'bold',
              }}>
                {n.message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
