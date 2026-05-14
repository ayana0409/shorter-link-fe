import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { get, post, put, remove } from "../../utils/request";
import PageWrapper from "../../components/PageWrapper";
import toast from "react-hot-toast";
import { getTokenPayload } from "../../constants/localStorage";
import { MSG } from "../../constants/messages";

const GroupsPage = () => {
    const [groups, setGroups] = useState([]);
    const [groupName, setGroupName] = useState("");
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [renameGroupId, setRenameGroupId] = useState(null);
    const [renameGroupName, setRenameGroupName] = useState("");
    const [renameLoading, setRenameLoading] = useState(false);
    const [deleteGroupId, setDeleteGroupId] = useState(null);
    const [deleteGroupName, setDeleteGroupName] = useState("");
    const [deletePassword, setDeletePassword] = useState("");
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [limits, setLimits] = useState({ maxGroupsCount: null });
    const navigate = useNavigate();
    const userId = useMemo(() => getTokenPayload()?._id, []);

    const fetchGroups = async () => {
        setLoading(true);
        try {
            const data = await get("groups");
            setGroups(data);
        } catch (error) {
            toast.error(MSG.GROUP.ERR_LOAD_LIST);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGroups();
        get('account/limits')
            .then((data) => setLimits(data))
            .catch(() => null);
    }, []);

    const handleCreateGroup = async () => {
        if (!groupName.trim()) {
            toast.error(MSG.GROUP.ERR_EMPTY_NAME);
            return;
        }

        setActionLoading(true);
        try {
            const newGroup = await post("groups", { name: groupName.trim() });
            setGroups((prev) => [newGroup, ...prev]);
            setGroupName("");
            toast.success(MSG.GROUP.SUCCESS_CREATE);
        } catch (error) {
            const message = error.response?.data?.error?.message || MSG.GROUP.ERR_CREATE;
            toast.error(message);
        } finally {
            setActionLoading(false);
        }
    };

    const isGroupCreator = (group) => group?.owner?._id === userId || group?.owner === userId;

    const formatDate = (value) => {
        if (!value) return "-";
        return new Date(value).toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    };

    const handleStartRename = (group) => {
        setRenameGroupId(group._id);
        setRenameGroupName(group.name || "");
    };

    const handleCancelRename = () => {
        setRenameGroupId(null);
        setRenameGroupName("");
    };

    const handleSaveRename = async (groupId) => {
        if (!renameGroupName.trim()) {
            toast.error(MSG.GROUP.ERR_RENAME_EMPTY);
            return;
        }
        setRenameLoading(true);
        try {
            const updatedGroup = await put(`groups/${groupId}`, { name: renameGroupName.trim() });
            setGroups((prev) => prev.map((group) => (group._id === groupId ? updatedGroup : group)));
            toast.success(MSG.GROUP.SUCCESS_RENAME);
            handleCancelRename();
        } catch (error) {
            toast.error(MSG.GROUP.ERR_RENAME);
        } finally {
            setRenameLoading(false);
        }
    };

    const handleStartDelete = (group) => {
        setDeleteGroupId(group._id);
        setDeleteGroupName(group.name || "");
        setDeletePassword("");
        setShowDeleteConfirm(true);
    };

    const handleCancelDelete = () => {
        setDeleteGroupId(null);
        setDeleteGroupName("");
        setDeletePassword("");
        setShowDeleteConfirm(false);
    };

    const handleConfirmDelete = async () => {
        if (!deletePassword.trim()) {
            toast.error(MSG.GROUP.ERR_DELETE_PASSWORD);
            return;
        }
        setActionLoading(true);
        try {
            await remove(`groups/${deleteGroupId}`, { data: { password: deletePassword.trim() } });
            setGroups((prev) => prev.filter((group) => group._id !== deleteGroupId));
            toast.success(MSG.GROUP.SUCCESS_DELETE);
            handleCancelDelete();
        } catch (error) {
            toast.error(MSG.GROUP.ERR_DELETE);
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <PageWrapper
            title={MSG.GROUP.PAGE_TITLE}
            subtitle={MSG.GROUP.PAGE_SUBTITLE}
            actions={
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="flex w-full max-w-xs items-center gap-2 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-2 shadow-sm shadow-slate-200/50">
                        <input
                            value={groupName}
                            onChange={(event) => setGroupName(event.target.value)}
                            placeholder={MSG.GROUP.LABEL_NEW_GROUP}
                            disabled={limits.maxGroupsCount !== null && groups.length >= limits.maxGroupsCount}
                            className="w-full bg-transparent text-sm text-slate-900 outline-none disabled:cursor-not-allowed disabled:opacity-60"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={handleCreateGroup}
                        disabled={actionLoading || (limits.maxGroupsCount !== null && groups.length >= limits.maxGroupsCount)}
                        className="inline-flex items-center justify-center rounded-3xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {limits.maxGroupsCount !== null && groups.length >= limits.maxGroupsCount ? MSG.GROUP.BTN_CREATE_LIMIT_REACHED : MSG.GROUP.BTN_CREATE}
                    </button>
                </div>
            }
        >
            {limits.maxGroupsCount !== null && (
                <div className={`rounded-3xl border p-4 mb-4 ${groups.length >= limits.maxGroupsCount ? 'border-amber-300 bg-amber-50' : 'border-blue-200 bg-blue-50'}`}>
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                        <span className="font-semibold">{MSG.GROUP.LIMIT_LABEL}</span>
                        <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${groups.length >= limits.maxGroupsCount ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                            📁 {MSG.GROUP.LIMIT_COUNT(groups.length, limits.maxGroupsCount)}
                        </span>
                        {groups.length >= limits.maxGroupsCount && (
                            <span className="text-amber-700 font-medium">{MSG.GROUP.LIMIT_WARNING}</span>
                        )}
                    </div>
                </div>
            )}

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-300/10">
                <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-900">{MSG.GROUP.LIST_TITLE}</h2>
                        <p className="mt-1 text-sm text-slate-600">{MSG.GROUP.LIST_DESC}</p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm text-slate-700">
                        <thead>
                            <tr className="border-b border-slate-200 text-slate-900">
                                <th className="px-3 py-3">{MSG.GROUP.COL_NAME}</th>
                                <th className="px-3 py-3">{MSG.GROUP.COL_MEMBERS}</th>
                                <th className="px-3 py-3">{MSG.GROUP.COL_LINKS}</th>
                                <th className="px-3 py-3">{MSG.GROUP.COL_OWNER}</th>
                                <th className="px-3 py-3">{MSG.GROUP.COL_DATE}</th>
                                <th className="px-3 py-3">{MSG.GROUP.COL_ACTION}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {!groups.length && !loading ? (
                                <tr>
                                    <td colSpan="6" className="px-3 py-6 text-center text-slate-500">
                                        {MSG.GROUP.NO_GROUPS}
                                    </td>
                                </tr>
                            ) : (
                                groups.map((group) => {
                                    const creator = group.owner?.username || group.owner || "-";
                                    const creatorIsMe = isGroupCreator(group);
                                    const groupNameContent = renameGroupId === group._id ? (
                                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                            <input
                                                value={renameGroupName}
                                                onChange={(event) => setRenameGroupName(event.target.value)}
                                                className="min-w-0 rounded-3xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => handleSaveRename(group._id)}
                                                disabled={renameLoading}
                                                className="rounded-2xl bg-amber-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
                                            >
                                                {MSG.GROUP.BTN_SAVE}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleCancelRename}
                                                className="rounded-2xl bg-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-300"
                                            >
                                                {MSG.GROUP.BTN_CANCEL}
                                            </button>
                                        </div>
                                    ) : (
                                        group.name
                                    );

                                    return (
                                        <tr key={group._id} className="border-b border-slate-100">
                                            <td className="px-3 py-4 font-medium text-slate-900">{groupNameContent}</td>
                                            <td className="px-3 py-4">{group.members?.length ?? 0}</td>
                                            <td className="px-3 py-4">{group.links?.length ?? 0}</td>
                                            <td className="px-3 py-4">{creator}</td>
                                            <td className="px-3 py-4">{formatDate(group.createdAt)}</td>
                                            <td className="px-3 py-4">
                                                <div className="flex flex-wrap gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => navigate(`/groups/${group._id}/members`)}
                                                        className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                                                    >
                                                        {MSG.GROUP.BTN_MEMBERS}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => navigate(`/groups/${group._id}/links`)}
                                                        className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                                                    >
                                                        {MSG.GROUP.BTN_LINKS}
                                                    </button>
                                                    {creatorIsMe && renameGroupId !== group._id && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleStartRename(group)}
                                                            className="rounded-2xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700"
                                                        >
                                                            {MSG.GROUP.BTN_RENAME}
                                                        </button>
                                                    )}
                                                    {creatorIsMe && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleStartDelete(group)}
                                                            className="rounded-2xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-600"
                                                        >
                                                            {MSG.GROUP.BTN_DELETE}
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            {showDeleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl">
                        <h3 className="text-lg font-semibold text-slate-900">{MSG.GROUP.DELETE_CONFIRM_TITLE}</h3>
                        <p className="mt-2 text-sm text-slate-600">
                            {MSG.GROUP.DELETE_CONFIRM_DESC(deleteGroupName)}
                        </p>
                        <div className="mt-4 space-y-4">
                            <input
                                type="password"
                                value={deletePassword}
                                onChange={(event) => setDeletePassword(event.target.value)}
                                placeholder={MSG.GROUP.DELETE_PASSWORD_PLACEHOLDER}
                                className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={handleCancelDelete}
                                    className="rounded-3xl bg-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-300"
                                >
                                    {MSG.GROUP.BTN_CANCEL}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleConfirmDelete}
                                    disabled={actionLoading}
                                    className="rounded-3xl bg-rose-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {MSG.GROUP.BTN_CONFIRM_DELETE}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </PageWrapper>
    );
};

export default GroupsPage;
