import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  connectNotificationSocket,
  onNotification,
  isSocketConnected,
} from "../utils/notificationSocket";
import {
  getTokenWithExpiry,
  getTokenPayload,
} from "../constants/localStorage";
import { get, post } from "../utils/request";
import { MSG } from "../constants/messages";
import { toast } from "react-hot-toast";

/**
 * Info Icon component for info toast notifications
 */
const InfoIcon = () => (
  <svg
    className="h-5 w-5 text-blue-500 flex-shrink-0"
    viewBox="0 0 20 20"
    fill="currentColor"
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
      clipRule="evenodd"
    />
  </svg>
);

/**
 * Trigger an info toast notification using react-hot-toast
 */
const toastInfo = (msg, options = {}) => {
  return toast(msg, {
    icon: <InfoIcon />,
    ...options,
  });
};

if (typeof toast.info !== "function") {
  toast.info = toastInfo;
}

/**
 * Notification Event Icon Resolver
 * Returns tailored SVG icon representing the specific notification category
 */
const NotificationEventIcon = ({ type }) => {
  switch (type) {
    case "group_invite":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <line x1="19" y1="8" x2="19" y2="14" />
          <line x1="22" y1="11" x2="16" y2="11" />
        </svg>
      );
    case "check":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      );
    case "user_minus":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <line x1="22" y1="11" x2="16" y2="11" />
        </svg>
      );
    case "x":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      );
    case "system":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m3 11 18-5v12L3 14v-3z" />
          <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
        </svg>
      );
    case "bell":
    default:
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
      );
  }
};

/**
 * Format timestamp into user-friendly Vietnamese time string
 */
const formatNotificationTime = (timestamp) => {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  const timeStr = date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (isToday) {
    return `${timeStr} · Hôm nay`;
  }

  return `${timeStr} · ${date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}`;
};

/**
 * Event Metadata Resolver
 * Transforms raw backend event keys into elegant Vietnamese UI representations,
 * contextual icons, color palettes, and deep-link actions.
 */
const getEventMeta = (event, data) => {
  const raw = String(event || "").toLowerCase();

  // 1. Group Invitations
  if (raw === "group_invitation_received") {
    return {
      label: "Lời mời nhóm",
      badgeClass: "bg-purple-50 text-purple-700 ring-1 ring-purple-500/20",
      iconBg: "bg-purple-50 text-purple-600 ring-1 ring-purple-100",
      iconType: "group_invite",
      actionText: "Xem & phản hồi",
      actionLink: "/groups?tab=invitations",
    };
  }

  if (raw === "group_invitation_accepted") {
    const groupId = data?.groupId;
    return {
      label: "Đã chấp nhận",
      badgeClass: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500/20",
      iconBg: "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100",
      iconType: "check",
      actionText: "Xem nhóm",
      actionLink: groupId ? `/groups/${groupId}/members` : "/groups",
    };
  }

  if (raw === "group_invitation_rejected") {
    return {
      label: "Từ chối lời mời",
      badgeClass: "bg-rose-50 text-rose-700 ring-1 ring-rose-500/20",
      iconBg: "bg-rose-50 text-rose-600 ring-1 ring-rose-100",
      iconType: "x",
      actionText: "Xem danh sách lời mời",
      actionLink: "/groups?tab=invitations",
    };
  }

  if (raw === "group_member_left") {
    const groupId = data?.groupId;
    return {
      label: "Thành viên rời nhóm",
      badgeClass: "bg-amber-50 text-amber-700 ring-1 ring-amber-500/20",
      iconBg: "bg-amber-50 text-amber-600 ring-1 ring-amber-100",
      iconType: "user_minus",
      actionText: "Xem thành viên",
      actionLink: groupId ? `/groups/${groupId}/members` : "/groups",
    };
  }

  // 2. System / Broadcast
  if (
    raw === "system_global" ||
    raw === "project_global" ||
    raw === "broadcast" ||
    raw.includes("system")
  ) {
    return {
      label: "Hệ thống",
      badgeClass: "bg-blue-50 text-blue-700 ring-1 ring-blue-500/20",
      iconBg: "bg-blue-50 text-blue-600 ring-1 ring-blue-100",
      iconType: "system",
      actionText: null,
      actionLink: null,
    };
  }

  // 3. Fallback / Generic Notifications
  return {
    label: "Thông báo",
    badgeClass: "bg-slate-100 text-slate-700 ring-1 ring-slate-200/60",
    iconBg: "bg-slate-100 text-slate-600 ring-1 ring-slate-200/50",
    iconType: "bell",
    actionText: null,
    actionLink: null,
  };
};

