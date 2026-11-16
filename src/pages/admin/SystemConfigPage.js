import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { get, patch } from '../../utils/request';
import toast from 'react-hot-toast';
import { getTokenRole, getTokenWithExpiry } from '../../constants/localStorage';
import PageWrapper from '../../components/PageWrapper';
import { MSG } from '../../constants/messages';

/**
 * SystemConfigPage Component
 * High-end minimalist agency screen for runtime system configuration.
 * Features Dual Mode (Desktop Studio Table + Mobile Bento Cards) and replaces all emojis with SVGs.
 */
const SystemConfigPage = () => {
    const navigate = useNavigate();
    const [configs, setConfigs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updatingKey, setUpdatingKey] = useState(null);
    const [inputValues, setInputValues] = useState({});
    const [visibleKeys, setVisibleKeys] = useState({});

    const toggleVisibility = (key) => {
        setVisibleKeys((prev) => ({
            ...prev,
            [key]: !prev[key],
        }));
    };

    const fetchConfigs = async () => {
        try {
            setLoading(true);
            const data = await get('/config');
            setConfigs(Array.isArray(data) ? data : []);

            const initialValues = {};
            (Array.isArray(data) ? data : []).forEach((config) => {
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

    useEffect(() => {
        const role = getTokenRole();
        if (!getTokenWithExpiry() || role !== 'admin') {
            navigate('/not-found', { replace: true });
            return;
        }
        fetchConfigs();
    }, [navigate]);

    const handleInputChange = (key, value) => {
        setInputValues((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    const handleUpdate = async (key, newValue, type) => {
        try {
            setUpdatingKey(key);
            await patch(`/config/${key}`, { value: newValue, type });
            setInputValues((prev) => ({
                ...prev,
                [key]: newValue,
            }));
            toast.success(MSG.ADMIN.CONFIG.SUCCESS_UPDATE);
        } catch (error) {
            const errMsg = error.response?.data?.error?.message || error.response?.data?.message || error.message;
            toast.error(MSG.ADMIN.CONFIG.ERR_UPDATE + errMsg);
        } finally {
            setUpdatingKey(null);
        }
    };

    return (
        <PageWrapper
            title={MSG.ADMIN.CONFIG.PAGE_TITLE}
            subtitle={MSG.ADMIN.CONFIG.PAGE_SUBTITLE}
        >
            <div className="space-y-6 max-w-6xl mx-auto">
                {/* Main Double-Bezel Configuration Container */}
                <div className="double-bezel-outer p-1.5 rounded-[2rem] bg-slate-200/50">
                    <div className="double-bezel-inner p-5 sm:p-7 bg-white rounded-[calc(2rem-0.375rem)] shadow-soft-md space-y-6">
                        {/* Section Header */}
                        <div className="pb-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                                <h2 className="text-xl font-bold tracking-tight text-slate-900">{MSG.ADMIN.CONFIG.TITLE}</h2>
                                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">{MSG.ADMIN.CONFIG.DESC}</p>
                            </div>
                            <span className="font-mono text-xs px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 font-medium self-start sm:self-auto">
                                {configs.length} biến cấu hình
                            </span>
                        </div>

                        {/* Loading State */}
                        {loading && (
                            <div className="py-20 text-center space-y-3">
                                <div className="w-8 h-8 mx-auto border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                <p className="text-xs font-medium text-slate-400">{MSG.COMMON.LOADING}</p>
                            </div>
                        )}

                        {/* Desktop View: Studio Config Table (hidden on mobile) */}
                        {!loading && (
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-left text-sm text-slate-600">
                                    <thead>
                                        <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wider text-slate-400">
                                            <th className="pb-3.5 pl-2">{MSG.ADMIN.CONFIG.COL_KEY}</th>
                                            <th className="pb-3.5 px-3">{MSG.ADMIN.CONFIG.COL_VALUE}</th>
                                            <th className="pb-3.5 px-3">{MSG.ADMIN.CONFIG.COL_DESC}</th>
                                            <th className="pb-3.5 pr-2 text-right">{MSG.ADMIN.CONFIG.COL_ACTION}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {configs.map((config) => {
                                            const isHiddenValue = config.isHidden && !visibleKeys[config.key];
                                            const isCurrentUpdating = updatingKey === config.key;

                                            return (
                                                <tr key={config.key} className="hover:bg-slate-50/70 transition">
                                                    {/* Key Tag */}
                                                    <td className="py-4 pl-2 whitespace-nowrap">
                                                        <span className="font-mono text-xs font-semibold text-blue-700 bg-blue-50/70 border border-blue-100 px-2.5 py-1 rounded-lg inline-block">
                                                            {config.key}
                                                        </span>
                                                    </td>

                                                    {/* Editable Value with Eye Toggle */}
                                                    <td className="py-4 px-3 min-w-[280px]">
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type={isHiddenValue ? "password" : "text"}
                                                                value={isHiddenValue ? "••••••••••••••••" : (inputValues[config.key] ?? '')}
                                                                onChange={(e) => handleInputChange(config.key, e.target.value)}
                                                                disabled={isCurrentUpdating || isHiddenValue}
                                                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-mono text-slate-900 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition disabled:opacity-60"
                                                            />
                                                            {config.isHidden && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => toggleVisibility(config.key)}
                                                                    className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition shrink-0"
                                                                    title={visibleKeys[config.key] ? MSG.ADMIN.CONFIG.TOOLTIP_HIDE : MSG.ADMIN.CONFIG.TOOLTIP_SHOW}
                                                                    aria-label={visibleKeys[config.key] ? "Ẩn giá trị cấu hình" : "Hiện giá trị cấu hình"}
                                                                >
                                                                    {visibleKeys[config.key] ? (
                                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                                                            <line x1="1" y1="1" x2="23" y2="23" />
                                                                        </svg>
                                                                    ) : (
                                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                                            <circle cx="12" cy="12" r="3" />
                                                                        </svg>
                                                                    )}
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>

                                                    {/* Description */}
                                                    <td className="py-4 px-3 text-xs text-slate-500 max-w-xs leading-relaxed">
                                                        {config.description || MSG.ADMIN.CONFIG.NO_DESC}
                                                    </td>

                                                    {/* Update Action Button */}
                                                    <td className="py-4 pr-2 text-right">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleUpdate(config.key, inputValues[config.key], config.type)}
                                                            disabled={isCurrentUpdating || isHiddenValue}
                                                            className={`px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-soft-xs transition-all active:scale-[0.98] ${
                                                                isCurrentUpdating
                                                                    ? 'bg-slate-400 cursor-not-allowed'
                                                                    : 'bg-blue-600 hover:bg-blue-700'
                                                            } disabled:opacity-40 disabled:cursor-not-allowed`}
                                                        >
                                                            {isCurrentUpdating ? MSG.ADMIN.CONFIG.BTN_UPDATING : MSG.ADMIN.CONFIG.BTN_UPDATE}
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Mobile View: Config Cards Stack (Zero Horizontal Overflow on Mobile) */}
                        {!loading && (
                            <div className="block md:hidden space-y-3.5">
                                {configs.map((config) => {
                                    const isHiddenValue = config.isHidden && !visibleKeys[config.key];
                                    const isCurrentUpdating = updatingKey === config.key;

                                    return (
                                        <div key={config.key} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-3">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg">
                                                    {config.key}
                                                </span>
                                                {config.description && (
                                                    <span className="text-[11px] text-slate-400 truncate max-w-[140px]">
                                                        {config.description}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <input
                                                    type={isHiddenValue ? "password" : "text"}
                                                    value={isHiddenValue ? "••••••••••••••••" : (inputValues[config.key] ?? '')}
                                                    onChange={(e) => handleInputChange(config.key, e.target.value)}
                                                    disabled={isCurrentUpdating || isHiddenValue}
                                                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-mono text-slate-900 outline-none focus:border-blue-500"
                                                />
                                                {config.isHidden && (
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleVisibility(config.key)}
                                                        aria-label={visibleKeys[config.key] ? "Ẩn giá trị cấu hình" : "Hiện giá trị cấu hình"}
                                                        className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-500"
                                                    >
                                                        {visibleKeys[config.key] ? (
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                                                <line x1="1" y1="1" x2="23" y2="23" />
                                                            </svg>
                                                        ) : (
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                                <circle cx="12" cy="12" r="3" />
                                                            </svg>
                                                        )}
                                                    </button>
                                                )}
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => handleUpdate(config.key, inputValues[config.key], config.type)}
                                                disabled={isCurrentUpdating || isHiddenValue}
                                                className="min-h-[44px] w-full flex items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-soft-xs transition disabled:opacity-40"
                                            >
                                                {isCurrentUpdating ? MSG.ADMIN.CONFIG.BTN_UPDATING : MSG.ADMIN.CONFIG.BTN_UPDATE}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Important Database Warning Banner (Replacing emoji with clean SVG Alert Triangle) */}
                <div className="double-bezel-outer p-1 rounded-2xl bg-amber-500/10 ring-1 ring-amber-500/20">
                    <div className="double-bezel-inner p-4 bg-white/95 rounded-[calc(1rem-0.25rem)] flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                                <line x1="12" y1="9" x2="12" y2="13" />
                                <line x1="12" y1="17" x2="12.01" y2="17" />
                            </svg>
                        </div>
                        <div className="text-xs text-amber-900 leading-relaxed">
                            <span className="font-bold">{MSG.ADMIN.CONFIG.WARNING_TITLE}</span>
                            <p className="mt-0.5 text-amber-800">{MSG.ADMIN.CONFIG.WARNING_MONGO('MONGO_DB_CONNECTIONSTRING')}</p>
                        </div>
                    </div>
                </div>
            </div>
        </PageWrapper>
    );
};

export default SystemConfigPage;
