import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { get, patch } from '../../utils/request';
import toast from 'react-hot-toast';
import { getTokenRole, getTokenWithExpiry } from '../../constants/localStorage';
import PageWrapper from '../../components/PageWrapper';

const SystemConfigPage = () => {
    const navigate = useNavigate();
    const [configs, setConfigs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updatingKey, setUpdatingKey] = useState(null);
    const [inputValues, setInputValues] = useState({});
    const [visibleKeys, setVisibleKeys] = useState({});

    const toggleVisibility = (key) => {
        setVisibleKeys(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    useEffect(() => {
        const role = getTokenRole();
        if (!getTokenWithExpiry() || role !== 'admin') {
            navigate('/not-found', { replace: true });
            return;
        }
        fetchConfigs();
    }, [navigate]);

    const fetchConfigs = async () => {
        try {
            setLoading(true);
            const data = await get('/config');
            setConfigs(data);

            // Initialize input values state
            const initialValues = {};
            data.forEach(config => {
                initialValues[config.key] = config.value;
            });
            setInputValues(initialValues);
        } catch (error) {
            console.error('Failed to fetch configs:', error);
            toast.error('Không thể tải cấu hình hệ thống');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (key, value) => {
        setInputValues(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const handleUpdate = async (key, newValue, type) => {
        try {
            setUpdatingKey(key);
            await patch(`/config/${key}`, { value: newValue, type });
            // Update state to reflect the new value
            setInputValues(prev => ({
                ...prev,
                [key]: newValue
            }));
            toast.success('Cập nhật cấu hình thành công!');
        } catch (error) {
            console.error('Failed to update config:', error);
            toast.error('Cập nhật thất bại: ' + (error.response?.data?.message || error.message));
        } finally {
            setUpdatingKey(null);
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-screen">Đang tải...</div>;
    }

    return (
        <PageWrapper
            title="Cấu hình hệ thống"
            subtitle="Quản lý các thông số vận hành và cài đặt kỹ thuật của hệ thống"
        >
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-300/10">
                <div className="mb-8">
                    <h2 className="text-2xl font-semibold text-slate-900">Quản lý Cấu hình Hệ thống</h2>
                    <p className="mt-2 text-sm text-slate-600">Thay đổi các giá trị bên dưới để điều chỉnh hành vi của ứng dụng trong thời gian thực.</p>
                </div>

                <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-slate-50">
                    <table className="min-w-full divide-y divide-slate-200 text-sm text-slate-700">
                        <thead className="bg-slate-100 text-slate-900">
                            <tr>
                                <th className="px-6 py-4 text-left font-semibold">Key</th>
                                <th className="px-6 py-4 text-left font-semibold">Giá trị</th>
                                <th className="px-6 py-4 text-left font-semibold">Mô tả</th>
                                <th className="px-6 py-4 text-center font-semibold">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white">
                            {configs.map((config) => (
                                <tr key={config.key} className="hover:bg-slate-50 transition">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="font-mono text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg inline-block border border-indigo-100">
                                            {config.key}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                className="rounded-2xl border border-slate-300 bg-white px-4 py-2 w-full outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                                value={(config.isHidden && !visibleKeys[config.key]) ? '****************' : (inputValues[config.key] || '')}
                                                onChange={(e) => handleInputChange(config.key, e.target.value)}
                                                disabled={updatingKey === config.key || (config.isHidden && !visibleKeys[config.key])}
                                            />
                                            {config.isHidden && (
                                                <button
                                                    onClick={() => toggleVisibility(config.key)}
                                                    className="p-2 text-slate-500 hover:text-blue-600 transition"
                                                    title={visibleKeys[config.key] ? "Ẩn giá trị" : "Hiện giá trị"}
                                                >
                                                    {visibleKeys[config.key] ? '🙈' : '👁️'}
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 max-w-xs">
                                        {config.description || 'Không có mô tả'}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button
                                            onClick={() => handleUpdate(config.key, inputValues[config.key], config.type)}
                                            disabled={updatingKey === config.key}
                                            className={`rounded-2xl px-4 py-2 text-sm font-medium text-white shadow-sm transition ${updatingKey === config.key ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600 active:scale-95'}`}
                                        >
                                            {updatingKey === config.key ? 'Đang lưu...' : 'Cập nhật'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="mt-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
                    <span className="text-amber-600 text-lg">⚠️</span>
                    <p className="text-sm text-amber-700">
                        <span className="font-bold">Lưu ý quan trọng:</span> <br />
                        Thay đổi <code className="bg-amber-100 px-1 rounded font-mono font-semibold">MONGO_DB_CONNECTIONSTRING</code> sẽ không có tác dụng ngay lập tức mà cần khởi động lại server để áp dụng kết nối mới do cơ chế khởi tạo connection pool của Mongoose.
                    </p>
                </div>
            </div>
        </PageWrapper>
    );
};

export default SystemConfigPage;

