import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { get } from '../../utils/request';
import toast from 'react-hot-toast';
import { getTokenRole, getTokenWithExpiry } from '../../constants/localStorage';

const AdminPage = () => {
    const [accounts, setAccounts] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const role = getTokenRole();
        if (!getTokenWithExpiry() || role !== 'admin') {
            navigate('/login', { state: { from: '/admin' }, replace: true });
            return;
        }

        get('account/admin')
            .then((response) => {
                setAccounts(response);
            })
            .catch((error) => {
                const message = error.response?.data?.message || 'Không thể tải danh sách tài khoản';
                toast.error(message);
            });
    }, [navigate]);

    return (
        <div className="min-h-screen bg-gray-100 py-10">
            <div className="mx-auto max-w-6xl bg-white shadow-lg rounded-lg p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Quản trị tài khoản</h1>
                        <p className="text-sm text-gray-600">Danh sách tài khoản hiện có</p>
                    </div>
                    <Link
                        to="/home"
                        className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition duration-300"
                    >
                        Về trang chính
                    </Link>
                </div>

                <table className="table-auto w-full border-collapse">
                    <thead>
                        <tr>
                            <th className="px-4 py-2 border">Username</th>
                            <th className="px-4 py-2 border">Fullname</th>
                            <th className="px-4 py-2 border">Role</th>
                            <th className="px-4 py-2 border">Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {accounts.map((account) => (
                            <tr key={account._id || account.id}>
                                <td className="border px-4 py-2">{account.username}</td>
                                <td className="border px-4 py-2">{account.fullname}</td>
                                <td className="border px-4 py-2">{account.role}</td>
                                <td className="border px-4 py-2">
                                    <Link
                                        to={`/admin/${account._id || account.id}`}
                                        className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition duration-200"
                                    >
                                        Xem chi tiết
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminPage;
