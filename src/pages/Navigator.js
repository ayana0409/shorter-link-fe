import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { get, post } from "../utils/request";
import toast from 'react-hot-toast';
import PageWrapper from "../components/PageWrapper";
import { MSG } from "../constants/messages";
import { getStaticDestinationUrl } from "../constants/staticLinks";

/**
 * Modern High-End Navigator Component.
 * Handles short URL resolution, password verification gate, and countdown auto-redirection.
 */
const Navigator = () => {
    const { shortLink: rawShortLink } = useParams();
    const shortLink = rawShortLink?.includes("/") ? rawShortLink.split("/").pop() : rawShortLink || "";
    const [countdown, setCountdown] = useState(3);
    const [originalLink, setOriginalLink] = useState("");
    const [password, setPassword] = useState("");
    const [passwordProtected, setPasswordProtected] = useState(false);
    const [passwordVerified, setPasswordVerified] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        // Direct static link bypass: redirect immediately without contacting backend
        const staticUrl = getStaticDestinationUrl(shortLink);
        if (staticUrl) {
            window.location.replace(staticUrl);
            return;
        }

        setIsLoading(true);
        get("shortener/" + shortLink)
            .then((response) => {
                if (!response) {
                    navigate("/not-found");
                    return;
                }
                setOriginalLink(response.originalUrl);
                setPasswordProtected(Boolean(response.passwordProtected));

                if (!response.passwordProtected) {
                    post(`shortener/${shortLink}/click`)
                        .then(() => setPasswordVerified(true))
                        .catch((error) => {
                            if (error.response?.status === 404 || error.status === 404) {
                                navigate("/not-found");
                            } else {
                                toast.error(error.response?.data?.message || MSG.NAVIGATOR.ERR_CLICK);
                            }
                        })
                        .finally(() => setIsLoading(false));
                } else {
                    setIsLoading(false);
                }
            })
            .catch((error) => {
                if (error.response?.status === 404 || error.status === 404) {
                    navigate("/not-found");
                }
                setIsLoading(false);
            });
    }, [navigate, shortLink]);

    // Countdown interval timer
    useEffect(() => {
        if (!passwordVerified) return;

        if (countdown > 0) {
            const timer = setInterval(() => {
                setCountdown((prev) => prev - 1);
            }, 1000);
            return () => clearInterval(timer);
        } else if (countdown === 0 && originalLink) {
            window.location.href = originalLink;
        }
    }, [countdown, navigate, passwordVerified, originalLink]);

    const verifyPassword = (e) => {
        if (e) e.preventDefault();
        if (!password.trim()) {
            toast.error(MSG.NAVIGATOR.PASSWORD_REQUIRED);
            return;
        }
        setIsLoading(true);
        post(`shortener/${shortLink}/click`, { password })
            .then(() => {
                setPasswordVerified(true);
                toast.success(MSG.NAVIGATOR.PASSWORD_SUCCESS);
            })
            .catch((error) => {
                const message = error.response?.data?.message || MSG.NAVIGATOR.PASSWORD_INCORRECT;
                toast.error(message);
            })
            .finally(() => setIsLoading(false));
    };

    return (
        <PageWrapper
            title={MSG.NAVIGATOR.TITLE}
            subtitle={MSG.NAVIGATOR.SUBTITLE}
        >
            <div className="double-bezel-outer mx-auto max-w-xl">
                <div className="double-bezel-inner p-6 sm:p-10 text-center">
                    
                    {/* Header Moment */}
                    <div className="mb-6">
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600 shadow-inner">
                            <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                            </svg>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                            {countdown === 0 ? MSG.NAVIGATOR.LINK_READY : MSG.NAVIGATOR.PREPARING_LINK}
                        </h1>
                        <p className="mt-2 text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                            {MSG.NAVIGATOR.REDIRECT_MESSAGE}
                        </p>
                    </div>

                    {/* Trust and Safety Badges */}
                    <div className="grid gap-2.5 sm:grid-cols-3 my-6">
                        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 text-center">
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-xs mb-1.5 font-bold">
                                ✓
                            </span>
                            <p className="text-xs font-semibold text-slate-800">Đã kiểm tra an toàn</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">Không chứa mã độc</p>
                        </div>

                        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 text-center">
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-xs mb-1.5 font-bold">
                                ⚡
                            </span>
                            <p className="text-xs font-semibold text-slate-800">Chuyển tiếp tức thì</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">Tốc độ cao</p>
                        </div>

                        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 text-center">
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-xs mb-1.5 font-bold">
                                🔒
                            </span>
                            <p className="text-xs font-semibold text-slate-800">Bảo mật SSL/TLS</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">Mã hóa an toàn</p>
                        </div>
                    </div>

                    {/* Active State Container */}
                    <div className="mt-8">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center gap-3 py-6 text-slate-500">
                                <div className="h-9 w-9 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
                                <span className="text-xs font-medium">{MSG.NAVIGATOR.CHECKING_LINK}</span>
                            </div>
                        ) : passwordProtected && !passwordVerified ? (
                            /* Password Gate Container */
                            <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-slate-50/80 p-5 sm:p-6 text-left shadow-soft-xs">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-lg">🔑</span>
                                    <h2 className="text-sm sm:text-base font-bold text-slate-900">
                                        {MSG.NAVIGATOR.PASSWORD_REQUIRED}
                                    </h2>
                                </div>
                                <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                                    {MSG.NAVIGATOR.PASSWORD_DESCRIPTION}
                                </p>
                                <form onSubmit={verifyPassword} className="space-y-3">
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder={MSG.NAVIGATOR.PASSWORD_PLACEHOLDER}
                                        autoFocus
                                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    />
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-xs font-semibold text-white shadow-soft-xs hover:bg-slate-800 active:scale-95 transition disabled:opacity-50"
                                    >
                                        <span>{MSG.NAVIGATOR.CONFIRM_PASSWORD}</span>
                                        <span className="text-xs">→</span>
                                    </button>
                                </form>
                            </div>
                        ) : countdown === 0 ? (
                            /* Link Ready Button */
                            <button
                                type="button"
                                onClick={() => originalLink && (window.location.href = originalLink)}
                                disabled={!originalLink}
                                className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-8 py-3.5 text-sm font-semibold text-white shadow-soft-md shadow-blue-500/20 transition hover:bg-blue-700 active:scale-95 disabled:bg-slate-300"
                            >
                                <span>{MSG.NAVIGATOR.OPEN_LINK}</span>
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-xs">↗</span>
                            </button>
                        ) : (
                            /* Countdown Circular Pulse */
                            <div className="flex flex-col items-center justify-center">
                                <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-blue-100 bg-blue-50/70 shadow-inner">
                                    <span className="font-mono text-3xl font-black text-blue-600">
                                        {countdown}
                                    </span>
                                </div>
                                <span className="mt-3 text-xs text-slate-400 font-medium">
                                    Tự động chuyển tiếp sau {countdown} {MSG.NAVIGATOR.SECONDS}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </PageWrapper>
    );
};

export default Navigator;
