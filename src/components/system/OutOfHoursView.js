import React from "react";
import { MSG } from "../../constants/messages";

/**
 * OutOfHoursView Component
 * High-end minimalist agency screen displayed outside daily operating hours (UTC+7).
 * Replaces raw emojis with bespoke SVG iconography and sharp JetBrains Mono clock digits.
 */
function OutOfHoursView({ startup, shutdown, currentTime }) {
    const text = MSG.SYSTEM_GUARD;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-2xl min-h-[100dvh]">
            {/* Ambient Background Glows */}
            <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-indigo-500/15 blur-3xl" />
            <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-blue-500/10 blur-2xl" />

            {/* Double-Bezel Central Modal */}
            <div className="double-bezel-outer p-2 rounded-[2.5rem] w-full max-w-lg bg-white/10 ring-1 ring-white/20 shadow-2xl relative z-10">
                <div className="double-bezel-inner p-7 sm:p-10 bg-white/95 backdrop-blur-xl rounded-[calc(2.5rem-0.5rem)] text-center space-y-6">
                    {/* Minimalist Crescent Moon & Star Icon */}
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-indigo-500/10 text-indigo-600 ring-1 ring-indigo-500/25 shadow-soft-xs">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                        </svg>
                    </div>

                    {/* Status Pill Badge */}
                    <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50/80 px-4 py-1.5 text-xs font-semibold text-indigo-800">
                        <span className="h-2 w-2 rounded-full bg-indigo-500" />
                        <span>{text.OUT_OF_HOURS_BADGE}</span>
                    </div>

                    {/* Title & Description */}
                    <div className="space-y-2">
                        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                            {text.OUT_OF_HOURS_TITLE}
                        </h2>
                        <p className="text-sm leading-relaxed text-slate-600 max-w-md mx-auto">
                            {text.OUT_OF_HOURS_DESC(startup, shutdown)}
                        </p>
                        <p className="text-xs text-slate-400">
                            {text.OUT_OF_HOURS_SUBTEXT}
                        </p>
                    </div>

                    {/* Operating Schedule & Realtime Clock Bento */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 flex flex-col items-center justify-center">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                {text.LABEL_WORKING_HOURS}
                            </span>
                            <span className="mt-1 font-mono text-base sm:text-lg font-bold text-blue-600">
                                {startup} – {shutdown}
                            </span>
                        </div>
                        <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 flex flex-col items-center justify-center">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                {text.LABEL_CURRENT_TIME}
                            </span>
                            <span className="mt-1 font-mono text-base sm:text-lg font-bold text-slate-800">
                                {currentTime || "--:--:--"}
                            </span>
                        </div>
                    </div>

                    {/* Next Open Note Capsule */}
                    <div className="inline-flex items-center gap-2 rounded-2xl border border-indigo-100 bg-indigo-50/60 px-4 py-3 text-xs font-semibold text-indigo-900 max-w-sm mx-auto">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600 shrink-0">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                        </svg>
                        <span>{text.OUT_OF_HOURS_NEXT_OPEN(startup)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default OutOfHoursView;
