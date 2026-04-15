import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { get } from '../../utils/request';
import toast from 'react-hot-toast';
import { getTokenRole, getTokenWithExpiry } from '../../constants/localStorage';

const AdminPage = () => {
    const [accounts, setAccounts] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState('desc');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
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
                const message = error.response?.data?.message || 'Không thể tải danh sách tài khoản';
                toast.error(message);
            });
    };

    useEffect(() => {
        const role = getTokenRole();
        if (!getTokenWithExpiry() || role !== 'admin') {
            navigate('/not-found', { replace: true });
            return;
        }

        loadAccounts(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [navigate]);

    return (
        <div className="min-h-screen bg-gray-100 py-10">
            <div className="mx-auto max-w-6xl bg-white shadow-lg rounded-lg p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Quản trị tài khoản</h1>
                        <p className="text-sm text-gray-600">Danh sách tài khoản hiện có</p>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
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
                            className="w-full sm:w-80 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <select
                            value={sortBy}
                            onChange={(e) => {
                                const nextSortBy = e.target.value;
                                setSortBy(nextSortBy);
                                setCurrentPage(1);
                                loadAccounts(1, searchQuery, nextSortBy, sortOrder);
                            }}
                            className="p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                            className="p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="desc">Giảm dần</option>
                            <option value="asc">Tăng dần</option>
                        </select>
                        <button
                            onClick={() => loadAccounts(currentPage)}
                            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition duration-300"
                        >
                            Làm mới
                        </button>
                    </div>
                    <Link
                        to="/home"
                        className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition duration-300"
                    >
                        Về trang chính
                    </Link>
                </div>

                <table className="table-auto w-full border-collapse">
                    <thead>
                        <tr>
                            <th className="px-4 py-2 border">Username</th>
                            <th className="px-4 py-2 border">Fullname</th>
                            <th className="px-4 py-2 border">Role</th>
                            <th className="px-4 py-2 border">Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {accounts.map((account) => (
                            <tr key={account._id || account.id}>
                                <td className="border px-4 py-2">{account.username}</td>
                                <td className="border px-4 py-2">{account.fullname}</td>
                                <td className="border px-4 py-2">{account.role}</td>
                                <td className="border px-4 py-2">
                                    <Link
                                        to={`/admin/${account._id || account.id}`}
                                        className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition duration-200"
                                    >
                                        Xem chi tiết
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="mt-6 flex items-center justify-between">
                    <button
                        onClick={() => {
                            const nextPage = Math.max(currentPage - 1, 1);
                            setCurrentPage(nextPage);
                            loadAccounts(nextPage);
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
                            loadAccounts(nextPage);
                        }}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 rounded bg-gray-200 text-gray-700 disabled:opacity-50"
                    >
                        Sau
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminPage;
