import { Link } from "react-router-dom";
import PageWrapper from "../components/PageWrapper";
import { MSG } from "../constants/messages";

/**
 * Modern High-End Account Locked Component.
 * Warm, empathetic screen informing user with clear support guidance.
 */
const AccountLocked = () => {
    return (
        <PageWrapper
            title={MSG.ACCOUNT_LOCKED.TITLE}
            subtitle={MSG.ACCOUNT_LOCKED.SUBTITLE}
        >
            <div className="double-bezel-outer mx-auto max-w-lg mt-6">
                <div className="double-bezel-inner p-8 sm:p-12 text-center">
                    {/* Visual Lock Halo */}
                    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-amber-50 text-amber-600 shadow-inner">
                        <svg className="h-10 w-10 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                    </div>

                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
                        {MSG.ACCOUNT_LOCKED.HEADING || MSG.ACCOUNT_LOCKED.TITLE}
                    </h1>
                    <p className="mb-8 text-xs sm:text-sm text-slate-500 leading-relaxed max-w-sm mx-auto">
                        {MSG.ACCOUNT_LOCKED.DESCRIPTION}
                    </p>

                    <Link
                        to="/home"
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-7 py-3.5 text-xs sm:text-sm font-semibold text-white shadow-soft-xs transition-all hover:bg-slate-800 active:scale-95"
                    >
                        <span>←</span>
                        <span>{MSG.ACCOUNT_LOCKED.BACK_TO_HOME}</span>
                    </Link>
                </div>
            </div>
        </PageWrapper>
    );
};

export default AccountLocked;
