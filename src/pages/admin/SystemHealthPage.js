import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { get } from '../../utils/request';
import toast from 'react-hot-toast';
import { getTokenRole, getTokenWithExpiry } from '../../constants/localStorage';
import PageWrapper from '../../components/PageWrapper';
import { MSG } from '../../constants/messages';

const StatusBadge = ({ status }) => {
    const isHealthy = status === 'healthy' || status === 'connected' || status === 'ok';
    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${isHealthy
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-red-50 text-red-700 border border-red-200'
                }`}
        >
            <span className={`h-2 w-2 rounded-full ${isHealthy ? 'bg-emerald-500' : 'bg-red-500'}`} />
            {status}
        </span>
    );
};

const InfoCard = ({ label, value, subValue }) => (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</p>
        <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
        {subValue && <p className="mt-1 text-sm text-slate-500">{subValue}</p>}
    </div>
);

const formatUptime = (seconds) => {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    const parts = [];
    if (d > 0) parts.push(`${d} ${MSG.ADMIN.HEALTH.UPTIME_DAY}`);
    if (h > 0) parts.push(`${h} ${MSG.ADMIN.HEALTH.UPTIME_HOUR}`);
    if (m > 0) parts.push(`${m} ${MSG.ADMIN.HEALTH.UPTIME_MINUTE}`);
    parts.push(`${s} ${MSG.ADMIN.HEALTH.UPTIME_SECOND}`);
    return parts.join(' ');
};

const SystemHealthPage = () => {
    const [health, setHealth] = useState(null);
    const [loading, setLoading] = useState(true);
    const [lastRefreshed, setLastRefreshed] = useState(null);
    const [rateLimited, setRateLimited] = useState(false);
    const navigate = useNavigate();

    const fetchHealth = useCallback(() => {
        setLoading(true);
        get('health')
            .then((response) => {
                setHealth(response);
                setLastRefreshed(new Date());
                setRateLimited(false);
            })
            .catch((error) => {
                if (error.isRateLimited) {
                    setRateLimited(true);
                    toast.error(error.rateLimitMessage);
                } else {
                    const message = error.response?.data?.error?.message || MSG.ADMIN.HEALTH.ERR_CONNECT;
                    toast.error(message);
                    setHealth(null);
                }
            })
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        const role = getTokenRole();
        if (!getTokenWithExpiry() || (role !== 'admin' && role !== 'manager')) {
            navigate('/not-found', { replace: true });
            return;
        }
        fetchHealth();
    }, [navigate, fetchHealth]);

    useEffect(() => {
        if (rateLimited) return;
        const interval = setInterval(fetchHealth, 30000);
        return () => clearInterval(interval);
    }, [fetchHealth, rateLimited]);

    return (
        <PageWrapper
            title={MSG.ADMIN.HEALTH.PAGE_TITLE}
            subtitle={MSG.ADMIN.HEALTH.PAGE_SUBTITLE}
            actions={
                <div className="flex items-center gap-3">
                    {lastRefreshed && (
                        <span className="text-xs text-slate-500">
                            {MSG.ADMIN.HEALTH.LAST_UPDATED} {lastRefreshed.toLocaleTimeString('vi-VN')}
                        </span>
                    )}
                    <button
                        onClick={fetchHealth}
                        disabled={loading}
                        className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                    >
                        {loading ? MSG.ADMIN.HEALTH.BTN_REFRESHING : MSG.ADMIN.HEALTH.BTN_REFRESH}
                    </button>
                </div>
            }
        >
            {rateLimited && (
                <div className="mb-6 rounded-3xl border border-amber-200 bg-amber-50 p-4 flex items-center gap-3">
                    <span className="text-2xl">⏳</span>
                    <div>
                        <p className="text-sm font-medium text-amber-800">{MSG.ADMIN.HEALTH.RATE_LIMITED_TITLE}</p>
                        <p className="text-xs text-amber-600">{MSG.ADMIN.HEALTH.RATE_LIMITED_DESC}</p>
                    </div>
                </div>
            )}

            {loading && !health ? (
                <div className="flex items-center justify-center rounded-3xl border border-slate-200 bg-white p-12">
                    <div className="flex flex-col items-center gap-3">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-500" />
                        <p className="text-sm text-slate-500">{MSG.ADMIN.HEALTH.LOADING_TEXT}</p>
                    </div>
                </div>
            ) : health ? (
                <div className="space-y-6">
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900">{MSG.ADMIN.HEALTH.OVERALL_STATUS}</h2>
                                <p className="mt-1 text-sm text-slate-500">{MSG.ADMIN.HEALTH.OVERALL_DESC}</p>
                            </div>
                            <StatusBadge status={health.status} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <InfoCard
                            label={MSG.ADMIN.HEALTH.LABEL_DATABASE}
                            value={health.database}
                            subValue={health.database === 'connected' ? MSG.ADMIN.HEALTH.DB_CONNECTED : MSG.ADMIN.HEALTH.DB_DISCONNECTED}
                        />
                        <InfoCard
                            label={MSG.ADMIN.HEALTH.LABEL_UPTIME}
                            value={formatUptime(health.uptime)}
                            subValue={MSG.ADMIN.HEALTH.MEMORY_SECONDS(health.uptime)}
                        />
                        <InfoCard
                            label={MSG.ADMIN.HEALTH.LABEL_MEMORY}
                            value={`${health.memory.used} / ${health.memory.total} MB`}
                            subValue={MSG.ADMIN.HEALTH.MEMORY_PERCENT(Math.round((health.memory.used / health.memory.total) * 100))}
                        />
                        <InfoCard
                            label={MSG.ADMIN.HEALTH.LABEL_RATE_LIMIT}
                            value={`${health.rateLimit.limit} requests`}
                            subValue={MSG.ADMIN.HEALTH.RATE_LIMIT_INFO(health.rateLimit.ttl / 1000)}
                        />
                        <InfoCard
                            label={MSG.ADMIN.HEALTH.LABEL_CHECK_TIME}
                            value={new Date(health.timestamp).toLocaleTimeString('vi-VN')}
                            subValue={new Date(health.timestamp).toLocaleDateString('vi-VN')}
                        />
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h3 className="text-sm font-semibold text-slate-900">{MSG.ADMIN.HEALTH.MEMORY_USAGE_TITLE}</h3>
                        <div className="mt-4">
                            <div className="flex items-center justify-between text-sm text-slate-600">
                                <span>{MSG.ADMIN.HEALTH.HEAP_USED}</span>
                                <span>{health.memory.used} MB</span>
                            </div>
                            <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-slate-100">
                                <div
                                    className={`h-full rounded-full transition-all duration-500 ${(health.memory.used / health.memory.total) > 0.8
                                        ? 'bg-red-500'
                                        : (health.memory.used / health.memory.total) > 0.6
                                            ? 'bg-amber-500'
                                            : 'bg-emerald-500'
                                        }`}
                                    style={{
                                        width: `${Math.min((health.memory.used / health.memory.total) * 100, 100)}%`,
                                    }}
                                />
                            </div>
                            <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
                                <span>0 MB</span>
                                <span>{health.memory.total} MB</span>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center rounded-3xl border border-red-200 bg-red-50 p-12">
                    <div className="text-4xl mb-3">⚠️</div>
                    <p className="text-lg font-medium text-red-700">{MSG.ADMIN.HEALTH.ERROR_TITLE}</p>
                    <p className="mt-1 text-sm text-red-500">{MSG.ADMIN.HEALTH.ERROR_DESC}</p>
                    <button
                        onClick={fetchHealth}
                        className="mt-4 rounded-2xl bg-red-600 px-6 py-2 text-sm font-medium text-white transition hover:bg-red-700"
                    >
                        {MSG.ADMIN.HEALTH.BTN_RETRY}
                    </button>
                </div>
            )}
        </PageWrapper>
    );
};

export default SystemHealthPage;
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             ) : (
//                 <div className="flex flex-col items-center justify-center rounded-3xl border border-red-200 bg-red-50 p-12">
//                     <div className="text-4xl mb-3">⚠️</div>
//                     <p className="text-lg font-medium text-red-700">Khong the ket noi den may chu</p>
//                     <p className="mt-1 text-sm text-red-500">Vui long kiem tra ket noi hoac thu lai sau</p>
//                     <button
//                         onClick={fetchHealth}
//                         className="mt-4 rounded-2xl bg-red-600 px-6 py-2 text-sm font-medium text-white transition hover:bg-red-700"
//                     >
//                         Thu lai
//                     </button>
//                 </div>
//             )}
//         </PageWrapper>
//     );
// };

// export default SystemHealthPage;
