import React from 'react';

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { get, post } from "../utils/request";
import toast from 'react-hot-toast';
import PageWrapper from "../components/PageWrapper";
import { MSG } from "../constants/messages";

const Navigator = () => {
    const { shortLink: rawShortLink } = useParams();
    const shortLink = rawShortLink?.includes("/") ? rawShortLink.split("/").pop() : rawShortLink || "";
    const [countdown, setCountdown] = useState(3);
    const [originalLink, setOriginalLink] = useState("");
    const [password, setPassword] = useState("");
    const [passwordProtected, setPasswordProtected] = useState(false);
    const [passwordVerified, setPasswordVerified] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        setIsLoading(true);
        get("shortener/" + shortLink)
            .then((response) => {
                if (!response) {
                    navigate("/not-found");
                    return;
                }
                setOriginalLink(response.originalUrl);
                setPasswordProtected(Boolean(response.passwordProtected));

                if (!response.passwordProtected) {
                    post(`shortener/${shortLink}/click`)
                        .then(() => setPasswordVerified(true))
                        .catch((error) => {
                            if (error.response?.status === 404 || error.status === 404) {
                                navigate("/not-found");
                            } else {
                                toast.error(error.response?.data?.message || MSG.NAVIGATOR.ERR_CLICK);
                            }
                        })
                        .finally(() => setIsLoading(false));
                } else {
                    setIsLoading(false);
                }
            })
            .catch((error) => {
                console.log(error);
                if (error.response?.status === 404 || error.status === 404) {
                    navigate("/not-found");
                }
                setIsLoading(false);
            });
    }, [navigate, shortLink]);

    useEffect(() => {
        if (!passwordVerified) {
            return;
        }
        if (countdown > 0) {
            const timer = setInterval(() => {
                setCountdown((prev) => prev - 1);
            }, 1000);

            return () => clearInterval(timer);
        }
    }, [countdown, navigate, passwordVerified]);

    const verifyPassword = () => {
        if (!password.trim()) {
            toast.error(MSG.NAVIGATOR.PASSWORD_REQUIRED);
            return;
        }
        setIsLoading(true);
        post(`shortener/${shortLink}/click`, { password })
            .then(() => {
                setPasswordVerified(true);
                toast.success(MSG.NAVIGATOR.PASSWORD_SUCCESS);
            })
            .catch((error) => {
                const message = error.response?.data?.message || MSG.NAVIGATOR.PASSWORD_INCORRECT;
                toast.error(message);
            })
            .finally(() => setIsLoading(false));
    };

    console.log("shortLink:", shortLink);
    console.log("current path:", window.location.pathname);
    return (
        <PageWrapper
            title={MSG.NAVIGATOR.TITLE}
            subtitle={MSG.NAVIGATOR.SUBTITLE}
        >
            <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm shadow-slate-300/10">
                <div className="text-center">
                    {countdown === 0 ? (
                        <h1 className="text-3xl font-bold text-slate-900 mb-4">{MSG.NAVIGATOR.LINK_READY}</h1>
                    ) : (
                        <h1 className="text-3xl font-bold text-slate-900 mb-4">{MSG.NAVIGATOR.PREPARING_LINK}</h1>
                    )}
                    <p className="text-slate-600 mb-6">{MSG.NAVIGATOR.REDIRECT_MESSAGE}</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-slate-700">{MSG.NAVIGATOR.ADVERTISEMENT_1}</div>
                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-slate-700">{MSG.NAVIGATOR.ADVERTISEMENT_2}</div>
                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-slate-700">{MSG.NAVIGATOR.ADVERTISEMENT_3}</div>
                </div>

                <div className="mt-8 text-center">
                    {isLoading ? (
                        <p className="text-slate-500">{MSG.NAVIGATOR.CHECKING_LINK}</p>
                    ) : passwordProtected && !passwordVerified ? (
                        <div className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-slate-50 p-6 text-left shadow-sm shadow-slate-300/10">
                            <h2 className="text-xl font-semibold text-slate-900 mb-3">{MSG.NAVIGATOR.PASSWORD_REQUIRED}</h2>
                            <p className="text-slate-600 mb-4">{MSG.NAVIGATOR.PASSWORD_DESCRIPTION}</p>
                            <div className="space-y-4">
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder={MSG.NAVIGATOR.PASSWORD_PLACEHOLDER}
                                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />
                                <button
                                    type="button"
                                    onClick={verifyPassword}
                                    disabled={isLoading}
                                    className={`w-full rounded-2xl px-6 py-3 text-white shadow-md transition ${isLoading ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'}`}
                                >
                                    {MSG.NAVIGATOR.CONFIRM_PASSWORD}
                                </button>
                            </div>
                        </div>
                    ) : countdown === 0 ? (
                        <button
                            className="rounded-2xl bg-blue-500 px-6 py-3 text-white shadow-md shadow-blue-500/10 transition hover:bg-blue-600 disabled:bg-slate-300"
                            onClick={() => originalLink && (window.location.href = originalLink)}
                            disabled={!originalLink}
                        >
                            {MSG.NAVIGATOR.OPEN_LINK}
                        </button>
                    ) : (
                        <div className="inline-flex items-center gap-3 rounded-3xl bg-slate-100 px-6 py-4 text-2xl font-semibold text-slate-900">
                            <span>{countdown}</span>
                            <span>{MSG.NAVIGATOR.SECONDS}</span>
                        </div>
                    )}
                </div>
            </div>
        </PageWrapper>
    );
};

export default Navigator;
