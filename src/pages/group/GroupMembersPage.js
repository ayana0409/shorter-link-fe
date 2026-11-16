import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate, useParams } from "react-router-dom";
import { get, post, remove } from "../../utils/request";
import PageWrapper from "../../components/PageWrapper";
import toast from "react-hot-toast";
import { getTokenPayload } from "../../constants/localStorage";
import { MSG } from "../../constants/messages";

/**
 * MembersList Component
 * Renders individual member cards with identity avatars, role switchers, and removal actions.
 */
const MembersList = React.memo(({
    members,
    memberRoleInputs,
    setMemberRoleInputs,
    isOwner,
    isAdmin,
    groupRole,
    userId,
    ownerId,
    actionLoading,
    handleUpdateMemberRole,
    handleRemoveMember,
    handleStartLeave,
}) => {
    return (
        <div className="space-y-3">
            {members.map((member) => {
                const account = member?.account || {};
                const accountId = account._id || account;
                const isOwnerMember = accountId === ownerId;
                const isCurrentUser = accountId === userId;
                const canRemove = isOwner || isAdmin || (groupRole === "manager" && member.role === "member");
                const displayName = account.username || account.fullname || (typeof account === "string" ? account : "Thành viên");
                const initials = (displayName.slice(0, 2) || "MB").toUpperCase();

                return (
                    <div
                        key={accountId}
                        className="p-4 sm:p-5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors duration-200"
                    >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            {/* Member Identity & Avatar */}
                            <div className="flex items-center gap-3.5 min-w-0">
                                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-slate-200 to-slate-100 text-slate-700 flex items-center justify-center font-bold text-sm tracking-wider shadow-inner shrink-0 ring-1 ring-slate-200/50">
                                    {initials}
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="font-bold text-slate-900 text-sm sm:text-base truncate">
                                            {account.username || account}
                                        </p>
                                        {isOwnerMember && (
                                            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-wider shrink-0">
                                                Trưởng nhóm
                                            </span>
                                        )}
                                        {isCurrentUser && (
                                            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wider shrink-0">
                                                Bạn
                                            </span>
                                        )}
                                    </div>
                                    {account.fullname && (
                                        <p className="text-xs text-slate-500 truncate mt-0.5">{account.fullname}</p>
                                    )}
                                    <p className="text-xs text-slate-400 mt-0.5 font-medium">
                                        {MSG.GROUP.ROLE_LABEL(member.role || "member")}
                                    </p>
                                </div>
                            </div>

                            {/* Member Role & Actions */}
                            <div className="flex items-center justify-end gap-2.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                                {(isOwner || isAdmin) && !isOwnerMember ? (
                                    <select
                                        value={memberRoleInputs[accountId] || member.role || "member"}
                                        onChange={(event) => {
                                            const newRole = event.target.value;
                                            setMemberRoleInputs((prev) => ({
                                                ...prev,
                                                [accountId]: newRole,
                                            }));
                                            handleUpdateMemberRole(accountId, newRole);
                                        }}
                                        disabled={actionLoading}
                                        className="h-10 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-soft-xs transition"
                                    >
                                        <option value="viewer">{MSG.GROUP.ROLE_VIEWER}</option>
                                        <option value="member">{MSG.GROUP.ROLE_MEMBER}</option>
                                        <option value="manager">{MSG.GROUP.ROLE_MANAGER}</option>
                                    </select>
                                ) : (
                                    <span className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-600 text-xs font-medium">
                                        {member.role === "manager"
                                            ? MSG.GROUP.ROLE_MANAGER
                                            : member.role === "viewer"
                                            ? MSG.GROUP.ROLE_VIEWER
                                            : MSG.GROUP.ROLE_MEMBER}
                                    </span>
                                )}

                                {canRemove && !isCurrentUser && (
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveMember(accountId)}
                                        disabled={actionLoading}
                                        title={MSG.GROUP.BTN_REMOVE_MEMBER}
                                        className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-all duration-200 disabled:opacity-50"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M3 6h18" />
                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                                            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                        </svg>
                                    </button>
                                )}

                                {isCurrentUser && !isOwner && handleStartLeave && (
                                    <button
                                        type="button"
                                        onClick={handleStartLeave}
                                        disabled={actionLoading}
                                        title={MSG.GROUP.BTN_LEAVE}
                                        className="min-h-[40px] px-3 flex items-center justify-center gap-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 transition-all duration-200 disabled:opacity-50 text-xs font-semibold"
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
                    </div>
                );
            })}
        </div>
    );
});

