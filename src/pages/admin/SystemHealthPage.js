import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { get, post } from '../../utils/request';
import toast from 'react-hot-toast';
import { getTokenRole, getTokenWithExpiry } from '../../constants/localStorage';
import PageWrapper from '../../components/PageWrapper';
import { MSG } from '../../constants/messages';

/**
 * Modern Status Badge with real-time pulsing dot
 */
const StatusBadge = ({ status }) => {
    const isHealthy = status === 'healthy' || status === 'connected' || status === 'ok';
    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                isHealthy
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                    : 'bg-rose-50 text-rose-700 border border-rose-200/80'
            }`}
        >
            <span className={`h-2 w-2 rounded-full ${isHealthy ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
            <span className="capitalize">{status}</span>
        </span>
    );
};

/**
 * Bento InfoCard Component
 */
const InfoCard = ({ label, value, subValue, icon }) => (
    <div className="double-bezel-outer p-1 rounded-2xl bg-slate-200/50">
        <div className="double-bezel-inner p-4 bg-white rounded-[calc(1rem-0.25rem)] shadow-soft-xs space-y-1.5">
            <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-bold uppercase tracking-wider">{label}</span>
                {icon && <span className="text-slate-400">{icon}</span>}
            </div>
            <p className="font-mono text-xl sm:text-2xl font-bold tracking-tight text-slate-900 truncate">{value}</p>
            {subValue && <p className="text-xs text-slate-500 font-medium truncate">{subValue}</p>}
        </div>
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

/**
 * SystemHealthPage Component
 * High-end Infrastructure & Cache Monitoring Center.
 */
const SystemHealthPage = () => {
    const [health, setHealth] = useState(null);
    const [loading, setLoading] = useState(true);
    const [lastRefreshed, setLastRefreshed] = useState(null);
    const [rateLimited, setRateLimited] = useState(false);
    const [flushingCache, setFlushingCache] = useState(false);
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

    const flushCache = useCallback(() => {
        setFlushingCache(true);
        post('admin/redis/flush')
            .then(() => {
                toast.success(MSG.ADMIN.HEALTH.CACHE_FLUSHED);
                fetchHealth();
            })
            .catch((error) => {
                const message = error.response?.data?.error?.message || MSG.ADMIN.HEALTH.ERR_FLUSH_CACHE;
                toast.error(message);
            })
            .finally(() => setFlushingCache(false));
    }, [fetchHealth]);

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
                        <span className="text-xs text-slate-500 font-mono hidden sm:inline">
                            {MSG.ADMIN.HEALTH.LAST_UPDATED} {lastRefreshed.toLocaleTimeString('vi-VN')}
                        </span>
                    )}
                    <button
                        onClick={fetchHealth}
                        disabled={loading}
                        className="px-4 py-2 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-soft-xs transition flex items-center gap-1.5 disabled:opacity-50"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={loading ? "animate-spin" : ""}>
                            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                        </svg>
                        <span>{loading ? MSG.ADMIN.HEALTH.BTN_REFRESHING : MSG.ADMIN.HEALTH.BTN_REFRESH}</span>
                    </button>
                </div>
            }
        >
            <div className="space-y-6 max-w-6xl mx-auto">
                {/* Rate Limited Notification Card (Replacing emoji with clean SVG Hourglass) */}
                {rateLimited && (
                    <div className="double-bezel-outer p-1.5 rounded-3xl bg-amber-500/10 ring-1 ring-amber-500/20">
                        <div className="double-bezel-inner p-4 bg-white/95 backdrop-blur-md rounded-[calc(1.5rem-0.375rem)] flex items-center gap-3.5">
                            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M5 22h14" />
                                    <path d="M5 2h14" />
                                    <path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22" />
                                    <path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm font-bold text-amber-900">{MSG.ADMIN.HEALTH.RATE_LIMITED_TITLE}</p>
                                <p className="text-xs text-amber-700 mt-0.5">{MSG.ADMIN.HEALTH.RATE_LIMITED_DESC}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Loading Skeleton */}
                {loading && !health ? (
                    <div className="py-24 text-center space-y-3">
                        <div className="w-8 h-8 mx-auto border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        <p className="text-xs font-medium text-slate-400">{MSG.ADMIN.HEALTH.LOADING_TEXT}</p>
                    </div>
                ) : health ? (
                    <div className="space-y-6">
                        {/* Overall System Status Banner */}
                        <div className="double-bezel-outer p-1.5 rounded-3xl bg-slate-200/50">
                            <div className="double-bezel-inner p-5 sm:p-6 bg-white rounded-[calc(1.5rem-0.375rem)] shadow-soft-sm flex items-center justify-between gap-4">
                                <div>
                                    <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
                                        {MSG.ADMIN.HEALTH.OVERALL_STATUS}
                                    </h2>
                                    <p className="text-xs text-slate-500 mt-0.5">{MSG.ADMIN.HEALTH.OVERALL_DESC}</p>
                                </div>
                                <StatusBadge status={health.status} />
                            </div>
                        </div>

                        {/* Core Infrastructure Bento Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                            <InfoCard
                                label={MSG.ADMIN.HEALTH.LABEL_DATABASE}
                                value={health.database}
                                subValue={health.database === 'connected' ? MSG.ADMIN.HEALTH.DB_CONNECTED : MSG.ADMIN.HEALTH.DB_DISCONNECTED}
                                icon={
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <ellipse cx="12" cy="5" rx="9" ry="3" />
                                        <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                                        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                                    </svg>
                                }
                            />
                            <InfoCard
                                label={MSG.ADMIN.HEALTH.LABEL_UPTIME}
                                value={formatUptime(health.uptime)}
                                subValue={MSG.ADMIN.HEALTH.MEMORY_SECONDS(health.uptime)}
                                icon={
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10" />
                                        <polyline points="12 6 12 12 16 14" />
                                    </svg>
                                }
                            />
                            <InfoCard
                                label={MSG.ADMIN.HEALTH.LABEL_MEMORY}
                                value={`${health.memory.used} / ${health.memory.total} MB`}
                                subValue={MSG.ADMIN.HEALTH.MEMORY_PERCENT(Math.round((health.memory.used / health.memory.total) * 100))}
                                icon={
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect width="18" height="18" x="3" y="3" rx="2" />
                                        <path d="M7 7h.01M17 7h.01M7 17h.01M17 17h.01" />
                                    </svg>
                                }
                            />
                            <InfoCard
                                label={MSG.ADMIN.HEALTH.LABEL_RATE_LIMIT}
                                value={`${health.rateLimit.limit} req`}
                                subValue={MSG.ADMIN.HEALTH.RATE_LIMIT_INFO(health.rateLimit.ttl / 1000)}
                                icon={
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                    </svg>
                                }
                            />
                            <InfoCard
                                label={MSG.ADMIN.HEALTH.LABEL_CHECK_TIME}
                                value={new Date(health.timestamp).toLocaleTimeString('vi-VN')}
                                subValue={new Date(health.timestamp).toLocaleDateString('vi-VN')}
                                icon={
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                                        <line x1="16" y1="2" x2="16" y2="6" />
                                        <line x1="8" y1="2" x2="8" y2="6" />
                                        <line x1="3" y1="10" x2="21" y2="10" />
                                    </svg>
                                }
                            />
                            <InfoCard
                                label={MSG.ADMIN.HEALTH.LABEL_ACTIVE_SESSIONS || "Active Sessions"}
                                value={health.activeSessions?.total ?? 0}
                                subValue={MSG.ADMIN.HEALTH.ACTIVE_SESSIONS_SUB || "người dùng trực tuyến"}
                                icon={
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                        <circle cx="9" cy="7" r="4" />
                                    </svg>
                                }
                            />
                        </div>

                        {/* Memory Heap Usage Progress Bar */}
                        <div className="double-bezel-outer p-1.5 rounded-[2rem] bg-slate-200/50">
                            <div className="double-bezel-inner p-5 sm:p-6 bg-white rounded-[calc(2rem-0.375rem)] shadow-soft-sm space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                                        {MSG.ADMIN.HEALTH.MEMORY_USAGE_TITLE}
                                    </h3>
                                    <span className="font-mono text-xs font-semibold text-slate-600">
                                        {health.memory.used} MB / {health.memory.total} MB
                                    </span>
                                </div>

                                <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100 p-0.5">
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 ${
                                            health.memory.used / health.memory.total > 0.8
                                                ? 'bg-rose-500'
                                                : health.memory.used / health.memory.total > 0.6
                                                ? 'bg-amber-500'
                                                : 'bg-emerald-500'
                                        }`}
                                        style={{
                                            width: `${Math.min((health.memory.used / health.memory.total) * 100, 100)}%`,
                                        }}
                                    />
                                </div>
                                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                                    <span>0 MB</span>
                                    <span>{health.memory.total} MB (Giới hạn cấp phát)</span>
                                </div>
                            </div>
                        </div>

                        {/* Redis Cache & Queue Operations Card */}
                        <div className="double-bezel-outer p-1.5 rounded-[2rem] bg-slate-200/50">
                            <div className="double-bezel-inner p-5 sm:p-7 bg-white rounded-[calc(2rem-0.375rem)] shadow-soft-md space-y-6">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                                            {MSG.ADMIN.HEALTH.REDIS_SECTION_TITLE}
                                        </h3>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            {MSG.ADMIN.HEALTH.REDIS_SECTION_DESC}
                                        </p>
                                    </div>
                                    <StatusBadge status={health.redis?.connected ? 'connected' : 'disconnected'} />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                            {MSG.ADMIN.HEALTH.LABEL_REDIS}
                                        </span>
                                        <p className="mt-1 font-mono text-lg font-bold text-slate-900">
                                            {health.redis?.connected ? MSG.ADMIN.HEALTH.REDIS_CONNECTED : MSG.ADMIN.HEALTH.REDIS_DISCONNECTED}
                                        </p>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                            {MSG.ADMIN.HEALTH.LABEL_PENDING_NOTIFICATIONS}
                                        </span>
                                        <p className="mt-1 font-mono text-lg font-bold text-slate-900">
                                            {health.redis?.pendingNotifications > 0
                                                ? MSG.ADMIN.HEALTH.PENDING_COUNT(health.redis.pendingNotifications)
                                                : MSG.ADMIN.HEALTH.NO_PENDING}
                                        </p>
                                    </div>
                                </div>

                                {/* Cache Statistics with Flush Button */}
                                {health.redis?.connected && health.redis?.cache && (
                                    <div className="p-5 rounded-2xl bg-blue-50/50 border border-blue-100/80 space-y-4">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                            <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
                                                {MSG.ADMIN.HEALTH.CACHE_STATS_TITLE}
                                            </span>
                                            <button
                                                onClick={flushCache}
                                                disabled={flushingCache}
                                                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white text-xs font-semibold shadow-soft-xs transition disabled:opacity-50 flex items-center justify-center gap-1.5 self-start sm:self-auto"
                                            >
                                                {flushingCache && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                                                <span>{flushingCache ? MSG.ADMIN.HEALTH.BTN_FLUSHING : MSG.ADMIN.HEALTH.BTN_FLUSH_CACHE}</span>
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                            <div className="p-3 rounded-xl bg-white border border-blue-100">
                                                <p className="text-[11px] text-slate-500">{MSG.ADMIN.HEALTH.CACHE_TOTAL_KEYS}</p>
                                                <p className="mt-1 font-mono text-base font-bold text-slate-900">{health.redis.cache.totalKeys}</p>
                                            </div>
                                            <div className="p-3 rounded-xl bg-white border border-blue-100">
                                                <p className="text-[11px] text-slate-500">{MSG.ADMIN.HEALTH.CACHE_MEMORY}</p>
                                                <p className="mt-1 font-mono text-base font-bold text-slate-900">{health.redis.cache.estimatedMemoryKB} KB</p>
                                            </div>
                                            <div className="p-3 rounded-xl bg-white border border-blue-100">
                                                <p className="text-[11px] text-slate-500">{MSG.ADMIN.HEALTH.CACHE_SHORT_URL}</p>
                                                <p className="mt-1 font-mono text-base font-bold text-slate-900">{health.redis.cache.shortUrl?.count ?? 0}</p>
                                            </div>
                                            <div className="p-3 rounded-xl bg-white border border-blue-100">
                                                <p className="text-[11px] text-slate-500">{MSG.ADMIN.HEALTH.CACHE_USER_PERM}</p>
                                                <p className="mt-1 font-mono text-base font-bold text-slate-900">{health.redis.cache.userPermissions?.count ?? 0}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>
        </PageWrapper>
    );
};

export default SystemHealthPage;
