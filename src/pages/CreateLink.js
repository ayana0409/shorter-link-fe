import { Fragment, useEffect, useState, useMemo } from "react";
import { get, post, patch } from "../utils/request";
import { clientUrl } from "../utils/url";
import toast from 'react-hot-toast';
import { getTokenWithExpiry } from "../constants/localStorage";
import PageWrapper from "../components/PageWrapper";
import QrCodePreview from "../components/QrCodePreview";
import { MSG } from "../constants/messages";

/**
 * Validate URL string with standard protocol or domain regex
 */
const isValidUrl = (string) => {
  try {
    new URL(string);
    return true;
  } catch (_) { }

  const domainRegex = /^([a-zA-Z0-9]([a-zA-Z0-9]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}(:\d+)?(\/.*)?$/;
  return domainRegex.test(string);
};

/**
 * High-End Minimalist SVG LineChart with electric gradient & smooth curvature
 */
const LineChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex min-h-[220px] flex-col items-center justify-center rounded-3xl border border-slate-100 bg-slate-50/60 p-8 text-center text-slate-400">
        <svg className="h-8 w-8 text-slate-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
        <span className="text-xs font-medium">{MSG.SHORTENER.CHART_NO_DATA}</span>
      </div>
    );
  }

  const width = 680;
  const height = 260;
  const padding = 36;
  const values = data.map((item) => item.value);
  const maxValue = Math.max(...values, 1);
  const minValue = Math.min(...values, 0);

  const points = data.map((item, index) => {
    const x = padding + (index * (width - padding * 2)) / Math.max(data.length - 1, 1);
    const y = height - padding - ((item.value - minValue) * (height - padding * 2)) / Math.max(maxValue - minValue, 1);
    return `${x},${y}`;
  });

  return (
    <div className="overflow-x-auto rounded-3xl border border-slate-100 bg-slate-50/50 p-4 sm:p-6 shadow-inner-dark">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto min-w-[500px]">
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Ambient Horizontal Grid Lines */}
        {[0, 1, 2, 3].map((line) => {
          const y = padding + ((height - padding * 2) / 3) * line;
          return (
            <line
              key={line}
              x1={padding}
              x2={width - padding}
              y1={y}
              y2={y}
              stroke="#e2e8f0"
              strokeDasharray="4 4"
              strokeWidth="1"
            />
          );
        })}

        {/* Area Gradient */}
        <polygon
          points={`${points.join(" ")} ${width - padding},${height - padding} ${padding},${height - padding}`}
          fill="url(#chartGradient)"
        />

        {/* Path Line */}
        <path
          d={`M${points.join(" L")}`}
          fill="none"
          stroke="#2563eb"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data Point Circles and Values */}
        {points.map((point, index) => {
          const [x, y] = point.split(",");
          return (
            <g key={index} className="transition-all hover:scale-125 origin-center">
              <circle cx={x} cy={y} r="5" fill="#2563eb" stroke="#ffffff" strokeWidth="2.5" />
              <text
                x={x}
                y={Number(y) - 10}
                textAnchor="middle"
                fontSize="11"
                fontWeight="600"
                fontFamily="JetBrains Mono, monospace"
                fill="#0f172a"
              >
                {data[index].value}
              </text>
            </g>
          );
        })}

        {/* X Axis Labels */}
        {data.map((item, index) => {
          const x = padding + (index * (width - padding * 2)) / Math.max(data.length - 1, 1);
          return (
            <text
              key={item.label}
              x={x}
              y={height - padding + 20}
              textAnchor="middle"
              fontSize="10"
              fontWeight="500"
              fill="#64748b"
            >
              {item.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
};

const CreateLink = () => {
  const formatDate = (date) => date.toISOString().slice(0, 10);
  const defaultToDate = formatDate(new Date());
  const defaultFromDate = formatDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));

  // Convert datetime-local (+7) to UTC ISO string
  const convertToUTC = (datetimeLocal) => {
    if (!datetimeLocal) return undefined;
    const utcDate = new Date(datetimeLocal + ':00Z');
    const actualUtc = new Date(utcDate.getTime() - 7 * 60 * 60 * 1000);
    return actualUtc.toISOString();
  };

  const [originalLink, setOriginalLink] = useState("");
  const [shortLink, setShortLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [links, setLinks] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("valid");
  const [isCreating, setIsCreating] = useState(false);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 5;
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [quotaInfo, setQuotaInfo] = useState(null);
  const [analyticsData, setAnalyticsData] = useState([]);
  const [analyticsRange, setAnalyticsRange] = useState("daily");
  const [analyticsFrom, setAnalyticsFrom] = useState(defaultFromDate);
  const [analyticsTo, setAnalyticsTo] = useState(defaultToDate);
  const [createPassword, setCreatePassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [editingPasswordLinkId, setEditingPasswordLinkId] = useState("");
  const [newLinkPassword, setNewLinkPassword] = useState("");
  const [confirmNewLinkPassword, setConfirmNewLinkPassword] = useState("");
  const [activeQrLinkId, setActiveQrLinkId] = useState("");
  const [siteName, setSiteName] = useState("");
  const [validityFromDate, setValidityFromDate] = useState("");
  const [validityToDate, setValidityToDate] = useState("");
  const [noExpiration, setNoExpiration] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const refreshLinks = (
    page = 1,
    search = searchQuery,
    status = statusFilter,
    sort = sortBy,
    order = sortOrder,
  ) => {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (status) params.append("status", status);
    if (sort) params.append("sortBy", sort);
    if (order) params.append("sortOrder", order);
    params.append("page", String(page));
    params.append("limit", String(pageSize));

    get(`shortener/user?${params.toString()}`)
      .then((response) => {
        setLinks(response.data || []);
        setCurrentPage(response.page || page);
        setTotalPages(response.totalPages || 1);
      })
      .catch((error) => {
        const message = error.response?.data?.error?.message || MSG.SHORTENER.ERR_LOAD_LINKS;
        toast.error(message);
      });
  };

  const isLinkExpired = (link) => {
    if (link.noExpiration) return false;
    const expiresAt = link.expiresAt ? new Date(link.expiresAt) : null;
    return expiresAt ? expiresAt < new Date() : false;
  };

  const getShortLinkUrl = (link) => `${clientUrl}/s/${link.shortUrl}`;

  const toggleLinkStatus = (link) => {
    if (isLinkExpired(link)) {
      toast.error(MSG.SHORTENER.ERR_EXPIRED_TOGGLE);
      return;
    }

    const nextStatus = link.status === 'disabled' ? 'active' : 'disabled';
    patch(`shortener/${link._id}`, { status: nextStatus })
      .then(() => {
        toast.success(MSG.SHORTENER.SUCCESS_TOGGLE);
        refreshLinks();
      })
      .catch((error) => {
        const message = error.response?.data?.error?.message || MSG.SHORTENER.ERR_TOGGLE;
        toast.error(message);
      });
  };

  const createLink = () => {
    if (isCreating) return;

    if (!originalLink) {
      toast.error(MSG.SHORTENER.ERR_EMPTY_ORIGINAL);
      return;
    }

    const validatedUrl = isValidUrl(originalLink);
    if (!validatedUrl) {
      toast.error(MSG.SHORTENER.ERR_INVALID_URL);
      return;
    }

    if (createPassword) {
      if (!password.trim() || !confirmPassword.trim()) {
        toast.error(MSG.SHORTENER.ERR_EMPTY_PASSWORD);
        return;
      }
      if (password !== confirmPassword) {
        toast.error(MSG.SHORTENER.ERR_PASSWORD_MISMATCH);
        return;
      }
    }

    if (!noExpiration && validityFromDate && validityToDate) {
      const fromDate = new Date(validityFromDate);
      const toDate = new Date(validityToDate);
      if (fromDate >= toDate) {
        toast.error(MSG.SHORTENER.ERR_DATE_RANGE);
        return;
      }
    }

    setIsCreating(true);
    const payload = {
      originalUrl: originalLink,
      password: createPassword ? password : undefined,
      siteName: siteName || undefined,
      validityFromDate: convertToUTC(validityFromDate),
      validityToDate: convertToUTC(validityToDate),
      noExpiration: noExpiration,
    };

    post("shortener", payload)
      .then((response) => {
        if (response?.shortUrl) {
          const generatedUrl = `${clientUrl}/s/${response.shortUrl}`;
          setShortLink(generatedUrl);
          toast.success(MSG.SHORTENER.SUCCESS_CREATE);
          refreshLinks();
          fetchQuota();
          setCreatePassword(false);
          setPassword("");
          setConfirmPassword("");
          setSiteName("");
          setValidityFromDate("");
          setValidityToDate("");
          setNoExpiration(false);
          setShowAdvanced(false);
        } else {
          toast.error(MSG.SHORTENER.ERR_CREATE);
        }
      })
      .catch((error) => {
        const message = error.response?.data?.error?.message || MSG.SHORTENER.ERR_CREATE;
        toast.error(message);
      })
      .finally(() => {
        setIsCreating(false);
      });
  };

  const getLinkStatus = (link) => {
    if (link.status === 'disabled') {
      return { label: MSG.SHORTENER.STATUS_DELETED, tone: "disabled" };
    }
    if (link.noExpiration) {
      return { label: MSG.SHORTENER.STATUS_NO_EXPIRE, tone: "emerald" };
    }
    const expiresAt = link.expiresAt ? new Date(link.expiresAt) : null;
    if (expiresAt && expiresAt < new Date()) {
      return { label: MSG.SHORTENER.STATUS_EXPIRED, tone: "slate" };
    }
    return { label: MSG.SHORTENER.STATUS_VALID, tone: "blue" };
  };

  const fetchAnalytics = () => {
    const params = new URLSearchParams();
    if (analyticsRange) params.append('range', analyticsRange);
    if (analyticsFrom) params.append('from', analyticsFrom);
    if (analyticsTo) params.append('to', analyticsTo);

    get(`shortener/analytics?${params.toString()}`)
      .then((response) => {
        setAnalyticsData(Array.isArray(response) ? response : []);
      })
      .catch(() => {
        setAnalyticsData([]);
      });
  };

  const fetchQuota = () => {
    get('shortener/quota')
      .then((response) => {
        setQuotaInfo(response);
      })
      .catch(() => {
        setQuotaInfo(null);
      });
  };

  useEffect(() => {
    const loggedIn = Boolean(getTokenWithExpiry());
    setIsLoggedIn(loggedIn);
    if (loggedIn) {
      refreshLinks();
      fetchQuota();
      fetchAnalytics();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const copyToClipboard = () => {
    if (shortLink) {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(shortLink);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = shortLink;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopied(true);
      toast.success(MSG.SHORTENER.COPY_SUCCESS);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const copyDirectLink = (url) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
    }
    toast.success(MSG.SHORTENER.COPY_LINK_SUCCESS);
  };

  // Count active advanced options to display a micro badge
  const activeAdvancedCount = useMemo(() => {
    let count = 0;
    if (siteName) count++;
    if (createPassword) count++;
    if (noExpiration || validityFromDate || validityToDate) count++;
    return count;
  }, [siteName, createPassword, noExpiration, validityFromDate, validityToDate]);

  return (
    <PageWrapper className="pt-20 sm:pt-24">
      {/* 1. Logged-in Quota Status Capsule */}
      {isLoggedIn && quotaInfo && (
        <div className="mx-auto max-w-2xl mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-full border border-slate-200/80 bg-white/80 px-5 py-2.5 shadow-soft-xs backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                {quotaInfo.fullName ? quotaInfo.fullName.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="text-xs">
                <span className="text-slate-500">{MSG.SHORTENER.GREETING} </span>
                <span className="font-semibold text-slate-800">{quotaInfo.fullName}</span>
                <span className="ml-2 inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 border border-slate-200/60">
                  {quotaInfo.level ? quotaInfo.level.name : MSG.SHORTENER.LEVEL_FREE}
                </span>
              </div>
            </div>

            <div className="text-xs text-slate-600 font-medium">
              {quotaInfo.unlimited ? (
                <span className="inline-flex items-center gap-1.5 text-blue-600 font-semibold">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                  {MSG.SHORTENER.ADMIN_UNLIMITED}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1">
                  <span className="text-slate-400">{MSG.SHORTENER.LABEL_REMAINING}:</span>
                  <span className="font-bold text-slate-900 font-mono">
                    {quotaInfo.remaining} / {quotaInfo.level?.dailyShortenLimit || quotaInfo.limit}
                  </span>
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. Central Hero Heading */}
      <div className="text-center max-w-2xl mx-auto mb-8">
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
          {MSG.SHORTENER.HEADING_CREATE}
        </h1>
        <p className="mt-2 text-sm sm:text-base text-slate-500 leading-relaxed max-w-md mx-auto">
          {MSG.SHORTENER.PAGE_SUBTITLE}
        </p>
      </div>

      {/* 3. Double-Bezel Omni Shortener Box */}
      <section className="mx-auto max-w-2xl">
        <div className="double-bezel-outer">
          <div className="double-bezel-inner p-3 sm:p-4">
            {/* Unified Input and CTA */}
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <div className="relative flex-1 w-full flex items-center">
                <span className="absolute left-3.5 text-slate-400">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                  </svg>
                </span>
                <input
                  type="text"
                  value={originalLink}
                  onChange={(e) => setOriginalLink(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && createLink()}
                  placeholder={MSG.SHORTENER.PLACEHOLDER_ORIGINAL}
                  className="w-full rounded-2xl bg-slate-50 py-3.5 pl-11 pr-4 text-sm sm:text-base text-slate-900 placeholder:text-slate-400 outline-none transition focus:bg-white focus:ring-2 focus:ring-blue-100 border border-transparent focus:border-blue-400"
                />
              </div>

              <button
                type="button"
                onClick={createLink}
                disabled={isCreating}
                className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-6 py-3.5 text-sm font-semibold text-white shadow-soft-xs transition-all hover:bg-slate-800 active:scale-[0.98] disabled:opacity-50"
              >
                {isCreating ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>{MSG.SHORTENER.BTN_CREATING}</span>
                  </>
                ) : (
                  <>
                    <span>{MSG.SHORTENER.BTN_CREATE}</span>
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-xs font-bold">→</span>
                  </>
                )}
              </button>
            </div>

            {/* Smart Disclosure Toggle */}
            <div className="mt-3 flex items-center justify-between border-t border-slate-100/80 pt-3 px-1">
              <button
                type="button"
                onClick={() => setShowAdvanced((prev) => !prev)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
              >
                <svg className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${showAdvanced ? 'rotate-90' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
                <span>Tùy chọn bổ sung</span>
                {activeAdvancedCount > 0 && (
                  <span className="flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700">
                    {activeAdvancedCount}
                  </span>
                )}
              </button>

              <span className="text-[11px] text-slate-400 hidden sm:inline">
                Hỗ trợ đặt mật khẩu & giới hạn thời gian
              </span>
            </div>

            {/* Collapsible Advanced Form Options */}
            {showAdvanced && (
              <div className="mt-4 pt-4 border-t border-slate-100 space-y-4 animate-in fade-in duration-200">
                {/* Site Name Field */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    {MSG.SHORTENER.LABEL_SITE_NAME}
                  </label>
                  <input
                    type="text"
                    value={siteName}
                    onChange={(e) => setSiteName(e.target.value)}
                    placeholder={MSG.SHORTENER.PLACEHOLDER_SITE_NAME}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs sm:text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                {/* Password Protection */}
                {quotaInfo?.level?.allowPassword && (
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 space-y-3">
                    <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={createPassword}
                        onChange={(e) => setCreatePassword(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>{MSG.SHORTENER.CHECKBOX_CREATE_PASSWORD}</span>
                    </label>

                    {createPassword && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className="mb-1 block text-[11px] font-medium text-slate-600">{MSG.SHORTENER.LABEL_PASSWORD}</label>
                          <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder={MSG.SHORTENER.PLACEHOLDER_PASSWORD}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-[11px] font-medium text-slate-600">{MSG.SHORTENER.LABEL_CONFIRM_PASSWORD}</label>
                          <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder={MSG.SHORTENER.PLACEHOLDER_CONFIRM_PASSWORD}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Expiration Rules */}
                {quotaInfo?.level?.allowCustomExpiration && (
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 space-y-3">
                    <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={noExpiration}
                        onChange={(e) => setNoExpiration(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>{MSG.SHORTENER.CHECKBOX_NO_EXPIRATION}</span>
                    </label>

                    {!noExpiration && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className="mb-1 block text-[11px] font-medium text-slate-600">{MSG.SHORTENER.LABEL_OPEN_TIME}</label>
                          <input
                            type="datetime-local"
                            value={validityFromDate}
                            onChange={(e) => setValidityFromDate(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-[11px] font-medium text-slate-600">{MSG.SHORTENER.LABEL_CLOSE_TIME}</label>
                          <input
                            type="datetime-local"
                            value={validityToDate}
                            onChange={(e) => setValidityToDate(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 4. Instant Result Bento Card */}
      {shortLink && (
        <section className="mx-auto max-w-2xl mt-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="overflow-hidden rounded-3xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/60 via-white to-white p-5 sm:p-6 shadow-soft-md">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="min-w-0 flex-1">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 mb-2 border border-emerald-200/60">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {MSG.SHORTENER.SECTION_SHORT}
                </span>
                <p className="font-mono text-base sm:text-lg font-bold text-slate-900 truncate">
                  {shortLink}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={copyToClipboard}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white shadow-soft-xs transition-all hover:bg-emerald-700 active:scale-95"
                >
                  {copied ? (
                    <>
                      <span>✓</span>
                      <span>Đã sao chép</span>
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                      <span>{MSG.SHORTENER.BTN_COPY}</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => window.open(shortLink, '_blank')}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors shadow-2xs"
                  title="Mở liên kết"
                >
                  ↗
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 5. User Links Management Section */}
      {isLoggedIn && (
        <section className="mt-14 sm:mt-20">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                {MSG.SHORTENER.HEADING_YOUR_LINKS}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Quản lý trạng thái, mã QR và mật khẩu bảo vệ các liên kết đã tạo.
              </p>
            </div>

            {/* Quick Refresh Button */}
            <button
              onClick={() => refreshLinks(currentPage)}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200/80 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-soft-xs hover:bg-slate-50 transition active:scale-95 w-fit"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
              </svg>
              <span>{MSG.SHORTENER.BTN_REFRESH}</span>
            </button>
          </div>

          {/* Search & Filters Bar */}
          <div className="mb-6 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4 rounded-3xl border border-slate-200/80 bg-white/80 p-3 shadow-soft-xs backdrop-blur-md">
            {/* Search Input */}
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  const nextSearch = e.target.value;
                  setSearchQuery(nextSearch);
                  setCurrentPage(1);
                  refreshLinks(1, nextSearch, statusFilter, sortBy, sortOrder);
                }}
                placeholder={MSG.SHORTENER.SEARCH_PLACEHOLDER}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-xs text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                const nextStatus = e.target.value;
                setStatusFilter(nextStatus);
                setCurrentPage(1);
                refreshLinks(1, searchQuery, nextStatus, sortBy, sortOrder);
              }}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white"
            >
              <option value="valid">{MSG.SHORTENER.FILTER_VALID}</option>
              <option value="expired">{MSG.SHORTENER.FILTER_EXPIRED}</option>
              <option value="disabled">{MSG.SHORTENER.FILTER_DISABLED}</option>
              <option value="all">{MSG.SHORTENER.FILTER_ALL}</option>
            </select>

            {/* Sort Field */}
            <select
              value={sortBy}
              onChange={(e) => {
                const nextSortBy = e.target.value;
                setSortBy(nextSortBy);
                setCurrentPage(1);
                refreshLinks(1, searchQuery, statusFilter, nextSortBy, sortOrder);
              }}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white"
            >
              <option value="createdAt">{MSG.SHORTENER.SORT_NEWEST}</option>
              <option value="siteName">{MSG.SHORTENER.SORT_NAME}</option>
              <option value="clicks">{MSG.SHORTENER.SORT_CLICKS}</option>
            </select>

            {/* Sort Order */}
            <select
              value={sortOrder}
              onChange={(e) => {
                const nextSortOrder = e.target.value;
                setSortOrder(nextSortOrder);
                setCurrentPage(1);
                refreshLinks(1, searchQuery, statusFilter, sortBy, nextSortOrder);
              }}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white"
            >
              <option value="desc">{MSG.SHORTENER.SORT_DESC}</option>
              <option value="asc">{MSG.SHORTENER.SORT_ASC}</option>
            </select>
          </div>

          {/* Links Render: Desktop Table + Mobile Cards */}
          {links.length > 0 ? (
            <div className="space-y-4">
              {/* Desktop Table View (≥ 768px) */}
              <div className="hidden md:block overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-soft-xs">
                <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
                  <thead className="bg-slate-50/70 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="px-5 py-3.5">{MSG.SHORTENER.COL_SITE_NAME}</th>
                      <th className="px-5 py-3.5">{MSG.SHORTENER.COL_SHORT_LINK}</th>
                      <th className="px-5 py-3.5">{MSG.SHORTENER.COL_SECURITY}</th>
                      <th className="px-5 py-3.5">{MSG.SHORTENER.COL_CLICKS}</th>
                      <th className="px-5 py-3.5">{MSG.SHORTENER.COL_STATUS}</th>
                      <th className="px-5 py-3.5 text-right">{MSG.SHORTENER.COL_ACTION}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {links.map((link) => {
                      const statusObj = getLinkStatus(link);
                      return (
                        <Fragment key={link._id}>
                          <tr className="hover:bg-slate-50/60 transition-colors">
                            {/* Site Name */}
                            <td className="px-5 py-4 font-semibold text-slate-800">
                              <span title={link.originalUrl} className="truncate max-w-[180px] block cursor-help">
                                {link.siteName || MSG.SHORTENER.SITE_UNKNOWN}
                              </span>
                            </td>

                            {/* Short Link */}
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2">
                                <span
                                  onClick={() => window.open(getShortLinkUrl(link), '_blank')}
                                  className="font-mono text-blue-600 hover:text-blue-700 hover:underline cursor-pointer font-medium truncate max-w-[200px]"
                                >
                                  {link.shortUrl}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => copyDirectLink(getShortLinkUrl(link))}
                                  className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] text-slate-600 hover:bg-slate-100 transition shadow-2xs"
                                >
                                  {MSG.SHORTENER.BTN_COPY}
                                </button>
                              </div>
                            </td>

                            {/* Security Badge */}
                            <td className="px-5 py-4">
                              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                link.passwordProtected
                                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                  : 'bg-slate-100 text-slate-600'
                              }`}>
                                {link.passwordProtected ? MSG.SHORTENER.SECURE_YES : MSG.SHORTENER.SECURE_NO}
                              </span>
                            </td>

                            {/* Clicks */}
                            <td className="px-5 py-4 font-mono font-bold text-slate-800">
                              {link.clicks ?? 0}
                            </td>

                            {/* Status and Dates */}
                            <td className="px-5 py-4">
                              <div className="flex flex-col gap-0.5">
                                <span className={`inline-flex items-center gap-1.5 font-semibold text-[11px] ${
                                  statusObj.tone === 'emerald' ? 'text-emerald-700' :
                                  statusObj.tone === 'blue' ? 'text-blue-700' :
                                  statusObj.tone === 'disabled' ? 'text-rose-700' : 'text-slate-500'
                                }`}>
                                  <span className={`h-1.5 w-1.5 rounded-full ${
                                    statusObj.tone === 'emerald' ? 'bg-emerald-500' :
                                    statusObj.tone === 'blue' ? 'bg-blue-500' :
                                    statusObj.tone === 'disabled' ? 'bg-rose-500' : 'bg-slate-400'
                                  }`} />
                                  {statusObj.label}
                                </span>
                                {link.expiresAt && !link.noExpiration && (
                                  <span className="text-[10px] text-slate-400">
                                    {new Date(link.expiresAt).toLocaleDateString('vi-VN')}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Action Buttons */}
                            <td className="px-5 py-4 text-right">
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => toggleLinkStatus(link)}
                                  disabled={isLinkExpired(link)}
                                  className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                                    isLinkExpired(link)
                                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                      : link.status === 'disabled'
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                  }`}
                                >
                                  {link.status === 'disabled' ? MSG.SHORTENER.BTN_ENABLE : MSG.SHORTENER.BTN_DISABLE}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setActiveQrLinkId(activeQrLinkId === link._id ? "" : link._id)}
                                  disabled={isLinkExpired(link) || link.status === 'disabled'}
                                  className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
                                >
                                  {activeQrLinkId === link._id ? MSG.SHORTENER.BTN_HIDE_QR : MSG.SHORTENER.BTN_QR}
                                </button>

                                {quotaInfo?.level?.allowPassword && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingPasswordLinkId(editingPasswordLinkId === link._id ? "" : link._id);
                                      setNewLinkPassword("");
                                      setConfirmNewLinkPassword("");
                                    }}
                                    className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-50 transition"
                                  >
                                    🔑
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>

                          {/* Inline Password Edit Row */}
                          {editingPasswordLinkId === link._id && (
                            <tr className="bg-slate-50/70">
                              <td colSpan={6} className="px-5 py-4">
                                <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-4 shadow-soft-xs space-y-3">
                                  <p className="text-xs font-semibold text-slate-800">{MSG.SHORTENER.BTN_CHANGE_PASSWORD}</p>
                                  <div className="grid grid-cols-2 gap-2">
                                    <input
                                      type="password"
                                      value={newLinkPassword}
                                      onChange={(e) => setNewLinkPassword(e.target.value)}
                                      placeholder={MSG.SHORTENER.NEW_PASSWORD_PLACEHOLDER}
                                      className="rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-500"
                                    />
                                    <input
                                      type="password"
                                      value={confirmNewLinkPassword}
                                      onChange={(e) => setConfirmNewLinkPassword(e.target.value)}
                                      placeholder={MSG.SHORTENER.PLACEHOLDER_CONFIRM_PASSWORD}
                                      className="rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-500"
                                    />
                                  </div>
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      type="button"
                                      onClick={() => setEditingPasswordLinkId("")}
                                      className="rounded-full px-3 py-1 text-xs text-slate-500 hover:bg-slate-100"
                                    >
                                      {MSG.SHORTENER.BTN_CANCEL_PASSWORD}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (!newLinkPassword.trim() || !confirmNewLinkPassword.trim()) {
                                          toast.error(MSG.SHORTENER.ERR_EMPTY_PASSWORD);
                                          return;
                                        }
                                        if (newLinkPassword !== confirmNewLinkPassword) {
                                          toast.error(MSG.SHORTENER.ERR_PASSWORD_MISMATCH);
                                          return;
                                        }
                                        patch(`shortener/${link._id}`, { password: newLinkPassword })
                                          .then(() => {
                                            toast.success(MSG.SHORTENER.SUCCESS_PASSWORD);
                                            setEditingPasswordLinkId("");
                                            refreshLinks(currentPage);
                                          })
                                          .catch((error) => {
                                            toast.error(error.response?.data?.error?.message || MSG.SHORTENER.ERR_PASSWORD);
                                          });
                                      }}
                                      className="rounded-full bg-blue-600 px-4 py-1 text-xs font-semibold text-white hover:bg-blue-700"
                                    >
                                      {MSG.SHORTENER.BTN_SAVE_PASSWORD}
                                    </button>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}

                          {/* QR Code Row */}
                          {activeQrLinkId === link._id && (
                            <tr>
                              <td colSpan={6} className="px-5 py-4 bg-slate-50/50">
                                <QrCodePreview url={getShortLinkUrl(link)} />
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Touch-First Cards View (< 768px, No Horizontal Scroll!) */}
              <div className="block md:hidden space-y-3">
                {links.map((link) => {
                  const statusObj = getLinkStatus(link);
                  return (
                    <div
                      key={link._id}
                      className="rounded-3xl border border-slate-200/90 bg-white p-4 shadow-soft-xs space-y-3"
                    >
                      {/* Card Header: Site Name + Status */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-900 text-sm truncate">
                            {link.siteName || MSG.SHORTENER.SITE_UNKNOWN}
                          </h4>
                          <span className="text-[11px] text-slate-400 truncate block max-w-xs">
                            {link.originalUrl}
                          </span>
                        </div>
                        <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          statusObj.tone === 'emerald' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          statusObj.tone === 'blue' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                          statusObj.tone === 'disabled' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${
                            statusObj.tone === 'emerald' ? 'bg-emerald-500' :
                            statusObj.tone === 'blue' ? 'bg-blue-500' :
                            statusObj.tone === 'disabled' ? 'bg-rose-500' : 'bg-slate-400'
                          }`} />
                          {statusObj.label}
                        </span>
                      </div>

                      {/* Card Short URL & Copy Action */}
                      <div className="flex items-center justify-between gap-2 rounded-2xl bg-slate-50 p-2.5">
                        <span
                          onClick={() => window.open(getShortLinkUrl(link), '_blank')}
                          className="font-mono text-xs font-semibold text-blue-600 truncate"
                        >
                          {getShortLinkUrl(link)}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyDirectLink(getShortLinkUrl(link))}
                          className="shrink-0 rounded-full bg-white border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 active:bg-slate-100"
                        >
                          {MSG.SHORTENER.BTN_COPY}
                        </button>
                      </div>

                      {/* Card Meta & Mobile Action Bar */}
                      <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <span>Lượt ghé thăm: <strong className="font-mono text-slate-900">{link.clicks ?? 0}</strong></span>
                          {link.passwordProtected && (
                            <span className="text-amber-600 font-semibold text-[11px]">🔑 Mật khẩu</span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => toggleLinkStatus(link)}
                            disabled={isLinkExpired(link)}
                            className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 active:scale-95 disabled:opacity-50 min-h-[36px]"
                          >
                            {link.status === 'disabled' ? MSG.SHORTENER.BTN_ENABLE : MSG.SHORTENER.BTN_DISABLE}
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveQrLinkId(activeQrLinkId === link._id ? "" : link._id)}
                            disabled={isLinkExpired(link) || link.status === 'disabled'}
                            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 active:scale-95 disabled:opacity-50 min-h-[36px]"
                          >
                            {activeQrLinkId === link._id ? "Ẩn QR" : "QR"}
                          </button>
                        </div>
                      </div>

                      {/* Mobile QR Container */}
                      {activeQrLinkId === link._id && (
                        <div className="pt-2">
                          <QrCodePreview url={getShortLinkUrl(link)} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Pagination Bar */}
              <div className="mt-6 flex items-center justify-between rounded-full border border-slate-200/80 bg-white/80 px-4 py-2 text-xs shadow-soft-xs">
                <button
                  onClick={() => {
                    const nextPage = Math.max(currentPage - 1, 1);
                    setCurrentPage(nextPage);
                    refreshLinks(nextPage);
                  }}
                  disabled={currentPage === 1}
                  className="rounded-full px-3 py-1 font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition"
                >
                  {MSG.SHORTENER.PAGE_PREV}
                </button>
                <div className="font-medium text-slate-500">
                  {MSG.SHORTENER.PAGE_INFO(currentPage, totalPages)}
                </div>
                <button
                  onClick={() => {
                    const nextPage = Math.min(currentPage + 1, totalPages);
                    setCurrentPage(nextPage);
                    refreshLinks(nextPage);
                  }}
                  disabled={currentPage === totalPages}
                  className="rounded-full px-3 py-1 font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition"
                >
                  {MSG.SHORTENER.PAGE_NEXT}
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-slate-200/70 bg-white p-12 text-center text-slate-400">
              <p className="text-sm">{MSG.SHORTENER.NO_LINKS}</p>
            </div>
          )}
        </section>
      )}

      {/* 6. Growth & Analytics Chart Section */}
      {isLoggedIn && (
        <section className="mt-14 sm:mt-20 rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-8 shadow-soft-sm">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
                {MSG.SHORTENER.CHART_TITLE}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {MSG.SHORTENER.CHART_SUBTITLE}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Range Toggle */}
              <select
                value={analyticsRange}
                onChange={(e) => setAnalyticsRange(e.target.value)}
                className="rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs text-slate-700 outline-none"
              >
                <option value="daily">{MSG.SHORTENER.FILTER_DAILY}</option>
                <option value="weekly">{MSG.SHORTENER.FILTER_WEEKLY}</option>
              </select>

              {/* Date Filters */}
              <input
                type="date"
                value={analyticsFrom}
                onChange={(e) => setAnalyticsFrom(e.target.value)}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700 outline-none"
              />
              <input
                type="date"
                value={analyticsTo}
                onChange={(e) => setAnalyticsTo(e.target.value)}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700 outline-none"
              />

              <button
                type="button"
                onClick={fetchAnalytics}
                className="rounded-full bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white shadow-soft-xs hover:bg-slate-800 transition active:scale-95"
              >
                {MSG.SHORTENER.BTN_UPDATE_CHART}
              </button>
            </div>
          </div>

          <LineChart data={analyticsData} />
        </section>
      )}
    </PageWrapper>
  );
};

export default CreateLink;
