import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { get, remove } from '../../utils/request';
import PageWrapper from '../../components/PageWrapper';
import toast from 'react-hot-toast';
import { getTokenRole, getTokenWithExpiry } from '../../constants/localStorage';
import { MSG } from '../../constants/messages';

/**
 * AccountGroupsPage Component
 * High-end inspector for groups owned by a specific account.
 * Features Dual Mode (Desktop Studio Table + Mobile Bento Cards).
 */
const AccountGroupsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(false);
    const [actionLoadingId, setActionLoadingId] = useState(null);

    const isAdmin = useMemo(() => getTokenRole() === 'admin', []);

    const fetchGroups = async () => {
        if (!id) return;
        setLoading(true);
        try {
            const data = await get(`account/admin/${id}/groups`);
            setGroups(Array.isArray(data) ? data : []);
        } catch (error) {
            const message = error.response?.data?.error?.message || MSG.ADMIN.ACCOUNT.ERR_LOAD_GROUPS;
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const role = getTokenRole();
        if (!getTokenWithExpiry() || (role !== 'admin' && role !== 'manager')) {
            navigate('/not-found', { replace: true });
            return;
        }
        fetchGroups();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, navigate]);

    const handleDeleteGroup = async (groupId) => {
        if (!window.confirm(MSG.ADMIN.ACCOUNT.CONFIRM_DELETE_GROUP)) {
            return;
        }

        setActionLoadingId(groupId);
        try {
            await remove(`groups/${groupId}`);
            toast.success(MSG.GROUP.SUCCESS_DELETE);
            await fetchGroups();
        } catch (error) {
            const message = error.response?.data?.error?.message || MSG.GROUP.ERR_DELETE;
            toast.error(message);
        } finally {
            setActionLoadingId(null);
        }
    };

    return (
        <PageWrapper
            title={MSG.ADMIN.ACCOUNT.GROUPS_PAGE_TITLE}
            subtitle={MSG.ADMIN.ACCOUNT.GROUPS_PAGE_SUBTITLE}
            actions={
                <button
                    type="button"
                    onClick={() => navigate(`/admin/${id}`)}
                    className="px-4 py-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition"
                >
                    {MSG.ADMIN.ACCOUNT.BTN_BACK_TO_ACCOUNT}
                </button>
            }
        >
            <div className="space-y-6 max-w-6xl mx-auto">
                <div className="double-bezel-outer p-1.5 rounded-[2rem] bg-slate-200/50">
                    <div className="double-bezel-inner p-5 sm:p-7 bg-white rounded-[calc(2rem-0.375rem)] shadow-soft-md space-y-6">
                        {/* Section Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
                            <div>
                                <h2 className="text-xl font-bold tracking-tight text-slate-900">
                                    {MSG.ADMIN.ACCOUNT.GROUPS_TABLE_TITLE}
                                </h2>
                                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                                    {MSG.ADMIN.ACCOUNT.GROUPS_TABLE_DESC}
                                </p>
                            </div>
                            <span className="font-mono text-xs px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 font-medium self-start sm:self-auto">
                                {groups.length} nhóm
                            </span>
                        </div>

                        {loading ? (
                            <div className="py-20 text-center space-y-3">
                                <div className="w-8 h-8 mx-auto border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                <p className="text-xs font-medium text-slate-400">{MSG.COMMON.LOADING}</p>
                            </div>
                        ) : groups.length === 0 ? (
                            <div className="py-16 text-center space-y-3">
                                <div className="w-14 h-14 mx-auto rounded-3xl bg-slate-50 flex items-center justify-center text-slate-400 ring-1 ring-slate-100">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                        <circle cx="9" cy="7" r="4" />
                                    </svg>
                                </div>
                                <p className="text-xs font-medium text-slate-500">{MSG.ADMIN.ACCOUNT.GROUPS_NO_GROUPS}</p>
                            </div>
                        ) : (
                            <>
                                {/* Desktop View: Groups Studio Table */}
                                <div className="hidden md:block overflow-x-auto">
                                    <table className="w-full text-left text-sm text-slate-600">
                                        <thead>
                                            <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wider text-slate-400">
                                                <th className="pb-3.5 pl-2">{MSG.GROUP.COL_NAME}</th>
                                                <th className="pb-3.5 px-3">{MSG.GROUP.COL_OWNER}</th>
                                                <th className="pb-3.5 px-3 text-center">{MSG.GROUP.COL_MEMBERS}</th>
                                                <th className="pb-3.5 px-3 text-center">{MSG.GROUP.COL_LINKS}</th>
                                                <th className="pb-3.5 px-3 font-mono">{MSG.ADMIN.ACCOUNT.COL_CREATED_AT}</th>
                                                <th className="pb-3.5 pr-2 text-right">{MSG.GROUP.COL_ACTION}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {groups.map((group) => {
                                                const groupId = group._id || group.id;
                                                return (
                                                    <tr key={groupId} className="hover:bg-slate-50/70 transition">
                                                        <td className="py-4 pl-2 font-semibold text-slate-900">
                                                            {group.name}
                                                        </td>
                                                        <td className="py-4 px-3 text-slate-700">
                                                            {group.owner?.username || group.owner || '—'}
                                                        </td>
                                                        <td className="py-4 px-3 text-center">
                                                            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                                                                {group.members?.length ?? 0}
                                                            </span>
                                                        </td>
                                                        <td className="py-4 px-3 text-center">
                                                            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                                                                {group.links?.length ?? 0}
                                                            </span>
                                                        </td>
                                                        <td className="py-4 px-3 font-mono text-xs text-slate-500">
                                                            {group.createdAt ? new Date(group.createdAt).toLocaleDateString('vi-VN') : '—'}
                                                        </td>
                                                        <td className="py-4 pr-2 text-right">
                                                            <div className="flex items-center justify-end gap-1.5">
                                                                <Link
                                                                    to={`/groups/${groupId}/members`}
                                                                    className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition"
                                                                >
                                                                    {MSG.GROUP.BTN_MEMBERS}
                                                                </Link>
                                                                <Link
                                                                    to={`/groups/${groupId}/links`}
                                                                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition"
                                                                >
                                                                    {MSG.GROUP.BTN_LINKS}
                                                                </Link>
                                                                {isAdmin && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleDeleteGroup(groupId)}
                                                                        disabled={actionLoadingId === groupId}
                                                                        className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition disabled:opacity-50"
                                                                        title={MSG.GROUP.BTN_DELETE}
                                                                    >
                                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                            <path d="M3 6h18" />
                                                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                                                                        </svg>
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile View: Groups Cards Stack */}
                                <div className="block md:hidden space-y-3.5">
                                    {groups.map((group) => {
                                        const groupId = group._id || group.id;
                                        return (
                                            <div key={groupId} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-3">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <h4 className="font-bold text-slate-900 text-sm">{group.name}</h4>
                                                        <p className="text-xs text-slate-500 mt-0.5">Chủ sở hữu: {group.owner?.username || group.owner || '—'}</p>
                                                    </div>
                                                    <span className="font-mono text-[11px] px-2 py-0.5 rounded-full bg-white border border-slate-100 text-slate-500 shrink-0">
                                                        {group.createdAt ? new Date(group.createdAt).toLocaleDateString('vi-VN') : '—'}
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-2 gap-2 text-xs">
                                                    <div className="p-2 rounded-xl bg-white border border-slate-100 flex items-center justify-between">
                                                        <span className="text-slate-500">Thành viên</span>
                                                        <span className="font-mono font-bold text-slate-900">{group.members?.length ?? 0}</span>
                                                    </div>
                                                    <div className="p-2 rounded-xl bg-white border border-slate-100 flex items-center justify-between">
                                                        <span className="text-slate-500">Liên kết</span>
                                                        <span className="font-mono font-bold text-blue-700">{group.links?.length ?? 0}</span>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 text-xs">
                                                    <Link
                                                        to={`/groups/${groupId}/members`}
                                                        className="min-h-[40px] px-3 rounded-xl bg-slate-900 text-white font-semibold flex items-center justify-center text-center"
                                                    >
                                                        {MSG.GROUP.BTN_MEMBERS}
                                                    </Link>
                                                    <Link
                                                        to={`/groups/${groupId}/links`}
                                                        className="min-h-[40px] px-3 rounded-xl bg-blue-600 text-white font-semibold flex items-center justify-center text-center"
                                                    >
                                                        {MSG.GROUP.BTN_LINKS}
                                                    </Link>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </PageWrapper>
    );
};

export default AccountGroupsPage;
