import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getTokenRole, getTokenWithExpiry, removeToken } from '../constants/localStorage';

const navItems = [
    { label: 'Home', to: '/home', roles: ['user', 'admin', 'manager'] },
    { label: 'Nhóm', to: '/groups', roles: ['user', 'admin', 'manager'] },
    { label: 'Biểu đồ admin', to: '/admin', roles: ['admin'] },
    {
        label: 'Quản lý',
        roles: ['admin', 'manager'],
        children: [
            { label: 'Quản lý tài khoản', to: '/admin/accounts', roles: ['admin', 'manager'] },
            { label: 'Quản lý Level', to: '/admin/levels', roles: ['admin'] },
        ]
    },
    {
        label: 'Hệ thống',
        roles: ['admin'],
        children: [
            { label: 'Nhật ký hoạt động', to: '/admin/audit', roles: ['admin'] },
            { label: 'Cấu hình hệ thống', to: '/admin/config', roles: ['admin'] },
        ]
    },
];

const Navbar = () => {
    const [menuOpen, setMenuOpen] = useState(false);
    const [openDropdown, setOpenDropdown] = useState(null);
    const navRef = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();
    const role = getTokenRole();
    const loggedIn = Boolean(getTokenWithExpiry());

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (navRef.current && !navRef.current.contains(event.target)) {
                setOpenDropdown(null);
                setMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        removeToken();
        navigate('/login');
    };

    const allowedItems = navItems.filter((item) => {
        if (item.children) {
            return item.children.some(child => child.roles.includes(role));
        }
        return item.roles.includes(role);
    });

    return (
        <header ref={navRef} className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-xl shadow-sm">
            <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
                <div className="flex flex-1 items-center justify-between gap-3">
                    <Link to="/home" className="flex items-center gap-3 text-lg font-semibold text-slate-900">
                        <div className="h-12 w-12 overflow-visible">
                            <img
                                src="/logo512.png"
                                alt="Logo"
                                className="h-12 w-12 scale-150 origin-center"
                            />
                        </div>
                        <span className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent font-bold">
                            Shorter Link
                        </span>
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
                        {allowedItems.map((item, index) => {
                            if (item.children) {
                                const isOpen = openDropdown === index;
                                const filteredChildren = item.children.filter(child => child.roles.includes(role));
                                return (
                                    <div
                                        key={item.label}
                                        className="relative group"
                                        onMouseEnter={() => {
                                            if (window.innerWidth >= 640) setOpenDropdown(index);
                                        }}
                                        onMouseLeave={() => {
                                            if (window.innerWidth >= 640) setOpenDropdown(null);
                                        }}
                                    >
                                        <button
                                            onClick={() => setOpenDropdown(isOpen ? null : index)}
                                            className={`flex items-center justify-between w-full sm:w-auto rounded-2xl px-4 py-2 text-sm font-medium transition ${isOpen ? 'bg-indigo-50 text-indigo-600' : 'text-slate-700 hover:bg-slate-100'
                                                }`}
                                        >
                                            {item.label}
                                            <svg className={`ml-2 h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                            </svg>
                                        </button>

                                        <div className={`
                                            ${isOpen ? 'block' : 'hidden'}
                                            sm:absolute sm:left-0 sm:mt-0 sm:w-48 sm:rounded-2xl sm:bg-white sm:shadow-lg sm:ring-1 sm:ring-black sm:ring-opacity-5 sm:z-10
                                            flex flex-col gap-1 p-2 sm:p-1
                                        `}>
                                            {filteredChildren.map(child => {
                                                const active = location.pathname === child.to;
                                                return (
                                                    <Link
                                                        key={child.to}
                                                        to={child.to}
                                                        onClick={() => {
                                                            setMenuOpen(false);
                                                            setOpenDropdown(null);
                                                        }}
                                                        className={`rounded-xl px-4 py-2 text-sm font-medium transition ${active ? 'bg-indigo-500 text-white shadow-sm shadow-indigo-500/10' : 'text-slate-700 hover:bg-slate-100'}`}
                                                    >
                                                        {child.label}
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            }

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

