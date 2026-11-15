import { Link } from "react-router-dom";
import PageWrapper from "../components/PageWrapper";
import { MSG } from "../constants/messages";

/**
 * Modern High-End 404 / Expired Link Component.
 * Gentle visual design with ambient lighting and clear return CTA.
 */
const NotFountOrExpire = () => {
    return (
        <PageWrapper
            title={MSG.NOT_FOUND.TITLE}
            subtitle={MSG.NOT_FOUND.SUBTITLE}
        >
            <div className="double-bezel-outer mx-auto max-w-lg mt-6">
                <div className="double-bezel-inner p-8 sm:p-12 text-center">
                    {/* Visual Icon Halo */}
                    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100/80 text-slate-400 shadow-inner">
                        <svg className="h-10 w-10 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <path d="m15 9-6 6" />
                            <path d="m9 9 6 6" />
                        </svg>
                    </div>

                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
                        {MSG.NOT_FOUND.HEADING || MSG.NOT_FOUND.TITLE}
                    </h1>
                    <p className="mb-8 text-xs sm:text-sm text-slate-500 leading-relaxed max-w-sm mx-auto">
                        {MSG.NOT_FOUND.DESCRIPTION}
                    </p>

                    <Link
                        to="/home"
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-7 py-3.5 text-xs sm:text-sm font-semibold text-white shadow-soft-xs transition-all hover:bg-slate-800 active:scale-95"
                    >
                        <span>←</span>
                        <span>{MSG.NOT_FOUND.BACK_TO_HOME}</span>
                    </Link>
                </div>
            </div>
        </PageWrapper>
    );
};

export default NotFountOrExpire;
