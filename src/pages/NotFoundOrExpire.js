
import { Link } from "react-router-dom";
import PageWrapper from "../components/PageWrapper";

const NotFountOrExpire = () => {
    return (
        <PageWrapper
            title="Không tìm thấy trang"
            subtitle="Liên kết bạn tìm không tồn tại hoặc đã hết hạn."
            className="bg-slate-50"
        >
            <div className="mx-auto max-w-lg rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm shadow-slate-300/10">
                <h1 className="text-3xl font-bold text-slate-900 mb-4">Trang không tồn tại hoặc đã hết hạn!</h1>
                <p className="mb-6 text-slate-600">Vui lòng kiểm tra lại đường dẫn hoặc quay về trang chủ để tiếp tục.</p>
                <Link
                    to="/home"
                    className="inline-flex rounded-2xl bg-blue-500 px-6 py-3 text-white shadow-md shadow-blue-500/10 transition hover:bg-blue-600"
                >
                    Quay về trang chủ
                </Link>
            </div>
        </PageWrapper>
    );
}

export default NotFountOrExpire;