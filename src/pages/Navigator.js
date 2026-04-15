import React from 'react';

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { get } from "../utils/request";
import PageWrapper from "../components/PageWrapper";

const Navigator = () => {
    const { shortLink } = useParams();
    const [countdown, setCountdown] = useState(3);
    const [originalLink, setOriginalLink] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        console.log("Fetching original URL for shortLink:", shortLink);
        get("shortener/" + shortLink)
            .then((response) => {
                console.log(response);
                if (!response) {
                    navigate("/not-found");
                } else {
                    setOriginalLink(response.originalUrl);
                }
            })
            .catch((error) => {
                if (error.response?.status === 404 || error.status === 404) {
                    navigate("/not-found");
                }
                console.log(error);
            });
    }, [navigate, shortLink]);

    useEffect(() => {
        if (countdown > 0) {
            const timer = setInterval(() => {
                setCountdown((prev) => prev - 1);
            }, 1000);

            return () => clearInterval(timer);
        }
    }, [countdown, navigate]);
    console.log("shortLink:", shortLink);
    console.log("current path:", window.location.pathname);
    return (
        <PageWrapper
            title="Đang chuyển hướng"
            subtitle="Chuẩn bị điều hướng tới liên kết gốc cho bạn"
        >
            <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm shadow-slate-300/10">
                <div className="text-center">
                    {countdown === 0 ? (
                        <h1 className="text-3xl font-bold text-slate-900 mb-4">Liên kết của bạn đã sẵn sàng!</h1>
                    ) : (
                        <h1 className="text-3xl font-bold text-slate-900 mb-4">Đang chuẩn bị liên kết...</h1>
                    )}
                    <p className="text-slate-600 mb-6">Bạn sẽ được chuyển đến trang gốc trong vài giây.</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-slate-700">Quảng cáo 1</div>
                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-slate-700">Quảng cáo 2</div>
                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-slate-700">Quảng cáo 3</div>
                </div>

                <div className="mt-8 text-center">
                    {countdown === 0 ? (
                        <button
                            className="rounded-2xl bg-blue-500 px-6 py-3 text-white shadow-md shadow-blue-500/10 transition hover:bg-blue-600 disabled:bg-slate-300"
                            onClick={() => originalLink && (window.location.href = originalLink)}
                            disabled={!originalLink}
                        >
                            Mở liên kết
                        </button>
                    ) : (
                        <div className="inline-flex items-center gap-3 rounded-3xl bg-slate-100 px-6 py-4 text-2xl font-semibold text-slate-900">
                            <span>{countdown}</span>
                            <span>giây</span>
                        </div>
                    )}
                </div>
            </div>
        </PageWrapper>
    );
};

export default Navigator;
