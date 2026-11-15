import React from 'react';

/**
 * High-End Studio Footer
 * Clean, hairline divider with live service readiness indicator and warm copy.
 */
const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="mt-auto border-t border-slate-200/70 bg-white/50 backdrop-blur-sm">
            <div className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between text-xs text-slate-500">

                    {/* Brand & Mission Statement */}
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
                        <span className="font-semibold text-slate-800 tracking-tight">
                            Shorter<span className="text-blue-600">Link</span>
                        </span>
                        <span className="hidden sm:inline text-slate-300">•</span>
                        <span>Đơn giản hóa từng liên kết, tối ưu cho con người</span>
                    </div>

                    {/* Operational Heartbeat & Copyright */}
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-200/60 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
                            <span className="relative flex h-2 w-2">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                            </span>
                            <span>Hệ thống hoạt động bình thường</span>
                        </div>

                        <div className="text-slate-400">
                            © {currentYear} Shorter Link
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
