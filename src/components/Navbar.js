import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getTokenRole, getTokenWithExpiry, removeToken, getIsSso } from '../constants/localStorage';
import { logout as logoutAction, selectIsAuthenticated, selectUser, selectIsSso } from '../store/authSlice';
import { post } from '../utils/request';
import NotificationBell from './NotificationBell';

/**
 * Navigation item declarations with role-based visibility.
 */
const navItems = [
    { label: 'Trang chủ', to: '/home', roles: ['user', 'admin', 'manager'] },
    { label: 'Nhóm làm việc', to: '/groups', roles: ['user', 'admin', 'manager'] },
    { label: 'Biểu đồ', to: '/admin', roles: ['admin'] },
    {
        label: 'Quản lý',
        roles: ['admin', 'manager'],
        children: [
            { label: 'Danh sách thành viên', to: '/admin/accounts', roles: ['admin', 'manager'] },
            { label: 'Gói thành viên', to: '/admin/levels', roles: ['admin'] },
        ]
    },
    {
        label: 'Hệ thống',
        roles: ['admin'],
        children: [
            { label: 'Sức khỏe máy chủ', to: '/admin/health', roles: ['admin'] },
            { label: 'Dòng sự kiện', to: '/admin/audit', roles: ['admin'] },
            { label: 'Cấu hình tham số', to: '/admin/config', roles: ['admin'] },
            { label: 'Gửi thông báo', to: '/admin/notifications', roles: ['admin'] },
        ]
    },
];

/**
 * Vanguard Floating Pill Navbar with smooth mobile drawer and glassmorphism.
 */
