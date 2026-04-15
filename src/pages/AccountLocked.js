import { Link } from "react-router-dom";
import PageWrapper from "../components/PageWrapper";

const AccountLocked = () => {
    return (
        <PageWrapper
            title="Tài khoản bị khóa"
            subtitle="Tài khoản của bạn đã bị khóa hoặc bị gỡ khỏi hệ thống"
        >
            <div className="mx-auto max-w-lg rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm shadow-slate-300/10">
                <h1 className="text-3xl font-bold text-slate-900 mb-4">Tài khoản của bạn đã bị khóa vĩnh viễn</h1>
                <p className="mb-6 text-slate-600">
                    Vui lòng liên hệ quản trị viên nếu bạn cần hỗ trợ hoặc muốn mở khóa lại tài khoản.
                </p>
                <Link
                    to="/home"
                    className="inline-flex rounded-2xl bg-blue-500 px-6 py-3 text-white shadow-md shadow-blue-500/10 transition hover:bg-blue-600"
                >
                    Quay về trang chủ
                </Link>
            </div>
        </PageWrapper>
    );
};

export default AccountLocked;
