import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { get, post } from "../../utils/request";
import toast from "react-hot-toast";
import { getTokenRole, getTokenWithExpiry } from "../../constants/localStorage";
import PageWrapper from "../../components/PageWrapper";
import { MSG } from "../../constants/messages";

/**
 * SendNotificationPage Component
 * High-end real-time push notification & broadcast composer.
 * Features Double-Bezel card architecture and responsive recipient selection.
 */
const SendNotificationPage = () => {
    const [users, setUsers] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [page, setPage] = useState(1);
    const pageSize = 5;
    const [event, setEvent] = useState("");
    const [message, setMessage] = useState("");
    const [sending, setSending] = useState(false);
    const [broadcast, setBroadcast] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const role = getTokenRole();
        if (!getTokenWithExpiry() || (role !== "admin" && role !== "manager")) {
            navigate("/not-found", { replace: true });
            return;
        }
        fetchUsers();
    }, [navigate]);

    const fetchUsers = async () => {
        try {
            const res = await get("account");
            setUsers(res?.accounts || res || []);
        } catch (err) {
            toast.error(MSG.ADMIN.NOTIFICATION.ERR_FETCH_USERS);
        }
    };

    const handleToggleUser = (userId) => {
        setSelectedUsers((prev) =>
            prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
        );
    };

    const filteredUsers = users.filter((user) => {
        const term = searchTerm.trim().toLowerCase();
        const username = String(user.username || "").toLowerCase();
        const fullname = String(user.fullname || "").toLowerCase();
        const matchesSearch = !term || username.includes(term) || fullname.includes(term);
        const matchesRole = roleFilter === "all" || user.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
    const visibleUsers = filteredUsers.slice((page - 1) * pageSize, page * pageSize);

    useEffect(() => {
        if (page > totalPages) {
            setPage(totalPages);
        }
    }, [page, totalPages]);

    const handleSelectAll = () => {
        const visibleUserIds = visibleUsers.map((u) => u._id || u.id);
        const allVisibleSelected =
            visibleUserIds.length > 0 && visibleUserIds.every((id) => selectedUsers.includes(id));

        if (allVisibleSelected) {
            setSelectedUsers((prev) => prev.filter((id) => !visibleUserIds.includes(id)));
            return;
        }

        setSelectedUsers((prev) => Array.from(new Set([...prev, ...visibleUserIds])));
    };

    const handleSelectRole = () => {
        const roleUserIds = filteredUsers.map((u) => u._id || u.id);
        const allRoleSelected =
            roleUserIds.length > 0 && roleUserIds.every((id) => selectedUsers.includes(id));

        if (allRoleSelected) {
            setSelectedUsers((prev) => prev.filter((id) => !roleUserIds.includes(id)));
            return;
        }

        setSelectedUsers((prev) => Array.from(new Set([...prev, ...roleUserIds])));
    };

    const handleSend = async (e) => {
        if (e) e.preventDefault();
        if (!event.trim()) {
            toast.error(MSG.ADMIN.NOTIFICATION.ERR_EMPTY_EVENT);
            return;
        }
        if (!message.trim()) {
            toast.error(MSG.ADMIN.NOTIFICATION.ERR_EMPTY_MESSAGE);
            return;
        }
        if (!broadcast && selectedUsers.length === 0) {
            toast.error(MSG.ADMIN.NOTIFICATION.ERR_NO_RECIPIENTS);
            return;
        }

        setSending(true);
        try {
            const payload = { message };

            if (broadcast) {
                await post("notifications/broadcast", { event, payload });
                toast.success(MSG.ADMIN.NOTIFICATION.SUCCESS_BROADCAST);
            } else {
                for (const userId of selectedUsers) {
                    await post("notifications/send", { userId, event, payload });
                }
                toast.success(MSG.ADMIN.NOTIFICATION.SUCCESS_SEND(selectedUsers.length));
            }

            setEvent("");
            setMessage("");
            setSelectedUsers([]);
        } catch (err) {
            toast.error(err.response?.data?.message || MSG.ADMIN.NOTIFICATION.ERR_SEND);
        } finally {
            setSending(false);
        }
    };

    return (
        <PageWrapper
            title={MSG.ADMIN.NOTIFICATION.PAGE_TITLE}
            subtitle={MSG.ADMIN.NOTIFICATION.PAGE_SUBTITLE}
        >
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Notification Composer (7 Cols on desktop) */}
                <div className="lg:col-span-7 space-y-6">
                    <div className="double-bezel-outer p-1.5 rounded-[2rem] bg-slate-200/50">
                        <form onSubmit={handleSend} className="double-bezel-inner p-5 sm:p-7 bg-white rounded-[calc(2rem-0.375rem)] shadow-soft-md space-y-5">
                            <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                                        {MSG.ADMIN.NOTIFICATION.COMPOSE_TITLE}
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-0.5">Thiết lập sự kiện và nội dung phát sóng</p>
                                </div>

                                {/* Broadcast Switch */}
                                <div className="flex items-center gap-2 p-2 rounded-2xl bg-slate-50 border border-slate-100">
                                    <span className="text-xs font-semibold text-slate-700">
                                        {MSG.ADMIN.NOTIFICATION.BROADCAST_LABEL}
                                    </span>
                                    <label className="relative inline-flex cursor-pointer items-center">
                                        <input
                                            type="checkbox"
                                            checked={broadcast}
                                            onChange={(e) => setBroadcast(e.target.checked)}
                                            className="peer sr-only"
                                        />
                                        <div className="w-10 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
                                    </label>
                                </div>
                            </div>

                            {/* Event Input */}
                            <div className="space-y-1">
                                <label className="block text-xs font-semibold text-slate-600">
                                    {MSG.ADMIN.NOTIFICATION.LABEL_EVENT}
                                </label>
                                <input
                                    type="text"
                                    value={event}
                                    onChange={(e) => setEvent(e.target.value)}
                                    placeholder={MSG.ADMIN.NOTIFICATION.PLACEHOLDER_EVENT}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-900 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition"
                                />
                            </div>

                            {/* Message Textarea */}
                            <div className="space-y-1">
                                <label className="block text-xs font-semibold text-slate-600">
                                    {MSG.ADMIN.NOTIFICATION.LABEL_MESSAGE}
                                </label>
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder={MSG.ADMIN.NOTIFICATION.PLACEHOLDER_MESSAGE}
                                    rows={5}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-900 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 resize-none transition"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={sending || (!broadcast && selectedUsers.length === 0)}
                                className="w-full min-h-[44px] rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-xs font-semibold shadow-soft-xs transition flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                {sending && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                                <span>
                                    {sending
                                        ? MSG.ADMIN.NOTIFICATION.BTN_SENDING || "Đang gửi..."
                                        : broadcast
                                        ? MSG.ADMIN.NOTIFICATION.BTN_SEND_BROADCAST || MSG.ADMIN.NOTIFICATION.BTN_BROADCAST || "Gửi tất cả (Broadcast)"
                                        : typeof MSG.ADMIN.NOTIFICATION.BTN_SEND_SELECTED === "function"
                                        ? MSG.ADMIN.NOTIFICATION.BTN_SEND_SELECTED(selectedUsers.length)
                                        : `Gửi thông báo (${selectedUsers.length})`}
                                </span>
                            </button>
                        </form>
                    </div>
                </div>

                {/* Recipient Picker (5 Cols on desktop) */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="double-bezel-outer p-1.5 rounded-[2rem] bg-slate-200/50">
                        <div className="double-bezel-inner p-5 sm:p-6 bg-white rounded-[calc(2rem-0.375rem)] shadow-soft-md space-y-4">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                                    {MSG.ADMIN.NOTIFICATION.RECIPIENTS_TITLE}
                                </h3>
                                {!broadcast && (
                                    <button
                                        type="button"
                                        onClick={handleSelectAll}
                                        className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                                    >
                                        {selectedUsers.length === filteredUsers.length && filteredUsers.length > 0
                                            ? MSG.ADMIN.NOTIFICATION.DESELECT_ALL
                                            : MSG.ADMIN.NOTIFICATION.SELECT_ALL}
                                    </button>
                                )}
                            </div>

                            {broadcast ? (
                                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-800 leading-relaxed">
                                    <div className="flex items-center gap-2 font-bold mb-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600">
                                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                        </svg>
                                        Chế độ Phát sóng Toàn Hệ thống
                                    </div>
                                    {MSG.ADMIN.NOTIFICATION.BROADCAST_NOTE}
                                </div>
                            ) : (
                                <>
                                    {/* Search & Role Filter Bar */}
                                    <div className="space-y-2">
                                        <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-900 focus-within:border-blue-500 focus-within:bg-white transition">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 mr-2 shrink-0">
                                                <circle cx="11" cy="11" r="8" />
                                                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                            </svg>
                                            <input
                                                type="text"
                                                value={searchTerm}
                                                onChange={(e) => {
                                                    setSearchTerm(e.target.value);
                                                    setPage(1);
                                                }}
                                                placeholder={MSG.ADMIN.NOTIFICATION.SEARCH_USERS_PLACEHOLDER}
                                                className="w-full bg-transparent outline-none placeholder:text-slate-400"
                                            />
                                        </div>
                                        <select
                                            value={roleFilter}
                                            onChange={(e) => {
                                                setRoleFilter(e.target.value);
                                                setPage(1);
                                            }}
                                            className="w-full h-9 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 outline-none"
                                        >
                                            <option value="all">{MSG.ADMIN.NOTIFICATION.FILTER_ROLE_ALL}</option>
                                            <option value="user">{MSG.ADMIN.NOTIFICATION.FILTER_ROLE_USER}</option>
                                            <option value="manager">{MSG.ADMIN.NOTIFICATION.FILTER_ROLE_MANAGER}</option>
                                            <option value="admin">{MSG.ADMIN.NOTIFICATION.FILTER_ROLE_ADMIN}</option>
                                        </select>
                                    </div>

                                    {/* Role Select Quick Chip */}
                                    {roleFilter !== "all" && (
                                        <div className="flex items-center gap-2 text-xs">
                                            <button
                                                type="button"
                                                onClick={handleSelectRole}
                                                className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-semibold hover:bg-blue-100 transition"
                                            >
                                                {MSG.ADMIN.NOTIFICATION.SELECT_ROLE(roleFilter)}
                                            </button>
                                            <span className="text-slate-400 text-[11px]">
                                                ({filteredUsers.length} người)
                                            </span>
                                        </div>
                                    )}

                                    {/* User Checkbox List */}
                                    <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                                        {visibleUsers.length === 0 ? (
                                            <p className="text-xs text-slate-400 text-center py-6">
                                                {MSG.ADMIN.NOTIFICATION.NO_USERS}
                                            </p>
                                        ) : (
                                            visibleUsers.map((user) => {
                                                const userId = user._id || user.id;
                                                const isSelected = selectedUsers.includes(userId);
                                                const initials = (user.username?.slice(0, 2) || "US").toUpperCase();

                                                return (
                                                    <label
                                                        key={userId}
                                                        className={`flex items-center gap-3 p-3 min-h-[44px] rounded-xl border cursor-pointer transition ${
                                                            isSelected
                                                                ? "border-blue-200 bg-blue-50/70"
                                                                : "border-slate-100 hover:bg-slate-50"
                                                        }`}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={() => handleToggleUser(userId)}
                                                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                                                        />
                                                        <div className="w-7 h-7 rounded-lg bg-slate-200/80 text-slate-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                                                            {initials}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs font-bold text-slate-900 truncate">
                                                                {user.fullname || user.username}
                                                            </p>
                                                            <p className="text-[11px] text-slate-500 truncate">{user.username}</p>
                                                        </div>
                                                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 capitalize shrink-0">
                                                            {user.role}
                                                        </span>
                                                    </label>
                                                );
                                            })
                                        )}
                                    </div>

                                    {/* Pagination Controller */}
                                    {totalPages > 1 && (
                                        <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-100">
                                            <button
                                                type="button"
                                                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                                                disabled={page === 1}
                                                aria-label="Trang trước"
                                                className="min-h-[40px] px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition flex items-center gap-1.5 disabled:opacity-40"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="15 18 9 12 15 6" />
                                                </svg>
                                                <span>{MSG.ADMIN.NOTIFICATION.BTN_PREV_PAGE}</span>
                                            </button>
                                            <span className="font-mono text-slate-400 text-[11px]">
                                                {MSG.ADMIN.NOTIFICATION.PAGE_INFO(page, totalPages)}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                                                disabled={page === totalPages}
                                                aria-label="Trang tiếp theo"
                                                className="min-h-[40px] px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition flex items-center gap-1.5 disabled:opacity-40"
                                            >
                                                <span>{MSG.ADMIN.NOTIFICATION.BTN_NEXT_PAGE}</span>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="9 18 15 12 9 6" />
                                                </svg>
                                            </button>
                                        </div>
                                    )}

                                    {selectedUsers.length > 0 && (
                                        <div className="text-[11px] text-blue-700 font-semibold text-center pt-1">
                                            {MSG.ADMIN.NOTIFICATION.SELECTED_COUNT(selectedUsers.length)}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </PageWrapper>
    );
};

export default SendNotificationPage;
