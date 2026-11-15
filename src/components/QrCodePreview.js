import { useEffect, useState } from "react";
import QRCode from "qrcode";

/**
 * Modern High-End QR Code Preview Component.
 * Generates an SVG/Canvas QR code with instant download capability.
 */
const QrCodePreview = ({ url }) => {
    const [dataUrl, setDataUrl] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let mounted = true;
        setLoading(true);
        setError("");
        setDataUrl("");

        QRCode.toDataURL(url, {
            width: 320,
            margin: 2,
            color: {
                dark: "#0f172a",
                light: "#ffffff",
            },
        })
            .then((result) => {
                if (mounted) {
                    setDataUrl(result);
                    setLoading(false);
                }
            })
            .catch(() => {
                if (mounted) {
                    setError("Không thể tạo mã QR lúc này");
                    setLoading(false);
                }
            });

        return () => {
            mounted = false;
        };
    }, [url]);

    const downloadQr = () => {
        if (!dataUrl) return;
        const anchor = document.createElement("a");
        anchor.href = dataUrl;
        anchor.download = `qr-${url.replace(/[^a-z0-9]/gi, "_").slice(0, 40)}.png`;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
    };

    return (
        <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-soft-md">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h4 className="text-base font-bold text-slate-900 tracking-tight">Mã QR liên kết</h4>
                    <p className="text-xs text-slate-500">Quét để mở nhanh trên điện thoại hoặc tải ảnh về máy.</p>
                </div>
                <button
                    type="button"
                    onClick={downloadQr}
                    disabled={!dataUrl || loading}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-soft-xs transition-all hover:bg-slate-800 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    <span>Tải ảnh QR</span>
                </button>
            </div>

            <div className="flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-slate-100 bg-slate-50/70 p-6">
                {loading ? (
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
                        <span className="text-xs">Đang khởi tạo mã QR...</span>
                    </div>
                ) : error ? (
                    <p className="text-xs font-medium text-rose-600">{error}</p>
                ) : (
                    <div className="rounded-2xl bg-white p-3 shadow-soft-xs border border-slate-100">
                        <img src={dataUrl} alt="QR code" className="h-52 w-52 object-contain" />
                    </div>
                )}
                <span className="mt-3 font-mono text-[11px] text-slate-400 max-w-xs truncate text-center">
                    {url}
                </span>
            </div>
        </div>
    );
};

export default QrCodePreview;
