import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { get, post } from "../../utils/request";
import toast from "react-hot-toast";
import { getTokenRole, getTokenWithExpiry } from "../../constants/localStorage";
import PageWrapper from "../../components/PageWrapper";
import { MSG } from "../../constants/messages";

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

    const handleSend = async () => {
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
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Form */}
                <div className="lg:col-span-2">
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h3 className="text-sm font-semibold text-slate-900 mb-4">
                            {MSG.ADMIN.NOTIFICATION.COMPOSE_TITLE}
                        </h3>

                        {/* Broadcast toggle */}
                        <div className="mb-4 flex items-center gap-3">
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={broadcast}
                                    onChange={(e) => setBroadcast(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
                            </label>
                            <span className="text-sm text-slate-700">{MSG.ADMIN.NOTIFICATION.BROADCAST_LABEL}</span>
                        </div>

                        {/* Event */}
                        <div className="mb-4">
                            <label className="block text-xs font-medium text-slate-500 mb-1.5">
                                {MSG.ADMIN.NOTIFICATION.LABEL_EVENT}
                            </label>
                            <input
                                type="text"
                                value={event}
                                onChange={(e) => setEvent(e.target.value)}
                                placeholder={MSG.ADMIN.NOTIFICATION.PLACEHOLDER_EVENT}
                                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                            />
                        </div>

                        {/* Message */}
                        <div className="mb-6">
                            <label className="block text-xs font-medium text-slate-500 mb-1.5">
                                {MSG.ADMIN.NOTIFICATION.LABEL_MESSAGE}
                            </label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder={MSG.ADMIN.NOTIFICATION.PLACEHOLDER_MESSAGE}
                                rows={4}
                                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none"
                            />
                        </div>

                        {/* Send Button */}
                        <button
                            onClick={handleSend}
                            disabled={sending}
                            className="w-full rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {sending
                                ? MSG.ADMIN.NOTIFICATION.BTN_SENDING
                                : broadcast
                                    ? MSG.ADMIN.NOTIFICATION.BTN_BROADCAST
                                    : MSG.ADMIN.NOTIFICATION.BTN_SEND}
                        </button>
                    </div>
                </div>

                {/* User Selection */}
                <div className="lg:col-span-1">
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="mb-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-slate-900">
                                    {MSG.ADMIN.NOTIFICATION.RECIPIENTS_TITLE}
                                </h3>
                                {!broadcast && (
                                    <button
                                        onClick={handleSelectAll}
                                        className="text-xs font-medium text-blue-600 hover:text-blue-700"
                                    >
                                        {selectedUsers.length === filteredUsers.length && filteredUsers.length > 0
                                            ? MSG.ADMIN.NOTIFICATION.DESELECT_ALL
                                            : MSG.ADMIN.NOTIFICATION.SELECT_ALL}
                                    </button>
                                )}
                            </div>

                            {!broadcast && (
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => {
                                            setSearchTerm(e.target.value);
                                            setPage(1);
                                        }}
                                        placeholder={MSG.ADMIN.NOTIFICATION.SEARCH_USERS_PLACEHOLDER}
                                        className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    />
                                    <select
                                        value={roleFilter}
                                        onChange={(e) => {
                                            setRoleFilter(e.target.value);
                                            setPage(1);
                                        }}
                                        className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    >
                                        <option value="all">{MSG.ADMIN.NOTIFICATION.FILTER_ROLE_ALL}</option>
                                        <option value="user">{MSG.ADMIN.NOTIFICATION.FILTER_ROLE_USER}</option>
                                        <option value="manager">{MSG.ADMIN.NOTIFICATION.FILTER_ROLE_MANAGER}</option>
                                        <option value="admin">{MSG.ADMIN.NOTIFICATION.FILTER_ROLE_ADMIN}</option>
                                    </select>
                                </div>
                            )}
                            {!broadcast && roleFilter !== "all" && (
                                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                    <button
                                        onClick={handleSelectRole}
                                        className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-blue-700 transition hover:bg-blue-100"
                                    >
                                        {MSG.ADMIN.NOTIFICATION.SELECT_ROLE(roleFilter)}
                                    </button>
                                    <span>
                                        {MSG.ADMIN.NOTIFICATION.ROLE_FILTER_HINT(filteredUsers.length)}
                                    </span>
                                </div>
                            )}
                        </div>

                        {broadcast ? (
                            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3">
                                <p className="text-xs text-amber-700">{MSG.ADMIN.NOTIFICATION.BROADCAST_NOTE}</p>
                            </div>
                        ) : (
                            <>
                                <div className="mb-3 flex items-center justify-between text-xs text-slate-500">
                                    <span>{MSG.ADMIN.NOTIFICATION.SHOWING_PAGE(page, totalPages)}</span>
                                    <span>{MSG.ADMIN.NOTIFICATION.TOTAL_USERS(filteredUsers.length)}</span>
                                </div>
                                <div className="max-h-72 overflow-y-auto space-y-2">
                                    {visibleUsers.length === 0 ? (
                                        <p className="text-sm text-slate-400 text-center py-4">
                                            {MSG.ADMIN.NOTIFICATION.NO_USERS}
                                        </p>
                                    ) : (
                                        visibleUsers.map((user) => {
                                            const userId = user._id || user.id;
                                            const isSelected = selectedUsers.includes(userId);
                                            return (
                                                <label
                                                    key={userId}
                                                    className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition ${isSelected
                                                        ? "border-blue-200 bg-blue-50"
                                                        : "border-slate-100 hover:bg-slate-50"
                                                        }`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => handleToggleUser(userId)}
                                                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-slate-900 truncate">
                                                            {user.fullname || user.username}
                                                        </p>
                                                        <p className="text-xs text-slate-500 truncate">{user.username}</p>
                                                    </div>
                                                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${user.role === "admin"
                                                        ? "bg-purple-100 text-purple-700"
                                                        : user.role === "manager"
                                                            ? "bg-blue-100 text-blue-700"
                                                            : "bg-slate-100 text-slate-600"
                                                        }`}>
                                                        {user.role}
                                                    </span>
                                                </label>
                                            );
                                        })
                                    )}
                                </div>

                                {totalPages > 1 && (
                                    <div className="mt-3 flex items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                                        <button
                                            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                                            disabled={page === 1}
                                            className="rounded-full border border-slate-300 bg-white px-3 py-1 transition hover:bg-slate-100 disabled:opacity-50"
                                        >
                                            {MSG.ADMIN.NOTIFICATION.BTN_PREV_PAGE}
                                        </button>
                                        <span>{MSG.ADMIN.NOTIFICATION.PAGE_INFO(page, totalPages)}</span>
                                        <button
                                            onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                                            disabled={page === totalPages}
                                            className="rounded-full border border-slate-300 bg-white px-3 py-1 transition hover:bg-slate-100 disabled:opacity-50"
                                        >
                                            {MSG.ADMIN.NOTIFICATION.BTN_NEXT_PAGE}
                                        </button>
                                    </div>
                                )}
                            </>
                        )}

                        {!broadcast && selectedUsers.length > 0 && (
                            <div className="mt-3 text-xs text-slate-500 text-center">
                                {MSG.ADMIN.NOTIFICATION.SELECTED_COUNT(selectedUsers.length)}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </PageWrapper>
    );
};

export default SendNotificationPage;
