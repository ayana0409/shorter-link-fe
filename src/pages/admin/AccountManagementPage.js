import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { get, post, patch } from '../../utils/request';
import toast from 'react-hot-toast';
import { getTokenPayload, getTokenRole, getTokenWithExpiry } from '../../constants/localStorage';
import PageWrapper from '../../components/PageWrapper';

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
                const accountList = Array.isArray(response?.data)
                    ? response.data
                    : [];
                const totalPagesFromResponse = Number(response?.totalPages) || 1;
                const nextPage = Math.min(Math.max(Number(response?.page) || pageNumber, 1), totalPagesFromResponse);

                setAccounts(accountList);
                setCurrentPage(nextPage);
                setTotalPages(totalPagesFromResponse);
            })
            .catch((error) => {
                const message = error.response?.data?.error?.message || 'Không thể tải danh sách tài khoản';
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
            .catch((error) => {
                console.error('Failed to load levels:', error);
            });
    };

    const createAccount = () => {
        if (isCreating) {
            return;
        }

        if (!newAccount.username.trim() || !newAccount.fullname.trim() || !newAccount.password.trim()) {
            toast.error('Vui lòng điền đầy đủ username, fullname và password');
            return;
        }

        setIsCreating(true);
        post('account', newAccount)
            .then(() => {
                toast.success('Tạo tài khoản thành công');
                setNewAccount({ username: '', fullname: '', password: '', role: 'user' });
                loadAccounts(1);
            })
            .catch((error) => {
                const message = error.response?.data?.message || 'Không thể tạo tài khoản';
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
                toast.success('Cập nhật level thành công');
                loadAccounts(currentPage);
            })
            .catch((error) => {
                const message =
                    error.response?.data?.message ||
                    'Không thể cập nhật level';
                toast.error(message);
            })
            .finally(() => {
                setLevelUpdatingId(null);
            });
    };

    const toggleAccountStatus = (account) => {
        const currentUser = getTokenPayload();
        if (currentUser?._id === account._id || currentUser?.username === account.username) {
            toast.error('Không thể khóa tài khoản đang đăng nhập');
            return;
        }

        const nextStatus = !account.isActive;
        const accountId = account._id || account.id;
        setStatusUpdatingId(accountId);
        patch(`account/${accountId}/active`, { isActive: nextStatus })
            .then(() => {
                toast.success(`Tài khoản ${nextStatus ? 'đã được mở khóa' : 'đã bị khóa'}`);
                loadAccounts(currentPage);
            })
            .catch((error) => {
                const message = error.response?.data?.message || 'Không thể thay đổi trạng thái tài khoản';
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

    return (
        <PageWrapper
            title="Quản lý tài khoản"
            subtitle="Tạo, tìm kiếm và quản lý tài khoản người dùng"
        >
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-300/10">
                <div className="mb-6">
                    <div>
                        <h2 className="text-2xl font-semibold text-slate-900">Quản lý tài khoản</h2>
                        <p className="mt-2 text-sm text-slate-600">Tạo mới và quản lý trạng thái tài khoản trong hệ thống.</p>
                    </div>
                </div>

                <div className="mb-6 rounded-3xl border border-slate-200 bg-slate-50 p-6">
                    <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <h3 className="text-xl font-semibold text-slate-900">Tạo tài khoản mới</h3>
                            <p className="text-sm text-slate-600">Thêm tài khoản mới cho hệ thống.</p>
                        </div>
                        <button
                            onClick={createAccount}
                            disabled={isCreating}
                            className={`rounded-2xl px-4 py-3 text-white shadow-md transition ${isCreating ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'}`}
                        >
                            {isCreating ? 'Đang tạo...' : 'Tạo tài khoản'}
                        </button>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                        <input
                            type="text"
                            value={newAccount.username}
                            onChange={(e) => setNewAccount({ ...newAccount, username: e.target.value })}
                            placeholder="Username"
                            className="rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                        <input
                            type="text"
                            value={newAccount.fullname}
                            onChange={(e) => setNewAccount({ ...newAccount, fullname: e.target.value })}
                            placeholder="Fullname"
                            className="rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                        <input
                            type="password"
                            value={newAccount.password}
                            onChange={(e) => setNewAccount({ ...newAccount, password: e.target.value })}
                            placeholder="Password"
                            className="rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                        <select
                            value={newAccount.role}
                            onChange={(e) => setNewAccount({ ...newAccount, role: e.target.value })}
                            disabled={getTokenRole() === 'manager'}
                            className="rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                        </select>
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
                                loadAccounts(1, nextSearch, sortBy, sortOrder);
                            }}
                            placeholder="Tìm kiếm username hoặc fullname"
                            className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[auto_auto_auto_auto]">
                        <select
                            value={sortBy}
                            onChange={(e) => {
                                const nextSortBy = e.target.value;
                                setSortBy(nextSortBy);
                                setCurrentPage(1);
                                loadAccounts(1, searchQuery, nextSortBy, sortOrder);
                            }}
                            className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        >
                            <option value="createdAt">Mới nhất</option>
                            <option value="username">Username</option>
                            <option value="fullname">Fullname</option>
                        </select>
                        <select
                            value={sortOrder}
                            onChange={(e) => {
                                const nextSortOrder = e.target.value;
                                setSortOrder(nextSortOrder);
                                setCurrentPage(1);
                                loadAccounts(1, searchQuery, sortBy, nextSortOrder);
                            }}
                            className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        >
                            <option value="desc">Giảm dần</option>
                            <option value="asc">Tăng dần</option>
                        </select>
                        <button
                            onClick={() => loadAccounts(currentPage)}
                            className="rounded-2xl bg-blue-500 px-4 py-3 text-white shadow-md shadow-blue-500/10 transition hover:bg-blue-600"
                        >
                            Làm mới
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-slate-50">
                    <table className="min-w-full divide-y divide-slate-200 text-sm text-slate-700">
                        <thead className="bg-slate-100 text-slate-900">
                            <tr>
                                <th className="px-4 py-3 text-left">Username</th>
                                <th className="px-4 py-3 text-left">Fullname</th>
                                <th className="px-4 py-3 text-left">Role</th>
                                <th className="px-4 py-3 text-left">Level</th>
                                <th className="px-4 py-3 text-left">Trạng thái</th>
                                <th className="px-4 py-3 text-left">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white">
                            {accounts.map((account) => (
                                <tr key={account._id || account.id} className="hover:bg-slate-50">
                                    <td className="px-4 py-3">{account.username}</td>
                                    <td className="px-4 py-3">{account.fullname}</td>
                                    <td className="px-4 py-3">{account.role}</td>
                                    <td className="px-4 py-3">{account.level ? account.level.name : 'Free'}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <span className={account.isActive ? 'inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700' : 'inline-flex rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700'}>
                                                {account.isActive ? 'Hoạt động' : 'Đã khóa'}
                                            </span>
                                            <label className="relative inline-flex cursor-pointer items-center">
                                                <input
                                                    type="checkbox"
                                                    checked={account.isActive}
                                                    disabled={statusUpdatingId === (account._id || account.id)}
                                                    onChange={() => toggleAccountStatus(account)}
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
                                                onClick={() => {
                                                    setSelectedAccountForLevel(account);
                                                    setSelectedLevelId(account.level?._id || '');
                                                    setLevelExpirationDate(account.levelExpirationDate ? new Date(account.levelExpirationDate).toISOString().slice(0, 16) : '');
                                                }}
                                                className="inline-flex rounded-full bg-orange-500 px-3 py-1 text-sm text-white transition hover:bg-orange-600"
                                            >
                                                Nạp VIP
                                            </button>
                                            <Link
                                                to={`/admin/${account._id || account.id}`}
                                                className="inline-flex rounded-full bg-blue-500 px-3 py-1 text-sm text-white transition hover:bg-blue-600"
                                            >
                                                Xem chi tiết
                                            </Link>
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
                            loadAccounts(nextPage);
                        }}
                        disabled={currentPage === 1}
                        className="rounded-2xl bg-slate-200 px-4 py-3 text-slate-700 disabled:opacity-50"
                    >
                        Trước
                    </button>
                    <div className="text-sm text-slate-700">Trang {currentPage} / {totalPages}</div>
                    <button
                        onClick={() => {
                            const nextPage = Math.min(currentPage + 1, totalPages);
                            setCurrentPage(nextPage);
                            loadAccounts(nextPage);
                        }}
                        disabled={currentPage === totalPages}
                        className="rounded-2xl bg-slate-200 px-4 py-3 text-slate-700 disabled:opacity-50"
                    >
                        Sau
                    </button>
                </div>
            </div>

            {/* Level Update Modal */}
            {selectedAccountForLevel && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
                        <h3 className="mb-4 text-lg font-semibold">Cập nhật Level cho {selectedAccountForLevel.username}</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Level</label>
                                <select
                                    value={selectedLevelId}
                                    onChange={(e) => setSelectedLevelId(e.target.value)}
                                    className="mt-1 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                >
                                    <option key={'free'} value={''}>
                                        Free - $0
                                    </option>
                                    {levels.map((level) => (
                                        <option key={level._id} value={level._id}>
                                            {level.name} - ${level.price}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Ngày hết hạn</label>
                                <input
                                    type="datetime-local"
                                    value={levelExpirationDate}
                                    onChange={(e) => setLevelExpirationDate(e.target.value)}
                                    className="mt-1 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />
                            </div>
                        </div>
                        <div className="mt-6 flex gap-3">
                            <button
                                onClick={() => {
                                    const levelId = selectedLevelId || null;
                                    const expiration = levelExpirationDate ? new Date(levelExpirationDate) : null;
                                    updateLevel(selectedAccountForLevel._id, levelId, expiration);
                                    setSelectedAccountForLevel(null);
                                    setSelectedLevelId('');
                                    setLevelExpirationDate('');
                                }}
                                disabled={levelUpdatingId === selectedAccountForLevel._id}
                                className="flex-1 rounded-2xl bg-blue-500 px-4 py-3 text-white transition hover:bg-blue-600 disabled:opacity-50"
                            >
                                {levelUpdatingId === selectedAccountForLevel._id ? 'Đang cập nhật...' : 'Cập nhật'}
                            </button>
                            <button
                                onClick={() => {
                                    setSelectedAccountForLevel(null);
                                    setSelectedLevelId('');
                                    setLevelExpirationDate('');
                                }}
                                className="flex-1 rounded-2xl bg-slate-200 px-4 py-3 text-slate-700 transition hover:bg-slate-300"
                            >
                                Hủy
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </PageWrapper>
    );
};

export default AccountManagementPage;
