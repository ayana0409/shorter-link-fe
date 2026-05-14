import React from "react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { get, post, remove } from "../../utils/request";
import PageWrapper from "../../components/PageWrapper";
import toast from "react-hot-toast";
import { getTokenPayload } from "../../constants/localStorage";
import { MSG } from "../../constants/messages";

const MembersList = React.memo(({ members, memberRoleInputs, setMemberRoleInputs, isOwner, isAdmin, groupRole, userId, ownerId, actionLoading, handleUpdateMemberRole, handleRemoveMember }) => {
    return (
        <div className="space-y-3">
            {members.map((member) => {
                const account = member?.account || {};
                const accountId = account._id || account;
                const isOwnerMember = accountId === ownerId;
                const isCurrentUser = accountId === userId;
                const canRemove = isOwner || isAdmin || (groupRole === "manager" && member.role === "member");
                return (
                    <div key={accountId} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
                            <div>
                                <p className="font-semibold text-slate-900">{account.username || account}</p>
                                {account.fullname && <p className="text-sm text-slate-600">{account.fullname}</p>}
                                <p className="mt-1 text-sm text-slate-500">{MSG.GROUP.ROLE_LABEL(member.role || "member")}</p>
                            </div>
                            <div className="flex flex-col gap-2 sm:items-end">
                                {(isOwner || isAdmin) && !isOwnerMember && (
                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                        <select
                                            value={memberRoleInputs[accountId] || member.role || "member"}
                                            onChange={(event) => {
                                                setMemberRoleInputs((prev) => ({
                                                    ...prev,
                                                    [accountId]: event.target.value,
                                                }))
                                                handleUpdateMemberRole(accountId)
                                            }
                                            }
                                            className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 outline-none"
                                        >
                                            <option value="viewer">{MSG.GROUP.ROLE_VIEWER}</option>
                                            <option value="member">{MSG.GROUP.ROLE_MEMBER}</option>
                                            <option value="manager">{MSG.GROUP.ROLE_MANAGER}</option>
                                        </select>
                                    </div>
                                )}
                                {canRemove && !isCurrentUser && (
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveMember(accountId)}
                                        disabled={actionLoading}
                                        placeholder={MSG.GROUP.BTN_REMOVE_MEMBER}
                                        className="rounded-3xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
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

    const handleAddGroupMember = async () => {
        if (!groupId) return;
        if (!memberUserId.trim()) {
            toast.error(MSG.GROUP.ERR_ADD_MEMBER_USERNAME);
            return;
        }

        setActionLoading(true);
        try {
            await post(`groups/${groupId}/members`, {
                userId: memberUserId.trim(),
                role: memberRole,
            });
            await refreshMembers();
            setMemberUserId("");
            toast.success(MSG.GROUP.SUCCESS_ADD_MEMBER);
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.error?.message || MSG.GROUP.ERR_ADD_MEMBER);
        } finally {
            setActionLoading(false);
        }
    };

    const handleUpdateMemberRole = async (memberId) => {
        if (!groupId) return;
        const role = memberRoleInputs[memberId] || "member";
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

    return groupRole === "viewer" ? (
        <PageWrapper
            title={MSG.GROUP.NO_ACCESS_TITLE}
            subtitle={MSG.GROUP.NO_ACCESS_SUBTITLE}
            actions={
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <button
                        type="button"
                        onClick={() => navigate("/groups")}
                        className="rounded-3xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                        {MSG.GROUP.BTN_GROUP_LIST}
                    </button>
                    <Link
                        to={`/groups/${groupId}/links`}
                        className="inline-flex items-center justify-center rounded-3xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                    >
                        {MSG.GROUP.BTN_VIEW_LINKS}
                    </Link>
                </div>
            }
        >
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
                {MSG.GROUP.NO_ACCESS_DESC}
            </div>
        </PageWrapper>
    ) : (
        <PageWrapper
            title={group ? MSG.GROUP.MEMBERS_PAGE_TITLE(group.name) : MSG.GROUP.MEMBERS_PAGE_TITLE_LOADING}
            subtitle={MSG.GROUP.MEMBERS_PAGE_SUBTITLE}
            actions={
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <button
                        type="button"
                        onClick={() => navigate("/groups")}
                        className="rounded-3xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                        {MSG.GROUP.BTN_GROUP_LIST}
                    </button>
                    <Link
                        to={`/groups/${groupId}/links`}
                        className="inline-flex items-center justify-center rounded-3xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                    >
                        {MSG.GROUP.BTN_VIEW_LINKS}
                    </Link>
                </div>
            }
        >
            <div className="grid gap-6 lg:grid-cols-[1fr]">
                {loading ? (
                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center text-slate-500">{MSG.GROUP.LOADING}</div>
                ) : !group ? (
                    <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
                        {MSG.GROUP.NOT_FOUND}
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-300/10">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-900">{group.name}</h2>
                                    <p className="mt-1 text-sm text-slate-600">{MSG.GROUP.GROUP_INFO_MEMBERS(group.members?.length ?? 0)} · {MSG.GROUP.GROUP_INFO_LINKS(group.links?.length ?? 0)}</p>
                                    {maxMembersPerGroup !== null && (
                                        <p className="mt-1 text-xs text-blue-600">{MSG.GROUP.GROUP_INFO_LIMIT(group.members?.length ?? 0, maxMembersPerGroup)}</p>
                                    )}
                                </div>
                                <div className="rounded-3xl bg-slate-50 px-4 py-3 text-sm text-slate-700">{MSG.GROUP.GROUP_OWNER_LABEL(group.owner?.username || group.owner)}</div>
                            </div>
                        </div>

                        {canManageMembers && (
                            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-slate-500">{MSG.GROUP.ADD_MEMBER_TITLE}</h3>
                                        <p className="text-sm text-slate-600">{MSG.GROUP.ADD_MEMBER_DESC}</p>
                                    </div>
                                </div>
                                <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                                    <input
                                        value={memberUserId}
                                        onChange={(event) => setMemberUserId(event.target.value)}
                                        placeholder={MSG.GROUP.ADD_MEMBER_PLACEHOLDER}
                                        className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    />
                                    <div className="flex items-center gap-2">
                                        <select
                                            value={memberRole}
                                            onChange={(event) => setMemberRole(event.target.value)}
                                            disabled={!isOwner}
                                            className="rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                        >
                                            <option value="viewer">Viewer</option>
                                            <option value="member">Member</option>
                                            <option value="manager">Manager</option>
                                        </select>
                                        <button
                                            type="button"
                                            onClick={handleAddGroupMember}
                                            disabled={actionLoading}
                                            className="rounded-3xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            {MSG.GROUP.BTN_ADD_MEMBER}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-300/10">
                            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-900">{MSG.GROUP.MEMBERS_LIST_TITLE}</h3>
                                    <p className="text-sm text-slate-600">{MSG.GROUP.MEMBERS_LIST_DESC}</p>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                <div className="flex flex-1 min-w-full sm:min-w-0 items-center gap-2 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-2 shadow-sm shadow-slate-200/50">
                                    <input
                                        value={searchQuery}
                                        onChange={(event) => {
                                            const nextSearch = event.target.value;
                                            setSearchQuery(nextSearch);
                                            setCurrentPage(1);
                                            refreshMembers(1, nextSearch, sortBy, sortOrder);
                                        }}
                                        placeholder={MSG.GROUP.SEARCH_PLACEHOLDER}
                                        className="w-full bg-transparent text-sm text-slate-900 outline-none"
                                    />
                                </div>
                                <select
                                    value={sortBy}
                                    onChange={(event) => {
                                        const nextSortBy = event.target.value;
                                        setSortBy(nextSortBy);
                                        setCurrentPage(1);
                                        refreshMembers(1, searchQuery, nextSortBy, sortOrder);
                                    }}
                                    className="rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:w-auto w-full"
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
                                    className="rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:w-auto w-full"
                                >
                                    <option value="asc">{MSG.GROUP.SORT_ASC}</option>
                                    <option value="desc">{MSG.GROUP.SORT_DESC}</option>
                                </select>
                                <button
                                    type="button"
                                    onClick={() => refreshMembers(currentPage)}
                                    className="rounded-3xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 sm:w-auto w-full"
                                >
                                    {MSG.GROUP.BTN_REFRESH}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-3">
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
                            />
                        </div>

                        {totalPages > 1 && (
                            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <button
                                    type="button"
                                    onClick={() => {
                                        const prevPage = currentPage - 1;
                                        setCurrentPage(prevPage);
                                        refreshMembers(prevPage);
                                    }}
                                    disabled={currentPage === 1}
                                    className="rounded-2xl bg-slate-200 px-4 py-2 text-sm text-slate-700 transition disabled:opacity-50"
                                >
                                    {MSG.GROUP.BTN_PREV}
                                </button>
                                <div className="text-sm text-slate-600">
                                    {MSG.GROUP.PAGE_INFO(currentPage, totalPages)}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const nextPage = currentPage + 1;
                                        setCurrentPage(nextPage);
                                        refreshMembers(nextPage);
                                    }}
                                    disabled={currentPage === totalPages}
                                    className="rounded-2xl bg-slate-200 px-4 py-2 text-sm text-slate-700 transition disabled:opacity-50"
                                >
                                    {MSG.GROUP.BTN_NEXT}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </PageWrapper>
    );
};

export default GroupMembersPage;
