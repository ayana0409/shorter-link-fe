import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { get, post, put, remove } from "../utils/request";
import PageWrapper from "../components/PageWrapper";
import toast from "react-hot-toast";
import { getTokenPayload } from "../constants/localStorage";

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
    const navigate = useNavigate();
    const userId = useMemo(() => getTokenPayload()?._id, []);

    const fetchGroups = async () => {
        setLoading(true);
        try {
            const data = await get("groups");
            setGroups(data);
        } catch (error) {
            toast.error("Không thể tải danh sách nhóm. Vui lòng thử lại sau.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGroups();
    }, []);

    const handleCreateGroup = async () => {
        if (!groupName.trim()) {
            toast.error("Vui lòng nhập tên nhóm.");
            return;
        }

        setActionLoading(true);
        try {
            const newGroup = await post("groups", { name: groupName.trim() });
            setGroups((prev) => [newGroup, ...prev]);
            setGroupName("");
            toast.success("Tạo nhóm thành công.");
        } catch (error) {
            toast.error("Tạo nhóm thất bại. Vui lòng thử lại.");
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
            toast.error("Tên nhóm không được để trống.");
            return;
        }
        setRenameLoading(true);
        try {
            const updatedGroup = await put(`groups/${groupId}`, { name: renameGroupName.trim() });
            setGroups((prev) => prev.map((group) => (group._id === groupId ? updatedGroup : group)));
            toast.success("Đổi tên nhóm thành công.");
            handleCancelRename();
        } catch (error) {
            toast.error("Đổi tên nhóm thất bại. Vui lòng thử lại.");
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
            toast.error("Vui lòng nhập mật khẩu để xác nhận.");
            return;
        }
        setActionLoading(true);
        try {
            await remove(`groups/${deleteGroupId}`, { data: { password: deletePassword.trim() } });
            setGroups((prev) => prev.filter((group) => group._id !== deleteGroupId));
            toast.success("Xóa nhóm thành công.");
            handleCancelDelete();
        } catch (error) {
            toast.error("Xóa nhóm thất bại. Kiểm tra mật khẩu và thử lại.");
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <PageWrapper
            title="Quản lý nhóm"
            subtitle="Tạo nhóm và mở trang thành viên hoặc liên kết cho từng nhóm."
            actions={
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="flex w-full max-w-xs items-center gap-2 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-2 shadow-sm shadow-slate-200/50">
                        <input
                            value={groupName}
                            onChange={(event) => setGroupName(event.target.value)}
                            placeholder="Tên nhóm mới"
                            className="w-full bg-transparent text-sm text-slate-900 outline-none"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={handleCreateGroup}
                        disabled={actionLoading}
                        className="inline-flex items-center justify-center rounded-3xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        Tạo nhóm
                    </button>
                </div>
            }
        >
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-300/10">
                <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-900">Danh sách nhóm</h2>
                        <p className="mt-1 text-sm text-slate-600">Hiển thị thông tin nhóm, chủ nhóm, số liên kết và quản lý tên hoặc xóa nhóm.</p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm text-slate-700">
                        <thead>
                            <tr className="border-b border-slate-200 text-slate-900">
                                <th className="px-3 py-3">Tên nhóm</th>
                                <th className="px-3 py-3">Thành viên</th>
                                <th className="px-3 py-3">Liên kết</th>
                                <th className="px-3 py-3">Chủ nhóm</th>
                                <th className="px-3 py-3">Ngày tạo</th>
                                <th className="px-3 py-3">Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {!groups.length && !loading ? (
                                <tr>
                                    <td colSpan="6" className="px-3 py-6 text-center text-slate-500">
                                        Chưa có nhóm nào.
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
                                                Lưu
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleCancelRename}
                                                className="rounded-2xl bg-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-300"
                                            >
                                                Hủy
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
                                                        Thành viên
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => navigate(`/groups/${group._id}/links`)}
                                                        className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                                                    >
                                                        Liên kết
                                                    </button>
                                                    {creatorIsMe && renameGroupId !== group._id && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleStartRename(group)}
                                                            className="rounded-2xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700"
                                                        >
                                                            Đổi tên
                                                        </button>
                                                    )}
                                                    {creatorIsMe && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleStartDelete(group)}
                                                            className="rounded-2xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-600"
                                                        >
                                                            Xóa nhóm
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
                        <h3 className="text-lg font-semibold text-slate-900">Xác nhận xóa nhóm</h3>
                        <p className="mt-2 text-sm text-slate-600">
                            Bạn sắp xóa nhóm <strong>{deleteGroupName}</strong>. Hành động này không thể hoàn tác.
                            Vui lòng nhập mật khẩu của chủ nhóm để xác nhận.
                        </p>
                        <div className="mt-4 space-y-4">
                            <input
                                type="password"
                                value={deletePassword}
                                onChange={(event) => setDeletePassword(event.target.value)}
                                placeholder="Mật khẩu của bạn"
                                className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={handleCancelDelete}
                                    className="rounded-3xl bg-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-300"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="button"
                                    onClick={handleConfirmDelete}
                                    disabled={actionLoading}
                                    className="rounded-3xl bg-rose-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    Xác nhận xóa
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
