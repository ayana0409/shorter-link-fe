import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams, Link } from 'react-router-dom';
import { get, patch, remove } from '../../utils/request';
import toast from 'react-hot-toast';
import { getTokenRole, getTokenWithExpiry } from '../../constants/localStorage';

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

    useEffect(() => {
        const role = getTokenRole();
        if (!getTokenWithExpiry() || role !== 'admin') {
            navigate('/not-found', { replace: true });
            return;
        }

        refreshLinks(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, navigate, location.pathname]);

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
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="bg-white p-6 rounded-lg shadow">Đang tải chi tiết tài khoản...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 py-10">
            <div className="mx-auto max-w-6xl bg-white shadow-lg rounded-lg p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Chi tiết tài khoản</h1>
                        <p className="text-sm text-gray-600">Thông tin tài khoản và liên kết của người dùng</p>
                    </div>
                    <div className="flex gap-2">
                        <Link
                            to="/admin"
                            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition duration-300"
                        >
                            Quay lại admin
                        </Link>
                        <Link
                            to="/home"
                            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition duration-300"
                        >
                            Về trang chính
                        </Link>
                    </div>
                </div>

                <div className="mb-6 rounded-lg border border-gray-200 p-4">
                    <h2 className="text-xl font-semibold mb-3">Thông tin tài khoản</h2>
                    <p><span className="font-semibold">Username:</span> {account.username}</p>
                    <p><span className="font-semibold">Fullname:</span> {account.fullname}</p>
                    <p><span className="font-semibold">Role:</span> {account.role}</p>
                </div>

                <div>
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-xl font-semibold">Danh sách liên kết</h2>
                            <p className="text-sm text-gray-600">Lọc và phân trang giống CreateLink</p>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
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
                                className="w-full sm:w-64 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <select
                                value={statusFilter}
                                onChange={(e) => {
                                    const nextStatus = e.target.value;
                                    setStatusFilter(nextStatus);
                                    setCurrentPage(1);
                                    refreshLinks(1, searchQuery, nextStatus, sortBy, sortOrder);
                                }}
                                className="p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                className="p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                className="p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="desc">Giảm dần</option>
                                <option value="asc">Tăng dần</option>
                            </select>
                            <button
                                onClick={() => refreshLinks(currentPage)}
                                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition duration-300"
                            >
                                Làm mới
                            </button>
                        </div>
                    </div>
                    {links.length > 0 ? (
                        <div>
                            <table className="table-auto w-full border-collapse">
                                <thead>
                                    <tr>
                                        <th className="px-4 py-2 border">Tên trang web</th>
                                        <th className="px-4 py-2 border">Link rút gọn</th>
                                        <th className="px-4 py-2 border">Lượt click</th>
                                        <th className="px-4 py-2 border">Trạng thái</th>
                                        <th className="px-4 py-2 border">Hết hạn</th>
                                        <th className="px-4 py-2 border">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedLinks.map((link) => (
                                        <tr key={link._id || link.id}>
                                            <td className="border px-4 py-2">
                                                <span
                                                    title={link.originalUrl}
                                                    className="cursor-help underline decoration-dotted"
                                                >
                                                    {link.siteName ?? 'Không rõ'}
                                                </span>
                                            </td>
                                            <td className="border px-4 py-2">localhost:3000/{link.shortUrl}</td>
                                            <td className="border px-4 py-2">{link.clicks ?? 0}</td>
                                            <td className="border px-4 py-2">{getLinkStatus(link)}</td>
                                            <td className="border px-4 py-2">{link.expiresAt ? new Date(link.expiresAt).toLocaleString() : 'Không có'}</td>
                                            <td className="border px-4 py-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                                                <button
                                                    onClick={() => toggleLinkStatus(link)}
                                                    disabled={isLinkExpired(link)}
                                                    className={`px-3 py-1 rounded transition duration-200 ${isLinkExpired(link)
                                                        ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                                                        : link.status === 'disabled'
                                                            ? 'bg-green-500 text-white hover:bg-green-600'
                                                            : 'bg-orange-500 text-white hover:bg-orange-600'}`}
                                                >
                                                    {link.status === 'disabled' ? 'Bật' : 'Tắt'}
                                                </button>
                                                <button
                                                    onClick={() => deleteLink(link._id || link.id)}
                                                    className="px-3 py-1 rounded bg-red-500 text-white hover:bg-red-600 transition duration-200"
                                                >
                                                    Xóa
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="mt-4 flex items-center justify-between">
                                <button
                                    onClick={() => {
                                        const nextPage = Math.max(currentPage - 1, 1);
                                        setCurrentPage(nextPage);
                                        refreshLinks(nextPage);
                                    }}
                                    disabled={currentPage === 1}
                                    className="px-4 py-2 rounded bg-gray-200 text-gray-700 disabled:opacity-50"
                                >
                                    Trước
                                </button>
                                <div className="text-sm text-gray-700">
                                    Trang {currentPage} / {totalPages}
                                </div>
                                <button
                                    onClick={() => {
                                        const nextPage = Math.min(currentPage + 1, totalPages);
                                        setCurrentPage(nextPage);
                                        refreshLinks(nextPage);
                                    }}
                                    disabled={currentPage === totalPages}
                                    className="px-4 py-2 rounded bg-gray-200 text-gray-700 disabled:opacity-50"
                                >
                                    Sau
                                </button>
                            </div>
                        </div>
                    ) : (
                        <p className="text-gray-500">Không có liên kết nào cho tài khoản này</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AccountDetailPage;
