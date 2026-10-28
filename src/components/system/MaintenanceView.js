import { MSG } from "../../constants/messages";

/**
 * MaintenanceView Component
 * Renders a warm, human-centered maintenance screen when IS_MAINTAIN is active.
 * Intentionally contains no action buttons that trigger network requests.
 */
function MaintenanceView() {
    const text = MSG.SYSTEM_GUARD;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-md">
            <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-slate-100 bg-white p-8 text-center shadow-2xl shadow-slate-300/50 sm:p-10">
                {/* Decorative background glow */}
                <div className="pointer-events-none absolute -top-20 -right-20 h-56 w-56 rounded-full bg-blue-100/60 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-amber-100/60 blur-3xl" />

                <div className="relative">
                    {/* Cozy Icon Illustration */}
                    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-50 text-4xl shadow-inner shadow-amber-200/50">
                        ☕
                    </div>

                    {/* Friendly Badge */}
                    <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-1.5 text-xs font-semibold text-amber-800">
                        <span className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
                        {text.MAINTENANCE_BADGE}
                    </div>

                    {/* Warm Header */}
                    <h2 className="mb-3 text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl">
                        {text.MAINTENANCE_TITLE}
                    </h2>

                    {/* Thoughtful Description */}
                    <p className="mb-6 text-sm leading-relaxed text-slate-600 sm:text-base">
                        {text.MAINTENANCE_DESC}
                    </p>

                    {/* Humanized Subtext Box */}
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 text-xs leading-relaxed text-slate-500 sm:text-sm">
                        {text.MAINTENANCE_SUBTEXT}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default MaintenanceView;

