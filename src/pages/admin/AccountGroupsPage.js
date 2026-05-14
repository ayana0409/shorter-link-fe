import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { get, remove } from '../../utils/request';
import PageWrapper from '../../components/PageWrapper';
import toast from 'react-hot-toast';
import { getTokenRole, getTokenWithExpiry } from '../../constants/localStorage';
import { MSG } from '../../constants/messages';

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
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <button
                        type="button"
                        onClick={() => navigate(`/admin/${id}`)}
                        className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                        {MSG.ADMIN.ACCOUNT.BTN_BACK_TO_ACCOUNT}
                    </button>
                </div>
            }
        >
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-300/10">
                <div className="mb-6">
                    <h2 className="text-2xl font-semibold text-slate-900">{MSG.ADMIN.ACCOUNT.GROUPS_TABLE_TITLE}</h2>
                    <p className="mt-2 text-sm text-slate-600">{MSG.ADMIN.ACCOUNT.GROUPS_TABLE_DESC}</p>
                </div>

                {loading ? (
                    <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
                        {MSG.COMMON.LOADING}
                    </div>
                ) : groups.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
                        {MSG.ADMIN.ACCOUNT.GROUPS_NO_GROUPS}
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-slate-50">
                        <table className="min-w-full divide-y divide-slate-200 text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900">
                                <tr>
                                    <th className="px-4 py-3">{MSG.GROUP.COL_NAME}</th>
                                    <th className="px-4 py-3">{MSG.GROUP.COL_OWNER}</th>
                                    <th className="px-4 py-3">{MSG.GROUP.COL_MEMBERS}</th>
                                    <th className="px-4 py-3">{MSG.GROUP.COL_LINKS}</th>
                                    <th className="px-4 py-3">{MSG.ADMIN.ACCOUNT.COL_CREATED_AT}</th>
                                    <th className="px-4 py-3">{MSG.GROUP.COL_ACTION}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 bg-white">
                                {groups.map((group) => (
                                    <tr key={group._id || group.id} className="hover:bg-slate-50">
                                        <td className="px-4 py-3 font-semibold text-slate-900">{group.name}</td>
                                        <td className="px-4 py-3">{group.owner?.username || group.owner}</td>
                                        <td className="px-4 py-3">{group.members?.length ?? 0}</td>
                                        <td className="px-4 py-3">{group.links?.length ?? 0}</td>
                                        <td className="px-4 py-3">{group.createdAt ? new Date(group.createdAt).toLocaleString() : '-'}</td>
                                        <td className="px-4 py-3 space-y-2 sm:space-y-0 sm:flex sm:flex-wrap sm:gap-2">
                                            <Link
                                                to={`/groups/${group._id || group.id}/members`}
                                                className="rounded-full bg-blue-500 px-3 py-1 text-sm font-medium text-white hover:bg-blue-600 transition"
                                            >
                                                {MSG.GROUP.BTN_MEMBERS}
                                            </Link>
                                            <Link
                                                to={`/groups/${group._id || group.id}/links`}
                                                className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700 hover:bg-slate-200 transition"
                                            >
                                                {MSG.GROUP.BTN_LINKS}
                                            </Link>
                                            {isAdmin && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteGroup(group._id || group.id)}
                                                    disabled={actionLoadingId === (group._id || group.id)}
                                                    className="rounded-full bg-rose-500 px-3 py-1 text-sm font-medium text-white hover:bg-rose-600 transition disabled:cursor-not-allowed disabled:opacity-60"
                                                >
                                                    {actionLoadingId === (group._id || group.id) ? `${MSG.GROUP.BTN_DELETE}...` : MSG.GROUP.BTN_DELETE}
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </PageWrapper>
    );
};

export default AccountGroupsPage;
