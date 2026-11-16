import { MSG } from "../../constants/messages";

/**
 * MaintenanceView Component
 * High-end minimalist agency screen displayed when IS_MAINTAIN is active.
 * Replaces raw emojis with bespoke SVG iconography and a Double-Bezel ambient halo.
 * Intentionally contains no action buttons that trigger network requests.
 */
function MaintenanceView() {
    const text = MSG.SYSTEM_GUARD;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-2xl min-h-[100dvh]">
            {/* Ambient Background Glows */}
            <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-amber-500/15 blur-3xl" />
            <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-blue-500/10 blur-2xl" />

            {/* Double-Bezel Central Modal */}
            <div className="double-bezel-outer p-2 rounded-[2.5rem] w-full max-w-lg bg-white/10 ring-1 ring-white/20 shadow-2xl relative z-10">
                <div className="double-bezel-inner p-7 sm:p-10 bg-white/95 backdrop-blur-xl rounded-[calc(2.5rem-0.5rem)] text-center space-y-6">
                    {/* Minimalist Machined Tool Icon */}
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/25 shadow-soft-xs">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                        </svg>
                    </div>

                    {/* Status Pill Badge */}
                    <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50/80 px-4 py-1.5 text-xs font-semibold text-amber-800">
                        <span className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
                        <span>{text.MAINTENANCE_BADGE}</span>
                    </div>

                    {/* Title & Description */}
                    <div className="space-y-2.5">
                        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                            {text.MAINTENANCE_TITLE}
                        </h2>
                        <p className="text-sm leading-relaxed text-slate-600 max-w-md mx-auto">
                            {text.MAINTENANCE_DESC}
                        </p>
                    </div>

                    {/* Humanized Subtext Box */}
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 text-xs leading-relaxed text-slate-500">
                        {text.MAINTENANCE_SUBTEXT}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default MaintenanceView;
