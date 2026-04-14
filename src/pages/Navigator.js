import React from 'react';

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { get } from "../utils/request";

const Navigator = () => {
    const { shortLink } = useParams();
    const [countdown, setCountdown] = useState(3);
    const [originalLink, setOriginalLink] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
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

    return (
        <div className="bg-gray-100 flex items-center justify-center min-h-screen">
            <div className="bg-white p-6 rounded shadow-md text-center">
                {countdown === 0 ? (
                    <h1 className="text-2xl font-bold mb-4">Liên kết của bạn đã sẵn sàng!</h1>
                ) : (
                    <h1 className="text-2xl font-bold mb-4">Đang chuẩn bị liên kết...</h1>
                )}

                <div className="grid grid-cols-1 gap-4">
                    <div className="bg-gray-200 p-4 rounded">Quảng cáo 1</div>
                    <div className="bg-gray-200 p-4 rounded">Quảng cáo 2</div>
                    <div className="bg-gray-200 p-4 rounded">Quảng cáo 3</div>
                </div>
                {countdown === 0 ? (
                    <button
                        className="bg-blue-500 text-white px-4 py-2 rounded my-3 disabled:bg-gray-400"
                        onClick={() => originalLink && (window.location.href = originalLink)}
                        disabled={!originalLink}
                    >
                        Get link
                    </button>
                ) : (
                    <h3 className="text-xl font-semibold mb-4">{countdown}</h3>
                )}

            </div>
        </div >
    );
};

export default Navigator;
