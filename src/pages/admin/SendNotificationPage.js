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

    const handleSelectAll = () => {
        if (selectedUsers.length === users.length) {
            setSelectedUsers([]);
        } else {
            setSelectedUsers(users.map((u) => u._id || u.id));
        }
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
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-slate-900">
                                {MSG.ADMIN.NOTIFICATION.RECIPIENTS_TITLE}
                            </h3>
                            {!broadcast && (
                                <button
                                    onClick={handleSelectAll}
                                    className="text-xs font-medium text-blue-600 hover:text-blue-700"
                                >
                                    {selectedUsers.length === users.length
                                        ? MSG.ADMIN.NOTIFICATION.DESELECT_ALL
                                        : MSG.ADMIN.NOTIFICATION.SELECT_ALL}
                                </button>
                            )}
                        </div>

                        {broadcast ? (
                            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3">
                                <p className="text-xs text-amber-700">{MSG.ADMIN.NOTIFICATION.BROADCAST_NOTE}</p>
                            </div>
                        ) : (
                            <div className="max-h-96 overflow-y-auto space-y-2">
                                {users.length === 0 ? (
                                    <p className="text-sm text-slate-400 text-center py-4">
                                        {MSG.ADMIN.NOTIFICATION.NO_USERS}
                                    </p>
                                ) : (
                                    users.map((user) => {
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