const NotificationBell = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [connected, setConnected] = useState(false);
  const dropdownRef = useRef(null);
  const bellRef = useRef(null);
  const isInitialMount = useRef(true);

  const isAuthenticated = Boolean(getTokenWithExpiry());
  const userId =
    getTokenPayload()?._id ||
    getTokenPayload()?.sub ||
    getTokenPayload()?.userId ||
    getTokenPayload()?.id;

  const fetchPending = useCallback(async (isRealtimeTrigger = false) => {
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

          // Trigger toast for new notifications if received during active session
          if (isRealtimeTrigger && newOnes.length > 0) {
            newOnes.forEach((notif) => {
              const msg =
                notif.data?.message ||
                (typeof notif.data === "string" ? notif.data : "");
              if (msg) {
                toastInfo(msg, { id: String(notif.id) });
              }
            });
          }

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
    fetchPending(false);
    isInitialMount.current = false;
  }, [isAuthenticated, userId, fetchPending]);

  // Connect WebSocket on mount, fetch pending on connect
  useEffect(() => {
    if (!isAuthenticated) return;
    const socket = connectNotificationSocket();
    setConnected(isSocketConnected());

    const handleConnect = () => {
      setConnected(true);
      fetchPending(false);
    };

    const handleDisconnect = () => setConnected(false);

    if (socket?.on) {
      socket.on("connect", handleConnect);
      socket.on("disconnect", handleDisconnect);
    }

    return () => {
      if (socket?.off) {
        socket.off("connect", handleConnect);
        socket.off("disconnect", handleDisconnect);
      }
    };
  }, [isAuthenticated, fetchPending]);

  // Listen for realtime notifications from WebSocket
  useEffect(() => {
    if (!isAuthenticated) return;

    const unsubscribe = onNotification((event, data) => {
      // Check if this is an internal database synchronization ping
      const isInternalPing =
        event === "new_notification" ||
        data?.event === "new_notification" ||
        data?.message === "Notification: new_notification" ||
        !data?.message;

      if (isInternalPing) {
        // Just synchronize with DB, do NOT add internal ping as a notification item!
        fetchPending(true);
        return;
      }

      // If it's a real notification (e.g. Broadcast / project_global / system_global)
      const messageText = data.message;
      const notifId =
        data.event_id ||
        data.id ||
        `notif_${event}_${messageText}`;

      const newNotif = {
        id: notifId,
        event: data.event || event,
        data: data,
        timestamp: new Date(),
        read: false,
        fromDB: false,
      };

      setNotifications((prev) => {
        if (prev.some((n) => n.id === notifId)) return prev;
        return [newNotif, ...prev].slice(0, 50);
      });

      // Display toast popup for the realtime message
      toastInfo(messageText, { id: notifId });
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
      {/* Bell Trigger Button */}
      <button
        ref={bellRef}
        onClick={handleToggle}
        aria-label="Hộp thông báo"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors active:scale-95"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
          />
        </svg>

        {/* Unread Count Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-xs">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}

        {/* Live Socket Status Dot */}
        <span
          className={`absolute bottom-0.5 right-0.5 h-2 w-2 rounded-full border-2 border-white ${
            connected ? "bg-emerald-500" : "bg-amber-400"
          }`}
          title={connected ? "Đang đồng bộ trực tuyến" : "Mất kết nối tạm thời"}
        />
      </button>

      {/* Popover Card */}
      {isOpen && (
        <div
          className="fixed sm:absolute right-4 sm:right-0 top-16 sm:top-full sm:mt-2.5 z-50 w-[calc(100vw-32px)] sm:w-[420px] max-w-[420px] overflow-hidden rounded-3xl border border-slate-200/90 bg-white/95 shadow-soft-xl backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-200"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100/80 px-5 py-3.5 bg-slate-50/50">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                {MSG.ADMIN.NOTIFICATION.TITLE}
              </h3>
              <p className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                <span className={`inline-block h-1.5 w-1.5 rounded-full ${connected ? "bg-emerald-500" : "bg-amber-400"}`} />
                {connected
                  ? MSG.ADMIN.NOTIFICATION.CONNECTED
                  : MSG.ADMIN.NOTIFICATION.DISCONNECTED}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="rounded-full px-2.5 py-1 text-[11px] font-semibold text-blue-600 hover:bg-blue-50 transition-colors"
                >
                  {MSG.ADMIN.NOTIFICATION.MARK_ALL_READ}
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="rounded-full px-2.5 py-1 text-[11px] font-medium text-slate-500 hover:bg-slate-100 transition-colors"
                >
                  {MSG.ADMIN.NOTIFICATION.CLEAR_ALL}
                </button>
              )}
            </div>
          </div>

          {/* Notification Items List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100/60">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-6 text-center text-slate-400">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-3">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-slate-700">
                  {MSG.ADMIN.NOTIFICATION.NO_NOTIFICATIONS}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Khi có sự kiện hoặc thông báo mới, chúng sẽ xuất hiện tại đây.
                </p>
              </div>
            ) : (
              notifications.map((notif) => {
                const meta = getEventMeta(notif.event, notif.data);
                const hasLink = Boolean(meta.actionLink);

                const handleItemClick = () => {
                  // Mark item as read locally
                  if (!notif.read) {
                    setNotifications((prev) =>
                      prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
                    );
                  }

                  if (hasLink) {
                    setIsOpen(false);
                    navigate(meta.actionLink);
                  }
                };

                return (
                  <div
                    key={notif.id}
                    onClick={handleItemClick}
                    className={`p-4 transition-all duration-200 border-b border-slate-100/60 last:border-b-0 ${
                      hasLink
                        ? "cursor-pointer hover:bg-slate-50/90 active:bg-slate-100/70"
                        : "hover:bg-slate-50/50"
                    } ${!notif.read ? "bg-blue-50/25" : ""}`}
                  >
                    <div className="flex items-start gap-3.5">
                      {/* Event Type Icon Avatar */}
                      <div
                        className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 ${meta.iconBg}`}
                      >
                        <NotificationEventIcon type={meta.iconType} />
                      </div>

                      {/* Content Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${meta.badgeClass}`}
                            >
                              {meta.label}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono shrink-0">
                              {formatNotificationTime(notif.timestamp)}
                            </span>
                          </div>
                          {!notif.read && (
                            <span className="h-2 w-2 rounded-full bg-blue-600 shrink-0" />
                          )}
                        </div>

                        <p className="mt-1.5 text-xs sm:text-[13px] text-slate-700 break-words leading-relaxed font-medium">
                          {typeof notif.data === "object"
                            ? notif.data.message || JSON.stringify(notif.data)
                            : String(notif.data)}
                        </p>

                        {hasLink && (
                          <div className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 transition">
                            <span>{meta.actionText}</span>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polyline points="9 18 15 12 9 6" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
