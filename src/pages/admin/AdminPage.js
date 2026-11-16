import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { get } from '../../utils/request';
import toast from 'react-hot-toast';
import { getTokenRole, getTokenWithExpiry } from '../../constants/localStorage';
import { MSG } from '../../constants/messages';
import PageWrapper from '../../components/PageWrapper';

/**
 * Modern SVG LineChart Component for Admin Dashboard
 * High-end electric blue visual aesthetics with subtle gradient fill and JetBrains Mono metrics.
 */
const LineChart = ({ data }) => {
    if (!data || data.length === 0) {
        return (
            <div className="py-16 text-center space-y-2">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 ring-1 ring-slate-100">
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="20" x2="18" y2="10" />
                        <line x1="12" y1="20" x2="12" y2="4" />
                        <line x1="6" y1="20" x2="6" y2="14" />
                    </svg>
                </div>
                <p className="text-xs font-medium text-slate-400">{MSG.ADMIN.DASHBOARD.CHART_NO_DATA}</p>
            </div>
        );
    }

    const width = 760;
    const height = 280;
    const padding = 45;
    const values = data.map((item) => item.value);
    const maxValue = Math.max(...values, 1);
    const minValue = 0;

    const points = data.map((item, index) => {
        const x = padding + (index * (width - padding * 2)) / Math.max(data.length - 1, 1);
        const y = height - padding - ((item.value - minValue) * (height - padding * 2)) / Math.max(maxValue - minValue, 1);
        return { x, y, value: item.value, label: item.label };
    });

    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const areaD = `${pathD} L ${width - padding} ${height - padding} L ${padding} ${height - padding} Z`;

    return (
        <div className="w-full overflow-x-auto">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto min-w-[540px]">
                <defs>
                    <linearGradient id="adminChartGlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2563eb" stopOpacity="0.28" />
                        <stop offset="50%" stopColor="#2563eb" stopOpacity="0.08" />
                        <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
                    </linearGradient>
                </defs>

                {/* Subtle Horizontal Hairline Grids */}
                {[0, 1, 2, 3].map((lineIndex) => {
                    const y = padding + ((height - padding * 2) / 3) * lineIndex;
                    return (
                        <line
                            key={lineIndex}
                            x1={padding}
                            x2={width - padding}
                            y1={y}
                            y2={y}
                            stroke="#f1f5f9"
                            strokeWidth="1.5"
                            strokeDasharray="4 4"
                        />
                    );
                })}

                {/* Area Gradient Fill */}
                <path d={areaD} fill="url(#adminChartGlow)" />

                {/* Main Stroke Path */}
                <path
                    d={pathD}
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {/* Data Points and Value Callouts */}
                {points.map((p, index) => (
                    <g key={index} className="group cursor-pointer">
                        {/* Outer Pulse Ring */}
                        <circle
                            cx={p.x}
                            cy={p.y}
                            r="5"
                            fill="#ffffff"
                            stroke="#2563eb"
                            strokeWidth="2.5"
                        />
                        {/* Value Text Above Point */}
                        <text
                            x={p.x}
                            y={p.y - 10}
                            textAnchor="middle"
                            fontSize="11"
                            fontWeight="600"
                            fontFamily="JetBrains Mono, monospace"
                            fill="#1e293b"
                        >
                            {p.value}
                        </text>
                        {/* X-axis Label */}
                        <text
                            x={p.x}
                            y={height - padding + 20}
                            textAnchor="middle"
                            fontSize="10"
                            fontWeight="500"
                            fontFamily="Plus Jakarta Sans, sans-serif"
                            fill="#64748b"
                        >
                            {p.label}
                        </text>
                    </g>
                ))}
            </svg>
        </div>
    );
};

/**
 * AdminPage Component
 * Executive Analytics Dashboard with responsive controls and modern KPI cards.
 */
