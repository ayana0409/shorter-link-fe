import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { get, post, patch } from '../../utils/request';
import toast from 'react-hot-toast';
import { getTokenPayload, getTokenRole, getTokenWithExpiry } from '../../constants/localStorage';
import { MSG } from '../../constants/messages';
import PageWrapper from '../../components/PageWrapper';

/**
 * AccountManagementPage Component
 * High-end user directory and access administration center.
 * Features Dual Mode (Desktop Studio Table + Mobile Bento Cards).
 */
const AccountManagementPage = () => {
    const [accounts, setAccounts] = useState([]);
    const [levels, setLevels] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState('desc');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [statusUpdatingId, setStatusUpdatingId] = useState(null);
    const [levelUpdatingId, setLevelUpdatingId] = useState(null);
    const [selectedAccountForLevel, setSelectedAccountForLevel] = useState(null);
    const [selectedLevelId, setSelectedLevelId] = useState('');
    const [levelExpirationDate, setLevelExpirationDate] = useState('');
    const [newAccount, setNewAccount] = useState({
        username: '',
        fullname: '',
        password: '',
        role: 'user',
    });
    const [isCreating, setIsCreating] = useState(false);
    const pageSize = 5;
    const navigate = useNavigate();

    const loadAccounts = (
        page = 1,
        search = searchQuery,
        sort = sortBy,
        order = sortOrder,
    ) => {
        const pageNumber = Math.max(1, Number(page) || 1);
        const params = new URLSearchParams();
        const trimmedSearch = search?.trim() ?? '';
        if (trimmedSearch) params.append('search', trimmedSearch);
        if (sort) params.append('sortBy', sort);
        if (order) params.append('sortOrder', order);
        params.append('page', String(pageNumber));
        params.append('limit', String(pageSize));

        get(`account/admin?${params.toString()}`)
            .then((response) => {
                const accountList = Array.isArray(response?.data) ? response.data : [];
                const totalPagesFromResponse = Number(response?.totalPages) || 1;
                const nextPage = Math.min(Math.max(Number(response?.page) || pageNumber, 1), totalPagesFromResponse);

                setAccounts(accountList);
                setCurrentPage(nextPage);
                setTotalPages(totalPagesFromResponse);
            })
            .catch((error) => {
                const message = error.response?.data?.error?.message || MSG.ACCOUNT.ERR_LOAD;
                toast.error(message);
            });
    };

    const loadLevels = () => {
        const params = new URLSearchParams();
        params.append('sortBy', 'price');

        get(`level?${params.toString()}`)
            .then((response) => {
                setLevels(Array.isArray(response?.data) ? response.data : []);
            })
            .catch(() => null);
    };

    const createAccount = (e) => {
        if (e) e.preventDefault();
        if (isCreating) return;

        if (!newAccount.username.trim() || !newAccount.fullname.trim() || !newAccount.password.trim()) {
            toast.error(MSG.ACCOUNT.ERR_CREATE_EMPTY);
            return;
        }

        setIsCreating(true);
        post('account', newAccount)
            .then(() => {
                toast.success(MSG.ACCOUNT.SUCCESS_CREATE);
                setNewAccount({ username: '', fullname: '', password: '', role: 'user' });
                loadAccounts(1);
            })
            .catch((error) => {
                const message = error.response?.data?.error?.message || MSG.ACCOUNT.ERR_CREATE;
                toast.error(message);
            })
            .finally(() => {
                setIsCreating(false);
            });
    };

    const updateLevel = (accountId, levelId, levelExpirationDate) => {
        if (levelUpdatingId) return;

        setLevelUpdatingId(accountId);

        patch(`account/${accountId}/level`, {
            levelId,
            levelExpirationDate,
        })
            .then(() => {
                toast.success(MSG.ACCOUNT.SUCCESS_UPDATE_LEVEL);
                loadAccounts(currentPage);
                setSelectedAccountForLevel(null);
            })
            .catch((error) => {
                const message = error.response?.data?.error?.message || MSG.ACCOUNT.ERR_UPDATE_LEVEL;
                toast.error(message);
            })
            .finally(() => {
                setLevelUpdatingId(null);
            });
    };

    const toggleAccountStatus = (account) => {
        const currentUser = getTokenPayload();
        if (currentUser?._id === account._id || currentUser?.username === account.username) {
            toast.error(MSG.ACCOUNT.ERR_SELF_LOCK);
            return;
        }

        const nextStatus = !account.isActive;
        const accountId = account._id || account.id;
        setStatusUpdatingId(accountId);
        patch(`account/${accountId}/active`, { isActive: nextStatus })
            .then(() => {
                toast.success(MSG.ACCOUNT.TOGGLE_UNLOCKED(nextStatus));
                loadAccounts(currentPage);
            })
            .catch((error) => {
                const message = error.response?.data?.error?.message || MSG.ACCOUNT.ERR_TOGGLE_STATUS;
                toast.error(message);
            })
            .finally(() => {
                setStatusUpdatingId(null);
            });
    };

    useEffect(() => {
        const role = getTokenRole();
        if (!getTokenWithExpiry() || (role !== 'admin' && role !== 'manager')) {
            navigate('/not-found', { replace: true });
            return;
        }

        loadAccounts(1);
        loadLevels();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [navigate]);

    // Handle ESC key and body scroll lock for VIP/Level assignment modal
    useEffect(() => {
        if (!selectedAccountForLevel) return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') setSelectedAccountForLevel(null);
        };
        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            document.body.style.overflow = '';
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [selectedAccountForLevel]);

    return (
        <PageWrapper
            title={MSG.ACCOUNT.PAGE_TITLE}
            subtitle={MSG.ACCOUNT.PAGE_SUBTITLE}
        >
            <div className="space-y-6 max-w-6xl mx-auto">
                {/* Create Account Omni-Box Card */}
                <div className="double-bezel-outer p-1.5 rounded-3xl bg-slate-200/50">
                    <form onSubmit={createAccount} className="double-bezel-inner p-5 sm:p-6 bg-white rounded-[calc(1.5rem-0.375rem)] shadow-soft-sm space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                                <h3 className="text-base font-bold text-slate-900">{MSG.ACCOUNT.CREATE_TITLE}</h3>
                                <p className="text-xs text-slate-500 mt-0.5">{MSG.ACCOUNT.CREATE_DESC}</p>
                            </div>
                            <button
                                type="submit"
                                disabled={isCreating}
                                className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-xs font-semibold shadow-soft-xs transition disabled:opacity-50 self-start sm:self-auto flex items-center gap-1.5"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="12" y1="5" x2="12" y2="19" />
                                    <line x1="5" y1="12" x2="19" y2="12" />
                                </svg>
                                <span>{isCreating ? MSG.ACCOUNT.BTN_CREATING : MSG.ACCOUNT.BTN_CREATE}</span>
                            </button>
                        </div>

                        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                            <div className="relative flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3.5 text-slate-400 pointer-events-none">
                                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                                    <circle cx="12" cy="7" r="4" />
                                </svg>
                                <input
                                    type="text"
                                    value={newAccount.username}
                                    onChange={(e) => setNewAccount({ ...newAccount, username: e.target.value })}
                                    placeholder={MSG.ACCOUNT.PLACEHOLDER_USERNAME}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition"
                                />
                            </div>
                            <div className="relative flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3.5 text-slate-400 pointer-events-none">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                    <circle cx="12" cy="7" r="4" />
                                </svg>
                                <input
                                    type="text"
                                    value={newAccount.fullname}
                                    onChange={(e) => setNewAccount({ ...newAccount, fullname: e.target.value })}
                                    placeholder={MSG.ACCOUNT.PLACEHOLDER_FULLNAME}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition"
                                />
                            </div>
                            <div className="relative flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3.5 text-slate-400 pointer-events-none">
                                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                                <input
                                    type="password"
                                    value={newAccount.password}
                                    onChange={(e) => setNewAccount({ ...newAccount, password: e.target.value })}
                                    placeholder={MSG.ACCOUNT.PLACEHOLDER_PASSWORD}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition"
                                />
                            </div>
                            <div className="relative flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3.5 text-slate-400 pointer-events-none">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                </svg>
                                <select
                                    value={newAccount.role}
                                    onChange={(e) => setNewAccount({ ...newAccount, role: e.target.value })}
                                    disabled={getTokenRole() === 'manager'}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3.5 py-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition"
                                >
                                    <option value="user">User</option>
                                    <option value="manager">Manager</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Main Directory Container */}
                <div className="double-bezel-outer p-1.5 rounded-[2rem] bg-slate-200/50">
                    <div className="double-bezel-inner p-5 sm:p-7 bg-white rounded-[calc(2rem-0.375rem)] shadow-soft-md space-y-6">
                        {/* Section Header & Search / Filter Toolbar */}
                        <div className="space-y-4 pb-5 border-b border-slate-100">
                            <div>
                                <h3 className="text-xl font-bold tracking-tight text-slate-900">{MSG.ACCOUNT.TITLE}</h3>
                                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">{MSG.ACCOUNT.DESC}</p>
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
                                            loadAccounts(1, nextSearch, sortBy, sortOrder);
                                        }}
                                        placeholder={MSG.ACCOUNT.SEARCH_PLACEHOLDER}
                                        className="w-full bg-transparent text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none"
                                    />
                                </div>

                                <div className="flex items-center gap-2">
                                    <select
                                        value={sortBy}
                                        onChange={(e) => {
                                            const nextSortBy = e.target.value;
                                            setSortBy(nextSortBy);
                                            setCurrentPage(1);
                                            loadAccounts(1, searchQuery, nextSortBy, sortOrder);
                                        }}
                                        className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 outline-none transition"
                                    >
                                        <option value="createdAt">{MSG.ACCOUNT.SORT_NEWEST}</option>
                                        <option value="username">{MSG.ACCOUNT.SORT_USERNAME}</option>
                                        <option value="fullname">{MSG.ACCOUNT.SORT_FULLNAME}</option>
                                    </select>
                                    <select
                                        value={sortOrder}
                                        onChange={(e) => {
                                            const nextSortOrder = e.target.value;
                                            setSortOrder(nextSortOrder);
                                            setCurrentPage(1);
                                            loadAccounts(1, searchQuery, sortBy, nextSortOrder);
                                        }}
                                        className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 outline-none transition"
                                    >
                                        <option value="desc">{MSG.ACCOUNT.SORT_DESC}</option>
                                        <option value="asc">{MSG.ACCOUNT.SORT_ASC}</option>
                                    </select>
                                    <button
                                        type="button"
                                        onClick={() => loadAccounts(currentPage)}
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

                        {/* Desktop View: Studio Table (hidden on mobile) */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left text-sm text-slate-600">
                                <thead>
                                    <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wider text-slate-400">
                                        <th className="pb-3.5 pl-2">{MSG.ACCOUNT.COL_USERNAME}</th>
                                        <th className="pb-3.5 px-3">{MSG.ACCOUNT.COL_FULLNAME}</th>
                                        <th className="pb-3.5 px-3">{MSG.ACCOUNT.COL_ROLE}</th>
                                        <th className="pb-3.5 px-3">{MSG.ACCOUNT.COL_LEVEL}</th>
                                        <th className="pb-3.5 px-3">{MSG.ACCOUNT.COL_STATUS}</th>
                                        <th className="pb-3.5 pr-2 text-right">{MSG.ACCOUNT.COL_ACTION}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {accounts.map((account) => {
                                        const accountId = account._id || account.id;
                                        return (
                                            <tr key={accountId} className="hover:bg-slate-50/70 transition">
                                                <td className="py-4 pl-2 font-semibold text-slate-900">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-slate-200 to-slate-100 text-slate-700 flex items-center justify-center font-bold text-[11px] shrink-0 border border-slate-200/50">
                                                            {(account.username?.slice(0, 2) || 'US').toUpperCase()}
                                                        </div>
                                                        <span className="font-semibold text-slate-900">{account.username}</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-3 text-slate-600">
                                                    {account.fullname || '—'}
                                                </td>
                                                <td className="py-4 px-3">
                                                    <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold capitalize">
                                                        {account.role}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-3">
                                                    <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold">
                                                        {account.level ? account.level.name : MSG.ACCOUNT.LEVEL_FREE}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-3">
                                                    <div className="flex items-center gap-2.5">
                                                        <span
                                                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                                                account.isActive
                                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                                                            }`}
                                                        >
                                                            <span className={`w-1.5 h-1.5 rounded-full ${account.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                                                            {account.isActive ? MSG.ACCOUNT.STATUS_ACTIVE : MSG.ACCOUNT.STATUS_LOCKED}
                                                        </span>
                                                        <label className="relative inline-flex cursor-pointer items-center">
                                                            <input
                                                                type="checkbox"
                                                                checked={account.isActive}
                                                                disabled={statusUpdatingId === accountId}
                                                                onChange={() => toggleAccountStatus(account)}
                                                                className="peer sr-only"
                                                            />
                                                            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
                                                        </label>
                                                    </div>
                                                </td>
                                                <td className="py-4 pr-2 text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setSelectedAccountForLevel(account);
                                                                setSelectedLevelId(account.level?._id || '');
                                                                setLevelExpirationDate(account.levelExpirationDate ? new Date(account.levelExpirationDate).toISOString().slice(0, 16) : '');
                                                            }}
                                                            title="Phân hạng gói dịch vụ"
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold transition active:scale-95"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                                            </svg>
                                                            <span>{MSG.ACCOUNT.BTN_SET_LEVEL}</span>
                                                        </button>
                                                        <Link
                                                            to={`/admin/${accountId}`}
                                                            title="Xem chi tiết"
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition active:scale-95"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                                <circle cx="12" cy="12" r="3" />
                                                            </svg>
                                                            <span>{MSG.ACCOUNT.BTN_DETAIL}</span>
                                                        </Link>
                                                        <Link
                                                            to={`/admin/${accountId}/groups`}
                                                            title="Xem nhóm"
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition active:scale-95"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                                                <circle cx="9" cy="7" r="4" />
                                                                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                                                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                                            </svg>
                                                            <span>{MSG.ACCOUNT.BTN_GROUPS}</span>
                                                        </Link>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile View: Account Cards Stack (Zero Horizontal Overflow on Mobile) */}
                        <div className="block md:hidden space-y-3.5">
                            {accounts.map((account) => {
                                const accountId = account._id || account.id;
                                const initials = (account.username?.slice(0, 2) || 'US').toUpperCase();

                                return (
                                    <div key={accountId} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-3">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-slate-200 to-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                                                    {initials}
                                                </div>
                                                <div className="min-w-0">
                                                    <h4 className="font-bold text-slate-900 text-sm truncate">{account.username}</h4>
                                                    <p className="text-xs text-slate-500 truncate">{account.fullname || '—'}</p>
                                                </div>
                                            </div>
                                            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold text-xs shrink-0">
                                                {account.level ? account.level.name : MSG.ACCOUNT.LEVEL_FREE}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs">
                                            <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 font-medium capitalize">
                                                {account.role}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[11px] font-semibold ${account.isActive ? 'text-emerald-700' : 'text-rose-700'}`}>
                                                    {account.isActive ? MSG.ACCOUNT.STATUS_ACTIVE : MSG.ACCOUNT.STATUS_LOCKED}
                                                </span>
                                                <label className="relative inline-flex cursor-pointer items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={account.isActive}
                                                        disabled={statusUpdatingId === accountId}
                                                        onChange={() => toggleAccountStatus(account)}
                                                        className="peer sr-only"
                                                    />
                                                    <div className="w-9 h-5 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-4 after:w-4 peer-checked:bg-blue-600" />
                                                </label>
                                            </div>
                                        </div>

                                        {/* Action Buttons Matrix */}
                                        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/60 text-xs">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSelectedAccountForLevel(account);
                                                    setSelectedLevelId(account.level?._id || '');
                                                    setLevelExpirationDate(account.levelExpirationDate ? new Date(account.levelExpirationDate).toISOString().slice(0, 16) : '');
                                                }}
                                                className="min-h-[44px] px-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold flex items-center justify-center gap-1.5 text-center active:scale-95 transition"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                                </svg>
                                                <span>{MSG.ACCOUNT.BTN_SET_LEVEL}</span>
                                            </button>
                                            <Link
                                                to={`/admin/${accountId}`}
                                                className="min-h-[44px] px-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold flex items-center justify-center gap-1.5 text-center active:scale-95 transition"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                    <circle cx="12" cy="12" r="3" />
                                                </svg>
                                                <span>{MSG.ACCOUNT.BTN_DETAIL}</span>
                                            </Link>
                                            <Link
                                                to={`/admin/${accountId}/groups`}
                                                className="min-h-[44px] px-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold flex items-center justify-center gap-1.5 text-center active:scale-95 transition"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                                    <circle cx="9" cy="7" r="4" />
                                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                                </svg>
                                                <span>{MSG.ACCOUNT.BTN_GROUPS}</span>
                                            </Link>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Pagination Segmented Controller */}
                        {totalPages > 1 && (
                            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                                <button
                                    type="button"
                                    onClick={() => {
                                        const prevPage = currentPage - 1;
                                        setCurrentPage(prevPage);
                                        loadAccounts(prevPage);
                                    }}
                                    disabled={currentPage === 1}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="15 18 9 12 15 6" />
                                    </svg>
                                    <span>{MSG.GROUP?.BTN_PREV || 'Trước'}</span>
                                </button>
                                <span className="font-mono text-slate-500">
                                    Trang {currentPage} / {totalPages}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const nextPage = currentPage + 1;
                                        setCurrentPage(nextPage);
                                        loadAccounts(nextPage);
                                    }}
                                    disabled={currentPage === totalPages}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    <span>{MSG.GROUP?.BTN_NEXT || 'Sau'}</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="9 18 15 12 9 6" />
                                    </svg>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Level Assignment High-End Double-Bezel Modal */}
            {selectedAccountForLevel && typeof document !== 'undefined' && createPortal(
                <div
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setSelectedAccountForLevel(null);
                    }}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xl animate-fade-in"
                >
                    <div className="double-bezel-outer p-2 rounded-[2rem] w-full max-w-md bg-white/10 ring-1 ring-white/20 shadow-2xl">
                        <div className="double-bezel-inner p-6 sm:p-7 bg-white rounded-[calc(2rem-0.5rem)] space-y-5 text-left">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">{MSG.ACCOUNT.MODAL_LEVEL_TITLE || "Cập nhật cấp bậc"}</h3>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            {typeof MSG.ACCOUNT.MODAL_LEVEL_SUBTITLE === 'function'
                                                ? MSG.ACCOUNT.MODAL_LEVEL_SUBTITLE(selectedAccountForLevel.username)
                                                : `Cập nhật gói thành viên cho ${selectedAccountForLevel.username}`}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setSelectedAccountForLevel(null)}
                                    aria-label="Đóng modal"
                                    className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 flex items-center justify-center transition shrink-0"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </button>
                            </div>

                            <div className="space-y-3.5">
                                <div>
                                    <label className="text-xs font-semibold text-slate-600 block mb-1">
                                        {MSG.ACCOUNT.LABEL_LEVEL}
                                    </label>
                                    <select
                                        value={selectedLevelId}
                                        onChange={(e) => setSelectedLevelId(e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500 focus:bg-white"
                                    >
                                        <option value="">{MSG.ACCOUNT.LEVEL_FREE}</option>
                                        {levels.map((level) => (
                                            <option key={level._id} value={level._id}>
                                                {level.name} ({level.price.toLocaleString()} VNĐ)
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-slate-600 block mb-1">
                                        {MSG.ACCOUNT.LABEL_EXPIRATION}
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={levelExpirationDate}
                                        onChange={(e) => setLevelExpirationDate(e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-mono text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
                                    />
                                    <p className="text-[11px] text-slate-400 mt-1">{MSG.ACCOUNT.EXPIRATION_HINT}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setSelectedAccountForLevel(null)}
                                    className="min-h-[44px] rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                                >
                                    {MSG.ACCOUNT.BTN_CANCEL}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => updateLevel(selectedAccountForLevel._id, selectedLevelId, levelExpirationDate)}
                                    disabled={levelUpdatingId === selectedAccountForLevel._id}
                                    className="min-h-[44px] rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-xs font-semibold transition shadow-soft-xs disabled:opacity-50"
                                >
                                    {levelUpdatingId === selectedAccountForLevel._id ? MSG.ACCOUNT.BTN_UPDATING : MSG.ACCOUNT.BTN_SAVE}
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

export default AccountManagementPage;
