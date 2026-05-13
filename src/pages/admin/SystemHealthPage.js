import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { get } from '../../utils/request';
import toast from 'react-hot-toast';
import { getTokenRole, getTokenWithExpiry } from '../../constants/localStorage';
import PageWrapper from '../../components/PageWrapper';

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
    if (d > 0) parts.push(`${d} ngày`);
    if (h > 0) parts.push(`${h} giờ`);
    if (m > 0) parts.push(`${m} phút`);
    parts.push(`${s} giây`);
    return parts.join(' ');
};

const SystemHealthPage = () => {
    const [health, setHealth] = useState(null);
    const [loading, setLoading] = useState(true);
    const [lastRefreshed, setLastRefreshed] = useState(null);
    const navigate = useNavigate();

    const fetchHealth = useCallback(() => {
        setLoading(true);
        get('health')
            .then((response) => {
                setHealth(response);
                setLastRefreshed(new Date());
            })
            .catch((error) => {
                const message = error.response?.data?.message || 'Không thể kết nối đến máy chủ';
                toast.error(message);
                setHealth(null);
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

    // Auto refresh every 30s
    useEffect(() => {
        const interval = setInterval(fetchHealth, 30000);
        return () => clearInterval(interval);
    }, [fetchHealth]);

    return (
        <PageWrapper
            title="Trạng thái hệ thống"
            subtitle="Theo dõi sức khỏe và hiệu suất của máy chủ"
            actions={
                <div className="flex items-center gap-3">
                    {lastRefreshed && (
                        <span className="text-xs text-slate-500">
                            Cập nhật: {lastRefreshed.toLocaleTimeString('vi-VN')}
                        </span>
                    )}
                    <button
                        onClick={fetchHealth}
                        disabled={loading}
                        className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                    >
                        {loading ? 'Đang tải...' : 'Làm mới'}
                    </button>
                </div>
            }
        >
            {loading && !health ? (
                <div className="flex items-center justify-center rounded-3xl border border-slate-200 bg-white p-12">
                    <div className="flex flex-col items-center gap-3">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-500" />
                        <p className="text-sm text-slate-500">Đang kiểm tra trạng thái...</p>
                    </div>
                </div>
            ) : health ? (
                <div className="space-y-6">
                    {/* Overall Status */}
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900">Trạng thái tổng thể</h2>
                                <p className="mt-1 text-sm text-slate-500">Tất cả dịch vụ đang hoạt động bình thường</p>
                            </div>
                            <StatusBadge status={health.status} />
                        </div>
                    </div>

                    {/* Info Grid */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <InfoCard
                            label="Cơ sở dữ liệu"
                            value={health.database}
                            subValue={health.database === 'connected' ? 'Kết nối ổn định' : 'Mất kết nối'}
                        />
                        <InfoCard
                            label="Thời gian hoạt động"
                            value={formatUptime(health.uptime)}
                            subValue={`${health.uptime} giây`}
                        />
                        <InfoCard
                            label="Bộ nhớ sử dụng"
                            value={`${health.memory.used} / ${health.memory.total} MB`}
                            subValue={`${Math.round((health.memory.used / health.memory.total) * 100)}% đã dùng`}
                        />
                        <InfoCard
                            label="Rate Limit"
                            value={`${health.rateLimit.limit} requests`}
                            subValue={`Mỗi ${health.rateLimit.ttl / 1000}s`}
                        />
                        <InfoCard
                            label="Thời điểm kiểm tra"
                            value={new Date(health.timestamp).toLocaleTimeString('vi-VN')}
                            subValue={new Date(health.timestamp).toLocaleDateString('vi-VN')}
                        />
                    </div>

                    {/* Memory Bar */}
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h3 className="text-sm font-semibold text-slate-900">Sử dụng bộ nhớ</h3>
                        <div className="mt-4">
                            <div className="flex items-center justify-between text-sm text-slate-600">
                                <span>Heap Used</span>
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
                    <p className="text-lg font-medium text-red-700">Không thể kết nối đến máy chủ</p>
                    <p className="mt-1 text-sm text-red-500">Vui lòng kiểm tra kết nối hoặc thử lại sau</p>
                    <button
                        onClick={fetchHealth}
                        className="mt-4 rounded-2xl bg-red-600 px-6 py-2 text-sm font-medium text-white transition hover:bg-red-700"
                    >
                        Thử lại
                    </button>
                </div>
            )}
        </PageWrapper>
    );
};

export default SystemHealthPage;