const Navbar = () => {
    const [menuOpen, setMenuOpen] = useState(false);
    const [openDropdown, setOpenDropdown] = useState(null);
    const navRef = useRef(null);
    const dropdownTimeoutRef = useRef(null);
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const location = useLocation();
    const role = getTokenRole();
    const user = useSelector(selectUser);
    const isSso = useSelector(selectIsSso) || getIsSso();
    const loggedIn = useSelector(selectIsAuthenticated) || Boolean(getTokenWithExpiry());

    // Debounced hover handlers to prevent accidental closing when moving cursor into dropdown
    const handleMouseEnter = (index) => {
        if (dropdownTimeoutRef.current) {
            clearTimeout(dropdownTimeoutRef.current);
        }
        setOpenDropdown(index);
    };

    const handleMouseLeave = () => {
        dropdownTimeoutRef.current = setTimeout(() => {
            setOpenDropdown(null);
        }, 180);
    };

    // Close open menus when clicking anywhere outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (navRef.current && !navRef.current.contains(event.target)) {
                if (dropdownTimeoutRef.current) {
                    clearTimeout(dropdownTimeoutRef.current);
                }
                setOpenDropdown(null);
                setMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            if (dropdownTimeoutRef.current) {
                clearTimeout(dropdownTimeoutRef.current);
            }
        };
    }, []);

    // Close menu on route change
    useEffect(() => {
        if (dropdownTimeoutRef.current) {
            clearTimeout(dropdownTimeoutRef.current);
        }
        setMenuOpen(false);
        setOpenDropdown(null);
    }, [location.pathname]);

    const handleLogout = async () => {
        try {
            await post('/auth/logout', {});
        } catch {
            // Silently proceed with local cleanup
        }
        dispatch(logoutAction());
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
        <header
            ref={navRef}
            className="fixed top-3 sm:top-5 left-0 right-0 z-50 px-3 sm:px-6 pointer-events-none"
        >
            <div className="mx-auto max-w-5xl pointer-events-auto">
                {/* Floating Glass Pill Bar */}
                <div className="relative flex items-center justify-between rounded-full border border-slate-200/80 bg-white/85 px-4 py-2.5 shadow-soft-xl shadow-slate-900/5 backdrop-blur-xl transition-all duration-300">
                    
                    {/* Brand Logo & Title */}
                    <Link
                        to="/home"
                        className="group flex items-center gap-2.5 text-slate-900 transition-transform active:scale-95"
                    >
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 p-1.5 shadow-sm shadow-blue-500/20 transition-transform group-hover:scale-105">
                            <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                            </svg>
                        </div>
                        <span className="text-sm sm:text-base font-bold tracking-tight text-slate-900">
                            Shorter<span className="text-blue-600">Link</span>
                        </span>
                    </Link>

                    {/* Desktop Navigation Links */}
                    <nav className="hidden md:flex items-center gap-1.5">
                        {allowedItems.map((item, index) => {
                            if (item.children) {
                                const isOpen = openDropdown === index;
                                const filteredChildren = item.children.filter(child => child.roles.includes(role));
                                const hasActiveChild = filteredChildren.some(child => location.pathname === child.to);

                                return (
                                    <div
                                        key={item.label}
                                        className="relative py-1"
                                        onMouseEnter={() => handleMouseEnter(index)}
                                        onMouseLeave={handleMouseLeave}
                                    >
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
                                                setOpenDropdown(isOpen ? null : index);
                                            }}
                                            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold tracking-wide transition-all duration-200 ${
                                                hasActiveChild || isOpen
                                                    ? 'bg-blue-50 text-blue-600'
                                                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                            }`}
                                        >
                                            <span>{item.label}</span>
                                            <svg
                                                className={`h-3 w-3 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-600' : ''}`}
                                                viewBox="0 0 20 20"
                                                fill="currentColor"
                                            >
                                                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                            </svg>
                                        </button>

                                        {/* Dropdown Card with seamless hover bridge (pt-2) */}
                                        {isOpen && (
                                            <div className="absolute left-0 top-full pt-1.5 w-52 z-50">
                                                <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 p-1.5 shadow-soft-xl backdrop-blur-xl transition-all duration-200">
                                                    {filteredChildren.map((child) => {
                                                        const active = location.pathname === child.to;
                                                        return (
                                                            <Link
                                                                key={child.to}
                                                                to={child.to}
                                                                onClick={() => {
                                                                    if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
                                                                    setOpenDropdown(null);
                                                                }}
                                                                className={`block rounded-xl px-3.5 py-2 text-xs font-medium transition-colors ${
                                                                    active
                                                                        ? 'bg-blue-600 text-white font-semibold shadow-xs'
                                                                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                                                }`}
                                                            >
                                                                {child.label}
                                                            </Link>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            }

                            const active = location.pathname === item.to;
                            return (
                                <Link
                                    key={item.to}
                                    to={item.to}
                                    className={`rounded-full px-3.5 py-1.5 text-xs font-semibold tracking-wide transition-all duration-200 ${
                                        active
                                            ? 'bg-slate-900 text-white shadow-soft-xs'
                                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                    }`}
                                >
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Right Action Items */}
                    <div className="flex items-center gap-2">
                        {/* Real-time Notification Bell */}
                        <NotificationBell />

                        {/* Desktop Auth Section */}
                        <div className="hidden sm:flex items-center gap-2">
                            {loggedIn ? (
                                <div className="flex items-center gap-2 rounded-full border border-slate-200/60 bg-slate-100/70 py-1 pl-3 pr-1 text-xs">
                                    <span className="font-semibold text-slate-800 max-w-[120px] truncate">
                                        {user?.fullname || user?.username}
                                    </span>
                                    {isSso && (
                                        <span className="rounded-full bg-orange-500/10 px-1.5 py-0.5 text-[10px] font-bold text-orange-600 border border-orange-500/20">
                                            SSO
                                        </span>
                                    )}
                                    <button
                                        type="button"
                                        onClick={handleLogout}
                                        title="Đăng xuất"
                                        className="flex h-7 w-7 items-center justify-center rounded-full text-slate-500 hover:bg-white hover:text-rose-600 transition-colors shadow-2xs"
                                        aria-label="Đăng xuất"
                                    >
                                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                            <polyline points="16 17 21 12 16 7" />
                                            <line x1="21" y1="12" x2="9" y2="12" />
                                        </svg>
                                    </button>
                                </div>
                            ) : location.pathname === '/login' ? (
                                <Link
                                    to="/home"
                                    className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-blue-700 active:scale-95 shadow-sm shadow-blue-500/20"
                                >
                                    <span>Trang chủ</span>
                                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/20 text-[10px]">↗</span>
                                </Link>
                            ) : (
                                <Link
                                    to="/login"
                                    className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-slate-800 active:scale-95 shadow-soft-xs"
                                >
                                    <span>Đăng nhập</span>
                                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/20 text-[10px]">→</span>
                                </Link>
                            )}
                        </div>

                        {/* Mobile Morphing Hamburger Button */}
                        <button
                            type="button"
                            className="relative flex h-9 w-9 items-center justify-center rounded-full border border-slate-200/80 bg-slate-100/60 text-slate-700 transition md:hidden active:scale-90"
                            onClick={() => setMenuOpen((prev) => !prev)}
                            aria-label="Toggle Navigation Menu"
                        >
                            <span className="sr-only">Toggle navigation</span>
                            <div className="relative flex h-4 w-4 flex-col justify-between">
                                <span
                                    className={`h-0.5 w-full rounded-full bg-slate-700 transition-all duration-300 ${
                                        menuOpen ? 'translate-y-1.5 rotate-45' : ''
                                    }`}
                                />
                                <span
                                    className={`h-0.5 w-full rounded-full bg-slate-700 transition-all duration-200 ${
                                        menuOpen ? 'opacity-0 scale-x-0' : 'opacity-100'
                                    }`}
                                />
                                <span
                                    className={`h-0.5 w-full rounded-full bg-slate-700 transition-all duration-300 ${
                                        menuOpen ? '-translate-y-2 -rotate-45' : ''
                                    }`}
                                />
                            </div>
                        </button>
                    </div>
                </div>

                {/* Mobile Drawer (Card Overlay below Floating Nav) */}
                {menuOpen && (
                    <div className="mt-2.5 overflow-hidden rounded-3xl border border-slate-200/90 bg-white/95 p-4 shadow-soft-xl backdrop-blur-2xl md:hidden animate-in fade-in slide-in-from-top-3 duration-200">
                        {/* User Profile Card on Mobile */}
                        {loggedIn && (
                            <div className="mb-3 flex items-center justify-between rounded-2xl bg-slate-50 border border-slate-100 p-3">
                                <div>
                                    <p className="text-xs font-semibold text-slate-900">
                                        {user?.fullname || user?.username}
                                    </p>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                                        {role || 'Thành viên'}
                                    </p>
                                </div>
                                {isSso && (
                                    <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-700 border border-orange-200">
                                        QuickBite SSO
                                    </span>
                                )}
                            </div>
                        )}

                        {/* Navigation links */}
                        <div className="space-y-1">
                            {allowedItems.map((item) => {
                                if (item.children) {
                                    const filteredChildren = item.children.filter(child => child.roles.includes(role));
                                    return (
                                        <div key={item.label} className="pt-2">
                                            <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                                                {item.label}
                                            </p>
                                            <div className="space-y-1 pl-1">
                                                {filteredChildren.map((child) => {
                                                    const active = location.pathname === child.to;
                                                    return (
                                                        <Link
                                                            key={child.to}
                                                            to={child.to}
                                                            onClick={() => setMenuOpen(false)}
                                                            className={`flex min-h-[44px] items-center rounded-2xl px-3.5 text-sm font-medium transition ${
                                                                active
                                                                    ? 'bg-blue-600 text-white font-semibold'
                                                                    : 'text-slate-700 hover:bg-slate-100'
                                                            }`}
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
                                        className={`flex min-h-[44px] items-center rounded-2xl px-3.5 text-sm font-medium transition ${
                                            active
                                                ? 'bg-slate-900 text-white font-semibold'
                                                : 'text-slate-700 hover:bg-slate-100'
                                        }`}
                                    >
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </div>

                        {/* Mobile Action Button */}
                        <div className="mt-4 pt-3 border-t border-slate-100">
                            {loggedIn ? (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setMenuOpen(false);
                                        handleLogout();
                                    }}
                                    className="flex w-full min-h-[44px] items-center justify-center gap-2 rounded-2xl bg-rose-50 border border-rose-100 text-sm font-semibold text-rose-600 transition hover:bg-rose-100"
                                >
                                    <span>Đăng xuất</span>
                                </button>
                            ) : location.pathname === '/login' ? (
                                <Link
                                    to="/home"
                                    onClick={() => setMenuOpen(false)}
                                    className="flex w-full min-h-[44px] items-center justify-center rounded-2xl bg-blue-600 text-sm font-semibold text-white shadow-sm"
                                >
                                    Quay về trang chủ
                                </Link>
                            ) : (
                                <Link
                                    to="/login"
                                    onClick={() => setMenuOpen(false)}
                                    className="flex w-full min-h-[44px] items-center justify-center rounded-2xl bg-slate-900 text-sm font-semibold text-white shadow-sm"
                                >
                                    Đăng nhập
                                </Link>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
};

export default Navbar;
