import { useEffect, useState } from "react";
import QRCode from "qrcode";

const QrCodePreview = ({ url }) => {
    const [dataUrl, setDataUrl] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let mounted = true;
        setLoading(true);
        setError("");
        setDataUrl("");

        QRCode.toDataURL(url, { width: 280, margin: 2 })
            .then((result) => {
                if (mounted) {
                    setDataUrl(result);
                    setLoading(false);
                }
            })
            .catch(() => {
                if (mounted) {
                    setError("Không thể tạo mã QR");
                    setLoading(false);
                }
            });

        return () => {
            mounted = false;
        };
    }, [url]);

    const downloadQr = () => {
        if (!dataUrl) {
            return;
        }
        const anchor = document.createElement("a");
        anchor.href = dataUrl;
        anchor.download = `qr-${url.replace(/[^a-z0-9]/gi, "_").slice(0, 50)}.png`;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
    };

    return (
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-300/10">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h4 className="text-lg font-semibold text-slate-900">Mã QR cho link</h4>
                    <p className="text-sm text-slate-500">Quét để mở liên kết nhanh hoặc tải mã QR xuống.</p>
                </div>
                <button
                    type="button"
                    onClick={downloadQr}
                    disabled={!dataUrl || loading}
                    className="rounded-2xl bg-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                    Tải mã QR xuống
                </button>
            </div>
            <div className="flex min-h-[280px] items-center justify-center rounded-2xl bg-slate-50 p-4">
                {loading ? (
                    <p className="text-sm text-slate-500">Đang tạo mã QR...</p>
                ) : error ? (
                    <p className="text-sm text-red-600">{error}</p>
                ) : (
                    <img src={dataUrl} alt="QR code" className="h-56 w-56 object-contain" />
                )}
            </div>
        </div>
    );
};

export default QrCodePreview;
