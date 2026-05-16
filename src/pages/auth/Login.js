import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { post } from "../../utils/request";
import toast from "react-hot-toast";
import { setTokenWithExpiry, setRefreshToken, getTokenWithExpiry } from "../../constants/localStorage";
import PageWrapper from "../../components/PageWrapper";
import { MSG } from "../../constants/messages";

const Login = () => {
    const [user, setUser] = useState({
        username: '',
        password: ''
    });

    const navigate = useNavigate();
    const location = useLocation();
    const redirectTo = location.state?.from || '/home';
    const isAuthenticated = Boolean(getTokenWithExpiry());

    useEffect(() => {
        if (isAuthenticated) {
            navigate(redirectTo, { replace: true });
        }
    }, [isAuthenticated, navigate, redirectTo]);

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/auth/login', user)
            .then(res => {
                setTokenWithExpiry(res.access_token, res.expires_in * 1000);
                if (res.refresh_token) {
                    setRefreshToken(res.refresh_token);
                }
                toast.success(MSG.LOGIN.SUCCESS);
                navigate(redirectTo, { replace: true });
            })
            .catch(err => {
                console.error(err);
                const rawMessage = err.response?.data?.error?.message || err.response?.data?.message;
                const message = Array.isArray(rawMessage) ? rawMessage.join(' ') : String(rawMessage || MSG.COMMON.GENERIC_ERROR);
                toast.error(message);
                if (err.response?.status === 403 && /khóa|locked|bị khóa/i.test(message)) {
                    navigate('/locked', { replace: true });
                }
            });
    }

    if (isAuthenticated) {
        return null;
    }

    const handleChange = (e) => {
        const { name, value } = e.target;
        setUser({
            ...user,
            [name]: name === 'username' ? value.toLowerCase() : value
        });
    }

    return (
        <PageWrapper
            title={MSG.LOGIN.TITLE}
            subtitle={MSG.LOGIN.SUBTITLE}
        >
            <div className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm shadow-slate-300/10">
                <h2 className="text-3xl font-bold mb-2 text-center text-slate-900">{MSG.LOGIN.FORM_TITLE}</h2>
                <p className="text-center text-slate-600 mb-6">{MSG.LOGIN.FORM_SUBTITLE}</p>
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">{MSG.LOGIN.LABEL_USERNAME}</label>
                        <input
                            type="text"
                            name="username"
                            value={user.username}
                            onChange={handleChange}
                            required
                            className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">{MSG.LOGIN.LABEL_PASSWORD}</label>
                        <input
                            type="password"
                            name="password"
                            value={user.password}
                            onChange={handleChange}
                            required
                            className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full rounded-2xl bg-blue-500 px-4 py-3 text-white shadow-md shadow-blue-500/10 transition hover:bg-blue-600"
                    >
                        {MSG.LOGIN.BTN_SUBMIT}
                    </button>
                </form>
                <div className="mt-4 text-center text-sm text-slate-600">
                    {MSG.LOGIN.NO_ACCOUNT}{' '}
                    <Link to="/register" className="font-semibold text-blue-600 hover:text-blue-700">
                        {MSG.LOGIN.REGISTER_NOW}
                    </Link>
                </div>
            </div>
        </PageWrapper>
    );
}

export default Login;