const AdminPage = () => {
    const formatDate = (date) => date.toISOString().slice(0, 10);
    const defaultToDate = formatDate(new Date());
    const defaultFromDate = formatDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));

    const [analyticsData, setAnalyticsData] = useState([]);
    const [analyticsRange, setAnalyticsRange] = useState('daily');
    const [analyticsFrom, setAnalyticsFrom] = useState(defaultFromDate);
    const [analyticsTo, setAnalyticsTo] = useState(defaultToDate);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const loadAnalytics = () => {
        setLoading(true);
        const params = new URLSearchParams();
        params.append('range', analyticsRange);
        if (analyticsFrom) params.append('from', analyticsFrom);
        if (analyticsTo) params.append('to', analyticsTo);

        get(`shortener/analytics/admin?${params.toString()}`)
            .then((response) => {
                const responseData = Array.isArray(response) ? response : [];
                const formattedData = responseData.map((item) => ({
                    label: item.label,
                    value: item.count || item.value || 0,
                }));
                setAnalyticsData(formattedData);
            })
            .catch((error) => {
                const message = error.response?.data?.error?.message || MSG.ADMIN.DASHBOARD.ERR_LOAD_CHART;
                toast.error(message);
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        const role = getTokenRole();
        if (!getTokenWithExpiry() || (role !== 'admin' && role !== 'manager')) {
            navigate('/not-found', { replace: true });
            return;
        }

        loadAnalytics();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [navigate]);

    useEffect(() => {
        if (!getTokenWithExpiry() || (getTokenRole() !== 'admin' && getTokenRole() !== 'manager')) {
            return;
        }

        loadAnalytics();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [analyticsRange, analyticsFrom, analyticsTo]);

    // KPI Summary Metrics derived from dataset
    const summaryMetrics = useMemo(() => {
        if (!analyticsData.length) return { total: 0, peak: 0, avg: 0 };
        const total = analyticsData.reduce((acc, curr) => acc + curr.value, 0);
        const peak = Math.max(...analyticsData.map((d) => d.value), 0);
        const avg = Math.round(total / analyticsData.length);
        return { total, peak, avg };
    }, [analyticsData]);

    return (
        <PageWrapper
            title={MSG.ADMIN.DASHBOARD.PAGE_TITLE}
            subtitle={MSG.ADMIN.DASHBOARD.PAGE_SUBTITLE}
        >
            <div className="space-y-6 max-w-6xl mx-auto">
                {/* KPI Summary Bento Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div className="double-bezel-outer p-1 rounded-2xl bg-slate-200/50">
                        <div className="double-bezel-inner p-4 bg-white rounded-[calc(1rem-0.25rem)] shadow-soft-xs">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                Tổng lượt truy cập
                            </span>
                            <div className="mt-1 flex items-baseline gap-2">
                                <span className="font-mono text-2xl font-bold tracking-tight text-slate-900">
                                    {summaryMetrics.total.toLocaleString()}
                                </span>
                                <span className="text-xs text-blue-600 font-medium">clicks</span>
                            </div>
                        </div>
                    </div>

                    <div className="double-bezel-outer p-1 rounded-2xl bg-slate-200/50">
                        <div className="double-bezel-inner p-4 bg-white rounded-[calc(1rem-0.25rem)] shadow-soft-xs">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                Lượt cao điểm nhất
                            </span>
                            <div className="mt-1 flex items-baseline gap-2">
                                <span className="font-mono text-2xl font-bold tracking-tight text-emerald-600">
                                    {summaryMetrics.peak.toLocaleString()}
                                </span>
                                <span className="text-xs text-slate-500 font-medium">lượt/kỳ</span>
                            </div>
                        </div>
                    </div>

                    <div className="double-bezel-outer p-1 rounded-2xl bg-slate-200/50">
                        <div className="double-bezel-inner p-4 bg-white rounded-[calc(1rem-0.25rem)] shadow-soft-xs">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                Trung bình mỗi ngày
                            </span>
                            <div className="mt-1 flex items-baseline gap-2">
                                <span className="font-mono text-2xl font-bold tracking-tight text-slate-700">
                                    {summaryMetrics.avg.toLocaleString()}
                                </span>
                                <span className="text-xs text-slate-500 font-medium">lượt</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Analytics Card with Double-Bezel */}
                <div className="double-bezel-outer p-1.5 rounded-[2rem] bg-slate-200/50">
                    <div className="double-bezel-inner p-5 sm:p-7 bg-white rounded-[calc(2rem-0.375rem)] shadow-soft-md space-y-6">
                        {/* Header & Controls Toolbar */}
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                            <div>
                                <h3 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
                                    {MSG.ADMIN.DASHBOARD.TITLE}
                                </h3>
                                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                                    {MSG.ADMIN.DASHBOARD.DESC}
                                </p>
                            </div>

                            {/* Range Pill Selector & Date Pickers */}
                            <div className="flex flex-wrap items-center gap-2.5">
                                {/* Segmented Range Pill */}
                                <div className="inline-flex p-1 rounded-2xl bg-slate-100 border border-slate-200/60">
                                    {[
                                        { key: 'daily', label: MSG.ADMIN.DASHBOARD.FILTER_DAILY },
                                        { key: 'weekly', label: MSG.ADMIN.DASHBOARD.FILTER_WEEKLY },
                                        { key: 'monthly', label: MSG.ADMIN.DASHBOARD.FILTER_MONTHLY },
                                    ].map((tab) => (
                                        <button
                                            key={tab.key}
                                            type="button"
                                            onClick={() => setAnalyticsRange(tab.key)}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                                                analyticsRange === tab.key
                                                    ? 'bg-white text-slate-900 shadow-soft-xs'
                                                    : 'text-slate-500 hover:text-slate-900'
                                            }`}
                                        >
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>

                                {/* Date Inputs */}
                                <div className="flex items-center gap-1.5 text-xs">
                                    <input
                                        type="date"
                                        value={analyticsFrom}
                                        onChange={(e) => setAnalyticsFrom(e.target.value)}
                                        className="h-9 px-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 outline-none focus:border-blue-500 transition font-mono"
                                    />
                                    <span className="text-slate-400 font-mono">→</span>
                                    <input
                                        type="date"
                                        value={analyticsTo}
                                        onChange={(e) => setAnalyticsTo(e.target.value)}
                                        className="h-9 px-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 outline-none focus:border-blue-500 transition font-mono"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Chart Render */}
                        {loading ? (
                            <div className="py-20 text-center text-slate-400 space-y-2">
                                <div className="w-8 h-8 mx-auto border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                <p className="text-xs font-medium">Đang tải biểu đồ thống kê...</p>
                            </div>
                        ) : (
                            <LineChart data={analyticsData} />
                        )}
                    </div>
                </div>
            </div>
        </PageWrapper>
    );
};

export default AdminPage;
