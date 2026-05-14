import React from "react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { get, post, remove, patch } from "../../utils/request";
import PageWrapper from "../../components/PageWrapper";
import toast from "react-hot-toast";
import { getTokenPayload } from "../../constants/localStorage";
import { clientUrl } from "../../utils/url";
import { MSG } from "../../constants/messages";

const LinksList = React.memo(({ links, canManageLinks, userId, actionLoading, handleRemoveLink, toggleLinkStatus, setEditingPasswordLinkId, handleUpdatePassword, editingPasswordLinkId, newLinkPassword, setNewLinkPassword, confirmNewLinkPassword, setConfirmNewLinkPassword, copyToClipboard, getLinkStatus, clientUrl }) => {
    return (
        <div className="space-y-3">
            {!links.length ? (
                <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                    {MSG.GROUP.NO_LINKS}
                </div>
            ) : (
                links.map((link) => {
                    const status = getLinkStatus(link);
                    const isOwner = link.userId === userId;
                    return (
                        <div key={link._id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4 w-full max-w-full overflow-hidden">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between w-full overflow-hidden">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <p className="font-semibold text-slate-900 truncate" title={link.siteName ?? MSG.GROUP.SITE_UNKNOWN}>
                                            {link.siteName ?? MSG.GROUP.SITE_UNKNOWN}
                                        </p>
                                        <span
                                            title={status === "valid" ? MSG.GROUP.TOOLTIP_VALID : status === "expired" ? MSG.GROUP.TOOLTIP_EXPIRED : MSG.GROUP.TOOLTIP_DISABLED}
                                            className={`shrink-0 inline-flex items-center justify-center rounded-full w-5 h-5 text-xs font-medium ${status === "valid"
                                                ? "bg-green-100 text-green-800"
                                                : status === "expired"
                                                    ? "bg-red-100 text-red-800"
                                                    : "bg-gray-100 text-gray-800"
                                                }`}
                                        >
                                            {status === "valid" ? "✓" : status === "expired" ? "✕" : "!"}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-600 truncate" title={link.originalUrl}>
                                        {link.originalUrl}
                                    </p>
                                    <p className="mt-1 text-xs tracking-[0.16em] text-slate-500 min-w-0">
                                        <span
                                            onClick={() => window.open(`${clientUrl}/s/${link.shortUrl}`, '_blank')}
                                            className="block truncate cursor-pointer text-blue-500 hover:text-blue-700 hover:underline"
                                            title={`${clientUrl}/s/${link.shortUrl}`}
                                        >
                                            {clientUrl}/s/{link.shortUrl}
                                        </span>
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <p className="text-xs text-slate-500">{MSG.GROUP.LINK_CLICKS(link.clicks)}</p>
                                        {link.passwordProtected && (
                                            <span title={MSG.GROUP.TOOLTIP_HAS_PASSWORD} className="text-xs text-amber-600 cursor-help">
                                                🔒
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2 shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => copyToClipboard(link)}
                                        title={MSG.GROUP.TOOLTIP_COPY}
                                        className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-900 text-white transition hover:bg-slate-800"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg>
                                    </button>
                                    {isOwner && (
                                        <button
                                            type="button"
                                            onClick={() => toggleLinkStatus(link)}
                                            title={link.status === "active" ? MSG.GROUP.TOOLTIP_DISABLE : MSG.GROUP.TOOLTIP_ENABLE}
                                            className={`flex h-9 w-9 items-center justify-center rounded-2xl text-white transition ${link.status === "active"
                                                ? "bg-red-500 hover:bg-red-600"
                                                : "bg-green-500 hover:bg-green-600"
                                                }`}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0" /><line x1="12" y1="2" x2="12" y2="12" /></svg>
                                        </button>
                                    )}
                                    {isOwner && (
                                        <button
                                            type="button"
                                            onClick={() => setEditingPasswordLinkId(link._id)}
                                            title={MSG.GROUP.TOOLTIP_CHANGE_PASSWORD}
                                            className="flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-500 text-white transition hover:bg-amber-600"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                                        </button>
                                    )}
                                    {canManageLinks && (
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveLink(link._id)}
                                            disabled={actionLoading}
                                            title={MSG.GROUP.TOOLTIP_REMOVE_LINK}
                                            className="flex h-9 w-9 items-center justify-center rounded-2xl bg-rose-500 text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                                        </button>
                                    )}
                                </div>
                            </div>
                            {editingPasswordLinkId === link._id && (
                                <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4">
                                    <h4 className="text-sm font-semibold text-slate-900">{MSG.GROUP.PASSWORD_EDIT_TITLE}</h4>
                                    <div className="mt-3 space-y-3">
                                        <input
                                            type="password"
                                            value={newLinkPassword}
                                            onChange={(event) => setNewLinkPassword(event.target.value)}
                                            placeholder={MSG.GROUP.PASSWORD_NEW_PLACEHOLDER}
                                            className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                        />
                                        <input
                                            type="password"
                                            value={confirmNewLinkPassword}
                                            onChange={(event) => setConfirmNewLinkPassword(event.target.value)}
                                            placeholder={MSG.GROUP.PASSWORD_CONFIRM_PLACEHOLDER}
                                            className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => handleUpdatePassword(link._id)}
                                                className="rounded-3xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                                            >
                                                {MSG.GROUP.BTN_SAVE_PASSWORD_LINK}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setEditingPasswordLinkId("");
                                                    setNewLinkPassword("");
                                                    setConfirmNewLinkPassword("");
                                                }}
                                                className="rounded-3xl bg-slate-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-600"
                                            >
                                                {MSG.GROUP.BTN_CANCEL_PASSWORD}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })
            )}
        </div>
    );
});

const GroupLinksPage = () => {
    const { groupId } = useParams();
    const navigate = useNavigate();
    const [group, setGroup] = useState(null);
    const [links, setLinks] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("valid");
    const [sortBy, setSortBy] = useState("createdAt");
    const [sortOrder, setSortOrder] = useState("desc");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [linkUrl, setLinkUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [editingPasswordLinkId, setEditingPasswordLinkId] = useState("");
    const [newLinkPassword, setNewLinkPassword] = useState("");
    const [confirmNewLinkPassword, setConfirmNewLinkPassword] = useState("");
    const [maxLinksPerGroup, setMaxLinksPerGroup] = useState(null);

    const userId = useMemo(() => getTokenPayload()?._id, []);
    const isAdmin = useMemo(() => getTokenPayload()?.role === "admin", []);
    const pageSize = 5;

    const fetchGroup = async () => {
        if (!groupId) return;
        try {
            const data = await get(`groups/${groupId}`);
            setGroup(data);
        } catch (error) {
            toast.error(MSG.GROUP.ERR_LOAD_DATA);
        }
    };

    const refreshLinks = async (
        page = 1,
        search = searchQuery,
        status = statusFilter,
        sort = sortBy,
        order = sortOrder,
    ) => {
        if (!groupId) return;
        setLoading(true);
        try {
            const response = await get(
                `groups/${groupId}/links?search=${encodeURIComponent(search)}&status=${status}&sortBy=${sort}&sortOrder=${order}&page=${page}&limit=${pageSize}`
            );
            setLinks(response.data);
            setCurrentPage(response.page);
            setTotalPages(response.totalPages);
        } catch (error) {
            toast.error(MSG.GROUP.ERR_LOAD_LINKS);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGroup();
        refreshLinks();
        get(`groups/${groupId}/limits`)
            .then((data) => setMaxLinksPerGroup(data.maxLinksPerGroup))
            .catch(() => null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [groupId]);

    const handleAddLink = async () => {
        if (!groupId) return;
        if (!linkUrl.trim()) {
            toast.error(MSG.GROUP.ERR_ADD_LINK_EMPTY);
            return;
        }

        setActionLoading(true);
        try {
            await post(`groups/${groupId}/links`, { links: [linkUrl.trim()] });
            await fetchGroup();
            await refreshLinks();
            setLinkUrl("");
            toast.success(MSG.GROUP.SUCCESS_ADD_LINK);
        } catch (error) {
            toast.error(error.response?.data?.error?.message || MSG.GROUP.ERR_ADD_LINK);
        } finally {
            setActionLoading(false);
        }
    };

    const handleRemoveLink = async (linkId) => {
        if (!groupId) return;
        setActionLoading(true);
        try {
            await remove(`groups/${groupId}/links/${linkId}`);
            await fetchGroup();
            await refreshLinks();
            toast.success(MSG.GROUP.SUCCESS_REMOVE_LINK);
        } catch (error) {
            toast.error(error.response?.data?.error?.message || MSG.GROUP.ERR_REMOVE_LINK);
        } finally {
            setActionLoading(false);
        }
    };

    const toggleLinkStatus = async (link) => {
        const newStatus = link.status === "active" ? "disabled" : "active";
        try {
            await patch(`shortener/${link._id}`, { status: newStatus });
            await refreshLinks();
            toast.success(MSG.GROUP.SUCCESS_TOGGLE_LINK(newStatus === "active"));
        } catch (error) {
            toast.error(error.response?.data?.error?.message || MSG.GROUP.ERR_TOGGLE_LINK);
        }
    };

    const handleUpdatePassword = async (linkId) => {
        if (newLinkPassword !== confirmNewLinkPassword) {
            toast.error(MSG.GROUP.ERR_PASSWORD_MISMATCH);
            return;
        }

        try {
            await patch(`shortener/${linkId}`, {
                password: newLinkPassword || null,
            });
            setEditingPasswordLinkId("");
            setNewLinkPassword("");
            setConfirmNewLinkPassword("");
            await refreshLinks();
            toast.success(MSG.GROUP.SUCCESS_UPDATE_PASSWORD);
        } catch (error) {
            toast.error(error.response?.data?.error?.message || MSG.GROUP.ERR_UPDATE_PASSWORD);
        }
    };

    const isLinkExpired = (link) => {
        if (link.noExpiration) return false;
        if (!link.expiresAt) return false;
        return new Date(link.expiresAt) < new Date();
    };

    const getLinkStatus = (link) => {
        if (link.status === "disabled") return "disabled";
        if (isLinkExpired(link)) return "expired";
        return "valid";
    };

    const getShortLinkUrl = (link) => `${clientUrl}/s/${link.shortUrl}`;

    const copyToClipboard = async (link) => {
        try {
            await navigator.clipboard.writeText(getShortLinkUrl(link));
            toast.success(MSG.GROUP.SUCCESS_COPY_LINK);
        } catch (error) {
            toast.error(error.response?.data?.error?.message || MSG.GROUP.ERR_COPY_LINK);
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

    const canManageLinks = isAdmin || (groupRole && groupRole !== "viewer");

    return (
        <PageWrapper
            title={group ? MSG.GROUP.LINKS_PAGE_TITLE(group.name) : MSG.GROUP.LINKS_PAGE_TITLE_LOADING}
            subtitle={MSG.GROUP.LINKS_PAGE_SUBTITLE}
            actions={
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <button
                        type="button"
                        onClick={() => navigate("/groups")}
                        className="rounded-3xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                        {MSG.GROUP.BTN_GROUP_LIST}
                    </button>
                    {(groupRole !== "viewer" || isAdmin) && (
                        <Link
                            to={`/groups/${groupId}/members`}
                            className="inline-flex items-center justify-center rounded-3xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                        >
                            {MSG.GROUP.BTN_VIEW_MEMBERS}
                        </Link>
                    )}
                </div>
            }
        >
            <div className="grid gap-6 lg:grid-cols-[1fr] min-w-0">
                {loading ? (
                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center text-slate-500">{MSG.GROUP.LOADING}</div>
                ) : !group ? (
                    <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
                        {MSG.GROUP.NOT_FOUND}
                    </div>
                ) : (
                    <div className="space-y-6 min-w-0">
                        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-300/10">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-900">{group.name}</h2>
                                    <p className="mt-1 text-sm text-slate-600">{MSG.GROUP.GROUP_INFO_MEMBERS(group.members?.length ?? 0)} · {MSG.GROUP.GROUP_INFO_LINKS(group.links?.length ?? 0)}</p>
                                    {maxLinksPerGroup !== null && (
                                        <p className="mt-1 text-xs text-blue-600">{MSG.GROUP.LINKS_INFO_LIMIT(group.links?.length ?? 0, maxLinksPerGroup)}</p>
                                    )}
                                </div>
                                <div className="rounded-3xl bg-slate-50 px-4 py-3 text-sm text-slate-700">{MSG.GROUP.GROUP_OWNER_LABEL(group.owner?.username || group.owner)}</div>
                            </div>
                        </div>

                        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-slate-500">{MSG.GROUP.ADD_LINK_TITLE}</h3>
                                    <p className="text-sm text-slate-600">{MSG.GROUP.ADD_LINK_DESC(maxLinksPerGroup)}</p>
                                </div>
                            </div>
                            <div className="flex flex-col gap-3 sm:flex-row">
                                <input
                                    value={linkUrl}
                                    onChange={(event) => setLinkUrl(event.target.value)}
                                    placeholder={MSG.GROUP.ADD_LINK_PLACEHOLDER}
                                    className="flex-1 min-w-0 rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />
                                <button
                                    type="button"
                                    onClick={handleAddLink}
                                    disabled={!canManageLinks || actionLoading}
                                    className="inline-flex shrink-0 items-center justify-center rounded-3xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {MSG.GROUP.BTN_ADD_LINK}
                                </button>
                            </div>
                        </div>

                        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-300/10">
                            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-900">{MSG.GROUP.LINKS_LIST_TITLE}</h3>
                                    <p className="text-sm text-slate-600">{MSG.GROUP.LINKS_LIST_DESC}</p>
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
                                            refreshLinks(1, nextSearch, statusFilter, sortBy, sortOrder);
                                        }}
                                        placeholder={MSG.GROUP.SEARCH_LINKS_PLACEHOLDER}
                                        className="w-full bg-transparent text-sm text-slate-900 outline-none"
                                    />
                                </div>
                                <select
                                    value={statusFilter}

                                    onChange={(event) => {
                                        const nextStatus = event.target.value;
                                        setStatusFilter(nextStatus);
                                        setCurrentPage(1);
                                        refreshLinks(1, searchQuery, nextStatus, sortBy, sortOrder);
                                    }}
                                    className="rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:w-auto w-full"
                                >
                                    <option value="all">{MSG.GROUP.FILTER_ALL}</option>
                                    <option value="valid">{MSG.GROUP.FILTER_VALID}</option>
                                    <option value="expired">{MSG.GROUP.FILTER_EXPIRED}</option>
                                    <option value="disabled">{MSG.GROUP.FILTER_DISABLED}</option>
                                </select>
                                <select
                                    value={sortBy}

                                    onChange={(event) => {
                                        const nextSortBy = event.target.value;
                                        setSortBy(nextSortBy);
                                        setCurrentPage(1);
                                        refreshLinks(1, searchQuery, statusFilter, nextSortBy, sortOrder);
                                    }}
                                    className="rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:w-auto w-full"
                                >
                                    <option value="createdAt">{MSG.GROUP.SORT_DATE}</option>
                                    <option value="clicks">{MSG.GROUP.SORT_CLICKS}</option>
                                    <option value="siteName">{MSG.GROUP.SORT_SITE_NAME}</option>
                                </select>
                                <select
                                    value={sortOrder}

                                    onChange={(event) => {
                                        const nextSortOrder = event.target.value;
                                        setSortOrder(nextSortOrder);
                                        setCurrentPage(1);
                                        refreshLinks(1, searchQuery, statusFilter, sortBy, nextSortOrder);
                                    }}
                                    className="rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:w-auto w-full"
                                >
                                    <option value="desc">{MSG.GROUP.SORT_DESC}</option>
                                    <option value="asc">{MSG.GROUP.SORT_ASC}</option>
                                </select>
                                <button
                                    type="button"

                                    onClick={() => refreshLinks(currentPage)}
                                    className="rounded-3xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 sm:w-auto w-full"
                                >

                                    {MSG.GROUP.BTN_REFRESH}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <LinksList
                                links={links}
                                canManageLinks={canManageLinks}
                                userId={userId}
                                actionLoading={actionLoading}
                                handleRemoveLink={handleRemoveLink}
                                toggleLinkStatus={toggleLinkStatus}
                                setEditingPasswordLinkId={setEditingPasswordLinkId}
                                handleUpdatePassword={handleUpdatePassword}
                                editingPasswordLinkId={editingPasswordLinkId}
                                newLinkPassword={newLinkPassword}
                                setNewLinkPassword={setNewLinkPassword}
                                confirmNewLinkPassword={confirmNewLinkPassword}
                                setConfirmNewLinkPassword={setConfirmNewLinkPassword}
                                copyToClipboard={copyToClipboard}
                                getLinkStatus={getLinkStatus}
                                clientUrl={clientUrl}
                            />
                        </div>

                        {totalPages > 1 && (
                            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <button
                                    type="button"
                                    onClick={() => {
                                        const nextPage = Math.max(currentPage - 1, 1);
                                        setCurrentPage(nextPage);
                                        refreshLinks(nextPage);
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
                                        const nextPage = Math.min(currentPage + 1, totalPages);
                                        setCurrentPage(nextPage);
                                        refreshLinks(nextPage);
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
export default GroupLinksPage;