/**
 * GroupMembersPage Component
 * High-end minimalist agency redesign for group members management.
 */
const GroupMembersPage = () => {
    const { groupId } = useParams();
    const navigate = useNavigate();
    const [group, setGroup] = useState(null);
    const [members, setMembers] = useState([]);
    const [memberUserId, setMemberUserId] = useState("");
    const [memberRole, setMemberRole] = useState("member");
    const [memberRoleInputs, setMemberRoleInputs] = useState({});
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState("username");
    const [sortOrder, setSortOrder] = useState("asc");
    const [currentPage, setCurrentPage] = useState(1);
    const [maxMembersPerGroup, setMaxMembersPerGroup] = useState(null);
    const [totalPages, setTotalPages] = useState(1);
    const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

    const userId = useMemo(() => getTokenPayload()?._id, []);
    const isAdmin = useMemo(() => getTokenPayload()?.role === "admin", []);
    const pageSize = 5;

    const fetchGroup = async () => {
        if (!groupId) return;
        setLoading(true);
        try {
            const data = await get(`groups/${groupId}`);
            setGroup(data);
        } catch (error) {
            toast.error(MSG.GROUP.ERR_LOAD_DATA);
        } finally {
            setLoading(false);
        }
    };

    const refreshMembers = async (
        page = 1,
        search = searchQuery,
        sort = sortBy,
        order = sortOrder,
    ) => {
        if (!groupId) return;
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: pageSize.toString(),
                search,
                sortBy: sort,
                sortOrder: order,
            });
            const data = await get(`groups/${groupId}/members?${params}`);
            setMembers(data.members || []);
            setTotalPages(data.totalPages || 1);
            setMemberRoleInputs(
                (data.members || []).reduce(
                    (acc, member) => ({
                        ...acc,
                        [member.account?._id || member.account]: member.role || "member",
                    }),
                    {},
                ),
            );
        } catch (error) {
            toast.error(MSG.GROUP.ERR_LOAD_MEMBERS);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGroup();
        refreshMembers();
        get(`groups/${groupId}/limits`)
            .then((data) => setMaxMembersPerGroup(data.maxMembersPerGroup))
            .catch(() => null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [groupId]);

    // Handle ESC key and body scroll lock for leave confirmation modal
    useEffect(() => {
        if (!showLeaveConfirm) return;
        const handleKeyDown = (e) => {
            if (e.key === "Escape") setShowLeaveConfirm(false);
        };
        document.body.style.overflow = "hidden";
        window.addEventListener("keydown", handleKeyDown);
        return () => {
            document.body.style.overflow = "";
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [showLeaveConfirm]);

    const handleStartLeaveGroup = () => {
        setShowLeaveConfirm(true);
    };

    const handleConfirmLeaveGroup = async () => {
        if (!groupId) return;
        setActionLoading(true);
        try {
            const res = await post(`groups/${groupId}/leave`);
            toast.success(res?.message || MSG.GROUP.SUCCESS_LEAVE);
            setShowLeaveConfirm(false);
            navigate("/groups");
        } catch (error) {
            const message = error.response?.data?.error?.message || MSG.GROUP.ERR_LEAVE;
            toast.error(message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleAddGroupMember = async (e) => {
        if (e) e.preventDefault();
        if (!groupId) return;
        if (!memberUserId.trim()) {
            toast.error(MSG.GROUP.ERR_ADD_MEMBER_USERNAME);
            return;
        }

        setActionLoading(true);
        try {
            const response = await post(`groups/${groupId}/members`, {
                userId: memberUserId.trim(),
                role: memberRole,
            });
            await refreshMembers();
            setMemberUserId("");
            const successMsg = response?.message || MSG.GROUP.INVITATIONS?.SENT_SUCCESS || MSG.GROUP.SUCCESS_ADD_MEMBER;
            toast.success(successMsg);
        } catch (error) {
            toast.error(error.response?.data?.error?.message || MSG.GROUP.ERR_ADD_MEMBER);
        } finally {
            setActionLoading(false);
        }
    };

    const handleUpdateMemberRole = async (memberId, explicitRole) => {
        if (!groupId) return;
        const role = explicitRole || memberRoleInputs[memberId] || "member";
        setActionLoading(true);
        try {
            await post(`groups/${groupId}/members`, {
                userId: memberId,
                role,
            });
            await refreshMembers();
            toast.success(MSG.GROUP.SUCCESS_UPDATE_ROLE);
        } catch (error) {
            toast.error(error.response?.data?.error?.message || MSG.GROUP.ERR_UPDATE_ROLE);
        } finally {
            setActionLoading(false);
        }
    };

    const handleRemoveMember = async (memberId) => {
        if (!groupId) return;
        setActionLoading(true);
        try {
            await remove(`groups/${groupId}/members/${memberId}`);
            await refreshMembers();
            toast.success(MSG.GROUP.SUCCESS_REMOVE_MEMBER);
        } catch (error) {
            toast.error(MSG.GROUP.ERR_REMOVE_MEMBER);
        } finally {
            setActionLoading(false);
        }
    };

    const groupRole = useMemo(() => {
        if (!group || !userId) return null;

        if (group.owner?._id === userId || group.owner === userId) {
            return "owner";
        }

        if (isAdmin) {
            return "admin";
        }

        const member = group.members?.find((item) => {
            const accountId = item?.account?._id || item?.account;
            return accountId === userId;
        });

        return member?.role || null;
    }, [group, userId, isAdmin]);

    const canManageMembers = isAdmin || groupRole === "owner" || groupRole === "manager";
    const isOwner = groupRole === "owner";
    const ownerId = group?.owner?._id || group?.owner;

    if (groupRole === "viewer") {
        return (
            <PageWrapper
                title={MSG.GROUP.NO_ACCESS_TITLE}
                subtitle={MSG.GROUP.NO_ACCESS_SUBTITLE}
                actions={
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => navigate("/groups")}
                            className="px-4 py-2 rounded-2xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition"
                        >
                            {MSG.GROUP.BTN_GROUP_LIST}
                        </button>
                        <Link
                            to={`/groups/${groupId}/links`}
                            className="px-4 py-2 rounded-2xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition"
                        >
                            {MSG.GROUP.BTN_VIEW_LINKS}
                        </Link>
                    </div>
                }
            >
                <div className="double-bezel-outer p-2 rounded-[2rem] max-w-lg mx-auto bg-slate-100">
                    <div className="double-bezel-inner p-8 bg-white rounded-[calc(2rem-0.5rem)] text-center space-y-3">
                        <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                        </div>
                        <h3 className="font-bold text-slate-800 text-base">{MSG.GROUP.NO_ACCESS_TITLE}</h3>
                        <p className="text-sm text-slate-500 leading-relaxed">{MSG.GROUP.NO_ACCESS_DESC}</p>
                    </div>
                </div>
            </PageWrapper>
        );
    }

    return (
        <PageWrapper
            title={group ? MSG.GROUP.MEMBERS_PAGE_TITLE(group.name) : MSG.GROUP.MEMBERS_PAGE_TITLE_LOADING}
            subtitle={MSG.GROUP.MEMBERS_PAGE_SUBTITLE}
            actions={
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => navigate("/groups")}
                        className="px-4 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                    >
                        {MSG.GROUP.BTN_GROUP_LIST}
                    </button>
                    <Link
                        to={`/groups/${groupId}/links`}
                        className="px-4 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition shadow-soft-xs"
                    >
                        {MSG.GROUP.BTN_VIEW_LINKS}
                    </Link>
                    {!isOwner && group && (
                        <button
                            type="button"
                            onClick={handleStartLeaveGroup}
                            disabled={actionLoading}
                            className="px-4 py-2.5 rounded-full bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 text-xs font-semibold transition flex items-center gap-1.5"
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
            }
        >
            <div className="space-y-6 max-w-6xl mx-auto">
                {/* Group Summary Bento Banner */}
                {group && (
                    <div className="double-bezel-outer p-1.5 rounded-3xl bg-slate-200/50">
                        <div className="double-bezel-inner p-5 sm:p-6 bg-white rounded-[calc(1.5rem-0.375rem)] shadow-soft-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3.5">
                                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-base uppercase shrink-0">
                                    {group.name?.slice(0, 2) || "GP"}
                                </div>
                                <div>
                                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">{group.name}</h2>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        {MSG.GROUP.GROUP_INFO_MEMBERS(group.members?.length ?? 0)} · {MSG.GROUP.GROUP_INFO_LINKS(group.links?.length ?? 0)}
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto text-xs">
                                <span className="px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 font-medium">
                                    {MSG.GROUP.GROUP_OWNER_LABEL(group.owner?.username || group.owner)}
                                </span>
                                {maxMembersPerGroup !== null && (
                                    <span className="px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 font-medium font-mono">
                                        {MSG.GROUP.GROUP_INFO_LIMIT(group.members?.length ?? 0, maxMembersPerGroup)}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Add Member Omni-Box (if permitted) */}
                {canManageMembers && (
                    <div className="double-bezel-outer p-1.5 rounded-3xl bg-slate-200/50">
                        <form onSubmit={handleAddGroupMember} className="double-bezel-inner p-4 sm:p-5 bg-white rounded-[calc(1.5rem-0.375rem)] shadow-soft-sm space-y-3">
                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">{MSG.GROUP.ADD_MEMBER_TITLE}</h3>
                                <p className="text-xs text-slate-500 mt-0.5">{MSG.GROUP.ADD_MEMBER_DESC}</p>
                            </div>
                            <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
                                <div className="flex-1 flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-slate-900 focus-within:border-blue-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 transition">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 mr-2.5 shrink-0">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                        <circle cx="12" cy="7" r="4" />
                                    </svg>
                                    <input
                                        type="text"
                                        value={memberUserId}
                                        onChange={(event) => setMemberUserId(event.target.value)}
                                        placeholder={MSG.GROUP.ADD_MEMBER_PLACEHOLDER}
                                        className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 outline-none"
                                    />
                                </div>
                                <select
                                    value={memberRole}
                                    onChange={(event) => setMemberRole(event.target.value)}
                                    disabled={!isOwner}
                                    className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition shrink-0"
                                >
                                    <option value="viewer">Viewer</option>
                                    <option value="member">Member</option>
                                    <option value="manager">Manager</option>
                                </select>
                                <button
                                    type="submit"
                                    disabled={actionLoading || !memberUserId.trim()}
                                    className="h-11 px-5 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-xs font-semibold transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed shadow-soft-xs shrink-0 flex items-center justify-center gap-1.5"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="12" y1="5" x2="12" y2="19" />
                                        <line x1="5" y1="12" x2="19" y2="12" />
                                    </svg>
                                    <span>{MSG.GROUP.BTN_ADD_MEMBER}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Members List Container */}
                <div className="double-bezel-outer p-1.5 rounded-[2rem] bg-slate-200/50">
                    <div className="double-bezel-inner p-5 sm:p-7 bg-white rounded-[calc(2rem-0.375rem)] shadow-soft-md space-y-6">
                        {/* Section Header & Search / Sort Filter Bar */}
                        <div className="space-y-4 pb-5 border-b border-slate-100">
                            <div>
                                <h3 className="text-xl font-bold tracking-tight text-slate-900">{MSG.GROUP.MEMBERS_LIST_TITLE}</h3>
                                <p className="text-sm text-slate-500 mt-0.5">{MSG.GROUP.MEMBERS_LIST_DESC}</p>
                            </div>

                            {/* Floating Filter Bar */}
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                                <div className="flex-1 flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-slate-900 focus-within:border-blue-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 transition">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 mr-2.5 shrink-0">
                                        <circle cx="11" cy="11" r="8" />
                                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                    </svg>
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(event) => {
                                            const nextSearch = event.target.value;
                                            setSearchQuery(nextSearch);
                                            setCurrentPage(1);
                                            refreshMembers(1, nextSearch, sortBy, sortOrder);
                                        }}
                                        placeholder={MSG.GROUP.SEARCH_PLACEHOLDER}
                                        className="w-full bg-transparent text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <select
                                        value={sortBy}
                                        onChange={(event) => {
                                            const nextSortBy = event.target.value;
                                            setSortBy(nextSortBy);
                                            setCurrentPage(1);
                                            refreshMembers(1, searchQuery, nextSortBy, sortOrder);
                                        }}
                                        className="h-10 flex-1 sm:flex-none rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 outline-none transition"
                                    >
                                        <option value="username">{MSG.GROUP.SORT_USERNAME}</option>
                                        <option value="role">{MSG.GROUP.SORT_ROLE}</option>
                                    </select>
                                    <select
                                        value={sortOrder}
                                        onChange={(event) => {
                                            const nextSortOrder = event.target.value;
                                            setSortOrder(nextSortOrder);
                                            setCurrentPage(1);
                                            refreshMembers(1, searchQuery, sortBy, nextSortOrder);
                                        }}
                                        className="h-10 flex-1 sm:flex-none rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 outline-none transition"
                                    >
                                        <option value="asc">{MSG.GROUP.SORT_ASC}</option>
                                        <option value="desc">{MSG.GROUP.SORT_DESC}</option>
                                    </select>
                                    <button
                                        type="button"
                                        onClick={() => refreshMembers(currentPage)}
                                        title={MSG.GROUP.BTN_REFRESH}
                                        className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition shrink-0"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Loading State */}
                        {loading && (
                            <div className="py-12 text-center text-slate-400 space-y-2">
                                <div className="w-7 h-7 mx-auto border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                <p className="text-xs font-medium">{MSG.GROUP.LOADING}</p>
                            </div>
                        )}

                        {/* Empty / Not Found */}
                        {!loading && members.length === 0 && (
                            <div className="py-12 text-center text-slate-400 text-xs">
                                {MSG.GROUP.NOT_FOUND}
                            </div>
                        )}

                        {/* Members List Items */}
                        {!loading && members.length > 0 && (
                            <MembersList
                                members={members}
                                memberRoleInputs={memberRoleInputs}
                                setMemberRoleInputs={setMemberRoleInputs}
                                isOwner={isOwner}
                                isAdmin={isAdmin}
                                groupRole={groupRole}
                                userId={userId}
                                ownerId={ownerId}
                                actionLoading={actionLoading}
                                handleUpdateMemberRole={handleUpdateMemberRole}
                                handleRemoveMember={handleRemoveMember}
                                handleStartLeave={handleStartLeaveGroup}
                            />
                        )}

                        {/* Pagination Segmented Controller */}
                        {totalPages > 1 && (
                            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                                <button
                                    type="button"
                                    onClick={() => {
                                        const prevPage = currentPage - 1;
                                        setCurrentPage(prevPage);
                                        refreshMembers(prevPage);
                                    }}
                                    disabled={currentPage === 1}
                                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    {MSG.GROUP.BTN_PREV}
                                </button>
                                <span className="font-mono text-slate-500">
                                    {MSG.GROUP.PAGE_INFO(currentPage, totalPages)}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const nextPage = currentPage + 1;
                                        setCurrentPage(nextPage);
                                        refreshMembers(nextPage);
                                    }}
                                    disabled={currentPage === totalPages}
                                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    {MSG.GROUP.BTN_NEXT}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Double-Bezel Leave Group Confirmation Modal */}
            {showLeaveConfirm && group && typeof document !== 'undefined' && createPortal(
                <div
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setShowLeaveConfirm(false);
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
                                        {group.name}
                                    </p>
                                </div>
                            </div>

                            <p className="text-sm text-slate-600 leading-relaxed">
                                {MSG.GROUP.LEAVE_CONFIRM_DESC(group.name)}
                            </p>

                            <div className="flex items-center justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowLeaveConfirm(false)}
                                    disabled={actionLoading}
                                    className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                                >
                                    {MSG.GROUP.BTN_CANCEL}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleConfirmLeaveGroup}
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

export default GroupMembersPage;
