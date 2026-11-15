import React from 'react';

/**
 * High-End PageWrapper Component
 * Provides responsive macro-whitespace, subtle ambient lighting,
 * and seamless mobile viewport stability (100dvh).
 */
const PageWrapper = ({ title, subtitle, actions, children, className = "" }) => {
    return (
        <div className={`relative min-h-[100dvh] bg-slate-50 text-slate-900 overflow-x-hidden ${className}`}>
            {/* Subtle Spatial Ambient Orbs (GPU-safe, pointer-events-none) */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-96 w-full max-w-4xl rounded-full bg-gradient-to-b from-blue-100/50 via-indigo-50/20 to-transparent blur-3xl"
            />

            {/* Main Content Container with Macro-Whitespace below Floating Nav */}
            <main className="relative mx-auto max-w-5xl px-4 pt-24 sm:pt-28 pb-16 sm:pb-24">
                {/* Optional Page Header */}
                {(title || actions) && (
                    <header className="mb-8 rounded-3xl border border-slate-200/70 bg-white/75 p-6 sm:p-8 shadow-soft-sm backdrop-blur-xl">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0 flex-1">
                                {title && (
                                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                                        {title}
                                    </h1>
                                )}
                                {subtitle && (
                                    <p className="mt-1.5 text-sm sm:text-base leading-relaxed text-slate-500 max-w-[65ch]">
                                        {subtitle}
                                    </p>
                                )}
                            </div>
                            {actions && <div className="shrink-0">{actions}</div>}
                        </div>
                    </header>
                )}

                {/* Page Body */}
                <div className="space-y-6 min-w-0">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default PageWrapper;
