import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { get, patch, remove } from '../../utils/request';
import toast from 'react-hot-toast';
import { getTokenPayload, getTokenRole, getTokenWithExpiry } from '../../constants/localStorage';
import PageWrapper from '../../components/PageWrapper';

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
    const pageSize = 5;
    const navigate = useNavigate();
    const location = useLocation();

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
                const linksList = Array.isArray(response?.links)
                    ? response.links
                    : [];
                const totalPagesFromResponse = Number(response?.totalPages) || 1;
                const nextPage = Math.min(Math.max(Number(response?.page) || pageNumber, 1), totalPagesFromResponse);

                setLinks(linksList);
                setCurrentPage(nextPage);
                setTotalPages(totalPagesFromResponse);
            })
            .catch((error) => {
                const message = error.response?.data?.message || 'Không thể tải chi tiết tài khoản';
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
                toast.success('Cập nhật tài khoản thành công');
                setAccount(updatedAccount);
                setEditAccount({ ...editAccount, password: '' });
            })
            .catch((error) => {
                const message = error.response?.data?.message || 'Không thể cập nhật tài khoản';
                toast.error(message);
            })
            .finally(() => {
                setIsSaving(false);
            });
    };

    const deleteAccount = () => {
        if (!window.confirm('Bạn có chắc muốn xóa tài khoản này?')) {
            return;
        }

        setIsDeleting(true);
        remove(`account/${id}`)
            .then(() => {
                toast.success('Xóa tài khoản thành công');
                navigate('/admin');
            })
            .catch((error) => {
                const message = error.response?.data?.message || 'Không thể xóa tài khoản';
                toast.error(message);
            })
            .finally(() => {
                setIsDeleting(false);
            });
    };

    const toggleAccountStatus = () => {
        if (!account) {
            return;
        }
        const currentUser = getTokenPayload();
        if (currentUser?._id === account._id || currentUser?.username === account.username) {
            toast.error('Không thể khóa tài khoản đang đăng nhập');
            return;
        }
        const nextStatus = !account.isActive;
        setIsStatusUpdating(true);

        patch(`account/${id}/active`, { isActive: nextStatus })
            .then((updatedAccount) => {
                toast.success(`Tài khoản ${nextStatus ? 'đã được mở khóa' : 'đã bị khóa'}`);
                setAccount(updatedAccount);
            })
            .catch((error) => {
                const message = error.response?.data?.message || 'Không thể thay đổi trạng thái tài khoản';
                toast.error(message);
            })
            .finally(() => {
                setIsStatusUpdating(false);
            });
    };

    useEffect(() => {
        const role = getTokenRole();
        if (!getTokenWithExpiry() || role !== 'admin') {
            navigate('/not-found', { replace: true });
            return;
        }

        refreshLinks(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, navigate, location.pathname]);

    useEffect(() => {
        if (account) {
            setEditAccount({
                fullname: account.fullname || '',
                password: '',
                role: account.role || 'user',
            });
        }
    }, [account]);

    const getLinkStatus = (link) => {
        if (link.status === 'disabled') {
            return 'Đã xóa';
        }

        const expiresAt = link.expiresAt ? new Date(link.expiresAt) : null;
        if (expiresAt && expiresAt < new Date()) {
            return 'Hết hạn';
        }

        return 'Còn hạn';
    };

    const isLinkExpired = (link) => {
        const expiresAt = link.expiresAt ? new Date(link.expiresAt) : null;
        return expiresAt ? expiresAt < new Date() : false;
    };

    const toggleLinkStatus = (link) => {
        if (isLinkExpired(link)) {
            toast.error('Liên kết đã hết hạn, không thể thay đổi trạng thái');
            return;
        }

        const nextStatus = link.status === 'disabled' ? 'active' : 'disabled';
        patch(`shortener/${link._id || link.id}`, { status: nextStatus })
            .then(() => {
                toast.success('Cập nhật trạng thái liên kết thành công');
                refreshLinks(currentPage);
            })
            .catch((error) => {
                const message = error.response?.data?.message || 'Không thể cập nhật trạng thái liên kết';
                toast.error(message);
            });
    };

    const deleteLink = (linkId) => {
        remove(`shortener/${linkId}`)
            .then(() => {
                toast.success('Đã xóa liên kết');
                refreshLinks(currentPage);
            })
            .catch((error) => {
                const message = error.response?.data?.message || 'Không thể xóa liên kết';
                toast.error(message);
            });
    };

    const paginatedLinks = links;

    if (!account) {
        return (
            <PageWrapper
                title="Chi tiết tài khoản"
                subtitle="Đang tải thông tin tài khoản và liên kết"
            >
                <div className="mx-auto max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm shadow-slate-300/10">
                    Đang tải chi tiết tài khoản...
                </div>
            </PageWrapper>
        );
    }

    return (
        <PageWrapper
            title="Chi tiết tài khoản"
            subtitle="Xem thông tin tài khoản và các liên kết đã tạo"
        >
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-300/10">
                <div className="mb-6">
                    <div>
                        <h2 className="text-2xl font-semibold text-slate-900">Thông tin tài khoản</h2>
                        <p className="mt-2 text-sm text-slate-600">Thông tin chi tiết và liên kết của người dùng</p>
                    </div>
                </div>

                <div className="mb-6 rounded-3xl border border-slate-200 bg-slate-50 p-6">
                    <h3 className="text-xl font-semibold text-slate-900 mb-3">Thông tin tài khoản</h3>
                    <div className="grid gap-3 md:grid-cols-3">
                        <p><span className="font-semibold">Username:</span> {account.username}</p>
                        <p><span className="font-semibold">Fullname:</span> {account.fullname}</p>
                        <p><span className="font-semibold">Role:</span> {account.role}</p>
                        <p className="md:col-span-3 flex items-center gap-3">
                            <span className="font-semibold">Trạng thái:</span>
                            <span className={account.isActive ? 'inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700' : 'inline-flex rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700'}>
                                {account.isActive ? 'Hoạt động' : 'Đã khóa'}
                            </span>
                        </p>
                        <p className="md:col-span-3 flex items-center gap-3">
                            <span className="font-semibold">Khóa tài khoản:</span>
                            <label className="inline-flex cursor-pointer items-center gap-3 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-sm transition hover:bg-slate-200 disabled:opacity-50">
                                <span>{account.isActive ? 'Bật' : 'Tắt'}</span>
                                <input
                                    type="checkbox"
                                    checked={account.isActive}
                                    disabled={isStatusUpdating || getTokenPayload()?._id === account._id || getTokenPayload()?.username === account.username}
                                    onChange={toggleAccountStatus}
                                    className="h-5 w-10 rounded-full border border-slate-300 bg-white text-blue-600 transition duration-150 ease-in-out checked:bg-blue-500"
                                />
                            </label>
                        </p>
                    </div>
                </div>

                <div className="mb-6 rounded-3xl border border-slate-200 bg-slate-50 p-6">
                    <div className="mb-4">
                        <h3 className="text-xl font-semibold text-slate-900">Chỉnh sửa tài khoản</h3>
                        <p className="text-sm text-slate-600">Cập nhật thông tin fullname, mật khẩu hoặc role.</p>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1fr_1fr]">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">Fullname</label>
                            <input
                                type="text"
                                value={editAccount.fullname}
                                onChange={(e) => setEditAccount({ ...editAccount, fullname: e.target.value })}
                                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">Role</label>
                            <select
                                value={editAccount.role}
                                onChange={(e) => setEditAccount({ ...editAccount, role: e.target.value })}
                                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            >
                                <option value="user">User</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className="mb-2 block text-sm font-medium text-slate-700">Password mới</label>
                            <input
                                type="password"
                                value={editAccount.password}
                                onChange={(e) => setEditAccount({ ...editAccount, password: e.target.value })}
                                placeholder="Để trống nếu không đổi"
                                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                        </div>
                    </div>
                    <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-between">
                        <button
                            onClick={saveAccountChanges}
                            disabled={isSaving}
                            className={`rounded-2xl px-4 py-3 text-white shadow-md transition ${isSaving ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'}`}
                        >
                            {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                        </button>
                        <button
                            onClick={deleteAccount}
                            disabled={isDeleting}
                            className={`rounded-2xl px-4 py-3 text-white shadow-md transition ${isDeleting ? 'bg-slate-400 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600'}`}
                        >
                            {isDeleting ? 'Đang xóa...' : 'Xóa tài khoản'}
                        </button>
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
                                refreshLinks(1, nextSearch, statusFilter, sortBy, sortOrder);
                            }}
                            placeholder="Tìm kiếm theo tên web"
                            className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[auto_auto_auto_auto]">
                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                const nextStatus = e.target.value;
                                setStatusFilter(nextStatus);
                                setCurrentPage(1);
                                refreshLinks(1, searchQuery, nextStatus, sortBy, sortOrder);
                            }}
                            className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        >
                            <option value="all">Tất cả</option>
                            <option value="valid">Còn hạn</option>
                            <option value="expired">Hết hạn</option>
                            <option value="disabled">Đã xóa</option>
                        </select>
                        <select
                            value={sortBy}
                            onChange={(e) => {
                                const nextSortBy = e.target.value;
                                setSortBy(nextSortBy);
                                setCurrentPage(1);
                                refreshLinks(1, searchQuery, statusFilter, nextSortBy, sortOrder);
                            }}
                            className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        >
                            <option value="createdAt">Mới nhất</option>
                            <option value="siteName">Tên trang</option>
                            <option value="clicks">Lượt click</option>
                        </select>
                        <select
                            value={sortOrder}
                            onChange={(e) => {
                                const nextSortOrder = e.target.value;
                                setSortOrder(nextSortOrder);
                                setCurrentPage(1);
                                refreshLinks(1, searchQuery, statusFilter, sortBy, nextSortOrder);
                            }}
                            className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        >
                            <option value="desc">Giảm dần</option>
                            <option value="asc">Tăng dần</option>
                        </select>
                        <button
                            onClick={() => refreshLinks(currentPage)}
                            className="rounded-2xl bg-blue-500 px-4 py-3 text-white shadow-md shadow-blue-500/10 transition hover:bg-blue-600"
                        >
                            Làm mới
                        </button>
                    </div>
                </div>

                {links.length > 0 ? (
                    <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-slate-50">
                        <table className="min-w-full divide-y divide-slate-200 text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900">
                                <tr>
                                    <th className="px-4 py-3">Tên trang web</th>
                                    <th className="px-4 py-3">Link rút gọn</th>
                                    <th className="px-4 py-3">Bảo mật</th>
                                    <th className="px-4 py-3">Lượt click</th>
                                    <th className="px-4 py-3">Trạng thái</th>
                                    <th className="px-4 py-3">Hết hạn</th>
                                    <th className="px-4 py-3">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 bg-white">
                                {paginatedLinks.map((link) => (
                                    <tr key={link._id || link.id} className="hover:bg-slate-50">
                                        <td className="px-4 py-3">
                                            <span title={link.originalUrl} className="cursor-help underline decoration-dotted">
                                                {link.siteName ?? 'Không rõ'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">{clientUrl}/s/{link.shortUrl}</td>
                                        <td className="px-4 py-3">
                                            <span className={link.passwordProtected ? 'inline-flex rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-orange-700' : 'inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700'}>
                                                {link.passwordProtected ? 'Có' : 'Không'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">{link.clicks ?? 0}</td>
                                        <td className="px-4 py-3">{getLinkStatus(link)}</td>
                                        <td className="px-4 py-3">{link.expiresAt ? new Date(link.expiresAt).toLocaleString() : 'Không có'}</td>
                                        <td className="px-4 py-3 space-y-2 sm:space-y-0 sm:flex sm:flex-wrap sm:gap-2">
                                            <button
                                                onClick={() => toggleLinkStatus(link)}
                                                disabled={isLinkExpired(link)}
                                                className={`rounded-full px-3 py-1 text-sm font-medium transition ${isLinkExpired(link)
                                                    ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                                                    : link.status === 'disabled'
                                                        ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                                                        : 'bg-orange-500 text-white hover:bg-orange-600'}`}
                                            >
                                                {link.status === 'disabled' ? 'Bật' : 'Tắt'}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (editingPasswordLinkId === (link._id || link.id)) {
                                                        setEditingPasswordLinkId('');
                                                        setNewLinkPassword('');
                                                        setConfirmNewLinkPassword('');
                                                    } else {
                                                        setEditingPasswordLinkId(link._id || link.id);
                                                        setNewLinkPassword('');
                                                        setConfirmNewLinkPassword('');
                                                    }
                                                }}
                                                className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700 hover:bg-slate-200 transition"
                                            >
                                                {editingPasswordLinkId === (link._id || link.id) ? 'Hủy mật khẩu' : 'Đổi mật khẩu'}
                                            </button>
                                            <button
                                                onClick={() => deleteLink(link._id || link.id)}
                                                className="rounded-full bg-red-500 px-3 py-1 text-sm text-white hover:bg-red-600 transition"
                                            >
                                                Xóa
                                            </button>
                                            {editingPasswordLinkId === (link._id || link.id) && (
                                                <div className="flex w-full flex-col gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-3">
                                                    <input
                                                        type="password"
                                                        value={newLinkPassword}
                                                        onChange={(e) => setNewLinkPassword(e.target.value)}
                                                        placeholder="Mật khẩu mới"
                                                        className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none"
                                                    />
                                                    <input
                                                        type="password"
                                                        value={confirmNewLinkPassword}
                                                        onChange={(e) => setConfirmNewLinkPassword(e.target.value)}
                                                        placeholder="Xác nhận mật khẩu"
                                                        className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            if (!newLinkPassword.trim() || !confirmNewLinkPassword.trim()) {
                                                                toast.error('Vui lòng nhập mật khẩu và xác nhận mật khẩu');
                                                                return;
                                                            }
                                                            if (newLinkPassword !== confirmNewLinkPassword) {
                                                                toast.error('Mật khẩu và xác nhận mật khẩu không khớp');
                                                                return;
                                                            }
                                                            patch(`shortener/${link._id || link.id}`, { password: newLinkPassword })
                                                                .then(() => {
                                                                    toast.success('Cập nhật mật khẩu liên kết thành công');
                                                                    setEditingPasswordLinkId('');
                                                                    setNewLinkPassword('');
                                                                    setConfirmNewLinkPassword('');
                                                                    refreshLinks(currentPage);
                                                                })
                                                                .catch((error) => {
                                                                    const message = error.response?.data?.message || 'Không thể cập nhật mật khẩu liên kết';
                                                                    toast.error(message);
                                                                });
                                                        }}
                                                        className="rounded-2xl bg-blue-500 px-3 py-2 text-white text-sm hover:bg-blue-600 transition"
                                                    >
                                                        Lưu mật khẩu
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-center text-slate-500 py-8">Chưa có liên kết nào cho tài khoản này</p>
                )}

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <button
                        onClick={() => {
                            const nextPage = Math.max(currentPage - 1, 1);
                            setCurrentPage(nextPage);
                            refreshLinks(nextPage);
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
                            refreshLinks(nextPage);
                        }}
                        disabled={currentPage === totalPages}
                        className="rounded-2xl bg-slate-200 px-4 py-3 text-slate-700 disabled:opacity-50"
                    >
                        Sau
                    </button>
                </div>
            </div>
        </PageWrapper>
    );
};

export default AccountDetailPage;
