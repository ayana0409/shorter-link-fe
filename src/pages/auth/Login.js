import { useEffect, useState, useRef, useCallback } from "react";
import { useDispatch } from "react-redux";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { post } from "../../utils/request";
import toast from "react-hot-toast";
import {
    setTokenWithExpiry,
    getTokenWithExpiry,
    setRefreshToken,
    setIsSso,
} from "../../constants/localStorage";
import { setCredentials, setAuth } from "../../store/authSlice";
import { loginWithQuickBite, loginWithGoogle } from "../../services/authService";
import PageWrapper from "../../components/PageWrapper";
import { MSG } from "../../constants/messages";

const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID || "";

const Login = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const redirectTo = location.state?.from || "/home";
    const isAuthenticated = Boolean(getTokenWithExpiry());

    // Default to 'local' for internal login priority, 'sso' as secondary
    const [authMode, setAuthMode] = useState("local"); // 'local' | 'sso'
    const [loading, setLoading] = useState(false);
    const googleButtonRef = useRef(null);

    // Form state
    const [credentials, setCredentialsState] = useState({
        username: "",
        password: "",
    });

    useEffect(() => {
        if (isAuthenticated) {
            navigate(redirectTo, { replace: true });
        }
    }, [isAuthenticated, navigate, redirectTo]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setCredentialsState((prev) => ({
            ...prev,
            [name]: name === "username" ? value.trim().toLowerCase() : value,
        }));
    };

    // 1. Submit Local ShorterLink Login (Priority Default)
    const handleLocalLogin = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await post("/auth/login", credentials);
            setTokenWithExpiry(res.access_token, res.expires_in * 1000);
            setIsSso(false);

            dispatch(
                setCredentials({
                    access_token: res.access_token,
                    user: res.user,
                    isSso: false,
                })
            );

            toast.success(MSG.LOGIN.SUCCESS);
            navigate(redirectTo, { replace: true });
        } catch (err) {
            console.error("Local Login Error:", err);
            const rawMessage =
                err.response?.data?.error?.message || err.response?.data?.message;
            const message = Array.isArray(rawMessage)
                ? rawMessage.join(" ")
                : String(rawMessage || MSG.COMMON?.GENERIC_ERROR || "Đăng nhập thất bại");
            toast.error(message);

            if (
                err.response?.status === 403 &&
                /khóa|locked|bị khóa/i.test(message)
            ) {
                navigate("/locked", { replace: true });
            }
        } finally {
            setLoading(false);
        }
    };

    // 2. Submit QuickBite SSO Login (Secondary)
    const handleQuickBiteLogin = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await loginWithQuickBite(
                credentials.username,
                credentials.password
            );

            // Store tokens in localStorage
            setTokenWithExpiry(res.accessToken, (res.expiresIn || 3600) * 1000);
            if (res.refreshToken) {
                setRefreshToken(res.refreshToken);
            }
            setIsSso(true);

            // Store in Redux
            dispatch(
                setAuth({
                    user: res.user,
                    accessToken: res.accessToken,
                    refreshToken: res.refreshToken,
                    idToken: res.idToken,
                    isSso: true,
                })
            );

            toast.success(
                `Chào mừng ${res.user.fullname || res.user.username}! Đăng nhập QuickBite SSO thành công.`
            );
            navigate(redirectTo, { replace: true });
        } catch (err) {
            console.error("SSO Login Error:", err);
            const errorData = err.response?.data;
            let message = "Đăng nhập QuickBite SSO thất bại. Vui lòng thử lại.";

            if (errorData?.error === "invalid_grant") {
                message = "Tên đăng nhập hoặc mật khẩu QuickBite không chính xác.";
            } else if (errorData?.error_description) {
                message = errorData.error_description;
            } else if (err.message) {
                message = err.message;
            }

            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    // 3. Callback when Google Identity Services returns credential token
    const handleGoogleCredentialResponse = useCallback(
        async (response) => {
            if (!response?.credential) {
                console.warn("No Google credential returned");
                return;
            }

            setLoading(true);
            try {
                const res = await loginWithGoogle(response.credential);
                setTokenWithExpiry(res.accessToken, (res.expiresIn || 3600) * 1000);
                if (res.refreshToken) {
                    setRefreshToken(res.refreshToken);
                }
                setIsSso(true);

                dispatch(
                    setAuth({
                        user: res.user,
                        accessToken: res.accessToken,
                        refreshToken: res.refreshToken,
                        idToken: res.idToken,
                        isSso: true,
                    })
                );

                toast.success(
                    `Chào mừng ${res.user.fullname || res.user.username}! Đăng nhập Google SSO thành công.`
                );
                navigate(redirectTo, { replace: true });
            } catch (err) {
                console.error("Google SSO Login Error:", err);
                const rawMessage =
                    err.response?.data?.message ||
                    err.message ||
                    "Đăng nhập Google SSO qua QuickBite thất bại.";
                toast.error(rawMessage);
            } finally {
                setLoading(false);
            }
        },
        [dispatch, navigate, redirectTo]
    );

    // Initialize Google Identity Services SDK and render button
    useEffect(() => {
        if (!googleClientId || authMode !== "sso") return;

        const initializeGis = () => {
            if (window.google?.accounts?.id) {
                try {
                    window.google.accounts.id.initialize({
                        client_id: googleClientId,
                        callback: handleGoogleCredentialResponse,
                        auto_select: false,
                        cancel_on_tap_outside: true,
                    });

                    if (googleButtonRef.current) {
                        googleButtonRef.current.innerHTML = "";
                        window.google.accounts.id.renderButton(
                            googleButtonRef.current,
                            {
                                theme: "outline",
                                size: "large",
                                type: "standard",
                                text: "signin_with",
                                shape: "pill",
                                width: 340,
                                logo_alignment: "left",
                            }
                        );
                    }
                } catch (err) {
                    console.error("Failed to initialize Google Identity Services:", err);
                }
            }
        };

        if (window.google?.accounts?.id) {
            initializeGis();
        } else {
            const checkInterval = setInterval(() => {
                if (window.google?.accounts?.id) {
                    clearInterval(checkInterval);
                    initializeGis();
                }
            }, 300);
            return () => clearInterval(checkInterval);
        }
    }, [authMode, handleGoogleCredentialResponse]);

    // Fallback trigger for Google One Tap / Sign In prompt
    const handleGoogleSSOClick = () => {
        if (window.google?.accounts?.id) {
            window.google.accounts.id.prompt();
        } else {
            toast.error("Đang kết nối dịch vụ Google Sign-In, vui lòng thử lại sau giây lát.");
        }
    };

    if (isAuthenticated) {
        return null;
    }

    return (
        <PageWrapper
            title={MSG.LOGIN.TITLE}
            subtitle={MSG.LOGIN.SUBTITLE}
        >
            <div className="mx-auto max-w-lg rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm shadow-slate-300/10">
                {/* Header */}
                <div className="text-center mb-6">
                    {authMode === "sso" ? (
                        <div className="inline-flex items-center justify-center gap-2 mb-3 px-3 py-1 rounded-full bg-orange-50 border border-orange-200/60 text-orange-600 text-xs font-semibold">
                            <span className="h-2 w-2 rounded-full bg-orange-500 animate-pulse"></span>
                            QuickBite SSO Identity
                        </div>
                    ) : (
                        <div className="inline-flex items-center justify-center gap-2 mb-3 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/60 text-blue-600 text-xs font-semibold">
                            <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                            Shorter Link Portal
                        </div>
                    )}

                    <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                        {authMode === "local" ? "Đăng nhập Shorter Link" : "Đăng nhập với QuickBite SSO"}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                        {authMode === "local"
                            ? "Đăng nhập bằng tài khoản nội bộ Shorter Link"
                            : "Sử dụng tài khoản hệ sinh thái QuickBite để truy cập"}
                    </p>
                </div>

                {/* Tab Switcher: Local First (Priority), SSO Second */}
                <div className="mb-6 flex rounded-2xl bg-slate-100 p-1 text-sm font-medium text-slate-600">
                    <button
                        type="button"
                        onClick={() => setAuthMode("local")}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl transition ${
                            authMode === "local"
                                ? "bg-white text-blue-600 font-semibold shadow-sm"
                                : "hover:text-slate-900"
                        }`}
                    >
                        <span>🔗</span>
                        Đăng nhập nội bộ
                    </button>
                    <button
                        type="button"
                        onClick={() => setAuthMode("sso")}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl transition ${
                            authMode === "sso"
                                ? "bg-white text-orange-600 font-semibold shadow-sm"
                                : "hover:text-slate-900"
                        }`}
                    >
                        <span>🍔</span>
                        QuickBite SSO
                    </button>
                </div>

                {/* Form */}
                <form
                    onSubmit={authMode === "local" ? handleLocalLogin : handleQuickBiteLogin}
                    className="space-y-4"
                >
                    <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                            {authMode === "local" ? MSG.LOGIN.LABEL_USERNAME : "Tài khoản QuickBite / Email"}
                        </label>
                        <input
                            type="text"
                            name="username"
                            value={credentials.username}
                            onChange={handleChange}
                            placeholder={authMode === "local" ? "Nhập tên đăng nhập" : "admin / user@quickbite.vn"}
                            required
                            className={`w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition ${
                                authMode === "local"
                                    ? "focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                                    : "focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-100"
                            }`}
                        />
                    </div>

                    <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                            {MSG.LOGIN.LABEL_PASSWORD}
                        </label>
                        <input
                            type="password"
                            name="password"
                            value={credentials.password}
                            onChange={handleChange}
                            placeholder="••••••••"
                            required
                            className={`w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition ${
                                authMode === "local"
                                    ? "focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                                    : "focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-100"
                            }`}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-white font-semibold transition shadow-md disabled:opacity-50 ${
                            authMode === "local"
                                ? "bg-blue-600 hover:bg-blue-700 shadow-blue-600/20"
                                : "bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-orange-500/20"
                        }`}
                    >
                        {loading ? (
                            <>
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                                Đang xử lý...
                            </>
                        ) : authMode === "local" ? (
                            MSG.LOGIN.BTN_SUBMIT
                        ) : (
                            "Đăng nhập với QuickBite SSO"
                        )}
                    </button>
                </form>

                {/* Google SSO Button via Google Identity Services (in SSO tab) */}
                {authMode === "sso" && googleClientId && (
                    <div className="mt-4">
                        <div className="relative my-4">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-200"></div>
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-white px-2 text-slate-400 font-medium">hoặc</span>
                            </div>
                        </div>

                        {/* Official Google Identity Services Render Container */}
                        <div className="flex justify-center my-2">
                            <div ref={googleButtonRef}></div>
                        </div>

                        {/* Fallback Custom Google Button (if GIS iframe fails to render) */}
                        <button
                            type="button"
                            onClick={handleGoogleSSOClick}
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm mt-2"
                        >
                            <svg className="h-4 w-4" viewBox="0 0 24 24">
                                <path
                                    fill="#4285F4"
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                />
                                <path
                                    fill="#34A853"
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                />
                                <path
                                    fill="#FBBC05"
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                                />
                                <path
                                    fill="#EA4335"
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                                />
                            </svg>
                            Đăng nhập tài khoản Google (One-Click)
                        </button>
                    </div>
                )}

                {/* SSO Quick Information Notice */}
                {authMode === "sso" && (
                    <div className="mt-4 rounded-2xl bg-amber-50/70 border border-amber-200/50 p-3 text-xs text-amber-800 flex items-start gap-2">
                        <span className="text-base leading-none">🛡️</span>
                        <div>
                            <span className="font-semibold">Bảo mật OpenID Connect:</span> Xác thực một lần, truy cập an toàn mọi ứng dụng vệ tinh trong hệ thống QuickBite.
                        </div>
                    </div>
                )}

                {/* Footer Links */}
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <div>
                        {MSG.LOGIN.NO_ACCOUNT}{" "}
                        <Link
                            to="/register"
                            className="font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                        >
                            {MSG.LOGIN.REGISTER_NOW}
                        </Link>
                    </div>
                    <span className="text-slate-400">
                        {authMode === "local" ? "Shorter Link Auth" : "OAuth 2.0 / OpenIddict"}
                    </span>
                </div>
            </div>
        </PageWrapper>
    );
};

export default Login;