import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { get } from '../../utils/request';
import toast from 'react-hot-toast';
import { getTokenRole, getTokenWithExpiry } from '../../constants/localStorage';
import PageWrapper from '../../components/PageWrapper';

const LineChart = ({ data }) => {
    if (!data || data.length === 0) {
        return <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-center text-slate-500">Chưa có dữ liệu biểu đồ</div>;
    }

    const width = 640;
    const height = 260;
    const padding = 40;
    const values = data.map((item) => item.value);
    const maxValue = Math.max(...values, 1);
    const minValue = Math.min(...values, 0);
    const points = data.map((item, index) => {
        const x = padding + (index * (width - padding * 2)) / Math.max(data.length - 1, 1);
        const y = height - padding - ((item.value - minValue) * (height - padding * 2)) / Math.max(maxValue - minValue, 1);
        return `${x},${y}`;
    });

    return (
        <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-slate-50 p-4 shadow-sm shadow-slate-300/10">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
                <defs>
                    <linearGradient id="chartGradientAdmin" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2563eb" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
                    </linearGradient>
                </defs>
                {[0, 1, 2, 3].map((line) => {
                    const y = padding + ((height - padding * 2) / 3) * line;
                    return <line key={line} x1={padding} x2={width - padding} y1={y} y2={y} stroke="#e2e8f0" strokeWidth="1" />;
                })}
                <path
                    d={`M${points.join(' L')}`}
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <polygon
                    points={`${points.join(' ')} ${width - padding},${height - padding} ${padding},${height - padding}`}
                    fill="url(#chartGradientAdmin)"
                />
                {points.map((point, index) => {
                    const [x, y] = point.split(',');
                    return (
                        <g key={index}>
                            <circle cx={x} cy={y} r="4" fill="#2563eb" />
                            <text x={x} y={Number(y) - 10} textAnchor="middle" fontSize="10" fill="#0f172a">
                                {data[index].value}
                            </text>
                        </g>
                    );
                })}
                {data.map((item, index) => {
                    const x = padding + (index * (width - padding * 2)) / Math.max(data.length - 1, 1);
                    return (
                        <text key={item.label} x={x} y={height - padding + 16} textAnchor="middle" fontSize="10" fill="#334155">
                            {item.label}
                        </text>
                    );
                })}
            </svg>
        </div>
    );
};

const AdminPage = () => {
    const formatDate = (date) => date.toISOString().slice(0, 10);
    const defaultToDate = formatDate(new Date());
    const defaultFromDate = formatDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));

    const [analyticsData, setAnalyticsData] = useState([]);
    const [analyticsRange, setAnalyticsRange] = useState('daily');
    const [analyticsFrom, setAnalyticsFrom] = useState(defaultFromDate);
    const [analyticsTo, setAnalyticsTo] = useState(defaultToDate);
    const navigate = useNavigate();

    const loadAnalytics = () => {
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
                const message = error.response?.data?.message || 'Không thể tải dữ liệu biểu đồ';
                toast.error(message);
            });
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

    return (
        <PageWrapper
            title="Bảng điều khiển admin"
            subtitle="Theo dõi biểu đồ tăng trưởng liên kết của hệ thống"
        >
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-300/10">
                <div className="mb-6">
                    <div>
                        <h2 className="text-2xl font-semibold text-slate-900">Biểu đồ tăng trưởng</h2>
                        <p className="mt-2 text-sm text-slate-600">Xem số lượng liên kết được tạo theo thời gian trong hệ thống.</p>
                    </div>
                </div>

                <div className="mb-6 rounded-3xl border border-slate-200 bg-slate-50 p-6">
                    <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <h3 className="text-xl font-semibold text-slate-900">Lọc biểu đồ</h3>
                            <p className="text-sm text-slate-600">Chọn phạm vi và thời gian để cập nhật biểu đồ.</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <select
                                value={analyticsRange}
                                onChange={(e) => setAnalyticsRange(e.target.value)}
                                className="rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            >
                                <option value="daily">Ngày</option>
                                <option value="weekly">Tuần</option>
                                <option value="monthly">Tháng</option>
                            </select>
                            <input
                                type="date"
                                value={analyticsFrom}
                                onChange={(e) => setAnalyticsFrom(e.target.value)}
                                className="rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                            <input
                                type="date"
                                value={analyticsTo}
                                onChange={(e) => setAnalyticsTo(e.target.value)}
                                className="rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                        </div>
                    </div>
                    <LineChart data={analyticsData} />
                </div>
            </div>
        </PageWrapper>
    );
};

export default AdminPage;
