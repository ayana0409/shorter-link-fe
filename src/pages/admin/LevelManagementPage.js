import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { get, post, patch } from '../../utils/request';
import toast from 'react-hot-toast';
import { getTokenRole, getTokenWithExpiry } from '../../constants/localStorage';
import PageWrapper from '../../components/PageWrapper';
import { MSG } from '../../constants/messages';

/**
 * LevelManagementPage Component
 * High-end membership tier & privilege administration center.
 * Features Dual Mode (Desktop Studio Table + Mobile Bento Cards) and Double-Bezel Modals.
 */
const LevelManagementPage = () => {
    const [levels, setLevels] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('price');
    const [sortOrder, setSortOrder] = useState('asc');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [newLevel, setNewLevel] = useState({
        name: '',
        price: '',
        dailyShortenLimit: '',
        allowPassword: false,
        allowCustomExpiration: false,
        active: true,
        maxGroupsCount: '',
        maxMembersPerGroup: '',
        maxLinksPerGroup: '',
    });
    const [editingLevel, setEditingLevel] = useState(null);
    const [isCreating, setIsCreating] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const pageSize = 10;
    const navigate = useNavigate();

    const loadLevels = (
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

        get(`level?${params.toString()}`)
            .then((response) => {
                const levelList = Array.isArray(response?.data)
                    ? response.data
                    : Array.isArray(response)
                    ? response
                    : [];
                const totalPagesFromResponse = Number(response?.totalPages) || 1;
                const nextPage = Math.min(Math.max(Number(response?.page) || pageNumber, 1), totalPagesFromResponse);

                setLevels(levelList);
                setCurrentPage(nextPage);
                setTotalPages(totalPagesFromResponse);
            })
            .catch((error) => {
                const message = error.response?.data?.error?.message || MSG.ADMIN.LEVEL.ERR_LOAD;
                toast.error(message);
            });
    };

    const createLevel = (e) => {
        if (e) e.preventDefault();
        if (isCreating) return;

        if (!newLevel.name.trim() || newLevel.price === '' || newLevel.dailyShortenLimit === '') {
            toast.error(MSG.ADMIN.LEVEL.ERR_CREATE_EMPTY);
            return;
        }

        setIsCreating(true);
        post('level', {
            ...newLevel,
            price: Number(newLevel.price),
            dailyShortenLimit: Number(newLevel.dailyShortenLimit),
            maxGroupsCount: newLevel.maxGroupsCount !== '' ? Number(newLevel.maxGroupsCount) : undefined,
            maxMembersPerGroup: newLevel.maxMembersPerGroup !== '' ? Number(newLevel.maxMembersPerGroup) : undefined,
            maxLinksPerGroup: newLevel.maxLinksPerGroup !== '' ? Number(newLevel.maxLinksPerGroup) : undefined,
        })
            .then(() => {
                toast.success(MSG.ADMIN.LEVEL.SUCCESS_CREATE);
                setNewLevel({
                    name: '',
                    price: '',
                    dailyShortenLimit: '',
                    allowPassword: false,
                    allowCustomExpiration: false,
                    active: true,
                    maxGroupsCount: '',
                    maxMembersPerGroup: '',
                    maxLinksPerGroup: '',
                });
                loadLevels(currentPage);
            })
            .catch((error) => {
                const message = error.response?.data?.error?.message || MSG.ADMIN.LEVEL.ERR_CREATE;
                toast.error(message);
            })
            .finally(() => {
                setIsCreating(false);
            });
    };

    const updateLevel = () => {
        if (isUpdating || !editingLevel) return;

        setIsUpdating(true);
        patch(`level/${editingLevel._id}`, {
            ...editingLevel,
            price: Number(editingLevel.price),
            dailyShortenLimit: Number(editingLevel.dailyShortenLimit),
            maxGroupsCount: editingLevel.maxGroupsCount !== '' && editingLevel.maxGroupsCount !== undefined ? Number(editingLevel.maxGroupsCount) : undefined,
            maxMembersPerGroup: editingLevel.maxMembersPerGroup !== '' && editingLevel.maxMembersPerGroup !== undefined ? Number(editingLevel.maxMembersPerGroup) : undefined,
            maxLinksPerGroup: editingLevel.maxLinksPerGroup !== '' && editingLevel.maxLinksPerGroup !== undefined ? Number(editingLevel.maxLinksPerGroup) : undefined,
        })
            .then(() => {
                toast.success(MSG.ADMIN.LEVEL.SUCCESS_UPDATE);
                setEditingLevel(null);
                loadLevels(currentPage);
            })
            .catch((error) => {
                const message = error.response?.data?.error?.message || MSG.ADMIN.LEVEL.ERR_UPDATE;
                toast.error(message);
            })
            .finally(() => {
                setIsUpdating(false);
            });
    };

    const toggleLevelField = (levelId, field, currentStatus) => {
        patch(`level/${levelId}`, { [field]: !currentStatus })
            .then(() => {
                toast.success(MSG.ADMIN.LEVEL.SUCCESS_TOGGLE);
                loadLevels(currentPage);
            })
            .catch((error) => {
                const message = error.response?.data?.error?.message || MSG.ADMIN.LEVEL.ERR_TOGGLE;
                toast.error(message);
            });
    };

    useEffect(() => {
        const role = getTokenRole();
        if (!getTokenWithExpiry() || (role !== 'admin')) {
            navigate('/not-found', { replace: true });
            return;
        }
        loadLevels(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [navigate]);

    // Handle ESC key and body scroll lock for editing modal
    useEffect(() => {
        if (!editingLevel) return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') setEditingLevel(null);
        };
        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            document.body.style.overflow = '';
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [editingLevel]);

    return (
        <PageWrapper
            title={MSG.ADMIN.LEVEL.PAGE_TITLE}
            subtitle={MSG.ADMIN.LEVEL.PAGE_SUBTITLE}
        >
            <div className="space-y-6 max-w-6xl mx-auto">
                {/* Create Level Omni-Box Form */}
                <div className="double-bezel-outer p-1.5 rounded-3xl bg-slate-200/50">
                    <form onSubmit={createLevel} className="double-bezel-inner p-5 sm:p-6 bg-white rounded-[calc(1.5rem-0.375rem)] shadow-soft-sm space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                                <h3 className="text-base font-bold text-slate-900">{MSG.ADMIN.LEVEL.TITLE}</h3>
                                <p className="text-xs text-slate-500 mt-0.5">{MSG.ADMIN.LEVEL.DESC}</p>
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
                                <span>{isCreating ? MSG.ACCOUNT?.BTN_CREATING || 'Đang tạo...' : 'Tạo gói mới'}</span>
                            </button>
                        </div>

                        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                            <input
                                type="text"
                                value={newLevel.name}
                                onChange={(e) => setNewLevel({ ...newLevel, name: e.target.value })}
                                placeholder={MSG.ADMIN.LEVEL.PLACEHOLDER_NAME}
                                className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition"
                            />
                            <input
                                type="number"
                                value={newLevel.price}
                                onChange={(e) => setNewLevel({ ...newLevel, price: e.target.value })}
                                placeholder={MSG.ADMIN.LEVEL.PLACEHOLDER_PRICE}
                                className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-mono text-slate-900 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition"
                            />
                            <input
                                type="number"
                                value={newLevel.dailyShortenLimit}
                                onChange={(e) => setNewLevel({ ...newLevel, dailyShortenLimit: e.target.value })}
                                placeholder={MSG.ADMIN.LEVEL.PLACEHOLDER_DAILY_LIMIT}
                                className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-mono text-slate-900 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition"
                            />
                            <input
                                type="number"
                                value={newLevel.maxGroupsCount}
                                onChange={(e) => setNewLevel({ ...newLevel, maxGroupsCount: e.target.value })}
                                placeholder={MSG.ADMIN.LEVEL.PLACEHOLDER_MAX_GROUPS}
                                className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-mono text-slate-900 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition"
                            />
                            <input
                                type="number"
                                value={newLevel.maxMembersPerGroup}
                                onChange={(e) => setNewLevel({ ...newLevel, maxMembersPerGroup: e.target.value })}
                                placeholder={MSG.ADMIN.LEVEL.PLACEHOLDER_MAX_MEMBERS}
                                className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-mono text-slate-900 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition"
                            />
                            <input
                                type="number"
                                value={newLevel.maxLinksPerGroup}
                                onChange={(e) => setNewLevel({ ...newLevel, maxLinksPerGroup: e.target.value })}
                                placeholder={MSG.ADMIN.LEVEL.PLACEHOLDER_MAX_LINKS}
                                className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-mono text-slate-900 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition"
                            />
                        </div>

                        <div className="flex flex-wrap items-center gap-6 pt-1 text-xs text-slate-700">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={newLevel.allowPassword}
                                    onChange={(e) => setNewLevel({ ...newLevel, allowPassword: e.target.checked })}
                                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                                />
                                <span className="font-medium">{MSG.ADMIN.LEVEL.LABEL_ALLOW_PASSWORD}</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={newLevel.allowCustomExpiration}
                                    onChange={(e) => setNewLevel({ ...newLevel, allowCustomExpiration: e.target.checked })}
                                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                                />
                                <span className="font-medium">{MSG.ADMIN.LEVEL.LABEL_ALLOW_EXPIRATION}</span>
                            </label>
                        </div>
                    </form>
                </div>

                {/* Main Levels Directory Container */}
                <div className="double-bezel-outer p-1.5 rounded-[2rem] bg-slate-200/50">
                    <div className="double-bezel-inner p-5 sm:p-7 bg-white rounded-[calc(2rem-0.375rem)] shadow-soft-md space-y-6">
                        {/* Section Header & Search / Filter Toolbar */}
                        <div className="space-y-4 pb-5 border-b border-slate-100">
                            <div>
                                <h3 className="text-xl font-bold tracking-tight text-slate-900">Danh mục Gói Dịch vụ & Hạn mức</h3>
                                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Quản lý các gói thành viên và quyền lợi tài khoản</p>
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
                                            loadLevels(1, nextSearch, sortBy, sortOrder);
                                        }}
                                        placeholder={MSG.ADMIN.LEVEL.SEARCH_PLACEHOLDER}
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
                                            loadLevels(1, searchQuery, nextSortBy, sortOrder);
                                        }}
                                        className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 outline-none transition"
                                    >
                                        <option value="name">{MSG.ADMIN.LEVEL.SORT_NAME}</option>
                                        <option value="price">{MSG.ADMIN.LEVEL.SORT_PRICE}</option>
                                        <option value="dailyShortenLimit">{MSG.ADMIN.LEVEL.SORT_DAILY_LIMIT}</option>
                                    </select>
                                    <select
                                        value={sortOrder}
                                        onChange={(e) => {
                                            const nextSortOrder = e.target.value;
                                            setSortOrder(nextSortOrder);
                                            setCurrentPage(1);
                                            loadLevels(1, searchQuery, sortBy, nextSortOrder);
                                        }}
                                        className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 outline-none transition"
                                    >
                                        <option value="asc">{MSG.ADMIN.LEVEL.SORT_ASC}</option>
                                        <option value="desc">{MSG.ADMIN.LEVEL.SORT_DESC}</option>
                                    </select>
                                    <button
                                        type="button"
                                        onClick={() => loadLevels(currentPage)}
                                        title={MSG.ADMIN.LEVEL.BTN_REFRESH}
                                        className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition shrink-0"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Desktop View: Levels Studio Table */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left text-sm text-slate-600">
                                <thead>
                                    <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wider text-slate-400">
                                        <th className="pb-3.5 pl-2">{MSG.ADMIN.LEVEL.COL_NAME}</th>
                                        <th className="pb-3.5 px-3 font-mono">{MSG.ADMIN.LEVEL.COL_PRICE}</th>
                                        <th className="pb-3.5 px-3 font-mono">{MSG.ADMIN.LEVEL.COL_DAILY_LIMIT}</th>
                                        <th className="pb-3.5 px-3">{MSG.ADMIN.LEVEL.COL_PASSWORD}</th>
                                        <th className="pb-3.5 px-3">{MSG.ADMIN.LEVEL.COL_TIME}</th>
                                        <th className="pb-3.5 px-3 font-mono text-center">{MSG.ADMIN.LEVEL.COL_GROUPS}</th>
                                        <th className="pb-3.5 px-3">{MSG.ADMIN.LEVEL.COL_STATUS}</th>
                                        <th className="pb-3.5 pr-2 text-right">{MSG.ADMIN.LEVEL.COL_ACTION}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {levels.map((level) => (
                                        <tr key={level._id} className="hover:bg-slate-50/70 transition">
                                            <td className="py-4 pl-2 font-bold text-slate-900">
                                                {level.name}
                                            </td>
                                            <td className="py-4 px-3 font-mono text-xs font-bold text-blue-700">
                                                {level.price.toLocaleString()} VNĐ
                                            </td>
                                            <td className="py-4 px-3 font-mono text-xs font-semibold text-slate-800">
                                                {level.dailyShortenLimit} link/ngày
                                            </td>
                                            <td className="py-4 px-3">
                                                <label className="relative inline-flex cursor-pointer items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={level.allowPassword}
                                                        onChange={() => toggleLevelField(level._id, 'allowPassword', level.allowPassword)}
                                                        className="peer sr-only"
                                                    />
                                                    <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:border after:rounded-full after:h-3.5 after:w-3.5 peer-checked:bg-blue-600" />
                                                </label>
                                            </td>
                                            <td className="py-4 px-3">
                                                <label className="relative inline-flex cursor-pointer items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={level.allowCustomExpiration}
                                                        onChange={() => toggleLevelField(level._id, 'allowCustomExpiration', level.allowCustomExpiration)}
                                                        className="peer sr-only"
                                                    />
                                                    <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:border after:rounded-full after:h-3.5 after:w-3.5 peer-checked:bg-blue-600" />
                                                </label>
                                            </td>
                                            <td className="py-4 px-3 font-mono text-xs text-center text-slate-700">
                                                {level.maxGroupsCount ?? '—'}
                                            </td>
                                            <td className="py-4 px-3">
                                                <div className="flex items-center gap-2">
                                                    <span className={`w-1.5 h-1.5 rounded-full ${level.active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                                    <label className="relative inline-flex cursor-pointer items-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={level.active}
                                                            onChange={() => toggleLevelField(level._id, 'active', level.active)}
                                                            className="peer sr-only"
                                                        />
                                                        <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:border after:rounded-full after:h-3.5 after:w-3.5 peer-checked:bg-blue-600" />
                                                    </label>
                                                </div>
                                            </td>
                                            <td className="py-4 pr-2 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() => setEditingLevel({ ...level })}
                                                    className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold transition"
                                                >
                                                    {MSG.ADMIN.LEVEL.BTN_EDIT}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile View: Level Cards Stack */}
                        <div className="block md:hidden space-y-3.5">
                            {levels.map((level) => (
                                <div key={level._id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <h4 className="font-bold text-slate-900 text-base">{level.name}</h4>
                                            <p className="font-mono text-xs font-bold text-blue-700 mt-0.5">
                                                {level.price.toLocaleString()} VNĐ
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setEditingLevel({ ...level })}
                                            className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 text-xs font-semibold"
                                        >
                                            {MSG.ADMIN.LEVEL.BTN_EDIT}
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-2 border-t border-slate-200/60">
                                        <div>Hạn mức: <span className="font-bold text-slate-900">{level.dailyShortenLimit}/ngày</span></div>
                                        <div>Nhóm max: <span className="font-bold text-slate-900">{level.maxGroupsCount ?? '—'}</span></div>
                                    </div>

                                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs">
                                        <div className="flex items-center gap-4">
                                            <span className="text-slate-600">Khóa: {level.allowPassword ? '✓' : '✕'}</span>
                                            <span className="text-slate-600">Hạn dùng: {level.allowCustomExpiration ? '✓' : '✕'}</span>
                                        </div>
                                        <span className={`text-[11px] font-bold ${level.active ? 'text-emerald-700' : 'text-rose-700'}`}>
                                            {level.active ? 'Kích hoạt' : 'Tắt'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination Segmented Controller */}
                        {totalPages > 1 && (
                            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                                <button
                                    type="button"
                                    onClick={() => {
                                        const prevPage = Math.max(currentPage - 1, 1);
                                        setCurrentPage(prevPage);
                                        loadLevels(prevPage);
                                    }}
                                    disabled={currentPage === 1}
                                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    {MSG.ADMIN.LEVEL.BTN_PREV}
                                </button>
                                <span className="font-mono text-slate-500">
                                    {MSG.ADMIN.LEVEL.PAGE_INFO(currentPage, totalPages)}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const nextPage = Math.min(currentPage + 1, totalPages);
                                        setCurrentPage(nextPage);
                                        loadLevels(nextPage);
                                    }}
                                    disabled={currentPage === totalPages}
                                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    {MSG.ADMIN.LEVEL.BTN_NEXT}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Edit Level Double-Bezel Modal */}
            {editingLevel && typeof document !== 'undefined' && createPortal(
                <div
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setEditingLevel(null);
                    }}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xl animate-fade-in"
                >
                    <div className="double-bezel-outer p-2 rounded-[2rem] w-full max-w-2xl bg-white/10 ring-1 ring-white/20 shadow-2xl">
                        <div className="double-bezel-inner p-6 sm:p-7 bg-white rounded-[calc(2rem-0.5rem)] space-y-5 text-left max-h-[90vh] overflow-y-auto">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">{MSG.ADMIN.LEVEL.EDIT_TITLE(editingLevel.name)}</h3>
                                    <p className="text-xs text-slate-500 mt-0.5">Chỉnh sửa thông số gói và phân quyền người dùng</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setEditingLevel(null)}
                                    aria-label="Đóng modal"
                                    className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 flex items-center justify-center transition shrink-0"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </button>
                            </div>

                            <div className="grid gap-3.5 sm:grid-cols-2">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">{MSG.ADMIN.LEVEL.EDIT_LABEL_NAME}</label>
                                    <input
                                        type="text"
                                        value={editingLevel.name}
                                        onChange={(e) => setEditingLevel({ ...editingLevel, name: e.target.value })}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">{MSG.ADMIN.LEVEL.EDIT_LABEL_PRICE}</label>
                                    <input
                                        type="number"
                                        value={editingLevel.price}
                                        onChange={(e) => setEditingLevel({ ...editingLevel, price: e.target.value })}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-mono text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">{MSG.ADMIN.LEVEL.EDIT_LABEL_DAILY_LIMIT}</label>
                                    <input
                                        type="number"
                                        value={editingLevel.dailyShortenLimit}
                                        onChange={(e) => setEditingLevel({ ...editingLevel, dailyShortenLimit: e.target.value })}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-mono text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">{MSG.ADMIN.LEVEL.EDIT_LABEL_MAX_GROUPS}</label>
                                    <input
                                        type="number"
                                        value={editingLevel.maxGroupsCount ?? ''}
                                        onChange={(e) => setEditingLevel({ ...editingLevel, maxGroupsCount: e.target.value })}
                                        placeholder={MSG.ADMIN.LEVEL.EDIT_PLACEHOLDER_DEFAULT}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-mono text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">{MSG.ADMIN.LEVEL.EDIT_LABEL_MAX_MEMBERS}</label>
                                    <input
                                        type="number"
                                        value={editingLevel.maxMembersPerGroup ?? ''}
                                        onChange={(e) => setEditingLevel({ ...editingLevel, maxMembersPerGroup: e.target.value })}
                                        placeholder={MSG.ADMIN.LEVEL.EDIT_PLACEHOLDER_DEFAULT}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-mono text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">{MSG.ADMIN.LEVEL.EDIT_LABEL_MAX_LINKS}</label>
                                    <input
                                        type="number"
                                        value={editingLevel.maxLinksPerGroup ?? ''}
                                        onChange={(e) => setEditingLevel({ ...editingLevel, maxLinksPerGroup: e.target.value })}
                                        placeholder={MSG.ADMIN.LEVEL.EDIT_PLACEHOLDER_DEFAULT}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-mono text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-slate-100 text-xs">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={editingLevel.allowPassword}
                                        onChange={(e) => setEditingLevel({ ...editingLevel, allowPassword: e.target.checked })}
                                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                                    />
                                    <span className="font-medium text-slate-700">{MSG.ADMIN.LEVEL.EDIT_LABEL_ALLOW_PASSWORD}</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={editingLevel.allowCustomExpiration}
                                        onChange={(e) => setEditingLevel({ ...editingLevel, allowCustomExpiration: e.target.checked })}
                                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                                    />
                                    <span className="font-medium text-slate-700">{MSG.ADMIN.LEVEL.EDIT_LABEL_ALLOW_EXPIRATION}</span>
                                </label>
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-3">
                                <button
                                    type="button"
                                    onClick={() => setEditingLevel(null)}
                                    className="min-h-[44px] rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                                >
                                    {MSG.ADMIN.LEVEL.BTN_CANCEL}
                                </button>
                                <button
                                    type="button"
                                    onClick={updateLevel}
                                    disabled={isUpdating}
                                    className="min-h-[44px] rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-xs font-semibold transition shadow-soft-xs disabled:opacity-50"
                                >
                                    {isUpdating ? MSG.ADMIN.LEVEL.BTN_SAVING : MSG.ADMIN.LEVEL.BTN_SAVE}
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

export default LevelManagementPage;
