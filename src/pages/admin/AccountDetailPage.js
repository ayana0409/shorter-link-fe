import { Fragment, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { get, patch, remove } from '../../utils/request';
import toast from 'react-hot-toast';
import { getTokenPayload, getTokenRole, getTokenWithExpiry } from '../../constants/localStorage';
import { MSG } from '../../constants/messages';
import PageWrapper from '../../components/PageWrapper';
import QrCodePreview from '../../components/QrCodePreview';

const getClientUrl = () => {
    const rawUrl = process.env.REACT_APP_CLIENT_URL || window.location.origin;
    try {
        const parsed = new URL(rawUrl);
        return `${parsed.protocol}//${parsed.host}`;
    } catch {
        return rawUrl.replace(/\/+$/, "");
    }
};
const clientUrl = getClientUrl();

/**
 * AccountDetailPage Component
 * High-end user profile inspector & link management center.
 * Features Dual Mode for link lists (Desktop Studio Table + Mobile Cards).
 */
const AccountDetailPage = () => {
    const { id } = useParams();
    const [account, setAccount] = useState(null);
    const [links, setLinks] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState('desc');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [editAccount, setEditAccount] = useState({ fullname: '', password: '', role: 'user' });
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isStatusUpdating, setIsStatusUpdating] = useState(false);
    const [editingPasswordLinkId, setEditingPasswordLinkId] = useState('');
    const [newLinkPassword, setNewLinkPassword] = useState('');
    const [confirmNewLinkPassword, setConfirmNewLinkPassword] = useState('');
    const [activeQrLinkId, setActiveQrLinkId] = useState('');
    const pageSize = 5;
    const navigate = useNavigate();

    const refreshLinks = (
        page = 1,
        search = searchQuery,
        status = statusFilter,
        sortField = sortBy,
        order = sortOrder,
    ) => {
        const pageNumber = Math.max(1, Number(page) || 1);
        const params = new URLSearchParams();
        const trimmedSearch = search?.trim() ?? '';
        if (trimmedSearch) params.append('search', trimmedSearch);
        if (status && status !== 'all') params.append('status', status);
        if (sortField) params.append('sortBy', sortField);
        if (order) params.append('sortOrder', order);
        params.append('page', String(pageNumber));
        params.append('limit', String(pageSize));

        get(`account/admin/${id}?${params.toString()}`)
            .then((response) => {
                setAccount(response.account);
                const linksList = Array.isArray(response?.links) ? response.links : [];
                const totalPagesFromResponse = Number(response?.totalPages) || 1;
                const nextPage = Math.min(Math.max(Number(response?.page) || pageNumber, 1), totalPagesFromResponse);

                setLinks(linksList);
                setCurrentPage(nextPage);
                setTotalPages(totalPagesFromResponse);
            })
            .catch((error) => {
                const message = error.response?.data?.error?.message || MSG.ACCOUNT.ERR_LOAD_DETAIL;
                toast.error(message);
            });
    };

    const saveAccountChanges = () => {
        if (!account) return;

        const payload = {
            fullname: editAccount.fullname.trim(),
            role: editAccount.role,
        };
        if (editAccount.password) {
            payload.password = editAccount.password;
        }

        setIsSaving(true);
        patch(`account/${id}`, payload)
            .then((updatedAccount) => {
                toast.success(MSG.ACCOUNT.SUCCESS_UPDATE);
                setAccount(updatedAccount);
                setEditAccount({ ...editAccount, password: '' });
            })
            .catch((error) => {
                const message = error.response?.data?.error?.message || MSG.ACCOUNT.ERR_UPDATE;
                toast.error(message);
            })
            .finally(() => {
                setIsSaving(false);
            });
    };

    const deleteAccount = () => {
        if (!window.confirm(MSG.ACCOUNT.CONFIRM_DELETE)) {
            return;
        }

        setIsDeleting(true);
        remove(`account/${id}`)
            .then(() => {
                toast.success(MSG.ACCOUNT.SUCCESS_DELETE);
                navigate('/admin/accounts');
            })
            .catch((error) => {
                const message = error.response?.data?.error?.message || MSG.ACCOUNT.ERR_DELETE;
                toast.error(message);
            })
            .finally(() => {
                setIsDeleting(false);
            });
    };

    const toggleAccountStatus = () => {
        if (!account) return;
        const currentUser = getTokenPayload();
        if (currentUser?._id === account._id || currentUser?.username === account.username) {
            toast.error(MSG.ACCOUNT.ERR_SELF_LOCK);
            return;
        }
        const nextStatus = !account.isActive;
        setIsStatusUpdating(true);

        patch(`account/${id}/active`, { isActive: nextStatus })
            .then((updatedAccount) => {
                toast.success(MSG.ACCOUNT.SUCCESS_TOGGLE(nextStatus));
                setAccount(updatedAccount);
            })
            .catch((error) => {
                const message = error.response?.data?.error?.message || MSG.ACCOUNT.ERR_TOGGLE;
                toast.error(message);
            })
            .finally(() => {
                setIsStatusUpdating(false);
            });
    };

    useEffect(() => {
        const role = getTokenRole();
        if (!getTokenWithExpiry() || (role !== 'admin' && role !== 'manager')) {
            navigate('/not-found', { replace: true });
            return;
        }
        refreshLinks();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, navigate]);

    useEffect(() => {
        if (account) {
            setEditAccount({
                fullname: account.fullname || '',
                password: '',
                role: account.role || 'user',
            });
        }
    }, [account]);

    const isLinkExpired = (link) => {
        if (link.noExpiration) return false;
        if (!link.expiresAt) return false;
        return new Date(link.expiresAt) < new Date();
    };

    const getLinkStatus = (link) => {
        if (link.status === 'disabled') return MSG.ACCOUNT.STATUS_DISABLED;
        if (isLinkExpired(link)) return MSG.ACCOUNT.STATUS_EXPIRED;
        return MSG.ACCOUNT.STATUS_ACTIVE_LINK;
    };

    const updateLinkPassword = (linkId) => {
        if (newLinkPassword !== confirmNewLinkPassword) {
            toast.error(MSG.ACCOUNT.ERR_PASSWORD_MISMATCH);
            return;
        }

        patch(`shortener/${linkId}`, { password: newLinkPassword || null })
            .then(() => {
                toast.success(MSG.ACCOUNT.SUCCESS_UPDATE_PASSWORD);
                setEditingPasswordLinkId('');
                setNewLinkPassword('');
                setConfirmNewLinkPassword('');
                refreshLinks(currentPage);
            })
            .catch((error) => {
                const message = error.response?.data?.error?.message || MSG.ACCOUNT.ERR_UPDATE_PASSWORD;
                toast.error(message);
            });
    };

    const toggleLinkStatus = (link) => {
        const nextStatus = link.status === 'disabled' ? 'active' : 'disabled';
        patch(`shortener/${link._id || link.id}`, { status: nextStatus })
            .then(() => {
                toast.success(MSG.ACCOUNT.SUCCESS_TOGGLE_LINK);
                refreshLinks(currentPage);
            })
            .catch((error) => {
                const message = error.response?.data?.error?.message || MSG.ACCOUNT.ERR_TOGGLE_LINK;
                toast.error(message);
            });
    };

    const deleteLink = (linkId) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa liên kết này không?")) return;
        remove(`shortener/${linkId}`)
            .then(() => {
                toast.success(MSG.ACCOUNT.SUCCESS_DELETE_LINK);
                refreshLinks(currentPage);
            })
            .catch((error) => {
                const message = error.response?.data?.error?.message || MSG.ACCOUNT.ERR_DELETE_LINK;
                toast.error(message);
            });
    };

    if (!account) {
        return (
            <PageWrapper
                title={MSG.ACCOUNT.DETAIL_PAGE_TITLE}
                subtitle={MSG.ACCOUNT.DETAIL_PAGE_SUBTITLE}
            >
                <div className="py-24 text-center space-y-3">
                    <div className="w-8 h-8 mx-auto border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs font-medium text-slate-400">{MSG.ACCOUNT.DETAIL_LOADING}</p>
                </div>
            </PageWrapper>
        );
    }

    const initials = (account.username?.slice(0, 2) || 'US').toUpperCase();

    return (
        <PageWrapper
            title={MSG.ACCOUNT.DETAIL_PAGE_TITLE}
            subtitle={MSG.ACCOUNT.DETAIL_PAGE_SUBTITLE}
            actions={
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => navigate('/admin/accounts')}
                        className="px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                    >
                        {MSG.ADMIN.ACCOUNT.PAGE_TITLE}
                    </button>
                    <Link
                        to={`/admin/${id}/groups`}
                        className="px-4 py-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition"
                    >
                        {MSG.ADMIN.ACCOUNT.BTN_VIEW_GROUPS}
                    </Link>
                </div>
            }
        >
            <div className="space-y-6 max-w-6xl mx-auto">
                {/* Account Profile Header Bento */}
                <div className="double-bezel-outer p-1.5 rounded-3xl bg-slate-200/50">
                    <div className="double-bezel-inner p-5 sm:p-7 bg-white rounded-[calc(1.5rem-0.375rem)] shadow-soft-sm flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-slate-200 to-slate-100 text-slate-800 flex items-center justify-center font-bold text-lg shadow-inner ring-1 ring-slate-200/50">
                                {initials}
                            </div>
                            <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">{account.username}</h2>
                                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold capitalize">
                                        {account.role}
                                    </span>
                                    <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold">
                                        {account.level ? account.level.name : MSG.ACCOUNT.LEVEL_FREE}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 mt-1">{account.fullname || 'Chưa đặt họ tên'}</p>
                            </div>
                        </div>

                        {/* Status Toggle Switch */}
                        <div className="flex items-center gap-3 self-start sm:self-auto p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
                            <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${account.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                                <span className="text-xs font-bold text-slate-700">
                                    {account.isActive ? MSG.ACCOUNT.STATUS_ACTIVE : MSG.ACCOUNT.STATUS_LOCKED}
                                </span>
                            </div>
                            <label className="relative inline-flex cursor-pointer items-center">
                                <input
                                    type="checkbox"
                                    checked={account.isActive}
                                    disabled={isStatusUpdating || getTokenPayload()?._id === account._id || getTokenPayload()?.username === account.username}
                                    onChange={toggleAccountStatus}
                                    className="peer sr-only"
                                />
                                <div className="w-10 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
                            </label>
                        </div>
                    </div>
                </div>

                {/* Edit Account Settings Form Card */}
                <div className="double-bezel-outer p-1.5 rounded-3xl bg-slate-200/50">
                    <div className="double-bezel-inner p-5 sm:p-7 bg-white rounded-[calc(1.5rem-0.375rem)] shadow-soft-sm space-y-5">
                        <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-bold text-slate-900">{MSG.ACCOUNT.EDIT_TITLE}</h3>
                                <p className="text-xs text-slate-500 mt-0.5">{MSG.ACCOUNT.EDIT_DESC}</p>
                            </div>
                        </div>

                        <div className="grid gap-3.5 sm:grid-cols-2">
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">{MSG.ACCOUNT.EDIT_LABEL_FULLNAME}</label>
                                <input
                                    type="text"
                                    value={editAccount.fullname}
                                    onChange={(e) => setEditAccount({ ...editAccount, fullname: e.target.value })}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">{MSG.ACCOUNT.EDIT_LABEL_ROLE}</label>
                                <select
                                    value={editAccount.role}
                                    onChange={(e) => setEditAccount({ ...editAccount, role: e.target.value })}
                                    disabled={getTokenRole() === 'manager'}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition"
                                >
                                    <option value="user">User</option>
                                    <option value="manager">Manager</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <div className="sm:col-span-2">
                                <label className="block text-xs font-semibold text-slate-600 mb-1">{MSG.ACCOUNT.EDIT_LABEL_PASSWORD}</label>
                                <input
                                    type="password"
                                    value={editAccount.password}
                                    onChange={(e) => setEditAccount({ ...editAccount, password: e.target.value })}
                                    placeholder={MSG.ACCOUNT.EDIT_PASSWORD_PLACEHOLDER}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition"
                                />
                            </div>
                        </div>

                        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={saveAccountChanges}
                                disabled={isSaving}
                                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-xs font-semibold shadow-soft-xs transition disabled:opacity-50"
                            >
                                {isSaving ? MSG.ACCOUNT.BTN_SAVING : MSG.ACCOUNT.BTN_SAVE}
                            </button>
                            <button
                                type="button"
                                onClick={deleteAccount}
                                disabled={isDeleting}
                                className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold transition disabled:opacity-50"
                            >
                                {isDeleting ? MSG.ACCOUNT.BTN_DELETING : MSG.ACCOUNT.BTN_DELETE}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Managed Links Section Container */}
                <div className="double-bezel-outer p-1.5 rounded-[2rem] bg-slate-200/50">
                    <div className="double-bezel-inner p-5 sm:p-7 bg-white rounded-[calc(2rem-0.375rem)] shadow-soft-md space-y-6">
                        {/* Section Header & Search / Filter Toolbar */}
                        <div className="space-y-4 pb-5 border-b border-slate-100">
                            <div>
                                <h3 className="text-xl font-bold tracking-tight text-slate-900">Danh sách Liên kết của Người dùng</h3>
                                <p className="text-xs text-slate-500 mt-0.5">Quản lý và giám sát lưu lượng các liên kết do tài khoản này tạo</p>
                            </div>

                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                                <div className="flex-1 flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-slate-900 focus-within:border-blue-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 transition">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 mr-2.5 shrink-0">
                                        <circle cx="11" cy="11" r="8" />
                                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                    </svg>
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => {
                                            const nextSearch = e.target.value;
                                            setSearchQuery(nextSearch);
                                            setCurrentPage(1);
                                            refreshLinks(1, nextSearch, statusFilter, sortBy, sortOrder);
                                        }}
                                        placeholder="Tìm kiếm theo tên web..."
                                        className="w-full bg-transparent text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none"
                                    />
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => {
                                            const nextStatus = e.target.value;
                                            setStatusFilter(nextStatus);
                                            setCurrentPage(1);
                                            refreshLinks(1, searchQuery, nextStatus, sortBy, sortOrder);
                                        }}
                                        className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 outline-none transition"
                                    >
                                        <option value="all">{MSG.ACCOUNT.FILTER_ALL}</option>
                                        <option value="valid">{MSG.ACCOUNT.FILTER_VALID}</option>
                                        <option value="expired">{MSG.ACCOUNT.FILTER_EXPIRED}</option>
                                        <option value="disabled">{MSG.ACCOUNT.FILTER_DISABLED}</option>
                                    </select>
                                    <select
                                        value={sortBy}
                                        onChange={(e) => {
                                            const nextSortBy = e.target.value;
                                            setSortBy(nextSortBy);
                                            setCurrentPage(1);
                                            refreshLinks(1, searchQuery, statusFilter, nextSortBy, sortOrder);
                                        }}
                                        className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 outline-none transition"
                                    >
                                        <option value="createdAt">{MSG.ACCOUNT.SORT_NEWEST}</option>
                                        <option value="siteName">{MSG.ACCOUNT.SORT_SITE_NAME}</option>
                                        <option value="clicks">{MSG.ACCOUNT.SORT_CLICKS}</option>
                                    </select>
                                    <select
                                        value={sortOrder}
                                        onChange={(e) => {
                                            const nextSortOrder = e.target.value;
                                            setSortOrder(nextSortOrder);
                                            setCurrentPage(1);
                                            refreshLinks(1, searchQuery, statusFilter, sortBy, nextSortOrder);
                                        }}
                                        className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 outline-none transition"
                                    >
                                        <option value="desc">{MSG.ACCOUNT.SORT_DESC}</option>
                                        <option value="asc">{MSG.ACCOUNT.SORT_ASC}</option>
                                    </select>
                                    <button
                                        type="button"
                                        onClick={() => refreshLinks(currentPage)}
                                        title={MSG.ACCOUNT.BTN_REFRESH}
                                        className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition shrink-0"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {links.length === 0 ? (
                            <div className="py-12 text-center text-slate-400 text-xs">
                                Người dùng này chưa tạo liên kết nào.
                            </div>
                        ) : (
                            <>
                                {/* Desktop View: Links Table */}
                                <div className="hidden md:block overflow-x-auto">
                                    <table className="w-full text-left text-sm text-slate-600">
                                        <thead>
                                            <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wider text-slate-400">
                                                <th className="pb-3.5 pl-2">{MSG.ACCOUNT.COL_SITE_NAME}</th>
                                                <th className="pb-3.5 px-3">{MSG.ACCOUNT.COL_SHORT_LINK}</th>
                                                <th className="pb-3.5 px-3">{MSG.ACCOUNT.COL_SECURITY}</th>
                                                <th className="pb-3.5 px-3 font-mono">{MSG.ACCOUNT.COL_CLICKS}</th>
                                                <th className="pb-3.5 px-3">{MSG.ACCOUNT.COL_STATUS}</th>
                                                <th className="pb-3.5 px-3 font-mono">{MSG.ACCOUNT.COL_EXPIRES}</th>
                                                <th className="pb-3.5 pr-2 text-right">{MSG.ACCOUNT.COL_ACTION}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {links.map((link) => {
                                                const linkId = link._id || link.id;
                                                const shortFullUrl = `${clientUrl}/s/${link.shortUrl}`;
                                                const expired = isLinkExpired(link);

                                                return (
                                                    <Fragment key={linkId}>
                                                        <tr className="hover:bg-slate-50/70 transition">
                                                            <td className="py-4 pl-2 font-semibold text-slate-900 max-w-xs truncate" title={link.originalUrl}>
                                                                {link.siteName ?? MSG.ACCOUNT.SITE_UNKNOWN}
                                                            </td>
                                                            <td className="py-4 px-3 font-mono text-xs text-blue-600">
                                                                <a href={shortFullUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                                                    {link.shortUrl}
                                                                </a>
                                                            </td>
                                                            <td className="py-4 px-3">
                                                                {link.passwordProtected ? (
                                                                    <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold inline-flex items-center gap-1">
                                                                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                                            <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                                                                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                                                        </svg>
                                                                        Có
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-slate-400 text-xs">Không</span>
                                                                )}
                                                            </td>
                                                            <td className="py-4 px-3 font-mono text-xs font-semibold text-slate-700">
                                                                {link.clicks ?? 0}
                                                            </td>
                                                            <td className="py-4 px-3">
                                                                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                                                                    link.status === 'disabled'
                                                                        ? 'bg-slate-100 text-slate-600'
                                                                        : expired
                                                                        ? 'bg-rose-50 text-rose-700'
                                                                        : 'bg-emerald-50 text-emerald-700'
                                                                }`}>
                                                                    {getLinkStatus(link)}
                                                                </span>
                                                            </td>
                                                            <td className="py-4 px-3 font-mono text-xs text-slate-500">
                                                                {link.expiresAt ? new Date(link.expiresAt).toLocaleDateString('vi-VN') : MSG.ACCOUNT.NO_EXPIRE}
                                                            </td>
                                                            <td className="py-4 pr-2 text-right">
                                                                <div className="flex items-center justify-end gap-1.5">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => toggleLinkStatus(link)}
                                                                        disabled={expired}
                                                                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                                                                            expired
                                                                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                                                                : link.status === 'disabled'
                                                                                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                                                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                                                        }`}
                                                                    >
                                                                        {link.status === 'disabled' ? MSG.ACCOUNT.BTN_ENABLE : MSG.ACCOUNT.BTN_DISABLE}
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setActiveQrLinkId(activeQrLinkId === linkId ? '' : linkId)}
                                                                        disabled={expired || link.status === 'disabled'}
                                                                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs transition"
                                                                        title={MSG.ACCOUNT.BTN_QR}
                                                                    >
                                                                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                            <rect width="5" height="5" x="3" y="3" rx="1" />
                                                                            <rect width="5" height="5" x="16" y="3" rx="1" />
                                                                            <rect width="5" height="5" x="3" y="16" rx="1" />
                                                                            <path d="M21 16h-3a2 2 0 0 0-2 2v3" />
                                                                            <path d="M21 21v.01" />
                                                                            <path d="M12 7v3a2 2 0 0 1-2 2H7" />
                                                                            <path d="M3 12h.01" />
                                                                            <path d="M12 3h.01" />
                                                                            <path d="M12 16v.01" />
                                                                            <path d="M16 12h1" />
                                                                            <path d="M21 12v.01" />
                                                                            <path d="M12 21v-1" />
                                                                        </svg>
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setEditingPasswordLinkId(editingPasswordLinkId === linkId ? '' : linkId)}
                                                                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs transition"
                                                                        title={MSG.ACCOUNT.BTN_CHANGE_PASSWORD}
                                                                    >
                                                                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                            <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                                                                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                                                        </svg>
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => deleteLink(linkId)}
                                                                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 text-xs transition"
                                                                        title={MSG.ACCOUNT.BTN_DELETE_LINK}
                                                                    >
                                                                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                            <path d="M3 6h18" />
                                                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                                                                        </svg>
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>

                                                        {/* QR Code Drawer */}
                                                        {activeQrLinkId === linkId && (
                                                            <tr>
                                                                <td colSpan="7" className="p-4 bg-slate-50/50">
                                                                    <QrCodePreview shortUrl={link.shortUrl} />
                                                                </td>
                                                            </tr>
                                                        )}

                                                        {/* Edit Password Drawer */}
                                                        {editingPasswordLinkId === linkId && (
                                                            <tr>
                                                                <td colSpan="7" className="p-4 bg-amber-50/30">
                                                                    <div className="flex flex-wrap items-center gap-2">
                                                                        <input
                                                                            type="password"
                                                                            value={newLinkPassword}
                                                                            onChange={(e) => setNewLinkPassword(e.target.value)}
                                                                            placeholder="Mật khẩu mới (bỏ trống để gỡ)"
                                                                            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs outline-none focus:border-amber-500 font-mono"
                                                                        />
                                                                        <input
                                                                            type="password"
                                                                            value={confirmNewLinkPassword}
                                                                            onChange={(e) => setConfirmNewLinkPassword(e.target.value)}
                                                                            placeholder="Xác nhận mật khẩu mới"
                                                                            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs outline-none focus:border-amber-500 font-mono"
                                                                        />
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => updateLinkPassword(linkId)}
                                                                            className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold"
                                                                        >
                                                                            {MSG.ACCOUNT.BTN_SAVE_PASSWORD}
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setEditingPasswordLinkId('')}
                                                                            className="px-3 py-1.5 rounded-xl bg-slate-200 text-slate-700 text-xs font-medium"
                                                                        >
                                                                            {MSG.ACCOUNT.BTN_CANCEL_PASSWORD}
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </Fragment>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile View: Link Cards Stack (Zero Horizontal Overflow on Mobile) */}
                                <div className="block md:hidden space-y-3.5">
                                    {links.map((link) => {
                                        const linkId = link._id || link.id;
                                        const shortFullUrl = `${clientUrl}/s/${link.shortUrl}`;
                                        const expired = isLinkExpired(link);

                                        return (
                                            <div key={linkId} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-3">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div>
                                                        <h4 className="font-bold text-slate-900 text-sm truncate max-w-[200px]" title={link.siteName}>
                                                            {link.siteName ?? MSG.ACCOUNT.SITE_UNKNOWN}
                                                        </h4>
                                                        <a href={shortFullUrl} target="_blank" rel="noopener noreferrer" className="font-mono text-xs text-blue-600 hover:underline block truncate mt-0.5">
                                                            {link.shortUrl}
                                                        </a>
                                                    </div>
                                                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                                                        link.status === 'disabled'
                                                            ? 'bg-slate-100 text-slate-600'
                                                            : expired
                                                            ? 'bg-rose-50 text-rose-700'
                                                            : 'bg-emerald-50 text-emerald-700'
                                                    }`}>
                                                        {getLinkStatus(link)}
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-200/60 font-mono">
                                                    <div>Lượt click: <span className="font-bold text-slate-900">{link.clicks ?? 0}</span></div>
                                                    <div>Hạn: <span className="text-slate-600">{link.expiresAt ? new Date(link.expiresAt).toLocaleDateString('vi-VN') : 'Vĩnh viễn'}</span></div>
                                                </div>

                                                <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-200/60 text-xs">
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleLinkStatus(link)}
                                                        disabled={expired}
                                                        className="min-h-[40px] px-2 rounded-xl bg-slate-100 text-slate-700 font-semibold flex items-center justify-center text-center"
                                                    >
                                                        {link.status === 'disabled' ? 'Bật' : 'Tắt'}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setActiveQrLinkId(activeQrLinkId === linkId ? '' : linkId)}
                                                        className="min-h-[40px] px-2 rounded-xl bg-blue-50 text-blue-700 font-semibold flex items-center justify-center text-center"
                                                    >
                                                        Mã QR
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => deleteLink(linkId)}
                                                        className="min-h-[40px] px-2 rounded-xl bg-rose-50 text-rose-600 font-semibold flex items-center justify-center text-center"
                                                    >
                                                        Xóa
                                                    </button>
                                                </div>

                                                {/* Mobile Drawers */}
                                                {activeQrLinkId === linkId && (
                                                    <div className="p-3 bg-white rounded-xl border border-slate-200">
                                                        <QrCodePreview shortUrl={link.shortUrl} />
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
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
                                    {MSG.GROUP?.BTN_PREV || 'Trước'}
                                </button>
                                <span className="font-mono text-slate-500">
                                    Trang {currentPage} / {totalPages}
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
                                    {MSG.GROUP?.BTN_NEXT || 'Sau'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </PageWrapper>
    );
};

export default AccountDetailPage;
