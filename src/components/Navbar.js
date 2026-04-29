import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getTokenRole, getTokenWithExpiry, removeToken } from '../constants/localStorage';

const navItems = [
    { label: 'Home', to: '/home', roles: ['user', 'admin', 'manager', null] },
    { label: 'Biểu đồ admin', to: '/admin', roles: ['admin', 'manager'] },
    { label: 'Quản lý tài khoản', to: '/admin/accounts', roles: ['admin', 'manager'] },
    { label: 'Nhật ký hoạt động', to: '/admin/audit', roles: ['admin'] },
    { label: 'Cấu hình hệ thống', to: '/admin/config', roles: ['admin'] },
];

const Navbar = () => {
    const [menuOpen, setMenuOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const role = getTokenRole();
    const loggedIn = Boolean(getTokenWithExpiry());

    const handleLogout = () => {
        removeToken();
        navigate('/login');
    };

    const allowedItems = navItems.filter((item) => item.roles.includes(role));

    return (
        <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-xl shadow-sm">
            <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
                <div className="flex flex-1 items-center justify-between gap-3">
                    <Link to="/home" className="flex items-center gap-3 text-lg font-semibold text-slate-900">
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500 text-white shadow-sm shadow-indigo-500/10">S</span>
                        <span>Shorter Link</span>
                    </Link>

                    <button
                        type="button"
                        className="inline-flex items-center rounded-2xl border border-slate-200 bg-white p-2 text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 sm:hidden"
                        onClick={() => setMenuOpen((prev) => !prev)}
                        aria-label="Toggle navigation"
                    >
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d={menuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
                        </svg>
                    </button>
                </div>

                <div className={`w-full sm:flex sm:w-auto ${menuOpen ? 'block' : 'hidden'} sm:block`}>
                    <nav className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                        {allowedItems.map((item) => {
                            const active = location.pathname === item.to;
                            return (
                                <Link
                                    key={item.to}
                                    to={item.to}
                                    onClick={() => setMenuOpen(false)}
                                    className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${active ? 'bg-indigo-500 text-white shadow-sm shadow-indigo-500/10' : 'text-slate-700 hover:bg-slate-100'}`}
                                >
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>
                    <div className="mt-3 flex flex-col gap-2 sm:hidden px-4 pb-4">
                        {loggedIn ? (
                            <button
                                type="button"
                                onClick={() => {
                                    setMenuOpen(false);
                                    handleLogout();
                                }}
                                className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                            >
                                Đăng xuất
                            </button>
                        ) : location.pathname === '/login' ? (
                            <Link
                                to="/home"
                                onClick={() => setMenuOpen(false)}
                                className="rounded-2xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-600"
                            >
                                Trang chủ
                            </Link>
                        ) : (
                            <Link
                                to="/login"
                                onClick={() => setMenuOpen(false)}
                                className="rounded-2xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-600"
                            >
                                Đăng nhập
                            </Link>
                        )}
                    </div>
                </div>

                <div className="hidden items-center gap-3 sm:flex">
                    {loggedIn ? (
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                        >
                            Đăng xuất
                        </button>
                    ) : location.pathname === '/login' ? (
                        <Link
                            to="/home"
                            className="rounded-2xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-600"
                        >
                            Trang chủ
                        </Link>
                    ) : (
                        <Link
                            to="/login"
                            className="rounded-2xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-600"
                        >
                            Đăng nhập
                        </Link>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Navbar;
