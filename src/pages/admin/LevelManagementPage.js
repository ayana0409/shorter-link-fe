import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { get, post, patch } from '../../utils/request';
import toast from 'react-hot-toast';
import { getTokenRole, getTokenWithExpiry } from '../../constants/localStorage';
import PageWrapper from '../../components/PageWrapper';
import { MSG } from '../../constants/messages';

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

    const createLevel = () => {
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

    return (
        <PageWrapper
            title={MSG.ADMIN.LEVEL.PAGE_TITLE}
            subtitle={MSG.ADMIN.LEVEL.PAGE_SUBTITLE}
        >
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-300/10">
                <div className="mb-6">
                    <div>
                        <h2 className="text-2xl font-semibold text-slate-900">{MSG.ADMIN.LEVEL.TITLE}</h2>
                        <p className="mt-2 text-sm text-slate-600">{MSG.ADMIN.LEVEL.DESC}</p>
                    </div>
                </div>

                <div className="mb-6 rounded-3xl border border-slate-200 bg-slate-50 p-6">
                    <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <h3 className="text-xl font-semibold text-slate-900">{MSG.ADMIN.LEVEL.TITLE}</h3>
                            <p className="text-sm text-slate-600">{MSG.ADMIN.LEVEL.DESC}</p>
                        </div>
                        <button
                            onClick={createLevel}
                            disabled={isCreating}
                            className={`rounded-2xl px-4 py-3 text-white shadow-md transition ${isCreating ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'}`}
                        >
                            {isCreating ? MSG.ADMIN.LEVEL.BTN_CREATING : MSG.ADMIN.LEVEL.BTN_CREATE}
                        </button>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        <input
                            type="text"
                            value={newLevel.name}
                            onChange={(e) => setNewLevel({ ...newLevel, name: e.target.value })}
                            placeholder={MSG.ADMIN.LEVEL.PLACEHOLDER_NAME}
                            className="rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                        <input
                            type="number"
                            value={newLevel.price}
                            onChange={(e) => setNewLevel({ ...newLevel, price: e.target.value })}
                            placeholder={MSG.ADMIN.LEVEL.PLACEHOLDER_PRICE}
                            className="rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                        <input
                            type="number"
                            value={newLevel.dailyShortenLimit}
                            onChange={(e) => setNewLevel({ ...newLevel, dailyShortenLimit: e.target.value })}
                            placeholder={MSG.ADMIN.LEVEL.PLACEHOLDER_DAILY_LIMIT}
                            className="rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                        <input
                            type="number"
                            value={newLevel.maxGroupsCount}
                            onChange={(e) => setNewLevel({ ...newLevel, maxGroupsCount: e.target.value })}
                            placeholder={MSG.ADMIN.LEVEL.PLACEHOLDER_MAX_GROUPS}
                            className="rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                        <input
                            type="number"
                            value={newLevel.maxMembersPerGroup}
                            onChange={(e) => setNewLevel({ ...newLevel, maxMembersPerGroup: e.target.value })}
                            placeholder={MSG.ADMIN.LEVEL.PLACEHOLDER_MAX_MEMBERS}
                            className="rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                        <input
                            type="number"
                            value={newLevel.maxLinksPerGroup}
                            onChange={(e) => setNewLevel({ ...newLevel, maxLinksPerGroup: e.target.value })}
                            placeholder={MSG.ADMIN.LEVEL.PLACEHOLDER_MAX_LINKS}
                            className="rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                    </div>
                    <div className="mt-4 flex flex-wrap gap-6">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={newLevel.allowPassword}
                                onChange={(e) => setNewLevel({ ...newLevel, allowPassword: e.target.checked })}
                                className="h-5 w-5 rounded border-slate-300 text-blue-500 focus:ring-blue-500"
                            />
                            <span className="text-sm text-slate-700">{MSG.ADMIN.LEVEL.LABEL_ALLOW_PASSWORD}</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={newLevel.allowCustomExpiration}
                                onChange={(e) => setNewLevel({ ...newLevel, allowCustomExpiration: e.target.checked })}
                                className="h-5 w-5 rounded border-slate-300 text-blue-500 focus:ring-blue-500"
                            />
                            <span className="text-sm text-slate-700">{MSG.ADMIN.LEVEL.LABEL_ALLOW_EXPIRATION}</span>
                        </label>
                    </div>
                </div>

                <div className="mb-6 flex flex-col gap-4">
                    <div>
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
                            className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[auto_auto_auto]">
                        <select
                            value={sortBy}
                            onChange={(e) => {
                                const nextSortBy = e.target.value;
                                setSortBy(nextSortBy);
                                setCurrentPage(1);
                                loadLevels(1, searchQuery, nextSortBy, sortOrder);
                            }}
                            className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                            className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        >
                            <option value="asc">{MSG.ADMIN.LEVEL.SORT_ASC}</option>
                            <option value="desc">{MSG.ADMIN.LEVEL.SORT_DESC}</option>
                        </select>
                        <button
                            onClick={() => loadLevels(currentPage)}
                            className="rounded-2xl bg-blue-500 px-4 py-3 text-white shadow-md shadow-blue-500/10 transition hover:bg-blue-600"
                        >
                            {MSG.ADMIN.LEVEL.BTN_REFRESH}
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-slate-50">
                    <table className="min-w-full divide-y divide-slate-200 text-sm text-slate-700">
                        <thead className="bg-slate-100 text-slate-900">
                            <tr>
                                <th className="px-4 py-3 text-left">{MSG.ADMIN.LEVEL.COL_NAME}</th>
                                <th className="px-4 py-3 text-left">{MSG.ADMIN.LEVEL.COL_PRICE}</th>
                                <th className="px-4 py-3 text-left">{MSG.ADMIN.LEVEL.COL_DAILY_LIMIT}</th>
                                <th className="px-4 py-3 text-left">{MSG.ADMIN.LEVEL.COL_PASSWORD}</th>
                                <th className="px-4 py-3 text-left">{MSG.ADMIN.LEVEL.COL_TIME}</th>
                                <th className="px-4 py-3 text-left">{MSG.ADMIN.LEVEL.COL_GROUPS}</th>
                                <th className="px-4 py-3 text-left">{MSG.ADMIN.LEVEL.COL_MEMBERS}</th>
                                <th className="px-4 py-3 text-left">{MSG.ADMIN.LEVEL.COL_LINKS}</th>
                                <th className="px-4 py-3 text-left">{MSG.ADMIN.LEVEL.COL_STATUS}</th>
                                <th className="px-4 py-3 text-left">{MSG.ADMIN.LEVEL.COL_ACTION}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white">
                            {levels.map((level) => (
                                <tr key={level._id} className="hover:bg-slate-50">
                                    <td className="px-4 py-3 font-medium">{level.name}</td>
                                    <td className="px-4 py-3">${level.price}</td>
                                    <td className="px-4 py-3">{level.dailyShortenLimit}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <label className="relative inline-flex cursor-pointer items-center">
                                                <input
                                                    type="checkbox"
                                                    checked={level.allowPassword}
                                                    onChange={() => toggleLevelField(level._id, 'allowPassword', level.allowPassword)}
                                                    className="peer sr-only"
                                                />
                                                <span className="block h-6 w-11 rounded-full bg-slate-300 transition peer-checked:bg-blue-500"></span>
                                                <span className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow transition peer-checked:translate-x-5"></span>
                                            </label>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <label className="relative inline-flex cursor-pointer items-center">
                                                <input
                                                    type="checkbox"
                                                    checked={level.allowCustomExpiration}
                                                    onChange={() => toggleLevelField(level._id, 'allowCustomExpiration', level.allowCustomExpiration)}
                                                    className="peer sr-only"
                                                />
                                                <span className="block h-6 w-11 rounded-full bg-slate-300 transition peer-checked:bg-blue-500"></span>
                                                <span className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow transition peer-checked:translate-x-5"></span>
                                            </label>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">{level.maxGroupsCount ?? '-'}</td>
                                    <td className="px-4 py-3">{level.maxMembersPerGroup ?? '-'}</td>
                                    <td className="px-4 py-3">{level.maxLinksPerGroup ?? '-'}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <span className={level.active ? 'inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700' : 'inline-flex rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700'}>
                                                {level.active ? MSG.ADMIN.LEVEL.STATUS_ACTIVE : MSG.ADMIN.LEVEL.STATUS_INACTIVE}
                                            </span>
                                            <label className="relative inline-flex cursor-pointer items-center">
                                                <input
                                                    type="checkbox"
                                                    checked={level.active}
                                                    onChange={() => toggleLevelField(level._id, 'active', level.active)}
                                                    className="peer sr-only"
                                                />
                                                <span className="block h-6 w-11 rounded-full bg-slate-300 transition peer-checked:bg-blue-500"></span>
                                                <span className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow transition peer-checked:translate-x-5"></span>
                                            </label>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setEditingLevel({ ...level })}
                                                className="inline-flex rounded-full bg-blue-500 px-3 py-1 text-sm text-white transition hover:bg-blue-600"
                                            >
                                                {MSG.ADMIN.LEVEL.BTN_EDIT}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <button
                        onClick={() => {
                            const nextPage = Math.max(currentPage - 1, 1);
                            setCurrentPage(nextPage);
                            loadLevels(nextPage);
                        }}
                        disabled={currentPage === 1}
                        className="rounded-2xl bg-slate-200 px-4 py-3 text-slate-700 disabled:opacity-50"
                    >
                        {MSG.ADMIN.LEVEL.BTN_PREV}
                    </button>
                    <div className="text-sm text-slate-700">{MSG.ADMIN.LEVEL.PAGE_INFO(currentPage, totalPages)}</div>
                    <button
                        onClick={() => {
                            const nextPage = Math.min(currentPage + 1, totalPages);
                            setCurrentPage(nextPage);
                            loadLevels(nextPage);
                        }}
                        disabled={currentPage === totalPages}
                        className="rounded-2xl bg-slate-200 px-4 py-3 text-slate-700 disabled:opacity-50"
                    >
                        {MSG.ADMIN.LEVEL.BTN_NEXT}
                    </button>
                </div>
            </div>

            {/* Edit Modal */}
            {editingLevel && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-xl">
                        <h3 className="mb-4 text-lg font-semibold">{MSG.ADMIN.LEVEL.EDIT_TITLE(editingLevel.name)}</h3>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <label className="block text-sm font-medium text-slate-700">{MSG.ADMIN.LEVEL.EDIT_LABEL_NAME}</label>
                                <input
                                    type="text"
                                    value={editingLevel.name}
                                    onChange={(e) => setEditingLevel({ ...editingLevel, name: e.target.value })}
                                    className="mt-1 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">{MSG.ADMIN.LEVEL.EDIT_LABEL_PRICE}</label>
                                <input
                                    type="number"
                                    value={editingLevel.price}
                                    onChange={(e) => setEditingLevel({ ...editingLevel, price: e.target.value })}
                                    className="mt-1 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">{MSG.ADMIN.LEVEL.EDIT_LABEL_DAILY_LIMIT}</label>
                                <input
                                    type="number"
                                    value={editingLevel.dailyShortenLimit}
                                    onChange={(e) => setEditingLevel({ ...editingLevel, dailyShortenLimit: e.target.value })}
                                    className="mt-1 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">{MSG.ADMIN.LEVEL.EDIT_LABEL_MAX_GROUPS}</label>
                                <input
                                    type="number"
                                    value={editingLevel.maxGroupsCount ?? ''}
                                    onChange={(e) => setEditingLevel({ ...editingLevel, maxGroupsCount: e.target.value })}
                                    placeholder={MSG.ADMIN.LEVEL.EDIT_PLACEHOLDER_DEFAULT}
                                    className="mt-1 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">{MSG.ADMIN.LEVEL.EDIT_LABEL_MAX_MEMBERS}</label>
                                <input
                                    type="number"
                                    value={editingLevel.maxMembersPerGroup ?? ''}
                                    onChange={(e) => setEditingLevel({ ...editingLevel, maxMembersPerGroup: e.target.value })}
                                    placeholder={MSG.ADMIN.LEVEL.EDIT_PLACEHOLDER_DEFAULT}
                                    className="mt-1 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">{MSG.ADMIN.LEVEL.EDIT_LABEL_MAX_LINKS}</label>
                                <input
                                    type="number"
                                    value={editingLevel.maxLinksPerGroup ?? ''}
                                    onChange={(e) => setEditingLevel({ ...editingLevel, maxLinksPerGroup: e.target.value })}
                                    placeholder={MSG.ADMIN.LEVEL.EDIT_PLACEHOLDER_DEFAULT}
                                    className="mt-1 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />
                            </div>
                            <div className="flex items-center gap-6 py-6">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={editingLevel.allowPassword}
                                        onChange={(e) => setEditingLevel({ ...editingLevel, allowPassword: e.target.checked })}
                                        className="h-5 w-5 rounded border-slate-300 text-blue-500 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-slate-700">{MSG.ADMIN.LEVEL.EDIT_LABEL_ALLOW_PASSWORD}</span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={editingLevel.allowCustomExpiration}
                                        onChange={(e) => setEditingLevel({ ...editingLevel, allowCustomExpiration: e.target.checked })}
                                        className="h-5 w-5 rounded border-slate-300 text-blue-500 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-slate-700">{MSG.ADMIN.LEVEL.EDIT_LABEL_ALLOW_EXPIRATION}</span>
                                </label>
                            </div>
                        </div>
                        <div className="mt-6 flex gap-3">
                            <button
                                onClick={updateLevel}
                                disabled={isUpdating}
                                className="flex-1 rounded-2xl bg-blue-500 px-4 py-3 text-white transition hover:bg-blue-600 disabled:opacity-50"
                            >
                                {isUpdating ? MSG.ADMIN.LEVEL.BTN_SAVING : MSG.ADMIN.LEVEL.BTN_SAVE}
                            </button>
                            <button
                                onClick={() => setEditingLevel(null)}
                                className="flex-1 rounded-2xl bg-slate-200 px-4 py-3 text-slate-700 transition hover:bg-slate-300"
                            >
                                {MSG.ADMIN.LEVEL.BTN_CANCEL}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </PageWrapper>
    );
};

export default LevelManagementPage;

