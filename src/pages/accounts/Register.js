import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { post } from '../../utils/request';
import PageWrapper from '../../components/PageWrapper';
import { MSG } from '../../constants/messages';

/**
 * Modern High-End Register Component
 * Double-Bezel card architecture with 2-column balanced inputs.
 */
const Register = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        fullname: '',
        username: '',
        password: '',
    });
    const [verifyPassword, setVerifyPassword] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: name === 'username' ? value.trim().toLowerCase() : value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.password !== verifyPassword) {
            toast.error(MSG.REGISTER.PASSWORD_MISMATCH);
            return;
        }

        setLoading(true);
        try {
            await post('/account/register', formData);
            toast.success(MSG.REGISTER.SUCCESS);
            setTimeout(() => {
                navigate('/login');
            }, 1200);
        } catch (error) {
            const message = error.response?.data?.error?.message || error.response?.data?.message || MSG.COMMON.GENERIC_ERROR;
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <PageWrapper
            title={MSG.REGISTER.TITLE}
            subtitle={MSG.REGISTER.SUBTITLE}
        >
            <div className="double-bezel-outer mx-auto max-w-lg">
                <div className="double-bezel-inner p-6 sm:p-8">
                    {/* Header */}
                    <div className="text-center mb-6">
                        <div className="inline-flex items-center justify-center gap-1.5 mb-2.5 px-3 py-0.5 rounded-full bg-blue-50 border border-blue-200/60 text-blue-600 text-xs font-semibold">
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
                            Tạo tài khoản mới
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                            {MSG.REGISTER.FORM_TITLE}
                        </h2>
                        <p className="mt-1 text-xs sm:text-sm text-slate-500">
                            Khởi tạo tài khoản để bắt đầu quản lý các liên kết của bạn
                        </p>
                    </div>

                    {/* Registration Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            <div>
                                <label className="mb-1 block text-xs font-semibold text-slate-700">
                                    {MSG.REGISTER.LABEL_FULL_NAME}
                                </label>
                                <input
                                    type="text"
                                    name="fullname"
                                    value={formData.fullname}
                                    onChange={handleChange}
                                    required
                                    placeholder="Nguyễn Văn A"
                                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-semibold text-slate-700">
                                    {MSG.REGISTER.LABEL_USERNAME}
                                </label>
                                <input
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    required
                                    placeholder="username"
                                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            <div>
                                <label className="mb-1 block text-xs font-semibold text-slate-700">
                                    {MSG.REGISTER.LABEL_PASSWORD}
                                </label>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    placeholder="••••••••"
                                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-semibold text-slate-700">
                                    {MSG.REGISTER.LABEL_VERIFY_PASSWORD}
                                </label>
                                <input
                                    type="password"
                                    name="verifyPassword"
                                    value={verifyPassword}
                                    onChange={(e) => setVerifyPassword(e.target.value)}
                                    required
                                    placeholder="••••••••"
                                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-slate-900 hover:bg-slate-800 py-3.5 px-6 text-white text-xs sm:text-sm font-semibold transition shadow-soft-xs active:scale-[0.98] disabled:opacity-50 mt-2"
                        >
                            {loading ? (
                                <>
                                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                                    <span>Đang tạo tài khoản...</span>
                                </>
                            ) : (
                                <>
                                    <span>{MSG.REGISTER.BTN_SUBMIT}</span>
                                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-xs font-bold">→</span>
                                </>
                            )}
                        </button>
                    </form>

                    {/* Footer Link */}
                    <div className="mt-6 pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
                        <span>Đã có tài khoản? </span>
                        <Link
                            to="/login"
                            className="font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                        >
                            Đăng nhập ngay
                        </Link>
                    </div>
                </div>
            </div>
        </PageWrapper>
    );
};

export default Register;
