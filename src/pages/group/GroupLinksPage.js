import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { get, post, remove, patch } from "../../utils/request";
import PageWrapper from "../../components/PageWrapper";
import toast from "react-hot-toast";
import { getTokenPayload } from "../../constants/localStorage";
import { clientUrl } from "../../utils/url";
import { MSG } from "../../constants/messages";

/**
 * LinksList Component
 * Renders individual group link items with 1-click copy feedback, status toggling, and password management.
 */
const LinksList = React.memo(({
    links,
    canManageLinks,
    userId,
    actionLoading,
    handleRemoveLink,
    toggleLinkStatus,
    setEditingPasswordLinkId,
    handleUpdatePassword,
    editingPasswordLinkId,
    newLinkPassword,
    setNewLinkPassword,
    confirmNewLinkPassword,
    setConfirmNewLinkPassword,
    copyToClipboard,
    getLinkStatus,
    clientUrl,
    copiedLinkId,
}) => {
    if (!links.length) {
        return (
            <div className="py-16 text-center space-y-3">
                <div className="w-14 h-14 mx-auto rounded-3xl bg-slate-50 flex items-center justify-center text-slate-400 ring-1 ring-slate-100">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </svg>
                </div>
                <p className="text-sm font-medium text-slate-500">{MSG.GROUP.NO_LINKS}</p>
            </div>
        );
    }

    return (
        <div className="space-y-3.5">
            {links.map((link) => {
                const status = getLinkStatus(link);
                const isOwner = link.userId === userId;
                const isCopied = copiedLinkId === link._id;
                const shortFullUrl = `${clientUrl}/s/${link.shortUrl}`;

                return (
                    <div
                        key={link._id}
                        className="p-4 sm:p-5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-all duration-200"
                    >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            {/* Link Meta Details */}
                            <div className="flex-1 min-w-0 space-y-1.5">
                                <div className="flex items-center gap-2.5 flex-wrap">
                                    <h4 className="font-bold text-slate-900 text-sm sm:text-base truncate max-w-xs" title={link.siteName ?? MSG.GROUP.SITE_UNKNOWN}>
                                        {link.siteName ?? MSG.GROUP.SITE_UNKNOWN}
                                    </h4>

                                    {/* Status Indicator Badge */}
                                    <span
                                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                                            status === "valid"
                                                ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500/20"
                                                : status === "expired"
                                                ? "bg-rose-50 text-rose-700 ring-1 ring-rose-500/20"
                                                : "bg-slate-100 text-slate-600 ring-1 ring-slate-200"
                                        }`}
                                    >
                                        <span
                                            className={`w-1.5 h-1.5 rounded-full ${
                                                status === "valid"
                                                    ? "bg-emerald-500 animate-pulse"
                                                    : status === "expired"
                                                    ? "bg-rose-500"
                                                    : "bg-slate-400"
                                            }`}
                                        />
                                        {status === "valid" ? "Hoạt động" : status === "expired" ? "Hết hạn" : "Tắt"}
                                    </span>

                                    {/* Password Protected Pill */}
                                    {link.passwordProtected && (
                                        <span
                                            title={MSG.GROUP.TOOLTIP_HAS_PASSWORD}
                                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[11px] font-medium ring-1 ring-amber-500/20"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                            </svg>
                                            Mật khẩu
                                        </span>
                                    )}
                                </div>

                                {/* Destination URL */}
                                <p className="text-xs text-slate-400 truncate max-w-lg" title={link.originalUrl}>
                                    {link.originalUrl}
                                </p>

                                {/* Short URL + Visits Stats */}
                                <div className="flex items-center gap-3 pt-0.5 flex-wrap">
                                    <a
                                        href={shortFullUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="font-mono text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1 truncate max-w-xs"
                                        title={shortFullUrl}
                                    >
                                        <span>{shortFullUrl}</span>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                            <polyline points="15 3 21 3 21 9" />
                                            <line x1="10" y1="14" x2="21" y2="3" />
                                        </svg>
                                    </a>
                                    <span className="text-slate-300">•</span>
                                    <span className="font-mono text-xs text-slate-500">
                                        {MSG.GROUP.LINK_CLICKS(link.clicks)}
                                    </span>
                                </div>
                            </div>

                            {/* Action Buttons Toolbar */}
                            <div className="flex items-center gap-1.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                                {/* 1-Click Copy Button */}
                                <button
                                    type="button"
                                    onClick={() => copyToClipboard(link)}
                                    title={MSG.GROUP.TOOLTIP_COPY}
                                    className={`min-h-[40px] px-3.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition-all duration-200 active:scale-95 ${
                                        isCopied
                                            ? "bg-emerald-600 text-white shadow-soft-xs"
                                            : "bg-slate-900 hover:bg-slate-800 text-white shadow-soft-xs"
                                    }`}
                                >
                                    {isCopied ? (
                                        <>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                            <span>Đã sao chép</span>
                                        </>
                                    ) : (
                                        <>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                                                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                                            </svg>
                                            <span>Sao chép</span>
                                        </>
                                    )}
                                </button>

                                {/* Toggle Active/Disabled Status */}
                                {isOwner && (
                                    <button
                                        type="button"
                                        onClick={() => toggleLinkStatus(link)}
                                        title={link.status === "active" ? MSG.GROUP.TOOLTIP_DISABLE : MSG.GROUP.TOOLTIP_ENABLE}
                                        className={`min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl transition-all duration-200 active:scale-95 ${
                                            link.status === "active"
                                                ? "bg-white border border-slate-200 text-slate-500 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50"
                                                : "bg-white border border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                                        }`}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
                                            <line x1="12" y1="2" x2="12" y2="12" />
                                        </svg>
                                    </button>
                                )}

                                {/* Edit Password Button */}
                                {isOwner && (
                                    <button
                                        type="button"
                                        onClick={() => setEditingPasswordLinkId(editingPasswordLinkId === link._id ? "" : link._id)}
                                        title={MSG.GROUP.TOOLTIP_CHANGE_PASSWORD}
                                        className={`min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl border transition-all duration-200 ${
                                            editingPasswordLinkId === link._id
                                                ? "bg-amber-500 text-white border-amber-500"
                                                : "bg-white border-slate-200 text-slate-500 hover:text-amber-600 hover:border-amber-200 hover:bg-amber-50"
                                        }`}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                        </svg>
                                    </button>
                                )}

                                {/* Remove Link Button */}
                                {canManageLinks && (
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveLink(link._id)}
                                        disabled={actionLoading}
                                        title={MSG.GROUP.TOOLTIP_REMOVE_LINK}
                                        className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-all duration-200 disabled:opacity-50"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M3 6h18" />
                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                                            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Password Edit Disclosure Drawer */}
                        {editingPasswordLinkId === link._id && (
                            <div className="mt-4 pt-4 border-t border-slate-200/80 animate-fade-in">
                                <div className="p-4 rounded-2xl bg-white border border-amber-200/60 shadow-soft-xs space-y-3">
                                    <div className="flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600">
                                            <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                        </svg>
                                        <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                                            {MSG.GROUP.PASSWORD_EDIT_TITLE}
                                        </h5>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                        <input
                                            type="password"
                                            value={newLinkPassword}
                                            onChange={(e) => setNewLinkPassword(e.target.value)}
                                            placeholder={MSG.GROUP.PASSWORD_NEW_PLACEHOLDER}
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-100 transition"
                                        />
                                        <input
                                            type="password"
                                            value={confirmNewLinkPassword}
                                            onChange={(e) => setConfirmNewLinkPassword(e.target.value)}
                                            placeholder={MSG.GROUP.PASSWORD_CONFIRM_PLACEHOLDER}
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-100 transition"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 pt-1">
                                        <button
                                            type="button"
                                            onClick={() => handleUpdatePassword(link._id)}
                                            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition shadow-soft-xs"
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
                                            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium transition"
                                        >
                                            {MSG.GROUP.BTN_CANCEL_PASSWORD}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
});

/**
 * GroupLinksPage Component
 * High-end minimalist agency redesign for group shared links management.
 */
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
    const [copiedLinkId, setCopiedLinkId] = useState(null);

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
            setLinks(response.data || []);
            setCurrentPage(response.page || 1);
            setTotalPages(response.totalPages || 1);
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

    const handleAddLink = async (e) => {
        if (e) e.preventDefault();
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
            setCopiedLinkId(link._id);
            toast.success(MSG.GROUP.SUCCESS_COPY_LINK);
            setTimeout(() => {
                setCopiedLinkId(null);
            }, 2000);
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
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => navigate("/groups")}
                        className="px-4 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                    >
                        {MSG.GROUP.BTN_GROUP_LIST}
                    </button>
                    {(groupRole !== "viewer" || isAdmin) && (
                        <Link
                            to={`/groups/${groupId}/members`}
                            className="px-4 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition shadow-soft-xs"
                        >
                            {MSG.GROUP.BTN_VIEW_MEMBERS}
                        </Link>
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
                                {maxLinksPerGroup !== null && (
                                    <span className="px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 font-medium font-mono">
                                        {MSG.GROUP.LINKS_INFO_LIMIT(group.links?.length ?? 0, maxLinksPerGroup)}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Add Link Omni-Box (if permitted) */}
                <div className="double-bezel-outer p-1.5 rounded-3xl bg-slate-200/50">
                    <form onSubmit={handleAddLink} className="double-bezel-inner p-4 sm:p-5 bg-white rounded-[calc(1.5rem-0.375rem)] shadow-soft-sm space-y-3">
                        <div>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">{MSG.GROUP.ADD_LINK_TITLE}</h3>
                            <p className="text-xs text-slate-500 mt-0.5">{MSG.GROUP.ADD_LINK_DESC(maxLinksPerGroup)}</p>
                        </div>
                        <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
                            <div className="flex-1 flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-slate-900 focus-within:border-blue-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 transition">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 mr-2.5 shrink-0">
                                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                                </svg>
                                <input
                                    type="text"
                                    value={linkUrl}
                                    onChange={(event) => setLinkUrl(event.target.value)}
                                    placeholder={MSG.GROUP.ADD_LINK_PLACEHOLDER}
                                    disabled={!canManageLinks || actionLoading}
                                    className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 outline-none disabled:cursor-not-allowed"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={!canManageLinks || actionLoading || !linkUrl.trim()}
                                className="h-11 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-xs font-semibold transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed shadow-soft-xs shrink-0 flex items-center justify-center gap-1.5"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="12" y1="5" x2="12" y2="19" />
                                    <line x1="5" y1="12" x2="19" y2="12" />
                                </svg>
                                <span>{MSG.GROUP.BTN_ADD_LINK}</span>
                            </button>
                        </div>
                    </form>
                </div>

                {/* Links List Container */}
                <div className="double-bezel-outer p-1.5 rounded-[2rem] bg-slate-200/50">
                    <div className="double-bezel-inner p-5 sm:p-7 bg-white rounded-[calc(2rem-0.375rem)] shadow-soft-md space-y-6">
                        {/* Section Header & Search / Sort Filter Bar */}
                        <div className="space-y-4 pb-5 border-b border-slate-100">
                            <div>
                                <h3 className="text-xl font-bold tracking-tight text-slate-900">{MSG.GROUP.LINKS_LIST_TITLE}</h3>
                                <p className="text-sm text-slate-500 mt-0.5">{MSG.GROUP.LINKS_LIST_DESC}</p>
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
                                            refreshLinks(1, nextSearch, statusFilter, sortBy, sortOrder);
                                        }}
                                        placeholder={MSG.GROUP.SEARCH_LINKS_PLACEHOLDER}
                                        className="w-full bg-transparent text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none"
                                    />
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <select
                                        value={statusFilter}
                                        onChange={(event) => {
                                            const nextStatus = event.target.value;
                                            setStatusFilter(nextStatus);
                                            setCurrentPage(1);
                                            refreshLinks(1, searchQuery, nextStatus, sortBy, sortOrder);
                                        }}
                                        className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 outline-none transition"
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
                                        className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 outline-none transition"
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
                                        className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 outline-none transition"
                                    >
                                        <option value="desc">{MSG.GROUP.SORT_DESC}</option>
                                        <option value="asc">{MSG.GROUP.SORT_ASC}</option>
                                    </select>
                                    <button
                                        type="button"
                                        onClick={() => refreshLinks(currentPage)}
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

                        {/* Links List Items */}
                        {!loading && (
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
                                copiedLinkId={copiedLinkId}
                            />
                        )}

                        {/* Pagination Segmented Controller */}
                        {totalPages > 1 && (
                            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                                <button
                                    type="button"
                                    onClick={() => {
                                        const prevPage = Math.max(currentPage - 1, 1);
                                        setCurrentPage(prevPage);
                                        refreshLinks(prevPage);
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
                                        const nextPage = Math.min(currentPage + 1, totalPages);
                                        setCurrentPage(nextPage);
                                        refreshLinks(nextPage);
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
        </PageWrapper>
    );
};

export default GroupLinksPage;
