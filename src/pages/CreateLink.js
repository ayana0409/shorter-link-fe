import { Fragment, useEffect, useState } from "react";
import { get, post, patch } from "../utils/request";
import toast from 'react-hot-toast';
import { getTokenWithExpiry } from "../constants/localStorage";
import PageWrapper from "../components/PageWrapper";
import QrCodePreview from "../components/QrCodePreview";

const getClientUrl = () => {
  const rawUrl = process.env.REACT_APP_CLIENT_URL || window.location.origin;
  try {
    const parsed = new URL(rawUrl);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return rawUrl.replace(/\/+$/, "");
  }
};
const clientUrl = getClientUrl();

const LineChart = ({ data }) => {
  if (!data || data.length === 0) {
    return <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-center text-slate-500">Chưa có dữ liệu biểu đồ</div>;
  }

  const width = 640;
  const height = 260;
  const padding = 40;
  const values = data.map((item) => item.value);
  const maxValue = Math.max(...values, 1);
  const minValue = Math.min(...values, 0);
  const points = data.map((item, index) => {
    const x = padding + (index * (width - padding * 2)) / Math.max(data.length - 1, 1);
    const y = height - padding - ((item.value - minValue) * (height - padding * 2)) / Math.max(maxValue - minValue, 1);
    return `${x},${y}`;
  });

  return (
    <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-slate-50 p-4 shadow-sm shadow-slate-300/10">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2563eb" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3].map((line) => {
          const y = padding + ((height - padding * 2) / 3) * line;
          return (
            <line key={line} x1={padding} x2={width - padding} y1={y} y2={y} stroke="#e2e8f0" strokeWidth="1" />
          );
        })}
        <path
          d={`M${points.join(" L")}`}
          fill="none"
          stroke="#2563eb"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <polygon
          points={`${points.join(" ")} ${width - padding},${height - padding} ${padding},${height - padding}`}
          fill="url(#chartGradient)"
        />
        {points.map((point, index) => {
          const [x, y] = point.split(",");
          return (
            <g key={index}>
              <circle cx={x} cy={y} r="4" fill="#2563eb" />
              <text x={x} y={Number(y) - 10} textAnchor="middle" fontSize="10" fill="#0f172a">
                {data[index].value}
              </text>
            </g>
          );
        })}
        {data.map((item, index) => {
          const x = padding + (index * (width - padding * 2)) / Math.max(data.length - 1, 1);
          return (
            <text key={item.label} x={x} y={height - padding + 16} textAnchor="middle" fontSize="10" fill="#334155">
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

  const [originalLink, setOriginalLink] = useState("");
  const [shortLink, setShortLink] = useState("");
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
        const message = error.response?.data?.message || 'Không thể tải danh sách liên kết';
        toast.error(message);
      });
  };

  const isLinkExpired = (link) => {
    const expiresAt = link.expiresAt ? new Date(link.expiresAt) : null;
    return expiresAt ? expiresAt < new Date() : false;
  };

  const getShortLinkUrl = (link) => `${clientUrl}/s/${link.shortUrl}`;

  const toggleLinkStatus = (link) => {
    if (isLinkExpired(link)) {
      toast.error('Liên kết đã hết hạn, không thể thay đổi trạng thái');
      return;
    }

    const nextStatus = link.status === 'disabled' ? 'active' : 'disabled';
    patch(`shortener/${link._id}`, { status: nextStatus })
      .then(() => {
        toast.success('Cập nhật trạng thái liên kết thành công');
        refreshLinks();
      })
      .catch((error) => {
        const message = error.response?.data?.message || 'Không thể cập nhật trạng thái liên kết';
        toast.error(message);
      });
  };

  const createLink = () => {
    if (isCreating) {
      return;
    }

    if (!originalLink) {
      toast.error("Vui lòng nhập liên kết gốc");
      return;
    }

    if (createPassword) {
      if (!password.trim() || !confirmPassword.trim()) {
        toast.error("Vui lòng nhập mật khẩu và xác nhận mật khẩu");
        return;
      }
      if (password !== confirmPassword) {
        toast.error("Mật khẩu và xác nhận mật khẩu không trùng khớp");
        return;
      }
    }

    setIsCreating(true);
    post("shortener", {
      originalUrl: originalLink,
      password: createPassword ? password : undefined,
    })
      .then((response) => {
        if (response?.shortUrl) {
          setShortLink(`${clientUrl}/s/${response.shortUrl}`);
          toast.success("Tạo liên kết thành công!");
          refreshLinks();
          fetchQuota();
          setCreatePassword(false);
          setPassword("");
          setConfirmPassword("");
        } else {
          toast.error("Không thể tạo liên kết");
        }
      })
      .catch((error) => {
        const message = error.response?.data?.message || 'Không thể tạo liên kết';
        toast.error(message);
      })
      .finally(() => {
        setIsCreating(false);
      });
  };

  const getLinkStatus = (link) => {
    if (link.status === 'disabled') {
      return 'Đã xóa';
    }

    const expiresAt = link.expiresAt ? new Date(link.expiresAt) : null;
    if (expiresAt && expiresAt < new Date()) {
      return 'Hết hạn';
    }

    return 'Còn hạn';
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

  const paginatedLinks = links;


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

  const fetchQuota = () => {
    get('shortener/quota')
      .then((response) => {
        setQuotaInfo(response);
      })
      .catch(() => {
        setQuotaInfo(null);
      });
  };

  const copyToClipboard = () => {
    if (shortLink) {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(shortLink);
        toast.success("Đã sao chép liên kết!");
      } else {
        // Fallback for older browsers
        const textArea = document.createElement("textarea");
        textArea.value = shortLink;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        toast.success("Đã sao chép liên kết!");
      }
    }
  };

  return (
    <PageWrapper
      title="Shorter Link"
      subtitle="Tạo, quản lý và theo dõi liên kết rút gọn của bạn trong một giao diện hiện đại"
    >
      <h1 className="text-4xl font-semibold text-slate-900 uppercase text-center">Tạo liên kết rút gọn</h1>
      {isLoggedIn && quotaInfo && (
        <div className="mx-auto mb-6 max-w-4xl rounded-3xl border border-slate-200 bg-slate-50 p-4 text-slate-700 shadow-sm shadow-slate-300/10">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-slate-500">Xin chào</p>
              <p className="text-lg font-semibold text-slate-900">{quotaInfo.username}</p>
            </div>
            <div className="rounded-3xl bg-white p-4 shadow-sm shadow-slate-200">
              {quotaInfo.unlimited ? (
                <p className="text-sm text-slate-500">Admin không bị giới hạn</p>
              ) : (
                <>
                  <p className="text-sm text-slate-500">Lượt tạo link còn lại hôm nay</p>
                  <p className="text-xl font-semibold text-slate-900">{quotaInfo.remaining} / {quotaInfo.limit}</p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-300/10">
          <div className="mb-4">
            <h2 className="text-2xl font-semibold text-slate-900">Liên kết gốc</h2>
            <p className="mt-2 text-sm text-slate-600">Nhập liên kết gốc của bạn để tạo liên kết rút gọn.</p>
          </div>
          <div className="space-y-4">
            <div>
              <input
                type="text"
                onChange={(e) => setOriginalLink(e.target.value)}
                value={originalLink}
                placeholder="Nhập liên kết gốc"
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div className="flex items-center gap-3">
              <label className="inline-flex items-center gap-2 text-slate-700">
                <input
                  type="checkbox"
                  checked={createPassword}
                  onChange={(e) => setCreatePassword(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                Tạo mật khẩu
              </label>
            </div>
            {createPassword && (
              <>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Mật khẩu</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu"
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Xác nhận mật khẩu</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Xác nhận mật khẩu"
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </>
            )}
            <button
              type="button"
              onClick={createLink}
              disabled={isCreating}
              className={`w-full rounded-2xl px-4 py-3 text-white shadow-md transition ${isCreating ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'}`}
            >
              {isCreating ? 'Đang rút gọn...' : 'Rút gọn'}
            </button>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-300/10">
          <div className="mb-4">
            <h2 className="text-2xl font-semibold text-slate-900">Liên kết rút gọn</h2>
            <p className="mt-2 text-sm text-slate-600">Sao chép và chia sẻ link mới tạo.</p>
          </div>
          <div className="space-y-4">
            <input
              type="text"
              value={shortLink}
              placeholder="Liên kết rút gọn"
              readOnly
              className="w-full rounded-2xl border border-slate-300 bg-slate-100 px-4 py-3 text-slate-900"
            />
            <button
              onClick={copyToClipboard}
              className="w-full rounded-2xl bg-emerald-500 px-4 py-3 text-white shadow-md shadow-emerald-500/10 transition hover:bg-emerald-600"
            >
              Sao chép
            </button>
          </div>
        </section>
      </div>

      {isLoggedIn && (
        <div>
          <h1 className="text-3xl font-semibold text-slate-900 uppercase text-center mb-6">Liên kết của bạn</h1>
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-300/10">
            <div className="mb-6 flex flex-col gap-4">
              <div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    const nextSearch = e.target.value;
                    setSearchQuery(nextSearch);
                    setCurrentPage(1);
                    refreshLinks(1, nextSearch, statusFilter, sortBy, sortOrder);
                  }}
                  placeholder="Tìm kiếm theo tên web"
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[auto_auto_auto_auto]">
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    const nextStatus = e.target.value;
                    setStatusFilter(nextStatus);
                    setCurrentPage(1);
                    refreshLinks(1, searchQuery, nextStatus, sortBy, sortOrder);
                  }}
                  className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="valid">Còn hạn</option>
                  <option value="expired">Hết hạn</option>
                  <option value="disabled">Đã xóa</option>
                  <option value="all">Tất cả</option>
                </select>
                <select
                  value={sortBy}
                  onChange={(e) => {
                    const nextSortBy = e.target.value;
                    setSortBy(nextSortBy);
                    setCurrentPage(1);
                    refreshLinks(1, searchQuery, statusFilter, nextSortBy, sortOrder);
                  }}
                  className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="createdAt">Mới nhất</option>
                  <option value="siteName">Tên trang</option>
                  <option value="clicks">Lượt click</option>
                </select>
                <select
                  value={sortOrder}
                  onChange={(e) => {
                    const nextSortOrder = e.target.value;
                    setSortOrder(nextSortOrder);
                    setCurrentPage(1);
                    refreshLinks(1, searchQuery, statusFilter, sortBy, nextSortOrder);
                  }}
                  className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="desc">Giảm dần</option>
                  <option value="asc">Tăng dần</option>
                </select>
                <button
                  onClick={() => refreshLinks(currentPage)}
                  className="rounded-2xl bg-blue-500 px-4 py-3 text-white shadow-md shadow-blue-500/10 transition hover:bg-blue-600"
                >
                  Làm mới
                </button>
              </div>
            </div>

            {links.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                    <thead className="bg-slate-50 text-slate-700">
                      <tr>
                        <th className="px-4 py-3">Tên trang web</th>
                        <th className="px-4 py-3">Link rút gọn</th>
                        <th className="px-4 py-3">Bảo mật</th>
                        <th className="px-4 py-3">Lượt click</th>
                        <th className="px-4 py-3">Trạng thái</th>
                        <th className="px-4 py-3">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {paginatedLinks.map((link) => (
                        <Fragment key={link._id}>
                          <tr className="hover:bg-slate-50">
                            <td className="px-4 py-3">
                              <span title={link.originalUrl} className="cursor-help underline decoration-dotted">
                                {link.siteName ?? 'Không rõ'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <span className="truncate">{clientUrl}/s/{link.shortUrl}</span>
                                <button
                                  onClick={() => {
                                    if (navigator.clipboard) {
                                      navigator.clipboard.writeText(`${clientUrl}/s/${link.shortUrl}`);
                                      toast.success('Đã sao chép link rút gọn');
                                    }
                                  }}
                                  className="rounded-full border border-slate-300 bg-slate-100 px-2 py-1 text-xs text-slate-600 hover:bg-slate-200"
                                >
                                  Copy
                                </button>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className={link.passwordProtected ? 'inline-flex rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-orange-700' : 'inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700'}>
                                {link.passwordProtected ? 'Có' : 'Không'}
                              </span>
                            </td>
                            <td className="px-4 py-3">{link.clicks ?? 0}</td>
                            <td className="px-4 py-3">{getLinkStatus(link)}</td>
                            <td className="px-4 py-3 space-y-2 sm:space-y-0 sm:flex sm:flex-wrap sm:gap-2">
                              <button
                                onClick={() => toggleLinkStatus(link)}
                                disabled={isLinkExpired(link)}
                                className={`rounded-full px-3 py-1 text-sm font-medium transition ${isLinkExpired(link)
                                  ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                                  : link.status === 'disabled'
                                    ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                                    : 'bg-orange-500 text-white hover:bg-orange-600'}`}
                              >
                                {link.status === 'disabled' ? 'Bật' : 'Tắt'}
                              </button>
                              <button
                                onClick={() => setActiveQrLinkId(activeQrLinkId === link._id ? "" : link._id)}
                                disabled={isLinkExpired(link) || link.status === 'disabled'}
                                className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700 hover:bg-slate-200 transition disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                              >
                                {activeQrLinkId === link._id ? 'Ẩn QR' : 'QR'}
                              </button>
                              <button
                                onClick={() => {
                                  if (editingPasswordLinkId === link._id) {
                                    setEditingPasswordLinkId("");
                                    setNewLinkPassword("");
                                    setConfirmNewLinkPassword("");
                                  } else {
                                    setEditingPasswordLinkId(link._id);
                                    setNewLinkPassword("");
                                    setConfirmNewLinkPassword("");
                                  }
                                }}
                                className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700 hover:bg-slate-200 transition"
                              >
                                {editingPasswordLinkId === link._id ? 'Hủy mật khẩu' : 'Đổi mật khẩu'}
                              </button>
                              {editingPasswordLinkId === link._id && (
                                <div className="flex w-full flex-col gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-3">
                                  <input
                                    type="password"
                                    value={newLinkPassword}
                                    onChange={(e) => setNewLinkPassword(e.target.value)}
                                    placeholder="Mật khẩu mới"
                                    className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none"
                                  />
                                  <input
                                    type="password"
                                    value={confirmNewLinkPassword}
                                    onChange={(e) => setConfirmNewLinkPassword(e.target.value)}
                                    placeholder="Xác nhận mật khẩu"
                                    className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (!newLinkPassword.trim() || !confirmNewLinkPassword.trim()) {
                                        toast.error('Vui lòng nhập mật khẩu và xác nhận mật khẩu');
                                        return;
                                      }
                                      if (newLinkPassword !== confirmNewLinkPassword) {
                                        toast.error('Mật khẩu và xác nhận mật khẩu không khớp');
                                        return;
                                      }
                                      patch(`shortener/${link._id}`, { password: newLinkPassword })
                                        .then(() => {
                                          toast.success('Cập nhật mật khẩu liên kết thành công');
                                          setEditingPasswordLinkId("");
                                          setNewLinkPassword("");
                                          setConfirmNewLinkPassword("");
                                          refreshLinks(currentPage);
                                        })
                                        .catch((error) => {
                                          const message = error.response?.data?.message || 'Không thể cập nhật mật khẩu liên kết';
                                          toast.error(message);
                                        });
                                    }}
                                    className="rounded-2xl bg-blue-500 px-3 py-2 text-white text-sm hover:bg-blue-600 transition"
                                  >
                                    Lưu mật khẩu
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                          {activeQrLinkId === link._id && (
                            <tr>
                              <td colSpan={6} className="px-4 py-4">
                                <QrCodePreview url={getShortLinkUrl(link)} />
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    onClick={() => {
                      const nextPage = Math.max(currentPage - 1, 1);
                      setCurrentPage(nextPage);
                      refreshLinks(nextPage);
                    }}
                    disabled={currentPage === 1}
                    className="rounded-2xl bg-slate-200 px-4 py-2 text-slate-700 disabled:opacity-50"
                  >
                    Trước
                  </button>
                  <div className="text-sm text-slate-700">Trang {currentPage} / {totalPages}</div>
                  <button
                    onClick={() => {
                      const nextPage = Math.min(currentPage + 1, totalPages);
                      setCurrentPage(nextPage);
                      refreshLinks(nextPage);
                    }}
                    disabled={currentPage === totalPages}
                    className="rounded-2xl bg-slate-200 px-4 py-2 text-slate-700 disabled:opacity-50"
                  >
                    Sau
                  </button>
                </div>
              </>
            ) : (
              <p className="text-center text-slate-500 py-8">Chưa có liên kết nào</p>
            )}
          </section>
        </div>
      )}

      {isLoggedIn && (
        <section className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-300/10">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">Biểu đồ tăng trưởng</h2>
              <p className="mt-2 text-sm text-slate-600">Theo dõi số lượng link tạo theo ngày/tuần.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <select
                value={analyticsRange}
                onChange={(e) => {
                  setAnalyticsRange(e.target.value);
                  setCurrentPage(1);
                }}
                className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="daily">Theo ngày</option>
                <option value="weekly">Theo tuần</option>
              </select>
              <input
                type="date"
                value={analyticsFrom}
                onChange={(e) => setAnalyticsFrom(e.target.value)}
                className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              <input
                type="date"
                value={analyticsTo}
                onChange={(e) => setAnalyticsTo(e.target.value)}
                className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>
          <button
            onClick={fetchAnalytics}
            className="mb-6 rounded-2xl bg-blue-500 px-4 py-3 text-white shadow-md shadow-blue-500/10 transition hover:bg-blue-600"
          >
            Cập nhật biểu đồ
          </button>
          <LineChart data={analyticsData} />
        </section>
      )}
    </PageWrapper>
  );
};

export default CreateLink;
