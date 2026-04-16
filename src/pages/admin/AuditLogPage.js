import { useEffect, useState } from 'react';
import { get, remove } from '../../utils/request';
import toast from 'react-hot-toast';
import { getTokenRole, getTokenWithExpiry } from '../../constants/localStorage';
import PageWrapper from '../../components/PageWrapper';

const AuditLogPage = () => {
    const [logs, setLogs] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [actionFilter, setActionFilter] = useState('all');
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState('desc');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [detailLogId, setDetailLogId] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isDeleting, setIsDeleting] = useState(false);
    const pageSize = 5;

    const loadLogs = (
        page = 1,
        search = searchQuery,
        action = actionFilter,
        sort = sortBy,
        order = sortOrder,
    ) => {
        const pageNumber = Math.max(1, Number(page) || 1);
        const params = new URLSearchParams();
        const trimmedSearch = search?.trim() ?? '';
        if (trimmedSearch) params.append('search', trimmedSearch);
        if (action) params.append('action', action);
        if (sort) params.append('sortBy', sort);
        if (order) params.append('sortOrder', order);
        params.append('page', String(pageNumber));
        params.append('limit', String(pageSize));

        get(`audit/admin?${params.toString()}`)
            .then((response) => {
                const logsList = Array.isArray(response?.data) ? response.data : [];
                const totalPagesFromResponse = Number(response?.totalPages) || 1;
                const nextPage = Math.min(Math.max(Number(response?.page) || pageNumber, 1), totalPagesFromResponse);

                setLogs(logsList);
                setCurrentPage(nextPage);
                setTotalPages(totalPagesFromResponse);
            })
            .catch((error) => {
                const message = error.response?.data?.error?.message || 'Không thể tải nhật ký hoạt động';
                toast.error(message);
            });
    };

    useEffect(() => {
        if (!getTokenWithExpiry() || getTokenRole() !== 'admin') {
            toast.error('Bạn không có quyền truy cập');
            return;
        }

        loadLogs(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const formatDate = (value) => {
        if (!value) return '-';
        return new Date(value).toLocaleString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    };

    const deleteLogs = () => {
        const trimmedFrom = fromDate.trim();
        const trimmedTo = toDate.trim();
        const params = new URLSearchParams();

        if (actionFilter) {
            params.append('action', actionFilter);
        }
        if (trimmedFrom) {
            params.append('from', trimmedFrom);
        }
        if (trimmedTo) {
            params.append('to', trimmedTo);
        }

        if (!window.confirm('Bạn có chắc muốn xóa các log theo điều kiện này?')) {
            return;
        }

        setIsDeleting(true);
        remove(`audit/admin?${params.toString()}`)
            .then((response) => {
                toast.success(`Đã xóa ${response.deletedCount || 0} bản ghi`);
                loadLogs(1);
            })
            .catch((error) => {
                const message = error.response?.data?.message || 'Không thể xóa nhật ký';
                toast.error(message);
            })
            .finally(() => {
                setIsDeleting(false);
            });
    };

    return (
        <PageWrapper
            title="Nhật ký hoạt động"
            subtitle="Xem lại các thao tác tạo / cập nhật / xóa và lỗi hệ thống trong hệ thống"
        >
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-300/10">
                <div className="mb-6">
                    <div>
                        <h2 className="text-2xl font-semibold text-slate-900">Nhật ký hoạt động</h2>
                        <p className="mt-2 text-sm text-slate-600">Kiểm tra ai đã thực hiện hành động nào và khi nào.</p>
                    </div>
                </div>

                <div className="mb-6 grid gap-3 lg:grid-cols-[1.5fr_1fr] xl:grid-cols-[2fr_auto]">
                    <div className="grid gap-3 sm:grid-cols-2">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => {
                                const nextSearch = e.target.value;
                                setSearchQuery(nextSearch);
                                setCurrentPage(1);
                                loadLogs(1, nextSearch, actionFilter, sortBy, sortOrder);
                            }}
                            placeholder="Tìm kiếm tên thực thể, hành động, người thực hiện hoặc mô tả"
                            className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                        <select
                            value={actionFilter}
                            onChange={(e) => {
                                const nextAction = e.target.value;
                                setActionFilter(nextAction);
                                setCurrentPage(1);
                                loadLogs(1, searchQuery, nextAction, sortBy, sortOrder);
                            }}
                            className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        >
                            <option value="all">Tất cả hành động</option>
                            <option value="create">Create</option>
                            <option value="update">Update</option>
                            <option value="delete">Delete</option>
                            <option value="error">Error</option>
                        </select>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                        <input
                            type="date"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            placeholder="Từ ngày"
                        />
                        <input
                            type="date"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                            className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            placeholder="Đến ngày"
                        />
                        <button
                            onClick={deleteLogs}
                            disabled={isDeleting}
                            className={`rounded-2xl ${isDeleting ? 'bg-slate-400 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600'} px-4 py-3 text-white shadow-md shadow-red-500/10 transition`}
                        >
                            {isDeleting ? 'Đang xóa...' : 'Xóa log theo điều kiện'}
                        </button>
                    </div>
                </div>

                <div className="mb-6 grid gap-3 sm:grid-cols-3 xl:grid-cols-[auto_auto_auto]">
                    <select
                        value={sortBy}
                        onChange={(e) => {
                            const nextSortBy = e.target.value;
                            setSortBy(nextSortBy);
                            setCurrentPage(1);
                            loadLogs(1, searchQuery, actionFilter, nextSortBy, sortOrder);
                        }}
                        className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    >
                        <option value="createdAt">Mới nhất</option>
                        <option value="entity">Thực thể</option>
                        <option value="performedBy">Người thực hiện</option>
                    </select>
                    <select
                        value={sortOrder}
                        onChange={(e) => {
                            const nextSortOrder = e.target.value;
                            setSortOrder(nextSortOrder);
                            setCurrentPage(1);
                            loadLogs(1, searchQuery, actionFilter, sortBy, nextSortOrder);
                        }}
                        className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    >
                        <option value="desc">Giảm dần</option>
                        <option value="asc">Tăng dần</option>
                    </select>
                    <button
                        onClick={() => loadLogs(1)}
                        className="rounded-2xl bg-blue-500 px-4 py-3 text-white shadow-md shadow-blue-500/10 transition hover:bg-blue-600"
                    >
                        Làm mới
                    </button>
                </div>

                <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-slate-50">
                    <table className="min-w-full divide-y divide-slate-200 text-sm text-slate-700">
                        <thead className="bg-slate-100 text-slate-900">
                            <tr>
                                <th className="px-4 py-3 text-left">Thời gian</th>
                                <th className="px-4 py-3 text-left">Hành động</th>
                                <th className="px-4 py-3 text-left">Thực thể</th>
                                <th className="px-4 py-3 text-left">Người thực hiện</th>
                                <th className="px-4 py-3 text-left">Mô tả</th>
                                <th className="px-4 py-3 text-left">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white">
                            {logs.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                                        Chưa có nhật ký phù hợp
                                    </td>
                                </tr>
                            ) : (
                                logs.flatMap((log) => {
                                    const isOpen = detailLogId === (log._id || log.id);
                                    return [
                                        <tr key={`${log._id || log.id}-summary`} className="hover:bg-slate-50">
                                            <td className="px-4 py-3 whitespace-nowrap">{formatDate(log.createdAt)}</td>
                                            <td className="px-4 py-3 capitalize">{log.action}</td>
                                            <td className="px-4 py-3">{log.entity}</td>
                                            <td className="px-4 py-3">{log.performedBy || 'Hệ thống'}</td>
                                            <td className="px-4 py-3 break-words max-w-xl">{log.description}</td>
                                            <td className="px-4 py-3">
                                                <button
                                                    onClick={() => setDetailLogId(isOpen ? null : (log._id || log.id))}
                                                    className="rounded-2xl bg-blue-500 px-3 py-1 text-white transition hover:bg-blue-600"
                                                >
                                                    {isOpen ? 'Ẩn chi tiết' : 'Chi tiết'}
                                                </button>
                                            </td>
                                        </tr>,
                                        isOpen ? (
                                            <tr key={`${log._id || log.id}-detail`} className="bg-slate-50">
                                                <td colSpan={6} className="px-4 py-4 text-slate-700">
                                                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                                                        <div>
                                                            <p className="text-xs uppercase text-slate-500">Phương thức</p>
                                                            <p className="mt-1 text-sm text-slate-900">{log.requestMethod || '-'}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs uppercase text-slate-500">URL</p>
                                                            <p className="mt-1 text-sm text-slate-900 break-words">{log.requestUrl || '-'}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs uppercase text-slate-500">ID thực thể</p>
                                                            <p className="mt-1 text-sm text-slate-900">{log.entityId || '-'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                                                        <div>
                                                            <p className="text-xs uppercase text-slate-500">Yêu cầu</p>
                                                            <pre className="mt-1 max-h-40 overflow-auto rounded-2xl border border-slate-200 bg-white p-3 text-xs text-slate-700">{log.requestBody ? JSON.stringify(log.requestBody, null, 2) : '-'}</pre>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs uppercase text-slate-500">Lỗi / Mô tả chi tiết</p>
                                                            <pre className="mt-1 max-h-40 overflow-auto rounded-2xl border border-slate-200 bg-white p-3 text-xs text-slate-700">{log.error || log.description || '-'}</pre>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : null,
                                    ];
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <button
                        onClick={() => {
                            const nextPage = Math.max(currentPage - 1, 1);
                            setCurrentPage(nextPage);
                            loadLogs(nextPage);
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
                            loadLogs(nextPage);
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

export default AuditLogPage;
