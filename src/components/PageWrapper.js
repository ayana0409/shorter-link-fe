const PageWrapper = ({ title, subtitle, actions, children, className = "" }) => {
    return (
        <div className={`min-h-screen bg-slate-50 text-slate-900 ${className}`}>
            <div className="mx-auto max-w-6xl px-4 py-8">
                <div className="mb-8 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm shadow-slate-300/10 backdrop-blur">
                    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <div className="min-w-0">
                            {title && <h1 className="text-3xl font-bold text-slate-900 truncate">{title}</h1>}
                            {subtitle && <p className="mt-2 text-sm text-slate-600">{subtitle}</p>}
                        </div>
                        {actions && <div className="shrink-0">{actions}</div>}
                    </div>
                </div>
                <div className="space-y-6 min-w-0 overflow-hidden">{children}</div>
            </div>
        </div>
    );
};

export default PageWrapper;
