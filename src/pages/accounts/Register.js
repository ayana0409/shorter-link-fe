import React, { useState } from 'react';
import 'tailwindcss/tailwind.css';
import toast from 'react-hot-toast';
import request from '../../utils/request';
import PageWrapper from '../../components/PageWrapper';

const Register = () => {
    const [formData, setFormData] = useState({
        fullname: '',
        username: '',
        password: '',
    });

    const [verifyPassword, setVerifyPassword] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: name === 'username' ? value.toLowerCase() : value,
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (formData.password !== verifyPassword) {
            toast.error('Passwords do not match');
            return;
        }

        request.post('/account/register', formData)
            .then((response) => {
                toast.success('Account created successfully');
                setTimeout(() => {
                    window.location.href = '/login';
                }, 1500);
            })
            .catch((error) => {
                const message = error.response?.data?.error.message || 'An unexpected error occurred';
                toast.error('An error occurred: ' + message);
            });
    };

    return (
        <PageWrapper
            title="Đăng ký"
            subtitle="Tạo tài khoản để quản lý liên kết và truy cập dashboard"
        >
            <div className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm shadow-slate-300/10">
                <h2 className="text-3xl font-bold mb-6 text-center text-slate-900">Đăng ký</h2>
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">Full Name</label>
                        <input
                            type="text"
                            name="fullname"
                            value={formData.fullname}
                            onChange={handleChange}
                            required
                            className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">Username</label>
                        <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            required
                            className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">Password</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">Verify Password</label>
                        <input
                            type="password"
                            name="verifyPassword"
                            value={verifyPassword}
                            onChange={e => setVerifyPassword(e.target.value)}
                            required
                            className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full rounded-2xl bg-blue-500 px-4 py-3 text-white shadow-md shadow-blue-500/10 transition hover:bg-blue-600"
                    >
                        Register
                    </button>
                </form>
            </div>
        </PageWrapper>
    );
};

export default Register;
