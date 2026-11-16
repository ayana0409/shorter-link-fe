import { Fragment, useEffect, useState } from 'react';
import { get, remove } from '../../utils/request';
import toast from 'react-hot-toast';
import { getTokenRole, getTokenWithExpiry } from '../../constants/localStorage';
import { MSG } from '../../constants/messages';
import PageWrapper from '../../components/PageWrapper';

/**
 * Action Badge with color categorization
 */
const ActionBadge = ({ action }) => {
    const act = (action || '').toLowerCase();
    let style = 'bg-slate-100 text-slate-700 border-slate-200';
    if (act.includes('create') || act.includes('insert') || act.includes('add')) {
        style = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    } else if (act.includes('update') || act.includes('edit') || act.includes('patch')) {
        style = 'bg-blue-50 text-blue-700 border-blue-200';
    } else if (act.includes('delete') || act.includes('remove')) {
        style = 'bg-rose-50 text-rose-700 border-rose-200';
    } else if (act.includes('error') || act.includes('fail') || act.includes('warn')) {
        style = 'bg-amber-50 text-amber-800 border-amber-200';
    }

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${style} capitalize`}>
            {action}
        </span>
    );
};

/**
 * AuditLogPage Component
 * High-end security activity log inspector.
 * Features Dual Mode (Desktop Studio Table + Mobile Activity Cards).
 */
const AuditLogPage = () => {
    const [logs, setLogs] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [actionFilter, setActionFilter] = useState('all');
    const sortBy = 'createdAt';
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
        if (action && action !== 'all') params.append('action', action);
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
                const message = error.response?.data?.error?.message || MSG.ADMIN.AUDIT.ERR_LOAD;
                toast.error(message);
            });
    };

    useEffect(() => {
        if (!getTokenWithExpiry() || getTokenRole() !== 'admin') {
            toast.error(MSG.ADMIN.AUDIT.ERR_NO_ACCESS);
            return;
        }
        loadLogs(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const formatDate = (value) => {
        if (!value) return '—';
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

        if (actionFilter && actionFilter !== 'all') {
            params.append('action', actionFilter);
        }
        if (trimmedFrom) {
            params.append('from', trimmedFrom);
        }
        if (trimmedTo) {
            params.append('to', trimmedTo);
        }

        if (!window.confirm(MSG.ADMIN.AUDIT.CONFIRM_DELETE)) {
            return;
        }

        setIsDeleting(true);
        remove(`audit/admin?${params.toString()}`)
            .then((response) => {
                toast.success(MSG.ADMIN.AUDIT.SUCCESS_DELETE(response.deletedCount || 0));
                loadLogs(1);
            })
            .catch((error) => {
                const message = error.response?.data?.message || MSG.ADMIN.AUDIT.ERR_DELETE;
                toast.error(message);
            })
            .finally(() => {
                setIsDeleting(false);
            });
    };

    return (
        <PageWrapper
            title={MSG.ADMIN.AUDIT.PAGE_TITLE}
            subtitle={MSG.ADMIN.AUDIT.PAGE_SUBTITLE}
        >
            <div className="space-y-6 max-w-6xl mx-auto">
                {/* Main Double-Bezel Audit Container */}
                <div className="double-bezel-outer p-1.5 rounded-[2rem] bg-slate-200/50">
                    <div className="double-bezel-inner p-5 sm:p-7 bg-white rounded-[calc(2rem-0.375rem)] shadow-soft-md space-y-6">
                        {/* Section Header */}
                        <div className="pb-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                                <h2 className="text-xl font-bold tracking-tight text-slate-900">{MSG.ADMIN.AUDIT.TITLE}</h2>
                                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">{MSG.ADMIN.AUDIT.DESC}</p>
                            </div>
                            <span className="font-mono text-xs px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 font-medium self-start sm:self-auto">
                                Trang {currentPage} / {totalPages}
                            </span>
                        </div>

                        {/* Search & Filter Toolbar */}
                        <div className="space-y-3">
                            <div className="grid gap-2.5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                                <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-slate-900 focus-within:border-blue-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 transition">
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
                                            loadLogs(1, nextSearch, actionFilter, sortBy, sortOrder);
                                        }}
                                        placeholder={MSG.ADMIN.AUDIT.SEARCH_PLACEHOLDER}
                                        className="w-full bg-transparent text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none"
                                    />
                                </div>

                                <select
                                    value={actionFilter}
                                    onChange={(e) => {
                                        const nextAction = e.target.value;
                                        setActionFilter(nextAction);
                                        setCurrentPage(1);
                                        loadLogs(1, searchQuery, nextAction, sortBy, sortOrder);
                                    }}
                                    className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 outline-none transition"
                                >
                                    <option value="all">{MSG.ADMIN.AUDIT.FILTER_ALL}</option>
                                    <option value="create">{MSG.ADMIN.AUDIT.FILTER_CREATE}</option>
                                    <option value="update">{MSG.ADMIN.AUDIT.FILTER_UPDATE}</option>
                                    <option value="delete">{MSG.ADMIN.AUDIT.FILTER_DELETE}</option>
                                    <option value="error">{MSG.ADMIN.AUDIT.FILTER_ERROR}</option>
                                </select>

                                <div className="flex items-center gap-2">
                                    <select
                                        value={sortOrder}
                                        onChange={(e) => {
                                            const nextSortOrder = e.target.value;
                                            setSortOrder(nextSortOrder);
                                            setCurrentPage(1);
                                            loadLogs(1, searchQuery, actionFilter, sortBy, nextSortOrder);
                                        }}
                                        className="h-10 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 outline-none transition"
                                    >
                                        <option value="desc">Mới nhất</option>
                                        <option value="asc">Cũ nhất</option>
                                    </select>
                                    <button
                                        type="button"
                                        onClick={() => loadLogs(1)}
                                        title={MSG.ADMIN.AUDIT.BTN_REFRESH}
                                        className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition shrink-0"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            {/* Purge / Date Condition Toolbar */}
                            <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-slate-500 font-medium">Khoảng ngày:</span>
                                    <input
                                        type="date"
                                        value={fromDate}
                                        onChange={(e) => setFromDate(e.target.value)}
                                        className="h-8 px-2.5 rounded-lg border border-slate-200 bg-white font-mono text-slate-700 outline-none"
                                    />
                                    <span className="text-slate-400">→</span>
                                    <input
                                        type="date"
                                        value={toDate}
                                        onChange={(e) => setToDate(e.target.value)}
                                        className="h-8 px-2.5 rounded-lg border border-slate-200 bg-white font-mono text-slate-700 outline-none"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={deleteLogs}
                                    disabled={isDeleting}
                                    className="px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold transition disabled:opacity-50"
                                >
                                    {isDeleting ? MSG.ADMIN.AUDIT.BTN_DELETING : MSG.ADMIN.AUDIT.BTN_DELETE_CONDITION}
                                </button>
                            </div>
                        </div>

                        {logs.length === 0 ? (
                            <div className="py-16 text-center space-y-2">
                                <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 ring-1 ring-slate-100">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                    </svg>
                                </div>
                                <p className="text-xs font-medium text-slate-400">Chưa có nhật ký phù hợp</p>
                            </div>
                        ) : (
                            <>
                                {/* Desktop View: Audit Studio Table */}
                                <div className="hidden md:block overflow-x-auto">
                                    <table className="w-full text-left text-sm text-slate-600">
                                        <thead>
                                            <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wider text-slate-400">
                                                <th className="pb-3.5 pl-2 font-mono">{MSG.ADMIN.AUDIT.COL_TIME}</th>
                                                <th className="pb-3.5 px-3">{MSG.ADMIN.AUDIT.COL_ACTION}</th>
                                                <th className="pb-3.5 px-3">{MSG.ADMIN.AUDIT.COL_ENTITY}</th>
                                                <th className="pb-3.5 px-3">{MSG.ADMIN.AUDIT.COL_PERFORMED_BY}</th>
                                                <th className="pb-3.5 px-3">{MSG.ADMIN.AUDIT.COL_DESC}</th>
                                                <th className="pb-3.5 pr-2 text-right">{MSG.ADMIN.AUDIT.COL_ACTIONS}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {logs.map((log) => {
                                                const logId = log._id || log.id;
                                                const isOpen = detailLogId === logId;

                                                return (
                                                    <Fragment key={logId}>
                                                        <tr className="hover:bg-slate-50/70 transition">
                                                            <td className="py-4 pl-2 font-mono text-xs text-slate-500 whitespace-nowrap">
                                                                {formatDate(log.createdAt)}
                                                            </td>
                                                            <td className="py-4 px-3">
                                                                <ActionBadge action={log.action} />
                                                            </td>
                                                            <td className="py-4 px-3 font-semibold text-slate-900 text-xs">
                                                                {log.entity}
                                                            </td>
                                                            <td className="py-4 px-3 text-xs text-slate-700">
                                                                {log.performedBy || MSG.ADMIN.AUDIT.SYSTEM}
                                                            </td>
                                                            <td className="py-4 px-3 text-xs text-slate-600 max-w-sm truncate" title={log.description}>
                                                                {log.description}
                                                            </td>
                                                            <td className="py-4 pr-2 text-right">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setDetailLogId(isOpen ? null : logId)}
                                                                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${isOpen
                                                                        ? 'bg-slate-200 text-slate-800'
                                                                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                                                        }`}
                                                                >
                                                                    {isOpen ? MSG.ADMIN.AUDIT.BTN_HIDE_DETAIL : MSG.ADMIN.AUDIT.BTN_DETAIL}
                                                                </button>
                                                            </td>
                                                        </tr>

                                                        {/* Expandable JSON Detail Drawer */}
                                                        {isOpen && (
                                                            <tr>
                                                                <td colSpan={6} className="p-4 bg-slate-50/80">
                                                                    <div className="space-y-3 p-4 bg-white rounded-2xl border border-slate-200 shadow-soft-xs text-xs">
                                                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pb-3 border-b border-slate-100 font-mono">
                                                                            <div>
                                                                                <span className="text-slate-400 block text-[10px] uppercase">{MSG.ADMIN.AUDIT.DETAIL_METHOD}</span>
                                                                                <span className="font-bold text-slate-800">{log.requestMethod || '—'}</span>
                                                                            </div>
                                                                            <div>
                                                                                <span className="text-slate-400 block text-[10px] uppercase">{MSG.ADMIN.AUDIT.DETAIL_URL}</span>
                                                                                <span className="font-bold text-blue-600 break-all">{log.requestUrl || '—'}</span>
                                                                            </div>
                                                                            <div>
                                                                                <span className="text-slate-400 block text-[10px] uppercase">{MSG.ADMIN.AUDIT.DETAIL_ENTITY_ID}</span>
                                                                                <span className="font-bold text-slate-700">{log.entityId || '—'}</span>
                                                                            </div>
                                                                        </div>

                                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                                            <div>
                                                                                <span className="text-slate-500 font-bold uppercase text-[10px] block mb-1">
                                                                                    {MSG.ADMIN.AUDIT.DETAIL_REQUEST}
                                                                                </span>
                                                                                <pre className="p-3 rounded-xl bg-slate-900 text-slate-100 font-mono text-[11px] max-h-48 overflow-auto">
                                                                                    {log.requestBody ? JSON.stringify(log.requestBody, null, 2) : '—'}
                                                                                </pre>
                                                                            </div>
                                                                            <div>
                                                                                <span className="text-slate-500 font-bold uppercase text-[10px] block mb-1">
                                                                                    {MSG.ADMIN.AUDIT.DETAIL_ERROR}
                                                                                </span>
                                                                                <pre className="p-3 rounded-xl bg-slate-900 text-slate-100 font-mono text-[11px] max-h-48 overflow-auto">
                                                                                    {log.error || log.description || '—'}
                                                                                </pre>
                                                                            </div>
                                                                        </div>
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

                                {/* Mobile View: Activity Cards Stack */}
                                <div className="block md:hidden space-y-3.5">
                                    {logs.map((log) => {
                                        const logId = log._id || log.id;
                                        const isOpen = detailLogId === logId;

                                        return (
                                            <div key={logId} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-3">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <ActionBadge action={log.action} />
                                                        <span className="font-bold text-slate-900 text-xs">{log.entity}</span>
                                                    </div>
                                                    <span className="font-mono text-[11px] text-slate-500 shrink-0">
                                                        {formatDate(log.createdAt)}
                                                    </span>
                                                </div>

                                                <p className="text-xs text-slate-700 break-words">{log.description}</p>
                                                <p className="text-[11px] text-slate-400">Bởi: {log.performedBy || MSG.ADMIN.AUDIT.SYSTEM}</p>

                                                <button
                                                    type="button"
                                                    onClick={() => setDetailLogId(isOpen ? null : logId)}
                                                    className="w-full min-h-[40px] rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold flex items-center justify-center text-center"
                                                >
                                                    {isOpen ? MSG.ADMIN.AUDIT.BTN_HIDE_DETAIL : MSG.ADMIN.AUDIT.BTN_DETAIL}
                                                </button>

                                                {isOpen && (
                                                    <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-2">
                                                        <div className="font-mono text-[11px] space-y-1">
                                                            <div>Method: <span className="font-bold">{log.requestMethod || '—'}</span></div>
                                                            <div className="break-all">URL: <span className="text-blue-600">{log.requestUrl || '—'}</span></div>
                                                        </div>
                                                        <pre className="p-2.5 rounded-lg bg-slate-900 text-slate-100 font-mono text-[10px] max-h-36 overflow-auto">
                                                            {log.requestBody ? JSON.stringify(log.requestBody, null, 2) : '—'}
                                                        </pre>
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
                                        loadLogs(prevPage);
                                    }}
                                    disabled={currentPage === 1}
                                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    {MSG.ADMIN.AUDIT.BTN_PREV}
                                </button>
                                <span className="font-mono text-slate-500">
                                    {MSG.ADMIN.AUDIT.PAGE_INFO(currentPage, totalPages)}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const nextPage = Math.min(currentPage + 1, totalPages);
                                        setCurrentPage(nextPage);
                                        loadLogs(nextPage);
                                    }}
                                    disabled={currentPage === totalPages}
                                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    {MSG.ADMIN.AUDIT.BTN_NEXT}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </PageWrapper>
    );
};

export default AuditLogPage;
