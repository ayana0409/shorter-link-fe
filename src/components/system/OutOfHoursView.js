import React from "react";
import { MSG } from "../../constants/messages";

/**
 * OutOfHoursView Component
 * Renders an empathetic, human-centered screen when users visit outside operating hours.
 * Displays current UTC+7 time and the daily operating schedule.
 */
function OutOfHoursView({ startup, shutdown, currentTime }) {
    const text = MSG.SYSTEM_GUARD;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-md">
            <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-slate-100 bg-white p-8 text-center shadow-2xl shadow-slate-300/50 sm:p-10">
                {/* Decorative background glow */}
                <div className="pointer-events-none absolute -top-20 -right-20 h-56 w-56 rounded-full bg-indigo-100/60 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-blue-100/60 blur-3xl" />

                <div className="relative">
                    {/* Restful Icon Illustration */}
                    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-indigo-50 text-4xl shadow-inner shadow-indigo-200/50">
                        🌙
                    </div>

                    {/* Friendly Badge */}
                    <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-xs font-semibold text-indigo-800">
                        <span className="h-2 w-2 rounded-full bg-indigo-500" />
                        {text.OUT_OF_HOURS_BADGE}
                    </div>

                    {/* Warm Header */}
                    <h2 className="mb-3 text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl">
                        {text.OUT_OF_HOURS_TITLE}
                    </h2>

                    {/* Thoughtful Description */}
                    <p className="mb-4 text-sm leading-relaxed text-slate-600 sm:text-base">
                        {text.OUT_OF_HOURS_DESC(startup, shutdown)}
                    </p>

                    {/* Empathetic Subtext */}
                    <p className="mb-6 text-xs text-slate-500 sm:text-sm">
                        {text.OUT_OF_HOURS_SUBTEXT}
                    </p>

                    {/* Schedule & Live Time Information Card */}
                    <div className="mb-6 grid grid-cols-1 gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 sm:grid-cols-2">
                        <div className="flex flex-col items-center justify-center rounded-xl bg-white p-3 border border-slate-100 shadow-sm">
                            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                                {text.LABEL_WORKING_HOURS}
                            </span>
                            <span className="mt-1 text-base font-bold text-blue-600 sm:text-lg">
                                {startup} – {shutdown}
                            </span>
                        </div>
                        <div className="flex flex-col items-center justify-center rounded-xl bg-white p-3 border border-slate-100 shadow-sm">
                            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                                {text.LABEL_CURRENT_TIME}
                            </span>
                            <span className="mt-1 font-mono text-base font-bold text-slate-700 sm:text-lg">
                                {currentTime || "--:--:--"}
                            </span>
                        </div>
                    </div>

                    {/* Welcoming Next Open Note */}
                    <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-3.5 text-xs font-medium text-indigo-900 sm:text-sm">
                        ✨ {text.OUT_OF_HOURS_NEXT_OPEN(startup)}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default OutOfHoursView;

