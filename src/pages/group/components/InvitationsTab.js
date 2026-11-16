import React, { useState, useEffect, useMemo, useCallback } from "react";
import { get, post, remove } from "../../../utils/request";
import toast from "react-hot-toast";
import { MSG } from "../../../constants/messages";

/**
 * InvitationsTab Component
 * High-end Dual-Stream Collaboration Hub for received and sent group invitations.
 * Built with Double-Bezel architecture, kinetic button-in-button CTAs, and tactile filter controls.
 */
const InvitationsTab = ({ onInvitationAccepted, onPendingCountChange }) => {
    const [receivedInvites, setReceivedInvites] = useState([]);
    const [sentInvites, setSentInvites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoadingId, setActionLoadingId] = useState(null);

    // Filters and pagination state
    const [filterType, setFilterType] = useState("all"); // 'all' | 'received' | 'sent'
    const [filterRole, setFilterRole] = useState("all"); // 'all' | 'manager' | 'member'
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 6;

    const fetchAllInvitations = useCallback(async () => {
        setLoading(true);
        try {
            const [receivedRes, sentRes] = await Promise.all([
                get("groups/invitations/me").catch(() => []),
                get("groups/invitations/sent").catch(() => []),
            ]);

            const received = Array.isArray(receivedRes) ? receivedRes : [];
            const sent = Array.isArray(sentRes) ? sentRes : [];

            setReceivedInvites(received);
            setSentInvites(sent);

            if (onPendingCountChange) {
                onPendingCountChange(received.length);
            }
        } catch {
            toast.error(MSG.GROUP.INVITATIONS.ERR_LOAD_INVITATIONS);
        } finally {
            setLoading(false);
        }
    }, [onPendingCountChange]);

    useEffect(() => {
        fetchAllInvitations();
    }, [fetchAllInvitations]);

    // Handle Accept received invitation
    const handleAccept = async (groupId) => {
        setActionLoadingId(`accept-${groupId}`);
        try {
            await post(`groups/${groupId}/invitations/respond`, { action: "accept" });
            toast.success(MSG.GROUP.INVITATIONS.SUCCESS_ACCEPT);

            // Optimistic update
            setReceivedInvites((prev) => prev.filter((inv) => inv.groupId !== groupId));
            if (onPendingCountChange) {
                onPendingCountChange(Math.max(0, receivedInvites.length - 1));
            }
            if (onInvitationAccepted) {
                onInvitationAccepted(groupId);
            }
        } catch (error) {
            const message = error.response?.data?.error?.message || MSG.GROUP.INVITATIONS.ERR_ACCEPT;
            toast.error(message);
        } finally {
            setActionLoadingId(null);
        }
    };

    // Handle Reject received invitation
    const handleReject = async (groupId) => {
        setActionLoadingId(`reject-${groupId}`);
        try {
            await post(`groups/${groupId}/invitations/respond`, { action: "reject" });
            toast.success(MSG.GROUP.INVITATIONS.SUCCESS_REJECT);

            // Optimistic update
            setReceivedInvites((prev) => prev.filter((inv) => inv.groupId !== groupId));
            if (onPendingCountChange) {
                onPendingCountChange(Math.max(0, receivedInvites.length - 1));
            }
        } catch (error) {
            const message = error.response?.data?.error?.message || MSG.GROUP.INVITATIONS.ERR_REJECT;
            toast.error(message);
        } finally {
            setActionLoadingId(null);
        }
    };

    // Handle Cancel / Revoke sent invitation
    const handleCancelSent = async (groupId, targetAccountId) => {
        setActionLoadingId(`cancel-${groupId}-${targetAccountId}`);
        try {
            await remove(`groups/${groupId}/invitations/${targetAccountId}`);
            toast.success(MSG.GROUP.INVITATIONS.SUCCESS_CANCEL);

            // Optimistic update
            setSentInvites((prev) =>
                prev.filter(
                    (inv) =>
                        !(
                            inv.groupId === groupId &&
                            (inv.account?._id === targetAccountId || inv.account === targetAccountId)
                        ),
                ),
            );
        } catch (error) {
            const message = error.response?.data?.error?.message || MSG.GROUP.INVITATIONS.ERR_CANCEL;
            toast.error(message);
        } finally {
            setActionLoadingId(null);
        }
    };

    // Combine and filter invitations
    const filteredInvitations = useMemo(() => {
        const stream = [];

        if (filterType === "all" || filterType === "received") {
            receivedInvites.forEach((inv) => {
                stream.push({ ...inv, streamType: "received" });
            });
        }

        if (filterType === "all" || filterType === "sent") {
            sentInvites.forEach((inv) => {
                stream.push({ ...inv, streamType: "sent" });
            });
        }

        return stream.filter((item) => {
            // Role filter
            if (filterRole !== "all" && item.role !== filterRole) {
                return false;
            }

            // Search query filter
            if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase().trim();
                const groupMatch = item.groupName?.toLowerCase().includes(query);
                const inviterMatch =
                    item.invitedBy?.username?.toLowerCase().includes(query) ||
                    item.invitedBy?.fullname?.toLowerCase().includes(query);
                const inviteeMatch =
                    item.account?.username?.toLowerCase().includes(query) ||
                    item.account?.fullname?.toLowerCase().includes(query);

                return groupMatch || inviterMatch || inviteeMatch;
            }

            return true;
        });
    }, [receivedInvites, sentInvites, filterType, filterRole, searchQuery]);

    // Pagination calculations
    const totalPages = Math.max(1, Math.ceil(filteredInvitations.length / pageSize));
    const paginatedItems = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredInvitations.slice(start, start + pageSize);
    }, [filteredInvitations, currentPage, pageSize]);

    // Reset page to 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [filterType, filterRole, searchQuery]);

    const formatTimestamp = (dateStr) => {
        if (!dateStr) return "—";
        const date = new Date(dateStr);
        return date.toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <div className="space-y-6">
            {/* Filter & Search Bar - Double Bezel Container */}
            <div className="double-bezel-outer p-1.5 rounded-3xl bg-slate-200/50">
                <div className="double-bezel-inner p-4 sm:p-5 bg-white rounded-[calc(1.5rem-0.375rem)] shadow-soft-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
                    {/* Direction Selector (Pill Segmented Control) */}
                    <div className="flex items-center p-1 rounded-2xl bg-slate-100/80 border border-slate-200/60 self-start sm:self-auto">
                        <button
                            type="button"
                            onClick={() => setFilterType("all")}
                            className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
                                filterType === "all"
                                    ? "bg-white text-slate-900 shadow-soft-xs"
                                    : "text-slate-500 hover:text-slate-800"
                            }`}
                        >
                            {MSG.GROUP.INVITATIONS.FILTER_ALL} ({receivedInvites.length + sentInvites.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilterType("received")}
                            className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center gap-1.5 ${
                                filterType === "received"
                                    ? "bg-white text-emerald-700 shadow-soft-xs"
                                    : "text-slate-500 hover:text-slate-800"
                            }`}
                        >
                            <span>{MSG.GROUP.INVITATIONS.FILTER_RECEIVED}</span>
                            {receivedInvites.length > 0 && (
                                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center justify-center">
                                    {receivedInvites.length}
                                </span>
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilterType("sent")}
                            className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center gap-1.5 ${
                                filterType === "sent"
                                    ? "bg-white text-blue-700 shadow-soft-xs"
                                    : "text-slate-500 hover:text-slate-800"
                            }`}
                        >
                            <span>{MSG.GROUP.INVITATIONS.FILTER_SENT}</span>
                            {sentInvites.length > 0 && (
                                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold flex items-center justify-center">
                                    {sentInvites.length}
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Role Filter & Search Input */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 lg:max-w-xl justify-end">
                        {/* Role Select */}
                        <select
                            value={filterRole}
                            onChange={(e) => setFilterRole(e.target.value)}
                            className="h-10 px-3.5 py-1.5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white text-xs sm:text-sm font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-soft-xs transition cursor-pointer"
                        >
                            <option value="all">{MSG.GROUP.INVITATIONS.ROLE_ALL}</option>
                            <option value="manager">{MSG.GROUP.INVITATIONS.ROLE_MANAGER}</option>
                            <option value="member">{MSG.GROUP.INVITATIONS.ROLE_MEMBER}</option>
                        </select>

                        {/* Search Bar */}
                        <div className="relative flex-1">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                            >
                                <circle cx="11" cy="11" r="8" />
                                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={MSG.GROUP.INVITATIONS.SEARCH_PLACEHOLDER}
                                className="w-full h-10 pl-10 pr-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-soft-xs transition"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery("")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Stream - Double Bezel Layout */}
            <div className="double-bezel-outer p-1.5 rounded-[2rem] bg-slate-200/50">
                <div className="double-bezel-inner p-5 sm:p-7 bg-white rounded-[calc(2rem-0.375rem)] shadow-soft-md space-y-6">
                    {/* Header info */}
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                        <div>
                            <h3 className="text-lg font-bold tracking-tight text-slate-900">
                                {MSG.GROUP.INVITATIONS.PAGE_TITLE}
                            </h3>
                            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                                {MSG.GROUP.INVITATIONS.PAGE_SUBTITLE}
                            </p>
                        </div>
                        <span className="font-mono text-xs px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                            {filteredInvitations.length} lời mời
                        </span>
                    </div>

                    {/* Loading State - Skeletal Cards */}
                    {loading && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                            {[1, 2, 3, 4].map((n) => (
                                <div key={n} className="double-bezel-outer p-1 rounded-3xl bg-slate-100 animate-pulse">
                                    <div className="double-bezel-inner p-5 bg-white rounded-[calc(1.5rem-0.25rem)] space-y-4">
                                        <div className="flex justify-between items-center">
                                            <div className="h-5 w-24 bg-slate-200 rounded-full" />
                                            <div className="h-4 w-16 bg-slate-200 rounded-full" />
                                        </div>
                                        <div className="space-y-2">
                                            <div className="h-6 w-3/4 bg-slate-200 rounded-xl" />
                                            <div className="h-4 w-1/2 bg-slate-200 rounded-xl" />
                                        </div>
                                        <div className="h-10 bg-slate-100 rounded-2xl" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Empty State */}
                    {!loading && filteredInvitations.length === 0 && (
                        <div className="py-16 px-6 text-center text-slate-400 space-y-3">
                            <div className="w-14 h-14 mx-auto rounded-3xl bg-slate-100 flex items-center justify-center text-slate-400 ring-1 ring-slate-200/50">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3zm-8.27 4a2 2 0 0 1-3.46 0" />
                                </svg>
                            </div>
                            <h4 className="text-base font-bold text-slate-800">
                                {filterType === "received"
                                    ? MSG.GROUP.INVITATIONS.EMPTY_RECEIVED
                                    : filterType === "sent"
                                    ? MSG.GROUP.INVITATIONS.EMPTY_SENT
                                    : MSG.GROUP.INVITATIONS.EMPTY_ALL}
                            </h4>
                            <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">
                                Khi có lời mời tham gia nhóm mới hoặc bạn gửi lời mời cho cộng tác viên, các thông tin sẽ xuất hiện tại đây.
                            </p>
                        </div>
                    )}

                    {/* Invitations Grid (Bento Style) */}
                    {!loading && filteredInvitations.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                            {paginatedItems.map((item, index) => {
                                const isReceived = item.streamType === "received";
                                const isManagerRole = item.role === "manager";
                                const targetUser = isReceived ? item.invitedBy : item.account;
                                const targetName =
                                    targetUser?.fullname || targetUser?.username || "Thành viên";
                                const targetInitials = (targetName.slice(0, 2) || "MB").toUpperCase();

                                return (
                                    <div
                                        key={`${item.groupId}-${item.streamType}-${index}`}
                                        className="double-bezel-outer p-1.5 rounded-3xl bg-slate-100 hover:bg-slate-200/50 transition-all duration-300"
                                    >
                                        <div className="double-bezel-inner p-5 bg-white rounded-[calc(1.5rem-0.375rem)] shadow-soft-xs flex flex-col justify-between h-full gap-4">
                                            {/* Top Metadata Badges */}
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-2">
                                                    {isReceived ? (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold uppercase tracking-wider ring-1 ring-emerald-500/20">
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                                <line x1="12" y1="5" x2="12" y2="19" />
                                                                <polyline points="19 12 12 19 5 12" />
                                                            </svg>
                                                            {MSG.GROUP.INVITATIONS.LABEL_RECEIVED_BADGE}
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-[11px] font-bold uppercase tracking-wider ring-1 ring-blue-500/20">
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                                <line x1="12" y1="19" x2="12" y2="5" />
                                                                <polyline points="5 12 12 5 19 12" />
                                                            </svg>
                                                            {MSG.GROUP.INVITATIONS.LABEL_SENT_BADGE}
                                                        </span>
                                                    )}

                                                    <span
                                                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                                                            isManagerRole
                                                                ? "bg-purple-50 text-purple-700 ring-1 ring-purple-500/20"
                                                                : "bg-slate-100 text-slate-700 ring-1 ring-slate-200/50"
                                                        }`}
                                                    >
                                                        {isManagerRole
                                                            ? MSG.GROUP.INVITATIONS.ROLE_MANAGER
                                                            : MSG.GROUP.INVITATIONS.ROLE_MEMBER}
                                                    </span>
                                                </div>

                                                <span className="font-mono text-[11px] text-slate-400">
                                                    {formatTimestamp(item.invitedAt)}
                                                </span>
                                            </div>

                                            {/* Middle Information */}
                                            <div className="space-y-3">
                                                <div>
                                                    <h4 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight truncate">
                                                        {item.groupName}
                                                    </h4>
                                                    <p className="text-xs text-slate-500 mt-0.5">
                                                        {MSG.GROUP.INVITATIONS.LABEL_MEMBERS_COUNT(item.memberCount || 0)}
                                                    </p>
                                                </div>

                                                {/* Actor Avatar & Identity */}
                                                <div className="p-3 rounded-2xl bg-slate-50/70 border border-slate-100 flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-slate-200 to-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0 ring-1 ring-slate-200/50">
                                                        {targetInitials}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-xs text-slate-400 font-medium">
                                                            {isReceived
                                                                ? MSG.GROUP.INVITATIONS.LABEL_INVITED_BY(targetName)
                                                                : MSG.GROUP.INVITATIONS.LABEL_INVITED_TO(targetName)}
                                                        </p>
                                                        {targetUser?.username && (
                                                            <p className="text-xs font-semibold text-slate-700 truncate">
                                                                @{targetUser.username}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Bottom Action CTAs */}
                                            <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2.5">
                                                {isReceived ? (
                                                    <>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleReject(item.groupId)}
                                                            disabled={actionLoadingId !== null}
                                                            className="px-4 py-2 rounded-full bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 text-xs font-semibold active:scale-[0.98] transition-all disabled:opacity-50"
                                                        >
                                                            {MSG.GROUP.INVITATIONS.BTN_REJECT}
                                                        </button>

                                                        {/* Linear-Tier Button-In-Button Accept */}
                                                        <button
                                                            type="button"
                                                            onClick={() => handleAccept(item.groupId)}
                                                            disabled={actionLoadingId !== null}
                                                            className="group/btn relative inline-flex items-center gap-2 pl-4 pr-2.5 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold active:scale-[0.98] transition-all shadow-soft-xs disabled:opacity-50"
                                                        >
                                                            <span>{MSG.GROUP.INVITATIONS.BTN_ACCEPT}</span>
                                                            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center transition-transform duration-200 group-hover/btn:scale-110">
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                                    <polyline points="20 6 9 17 4 12" />
                                                                </svg>
                                                            </div>
                                                        </button>
                                                    </>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleCancelSent(
                                                                item.groupId,
                                                                item.account?._id || item.account,
                                                            )
                                                        }
                                                        disabled={actionLoadingId !== null}
                                                        className="group/btn inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 text-xs font-semibold active:scale-[0.98] transition-all disabled:opacity-50"
                                                    >
                                                        <span>{MSG.GROUP.INVITATIONS.BTN_CANCEL}</span>
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 group-hover/btn:text-rose-600">
                                                            <line x1="18" y1="6" x2="6" y2="18" />
                                                            <line x1="6" y1="6" x2="18" y2="18" />
                                                        </svg>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Pagination Bar */}
                    {!loading && filteredInvitations.length > 0 && totalPages > 1 && (
                        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
                            <span className="font-medium">
                                {MSG.GROUP.INVITATIONS.ITEMS_INFO(
                                    (currentPage - 1) * pageSize + 1,
                                    Math.min(currentPage * pageSize, filteredInvitations.length),
                                    filteredInvitations.length,
                                )}
                            </span>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-semibold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-soft-xs active:scale-[0.98] transition"
                                >
                                    {MSG.GROUP.BTN_PREV}
                                </button>
                                <span className="font-mono px-3 py-1.5 rounded-xl bg-slate-100 font-semibold text-slate-700">
                                    {MSG.GROUP.INVITATIONS.PAGE_INFO(currentPage, totalPages)}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-semibold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-soft-xs active:scale-[0.98] transition"
                                >
                                    {MSG.GROUP.BTN_NEXT}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default React.memo(InvitationsTab);
