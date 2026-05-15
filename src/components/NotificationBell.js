import { useState, useEffect, useRef, useCallback } from "react";
import { connectNotificationSocket, onNotification, isSocketConnected } from "../utils/notificationSocket";
import { getTokenWithExpiry, getTokenPayload } from "../constants/localStorage";
import { get, post } from "../utils/request";
import { MSG } from "../constants/messages";

const NotificationBell = () => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [connected, setConnected] = useState(false);
    const dropdownRef = useRef(null);
    const bellRef = useRef(null);
    const isAuthenticated = Boolean(getTokenWithExpiry());
    const userId = getTokenPayload()?._id || getTokenPayload()?.sub || getTokenPayload()?.userId || getTokenPayload()?.id;

    const fetchPending = useCallback(async () => {
        if (!userId) return;
        try {
            const res = await get(`notifications/pending?userId=${userId}`);
            if (Array.isArray(res)) {
                const pendingNotifs = res.map((n) => ({
                    id: n._id || n.id,
                    event: n.event,
                    data: n.payload,
                    timestamp: new Date(n.createdAt),
                    read: false,
                    fromDB: true,
                }));
                setNotifications((prev) => {
                    const existingIds = new Set(prev.map((n) => n.id));
                    const newOnes = pendingNotifs.filter((n) => !existingIds.has(n.id));
                    return [...newOnes, ...prev].slice(0, 50);
                });
            }
        } catch {
            // ignore fetch errors
        }
    }, [userId]);

    // Fetch pending notifications on mount (user was offline)
    useEffect(() => {
        if (!isAuthenticated || !userId) return;
        fetchPending();
    }, [isAuthenticated, userId, fetchPending]);

    // Connect WebSocket on mount, fetch pending on connect
    useEffect(() => {
        if (!isAuthenticated) return;
        const socket = connectNotificationSocket();
        setConnected(isSocketConnected());
        const handleConnect = () => {
            setConnected(true);
            fetchPending(); // Fetch pending notifications when WebSocket connects
        };
        const handleDisconnect = () => setConnected(false);
        socket.on("connect", handleConnect);
        socket.on("disconnect", handleDisconnect);
        return () => {
            socket.off("connect", handleConnect);
            socket.off("disconnect", handleDisconnect);
        };
    }, [isAuthenticated, fetchPending]);

    // Listen for ping from WebSocket — fetch pending notifications from DB
    useEffect(() => {
        if (!isAuthenticated) return;
        const unsubscribe = onNotification((event, data) => {
            if (event === "new_notification") {
                fetchPending();
            }
        });
        return unsubscribe;
    }, [isAuthenticated, userId, fetchPending]);

    useEffect(() => {
        setUnreadCount(notifications.filter((n) => !n.read).length);
    }, [notifications]);

    const handleMarkAllRead = async () => {
        try {
            await post("notifications/mark-as-read", { userId });
        } catch {
            // ignore
        }
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
    };

    const handleClearAll = () => {
        setNotifications([]);
        setUnreadCount(0);
    };

    const handleToggle = () => setIsOpen((prev) => !prev);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    if (!isAuthenticated) return null;

    return (
        <div className="relative flex justify-end" ref={dropdownRef}>
            {/* Bell Button */}
            <button
                ref={bellRef}
                onClick={handleToggle}
                className="relative rounded-full p-2 text-slate-600 hover:bg-slate-100 transition"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
                <span className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white ${connected ? "bg-emerald-500" : "bg-red-400"}`} />
            </button>

            {/* Dropdown — wider on desktop (480px), full width on mobile */}
            {isOpen && (
                <div
                    ref={bellRef}
                    className="absolute right-0 top-full z-50 mt-2 rounded-2xl border border-slate-200 bg-white shadow-xl"
                    style={{
                        width: typeof window !== "undefined" && window.innerWidth < 640 ? "calc(100vw - 32px)" : "480px",
                        maxWidth: "480px",
                    }}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
                        <div>
                            <h3 className="text-sm font-semibold text-slate-900">{MSG.ADMIN.NOTIFICATION.TITLE}</h3>
                            <p className="text-xs text-slate-500">
                                {connected ? MSG.ADMIN.NOTIFICATION.CONNECTED : MSG.ADMIN.NOTIFICATION.DISCONNECTED}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <button onClick={handleMarkAllRead} className="rounded-lg px-2.5 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 transition">
                                    {MSG.ADMIN.NOTIFICATION.MARK_ALL_READ}
                                </button>
                            )}
                            {notifications.length > 0 && (
                                <button onClick={handleClearAll} className="rounded-lg px-2.5 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 transition">
                                    {MSG.ADMIN.NOTIFICATION.CLEAR_ALL}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Notification List */}
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                                <p className="text-sm">{MSG.ADMIN.NOTIFICATION.NO_NOTIFICATIONS}</p>
                            </div>
                        ) : (
                            notifications.map((notif) => (
                                <div
                                    key={notif.id}
                                    className={`border-b border-slate-50 px-5 py-3.5 transition hover:bg-slate-50 ${!notif.read ? "bg-blue-50/40" : ""}`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">{notif.event}</p>
                                            <p className="mt-1 text-sm text-slate-700 break-words">
                                                {typeof notif.data === "object"
                                                    ? notif.data.message || JSON.stringify(notif.data)
                                                    : String(notif.data)}
                                            </p>
                                            <p className="mt-1.5 text-xs text-slate-400">
                                                {notif.timestamp.toLocaleTimeString("vi-VN")} · {notif.timestamp.toLocaleDateString("vi-VN")}
                                            </p>
                                        </div>
                                        {!notif.read && (
                                            <span className="mt-1.5 h-2.5 w-2.5 flex-shrink-0 rounded-full bg-blue-500" />
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
