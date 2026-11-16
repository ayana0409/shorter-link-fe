import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useSearchParams } from "react-router-dom";
import { get, post, put, remove } from "../../utils/request";
import PageWrapper from "../../components/PageWrapper";
import toast from "react-hot-toast";
import { getTokenPayload } from "../../constants/localStorage";
import { MSG } from "../../constants/messages";
import InvitationsTab from "./components/InvitationsTab";

/**
 * GroupsPage Component
 * High-end minimalist agency redesign for group collaboration management.
 * Features dual-mode presentation (Desktop Table + Mobile Bento Cards) to eliminate horizontal scrolling.
 */
const GroupsPage = () => {
    const [groups, setGroups] = useState([]);
    const [groupName, setGroupName] = useState("");
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [renameGroupId, setRenameGroupId] = useState(null);
    const [renameGroupName, setRenameGroupName] = useState("");
    const [renameLoading, setRenameLoading] = useState(false);
    const [deleteGroupId, setDeleteGroupId] = useState(null);
    const [deleteGroupName, setDeleteGroupName] = useState("");
    const [deletePassword, setDeletePassword] = useState("");
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [leaveGroupTarget, setLeaveGroupTarget] = useState(null);
    const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
    const [limits, setLimits] = useState({ maxGroupsCount: null });
    const [searchParams, setSearchParams] = useSearchParams();
    const initialTab = searchParams.get("tab") === "invitations" ? "invitations" : "groups";
    const [activeTab, setActiveTab] = useState(initialTab); // "groups" | "invitations"
    const [pendingInvitationsCount, setPendingInvitationsCount] = useState(0);
    const navigate = useNavigate();

    // Sync tab state with query param
    useEffect(() => {
        const tab = searchParams.get("tab");
        if (tab === "invitations" || tab === "groups") {
            setActiveTab(tab);
        }
    }, [searchParams]);

    const handleTabChange = (newTab) => {
        setActiveTab(newTab);
        setSearchParams(newTab === "groups" ? {} : { tab: newTab });
    };
    const userId = useMemo(() => getTokenPayload()?._id, []);

    const fetchGroups = async () => {
        setLoading(true);
        try {
            const data = await get("groups");
            setGroups(Array.isArray(data) ? data : []);
        } catch (error) {
            toast.error(MSG.GROUP.ERR_LOAD_LIST);
        } finally {
            setLoading(false);
        }
    };

    const fetchPendingInvitationsCount = async () => {
        try {
            const data = await get("groups/invitations/me");
            if (Array.isArray(data)) {
                setPendingInvitationsCount(data.length);
            }
        } catch {
            // Ignore background fetch error
        }
    };

    useEffect(() => {
        fetchGroups();
        fetchPendingInvitationsCount();
        get("account/limits")
            .then((data) => setLimits(data))
            .catch(() => null);
    }, []);

    // Handle ESC key and body scroll lock for confirmation modals
    useEffect(() => {
        if (!showDeleteConfirm && !showLeaveConfirm) return;
        const handleKeyDown = (e) => {
            if (e.key === "Escape") {
                if (showDeleteConfirm) handleCancelDelete();
                if (showLeaveConfirm) handleCancelLeave();
            }
        };
        document.body.style.overflow = "hidden";
        window.addEventListener("keydown", handleKeyDown);
        return () => {
            document.body.style.overflow = "";
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [showDeleteConfirm, showLeaveConfirm]);

    const handleCreateGroup = async (e) => {
        if (e) e.preventDefault();
        if (!groupName.trim()) {
            toast.error(MSG.GROUP.ERR_EMPTY_NAME);
            return;
        }

        setActionLoading(true);
        try {
            const newGroup = await post("groups", { name: groupName.trim() });
            setGroups((prev) => [newGroup, ...prev]);
            setGroupName("");
            toast.success(MSG.GROUP.SUCCESS_CREATE);
        } catch (error) {
            const message = error.response?.data?.error?.message || MSG.GROUP.ERR_CREATE;
            toast.error(message);
        } finally {
            setActionLoading(false);
        }
    };

    const isGroupCreator = (group) => group?.owner?._id === userId || group?.owner === userId;

    const formatDate = (value) => {
        if (!value) return "—";
        return new Date(value).toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    };

    const handleStartRename = (group) => {
        setRenameGroupId(group._id);
        setRenameGroupName(group.name || "");
    };

    const handleCancelRename = () => {
        setRenameGroupId(null);
        setRenameGroupName("");
    };

    const handleSaveRename = async (groupId) => {
        if (!renameGroupName.trim()) {
            toast.error(MSG.GROUP.ERR_RENAME_EMPTY);
            return;
        }
        setRenameLoading(true);
        try {
            const updatedGroup = await put(`groups/${groupId}`, { name: renameGroupName.trim() });
            setGroups((prev) => prev.map((group) => (group._id === groupId ? updatedGroup : group)));
            toast.success(MSG.GROUP.SUCCESS_RENAME);
            handleCancelRename();
        } catch (error) {
            toast.error(MSG.GROUP.ERR_RENAME);
        } finally {
            setRenameLoading(false);
        }
    };

    const handleStartDelete = (group) => {
        setDeleteGroupId(group._id);
        setDeleteGroupName(group.name || "");
        setDeletePassword("");
        setShowDeleteConfirm(true);
    };

    const handleCancelDelete = () => {
        setDeleteGroupId(null);
        setDeleteGroupName("");
        setDeletePassword("");
        setShowDeleteConfirm(false);
    };

    const handleConfirmDelete = async () => {
        if (!deletePassword.trim()) {
            toast.error(MSG.GROUP.ERR_DELETE_PASSWORD);
            return;
        }
        setActionLoading(true);
        try {
            await remove(`groups/${deleteGroupId}`, { data: { password: deletePassword.trim() } });
            setGroups((prev) => prev.filter((group) => group._id !== deleteGroupId));
            toast.success(MSG.GROUP.SUCCESS_DELETE);
            handleCancelDelete();
        } catch (error) {
            toast.error(MSG.GROUP.ERR_DELETE);
        } finally {
            setActionLoading(false);
        }
    };

    const handleStartLeave = (group) => {
        setLeaveGroupTarget(group);
        setShowLeaveConfirm(true);
    };

    const handleCancelLeave = () => {
        setLeaveGroupTarget(null);
        setShowLeaveConfirm(false);
    };

    const handleConfirmLeave = async () => {
        if (!leaveGroupTarget) return;
        setActionLoading(true);
        try {
            const res = await post(`groups/${leaveGroupTarget._id}/leave`);
            setGroups((prev) => prev.filter((group) => group._id !== leaveGroupTarget._id));
            toast.success(res?.message || MSG.GROUP.SUCCESS_LEAVE);
            handleCancelLeave();
        } catch (error) {
            const message = error.response?.data?.error?.message || MSG.GROUP.ERR_LEAVE;
            toast.error(message);
        } finally {
            setActionLoading(false);
        }
    };

    const isLimitReached = limits.maxGroupsCount !== null && groups.length >= limits.maxGroupsCount;

    return (
        <PageWrapper
            title={MSG.GROUP.PAGE_TITLE}
            subtitle={MSG.GROUP.PAGE_SUBTITLE}
        >
            <div className="space-y-6 max-w-6xl mx-auto">
                {/* Dual-Stream Segmented Tab Switcher */}
                <div className="flex items-center justify-between pb-1">
                    <div className="double-bezel-outer p-1 rounded-2xl bg-slate-200/60 inline-flex shadow-soft-xs">
                        <div className="double-bezel-inner flex items-center p-0.5 rounded-[calc(1rem-0.125rem)] bg-white/80 backdrop-blur-sm">
                            <button
                                type="button"
                                onClick={() => handleTabChange("groups")}
                                className={`relative px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 flex items-center gap-2 ${
                                    activeTab === "groups"
                                        ? "bg-slate-900 text-white shadow-soft-sm"
                                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/60"
                                }`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                    <circle cx="9" cy="7" r="4" />
                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                </svg>
                                <span>{MSG.GROUP.INVITATIONS.TAB_GROUPS}</span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                                    activeTab === "groups" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
                                }`}>
                                    {groups.length}
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleTabChange("invitations")}
                                className={`relative px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 flex items-center gap-2 ${
                                    activeTab === "invitations"
                                        ? "bg-slate-900 text-white shadow-soft-sm"
                                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/60"
                                }`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3zm-8.27 4a2 2 0 0 1-3.46 0" />
                                </svg>
                                <span>{MSG.GROUP.INVITATIONS.TAB_INVITATIONS}</span>
                                {pendingInvitationsCount > 0 && (
                                    <span className="relative flex h-5 items-center justify-center rounded-full bg-emerald-500 px-2 text-[10px] font-bold text-white shadow-sm">
                                        <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                                            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                                        </span>
                                        {pendingInvitationsCount}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {activeTab === "invitations" ? (
                    <InvitationsTab
                        onInvitationAccepted={fetchGroups}
                        onPendingCountChange={setPendingInvitationsCount}
                    />
                ) : (
                    <>
                        {/* Top Section: Quota Limit Warning & Creation Omni-Box */}
                        <div className="space-y-4">
                    {limits.maxGroupsCount !== null && (
                        <div
                            className={`double-bezel-outer p-1 rounded-3xl transition-all duration-300 ${
                                isLimitReached
                                    ? "bg-amber-500/10 ring-1 ring-amber-500/20"
                                    : "bg-blue-500/5 ring-1 ring-blue-500/10"
                            }`}
                        >
                            <div className="double-bezel-inner px-5 py-3.5 bg-white/90 backdrop-blur-md rounded-[calc(1.5rem-0.25rem)] flex flex-wrap items-center justify-between gap-3 text-sm">
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                                            isLimitReached
                                                ? "bg-amber-100 text-amber-700"
                                                : "bg-blue-50 text-blue-600"
                                        }`}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <span className="font-semibold text-slate-800">{MSG.GROUP.LIMIT_LABEL}</span>
                                        <span className="text-slate-500 ml-2 font-mono text-xs">
                                            ({MSG.GROUP.LIMIT_COUNT(groups.length, limits.maxGroupsCount)})
                                        </span>
                                    </div>
                                </div>
                                {isLimitReached && (
                                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-amber-100 text-amber-800">
                                        {MSG.GROUP.LIMIT_WARNING}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Omni-Box Create Group */}
                    <form onSubmit={handleCreateGroup} className="double-bezel-outer p-1.5 rounded-3xl bg-slate-200/50">
                        <div className="double-bezel-inner p-2 sm:p-2.5 bg-white rounded-[calc(1.5rem-0.375rem)] shadow-soft-sm flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                            <div className="flex-1 flex items-center px-4 py-2 text-slate-900">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 mr-3 shrink-0">
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                    <circle cx="9" cy="7" r="4" />
                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                </svg>
                                <input
                                    type="text"
                                    value={groupName}
                                    onChange={(event) => setGroupName(event.target.value)}
                                    placeholder={MSG.GROUP.LABEL_NEW_GROUP}
                                    disabled={actionLoading || isLimitReached}
                                    className="w-full bg-transparent text-sm sm:text-base text-slate-900 placeholder:text-slate-400 outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={actionLoading || isLimitReached || !groupName.trim()}
                                className="group relative inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl sm:rounded-full bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-sm font-semibold transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed shadow-soft-xs"
                            >
                                <span>{isLimitReached ? MSG.GROUP.BTN_CREATE_LIMIT_REACHED : MSG.GROUP.BTN_CREATE}</span>
                                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="12" y1="5" x2="12" y2="19" />
                                        <line x1="5" y1="12" x2="19" y2="12" />
                                    </svg>
                                </div>
                            </button>
                        </div>
                    </form>
                </div>

                {/* Groups Directory Container */}
                <div className="double-bezel-outer p-1.5 rounded-[2rem] bg-slate-200/50">
                    <div className="double-bezel-inner p-5 sm:p-7 bg-white rounded-[calc(2rem-0.375rem)] shadow-soft-md space-y-6">
                        {/* Section Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-5 border-b border-slate-100">
                            <div>
                                <h2 className="text-xl font-bold tracking-tight text-slate-900">{MSG.GROUP.LIST_TITLE}</h2>
                                <p className="text-sm text-slate-500 mt-0.5">{MSG.GROUP.LIST_DESC}</p>
                            </div>
                            <span className="font-mono text-xs px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 font-medium self-start sm:self-auto">
                                {groups.length} nhóm
                            </span>
                        </div>

                        {/* Loading State */}
                        {loading && (
                            <div className="py-16 text-center text-slate-400 space-y-3">
                                <div className="w-8 h-8 mx-auto border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                <p className="text-sm font-medium">{MSG.COMMON?.LOADING || "Đang tải dữ liệu..."}</p>
                            </div>
                        )}

                        {/* Empty State */}
                        {!loading && groups.length === 0 && (
                            <div className="py-16 text-center space-y-4">
                                <div className="w-16 h-16 mx-auto rounded-3xl bg-slate-50 flex items-center justify-center text-slate-400 ring-1 ring-slate-100">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                        <circle cx="9" cy="7" r="4" />
                                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-800 text-base">{MSG.GROUP.NO_GROUPS}</h3>
                                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                                        Hãy tạo nhóm làm việc đầu tiên để chia sẻ và quản trị liên kết cùng đồng nghiệp.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Desktop View: Studio Data Table (hidden on mobile) */}
                        {!loading && groups.length > 0 && (
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-left text-sm text-slate-600">
                                    <thead>
                                        <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wider text-slate-400">
                                            <th className="pb-3.5 pl-2">{MSG.GROUP.COL_NAME}</th>
                                            <th className="pb-3.5 px-3 text-center">{MSG.GROUP.COL_MEMBERS}</th>
                                            <th className="pb-3.5 px-3 text-center">{MSG.GROUP.COL_LINKS}</th>
                                            <th className="pb-3.5 px-3">{MSG.GROUP.COL_OWNER}</th>
                                            <th className="pb-3.5 px-3 font-mono">{MSG.GROUP.COL_DATE}</th>
                                            <th className="pb-3.5 pr-2 text-right">{MSG.GROUP.COL_ACTION}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {groups.map((group) => {
                                            const creator = group.owner?.username || group.owner || "—";
                                            const creatorIsMe = isGroupCreator(group);
                                            const isRenaming = renameGroupId === group._id;

                                            return (
                                                <tr key={group._id} className="group hover:bg-slate-50/70 transition-colors duration-150">
                                                    {/* Group Name Column */}
                                                    <td className="py-4 pl-2 font-medium text-slate-900 max-w-xs">
                                                        {isRenaming ? (
                                                            <div className="flex items-center gap-2">
                                                                <input
                                                                    type="text"
                                                                    value={renameGroupName}
                                                                    onChange={(e) => setRenameGroupName(e.target.value)}
                                                                    className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                                                    autoFocus
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleSaveRename(group._id)}
                                                                    disabled={renameLoading}
                                                                    className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition"
                                                                >
                                                                    {MSG.GROUP.BTN_SAVE}
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={handleCancelRename}
                                                                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium transition"
                                                                >
                                                                    {MSG.GROUP.BTN_CANCEL}
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-2.5">
                                                                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                                                                    {group.name?.slice(0, 2) || "GP"}
                                                                </div>
                                                                <span className="font-semibold text-slate-900 truncate" title={group.name}>
                                                                    {group.name}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </td>

                                                    {/* Members Count */}
                                                    <td className="py-4 px-3 text-center">
                                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-mono text-xs font-semibold">
                                                            {group.members?.length ?? 0}
                                                        </span>
                                                    </td>

                                                    {/* Links Count */}
                                                    <td className="py-4 px-3 text-center">
                                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-mono text-xs font-semibold">
                                                            {group.links?.length ?? 0}
                                                        </span>
                                                    </td>

                                                    {/* Owner */}
                                                    <td className="py-4 px-3 text-slate-700">
                                                        <span className="truncate max-w-[120px] inline-block font-medium">
                                                            {creator}
                                                        </span>
                                                        {creatorIsMe && (
                                                            <span className="ml-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold">
                                                                Tôi
                                                            </span>
                                                        )}
                                                    </td>

                                                    {/* Creation Date */}
                                                    <td className="py-4 px-3 font-mono text-xs text-slate-500">
                                                        {formatDate(group.createdAt)}
                                                    </td>

                                                    {/* Action Buttons */}
                                                    <td className="py-4 pr-2 text-right">
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            <button
                                                                type="button"
                                                                onClick={() => navigate(`/groups/${group._id}/members`)}
                                                                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition"
                                                            >
                                                                {MSG.GROUP.BTN_MEMBERS}
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => navigate(`/groups/${group._id}/links`)}
                                                                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition"
                                                            >
                                                                {MSG.GROUP.BTN_LINKS}
                                                            </button>
                                                            {creatorIsMe && !isRenaming && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleStartRename(group)}
                                                                    title={MSG.GROUP.BTN_RENAME}
                                                                    className="p-2 rounded-xl text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition"
                                                                >
                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                        <path d="M12 20h9" />
                                                                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                                                                    </svg>
                                                                </button>
                                                            )}
                                                            {creatorIsMe && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleStartDelete(group)}
                                                                    title={MSG.GROUP.BTN_DELETE}
                                                                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                                                                >
                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                        <path d="M3 6h18" />
                                                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                                                                        <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                                    </svg>
                                                                </button>
                                                            )}
                                                            {!creatorIsMe && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleStartLeave(group)}
                                                                    title={MSG.GROUP.BTN_LEAVE}
                                                                    className="p-2 rounded-xl text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition"
                                                                >
                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                                                        <polyline points="16 17 21 12 16 7" />
                                                                        <line x1="21" y1="12" x2="9" y2="12" />
                                                                    </svg>
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Mobile Cards View: Bento Cards Stack (Zero Horizontal Scroll on mobile) */}
                        {!loading && groups.length > 0 && (
                            <div className="block md:hidden space-y-3.5">
                                {groups.map((group) => {
                                    const creator = group.owner?.username || group.owner || "—";
                                    const creatorIsMe = isGroupCreator(group);
                                    const isRenaming = renameGroupId === group._id;

                                    return (
                                        <div
                                            key={group._id}
                                            className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition space-y-3.5"
                                        >
                                            {/* Header */}
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="w-10 h-10 rounded-2xl bg-blue-100/70 text-blue-700 flex items-center justify-center font-bold text-sm uppercase shrink-0">
                                                        {group.name?.slice(0, 2) || "GP"}
                                                    </div>
                                                    <div className="min-w-0">
                                                        {isRenaming ? (
                                                            <div className="flex flex-col gap-2 pt-1">
                                                                <input
                                                                    type="text"
                                                                    value={renameGroupName}
                                                                    onChange={(e) => setRenameGroupName(e.target.value)}
                                                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-blue-500"
                                                                />
                                                                <div className="flex gap-2">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleSaveRename(group._id)}
                                                                        disabled={renameLoading}
                                                                        className="px-3 py-1.5 rounded-xl bg-amber-600 text-white text-xs font-semibold"
                                                                    >
                                                                        {MSG.GROUP.BTN_SAVE}
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={handleCancelRename}
                                                                        className="px-3 py-1.5 rounded-xl bg-slate-200 text-slate-700 text-xs font-medium"
                                                                    >
                                                                        {MSG.GROUP.BTN_CANCEL}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div>
                                                                <h3 className="font-bold text-slate-900 text-base truncate">
                                                                    {group.name}
                                                                </h3>
                                                                <p className="text-xs text-slate-500 mt-0.5 truncate">
                                                                    Tạo bởi: <span className="font-medium text-slate-700">{creator}</span>
                                                                    {creatorIsMe && " (Bạn)"}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <span className="font-mono text-[11px] px-2.5 py-1 rounded-full bg-white border border-slate-100 text-slate-500 shrink-0">
                                                    {formatDate(group.createdAt)}
                                                </span>
                                            </div>

                                            {/* Metrics Pill Grid */}
                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                                <div className="p-2.5 rounded-xl bg-white border border-slate-100 flex items-center justify-between">
                                                    <span className="text-slate-500 font-medium">{MSG.GROUP.COL_MEMBERS}</span>
                                                    <span className="font-bold font-mono text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                                                        {group.members?.length ?? 0}
                                                    </span>
                                                </div>
                                                <div className="p-2.5 rounded-xl bg-white border border-slate-100 flex items-center justify-between">
                                                    <span className="text-slate-500 font-medium">{MSG.GROUP.COL_LINKS}</span>
                                                    <span className="font-bold font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                                                        {group.links?.length ?? 0}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Action Buttons Matrix */}
                                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60">
                                                <button
                                                    type="button"
                                                    onClick={() => navigate(`/groups/${group._id}/members`)}
                                                    className="min-h-[44px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                                        <circle cx="9" cy="7" r="4" />
                                                    </svg>
                                                    <span>{MSG.GROUP.BTN_MEMBERS}</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => navigate(`/groups/${group._id}/links`)}
                                                    className="min-h-[44px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                                                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                                                    </svg>
                                                    <span>{MSG.GROUP.BTN_LINKS}</span>
                                                </button>
                                                {creatorIsMe && !isRenaming && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleStartRename(group)}
                                                        className="min-h-[44px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-50 transition"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M12 20h9" />
                                                            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                                                        </svg>
                                                        <span>{MSG.GROUP.BTN_RENAME}</span>
                                                    </button>
                                                )}
                                                {creatorIsMe ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleStartDelete(group)}
                                                        className="min-h-[44px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-medium hover:bg-rose-100 transition"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M3 6h18" />
                                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                                                        </svg>
                                                        <span>{MSG.GROUP.BTN_DELETE}</span>
                                                    </button>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleStartLeave(group)}
                                                        className="min-h-[44px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium hover:bg-amber-100 transition"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                                            <polyline points="16 17 21 12 16 7" />
                                                            <line x1="21" y1="12" x2="9" y2="12" />
                                                        </svg>
                                                        <span>{MSG.GROUP.BTN_LEAVE}</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </>
        )}
    </div>

            {/* High-End Double-Bezel Modal: Delete Group Confirmation */}
            {showDeleteConfirm && typeof document !== 'undefined' && createPortal(
                <div
                    onClick={(e) => {
                        if (e.target === e.currentTarget) handleCancelDelete();
                    }}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xl animate-fade-in"
                >
                    <div className="double-bezel-outer p-2 rounded-[2rem] w-full max-w-md bg-white/10 ring-1 ring-white/20 shadow-2xl">
                        <div className="double-bezel-inner p-6 sm:p-7 bg-white rounded-[calc(2rem-0.5rem)] space-y-5 text-left">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M3 6h18" />
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                                        <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                        <line x1="10" y1="11" x2="10" y2="17" />
                                        <line x1="14" y1="11" x2="14" y2="17" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">{MSG.GROUP.DELETE_CONFIRM_TITLE}</h3>
                                    <p className="text-xs text-slate-500 mt-0.5">Thao tác này không thể hoàn tác</p>
                                </div>
                            </div>

                            <p className="text-sm text-slate-600 leading-relaxed">
                                {MSG.GROUP.DELETE_CONFIRM_DESC(deleteGroupName)}
                            </p>

                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        Mật khẩu xác nhận
                                    </label>
                                    <input
                                        type="password"
                                        value={deletePassword}
                                        onChange={(event) => setDeletePassword(event.target.value)}
                                        placeholder={MSG.GROUP.DELETE_PASSWORD_PLACEHOLDER}
                                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-rose-500 focus:bg-white focus:ring-2 focus:ring-rose-100 transition"
                                        autoFocus
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={handleCancelDelete}
                                        className="min-h-[44px] rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition"
                                    >
                                        {MSG.GROUP.BTN_CANCEL}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleConfirmDelete}
                                        disabled={actionLoading || !deletePassword.trim()}
                                        className="min-h-[44px] rounded-2xl bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white text-sm font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed shadow-soft-xs"
                                    >
                                        {actionLoading ? "Đang xóa..." : MSG.GROUP.BTN_CONFIRM_DELETE}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* High-End Double-Bezel Modal: Leave Group Confirmation */}
            {showLeaveConfirm && leaveGroupTarget && typeof document !== 'undefined' && createPortal(
                <div
                    onClick={(e) => {
                        if (e.target === e.currentTarget) handleCancelLeave();
                    }}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xl animate-fade-in"
                >
                    <div className="double-bezel-outer p-2 rounded-[2rem] w-full max-w-md bg-white/10 ring-1 ring-white/20 shadow-2xl">
                        <div className="double-bezel-inner p-6 sm:p-7 bg-white rounded-[calc(2rem-0.5rem)] space-y-5 text-left">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                        <polyline points="16 17 21 12 16 7" />
                                        <line x1="21" y1="12" x2="9" y2="12" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                                        {MSG.GROUP.LEAVE_CONFIRM_TITLE}
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-0.5 font-medium">
                                        {leaveGroupTarget.name}
                                    </p>
                                </div>
                            </div>

                            <p className="text-sm text-slate-600 leading-relaxed">
                                {MSG.GROUP.LEAVE_CONFIRM_DESC(leaveGroupTarget.name)}
                            </p>

                            <div className="flex items-center justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={handleCancelLeave}
                                    disabled={actionLoading}
                                    className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                                >
                                    {MSG.GROUP.BTN_CANCEL}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleConfirmLeave}
                                    disabled={actionLoading}
                                    className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-soft-xs active:scale-[0.98] transition disabled:opacity-50 flex items-center gap-1.5"
                                >
                                    {actionLoading ? (
                                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                            <polyline points="16 17 21 12 16 7" />
                                            <line x1="21" y1="12" x2="9" y2="12" />
                                        </svg>
                                    )}
                                    <span>{MSG.GROUP.BTN_CONFIRM_LEAVE}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </PageWrapper>
    );
};

export default GroupsPage;
