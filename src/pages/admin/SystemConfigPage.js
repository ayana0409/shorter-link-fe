import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { get, patch } from '../../utils/request';
import toast from 'react-hot-toast';
import { getTokenRole, getTokenWithExpiry } from '../../constants/localStorage';
import PageWrapper from '../../components/PageWrapper';
import { MSG } from '../../constants/messages';

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
            const message = error.response?.data?.error?.message || MSG.ADMIN.CONFIG.ERR_LOAD;
            toast.error(message);
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
            toast.success(MSG.ADMIN.CONFIG.SUCCESS_UPDATE);
        } catch (error) {
            const errMsg = error.response?.data?.error?.message || error.response?.data?.message || error.message;
            toast.error(MSG.ADMIN.CONFIG.ERR_UPDATE + errMsg);
        } finally {
            setUpdatingKey(null);
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-screen">{MSG.COMMON.LOADING}</div>;
    }

    return (
        <PageWrapper
            title={MSG.ADMIN.CONFIG.PAGE_TITLE}
            subtitle={MSG.ADMIN.CONFIG.PAGE_SUBTITLE}
        >
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-300/10">
                <div className="mb-8">
                    <h2 className="text-2xl font-semibold text-slate-900">{MSG.ADMIN.CONFIG.TITLE}</h2>
                    <p className="mt-2 text-sm text-slate-600">{MSG.ADMIN.CONFIG.DESC}</p>
                </div>

                <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-slate-50">
                    <table className="min-w-full divide-y divide-slate-200 text-sm text-slate-700">
                        <thead className="bg-slate-100 text-slate-900">
                            <tr>
                                <th className="px-6 py-4 text-left font-semibold">{MSG.ADMIN.CONFIG.COL_KEY}</th>
                                <th className="px-6 py-4 text-left font-semibold">{MSG.ADMIN.CONFIG.COL_VALUE}</th>
                                <th className="px-6 py-4 text-left font-semibold">{MSG.ADMIN.CONFIG.COL_DESC}</th>
                                <th className="px-6 py-4 text-center font-semibold">{MSG.ADMIN.CONFIG.COL_ACTION}</th>
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
                                                    title={visibleKeys[config.key] ? MSG.ADMIN.CONFIG.TOOLTIP_HIDE : MSG.ADMIN.CONFIG.TOOLTIP_SHOW}
                                                >
                                                    {visibleKeys[config.key] ? '🙈' : '👁️'}
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 max-w-xs">
                                        {config.description || MSG.ADMIN.CONFIG.NO_DESC}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button
                                            onClick={() => handleUpdate(config.key, inputValues[config.key], config.type)}
                                            disabled={updatingKey === config.key}
                                            className={`rounded-2xl px-4 py-2 text-sm font-medium text-white shadow-sm transition ${updatingKey === config.key ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600 active:scale-95'}`}
                                        >
                                            {updatingKey === config.key ? MSG.ADMIN.CONFIG.BTN_UPDATING : MSG.ADMIN.CONFIG.BTN_UPDATE}
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
                        <span className="font-bold">{MSG.ADMIN.CONFIG.WARNING_TITLE}</span> <br />
                        {MSG.ADMIN.CONFIG.WARNING_MONGO('MONGO_DB_CONNECTIONSTRING')}
                    </p>
                </div>
            </div>
        </PageWrapper>
    );
};

export default SystemConfigPage;

