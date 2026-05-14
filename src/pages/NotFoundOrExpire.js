
import { Link } from "react-router-dom";
import PageWrapper from "../components/PageWrapper";
import { MSG } from "../constants/messages";

const NotFountOrExpire = () => {
    return (
        <PageWrapper
            title={MSG.NOT_FOUND.TITLE}
            subtitle={MSG.NOT_FOUND.SUBTITLE}
            className="bg-slate-50"
        >
            <div className="mx-auto max-w-lg rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm shadow-slate-300/10">
                <h1 className="text-3xl font-bold text-slate-900 mb-4">{MSG.NOT_FOUND.TITLE}</h1>
                <p className="mb-6 text-slate-600">{MSG.NOT_FOUND.DESCRIPTION}</p>
                <Link
                    to="/home"
                    className="inline-flex rounded-2xl bg-blue-500 px-6 py-3 text-white shadow-md shadow-blue-500/10 transition hover:bg-blue-600"
                >
                    {MSG.NOT_FOUND.BACK_TO_HOME}
                </Link>
            </div>
        </PageWrapper>
    );
}

export default NotFountOrExpire;