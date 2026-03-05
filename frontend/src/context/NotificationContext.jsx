import React, { createContext, useContext, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';

const NotificationContext = createContext(null);

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [confirmDialog, setConfirmDialog] = useState(null);

    const showNotification = useCallback((message, type = 'info', duration = 3000) => {
        const id = Date.now();
        setNotifications((prev) => [...prev, { id, message, type }]);

        setTimeout(() => {
            setNotifications((prev) => prev.filter((n) => n.id !== id));
        }, duration);
    }, []);

    const confirm = useCallback((message, title = 'Confirm Action') => {
        return new Promise((resolve) => {
            setConfirmDialog({
                message,
                title,
                resolve: (value) => {
                    setConfirmDialog(null);
                    resolve(value);
                },
            });
        });
    }, []);

    return (
        <NotificationContext.Provider value={{ showNotification, confirm }}>
            {children}

            {/* Notification Portal */}
            {notifications.length > 0 && createPortal(
                <div className="notification-container">
                    {notifications.map((n) => (
                        <div key={n.id} className={`notification-toast notification-${n.type}`}>
                            {n.message}
                        </div>
                    ))}
                </div>,
                document.body
            )}

            {/* Confirmation Dialog Portal */}
            {confirmDialog && createPortal(
                <div className="confirm-overlay">
                    <div className="confirm-dialog animate-scale-up">
                        <h3>{confirmDialog.title}</h3>
                        <p>{confirmDialog.message}</p>
                        <div className="confirm-actions">
                            <button
                                className="btn btn-outline"
                                onClick={() => confirmDialog.resolve(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={() => confirmDialog.resolve(true)}
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </NotificationContext.Provider>
    );
};
