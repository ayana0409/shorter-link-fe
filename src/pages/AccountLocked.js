import { Link } from "react-router-dom";
import PageWrapper from "../components/PageWrapper";
import { MSG } from "../constants/messages";

const AccountLocked = () => {
    return (
        <PageWrapper
            title={MSG.ACCOUNT_LOCKED.TITLE}
            subtitle={MSG.ACCOUNT_LOCKED.SUBTITLE}
        >
            <div className="mx-auto max-w-lg rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm shadow-slate-300/10">
                <h1 className="text-3xl font-bold text-slate-900 mb-4">{MSG.ACCOUNT_LOCKED.TITLE}</h1>
                <p className="mb-6 text-slate-600">
                    {MSG.ACCOUNT_LOCKED.DESCRIPTION}
                </p>
                <Link
                    to="/home"
                    className="inline-flex rounded-2xl bg-blue-500 px-6 py-3 text-white shadow-md shadow-blue-500/10 transition hover:bg-blue-600"
                >
                    {MSG.ACCOUNT_LOCKED.BACK_TO_HOME}
                </Link>
            </div>
        </PageWrapper>
    );
};

export default AccountLocked;
