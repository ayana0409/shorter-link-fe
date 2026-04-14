import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { get, post, patch } from "../utils/request";
import toast from 'react-hot-toast';
import { getTokenWithExpiry, getTokenRole } from "../constants/localStorage";

const CreateLink = () => {
  const [originalLink, setOriginalLink] = useState("");
  const [shortLink, setShortLink] = useState("");
  const [links, setLinks] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("valid");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  const refreshLinks = () => {
    get("shortener/user")
      .then((response) => {
        const userLinks = Array.isArray(response)
          ? response
          : response?.data || [];
        setLinks(userLinks);
        setCurrentPage(1);
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
    if (!originalLink) {
      toast.error("Vui lòng nhập liên kết gốc");
      return;
    }

    post("shortener", { originalUrl: originalLink })
      .then((response) => {
        if (response?.shortUrl) {
          setShortLink("http://localhost:3000/" + response.shortUrl);
          toast.success("Tạo liên kết thành công!");
          refreshLinks();
        } else {
          toast.error("Không thể tạo liên kết");
        }
      })
      .catch((error) => {
        const message = error.response?.data?.message || 'Không thể tạo liên kết';
        toast.error(message);
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

  const isLinkValid = (link) => {
    return link.status === 'active' && !isLinkExpired(link);
  };

  const filteredLinks = links.filter((link) => {
    const matchesSearch = (link.siteName ?? 'Không rõ')
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    const matchesStatus = (() => {
      if (statusFilter === 'valid') {
        return isLinkValid(link);
      }
      if (statusFilter === 'expired') {
        return getLinkStatus(link) === 'Hết hạn';
      }
      if (statusFilter === 'disabled') {
        return getLinkStatus(link) === 'Đã xóa';
      }
      return true;
    })();

    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filteredLinks.length / pageSize));
  const paginatedLinks = filteredLinks.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );


  useEffect(() => {
    const loggedIn = Boolean(getTokenWithExpiry());
    setIsLoggedIn(loggedIn);
    setIsAdmin(getTokenRole() === 'admin');
    if (loggedIn) {
      refreshLinks();
    }
  }, []);

  const goToLogin = () => {
    navigate('/login');
  };

  const goToAdmin = () => {
    navigate('/admin');
  };

  const logout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
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
    <div className="flex flex-col items-center min-h-screen bg-gray-100">
      <header className="w-full bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Shorter Link</h1>
            <p className="text-sm text-gray-600">Tạo và quản lý liên kết rút gọn</p>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                onClick={goToAdmin}
                className="bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600 transition duration-300"
              >
                Admin
              </button>
            )}
            {isLoggedIn ? (
              <button
                onClick={logout}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition duration-300"
              >
                Đăng xuất
              </button>
            ) : (
              <button
                onClick={goToLogin}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition duration-300"
              >
                Đăng nhập
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="bg-white shadow-lg rounded-lg p-6 w-96 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-800">Tạo liên kết rút gọn</h1>
        </div>

        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-700">Liên kết gốc</h3>
          <input
            type="text"
            onChange={(e) => setOriginalLink(e.target.value)}
            value={originalLink}
            placeholder="Nhập liên kết gốc"
            className="w-full p-2 border border-gray-300 rounded mt-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-sm text-gray-500 mt-2">Tên trang web sẽ được tự động lấy từ tiêu đề trang khi tạo link.</p>
          <button
            onClick={createLink}
            className="w-full bg-blue-500 text-white px-4 py-2 rounded mt-3 hover:bg-blue-600 transition duration-300"
          >
            Rút gọn
          </button>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-700">
            Liên kết rút gọn
          </h3>
          <input
            type="text"
            value={shortLink}
            placeholder="Liên kết rút gọn"
            readOnly
            className="w-full p-2 border border-gray-300 rounded mt-2 bg-gray-100"
          />
          <button
            onClick={copyToClipboard}
            className="w-full bg-green-500 text-white px-4 py-2 rounded mt-3 hover:bg-green-600 transition duration-300"
          >
            Sao chép
          </button>
        </div>
      </div>
      {isLoggedIn && (
        <div className="w-full max-w-4xl mt-6 px-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Liên kết của bạn</h1>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Tìm kiếm theo tên web"
                className="w-full sm:w-80 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="valid">Còn hạn</option>
                <option value="expired">Hết hạn</option>
                <option value="disabled">Đã xóa</option>
                <option value="all">Tất cả</option>
              </select>
              <button
                onClick={refreshLinks}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition duration-300"
              >
                Làm mới
              </button>
            </div>
          </div>
          {filteredLinks.length > 0 ? (
            <>
              <table className="table-auto w-full border-collapse">
                <thead>
                  <tr>
                    <th className="px-4 py-2 border">Tên trang web</th>
                    <th className="px-4 py-2 border">Link rút gọn</th>
                    <th className="px-4 py-2 border">Lượt click</th>
                    <th className="px-4 py-2 border">Trạng thái</th>
                    <th className="px-4 py-2 border">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedLinks.map((link) => (
                    <tr key={link._id}>
                      <td className="border px-4 py-2">
                        <span
                          title={link.originalUrl}
                          className="cursor-help underline decoration-dotted"
                        >
                          {link.siteName ?? 'Không rõ'}
                        </span>
                      </td>
                      <td className="border px-4 py-2">
                        <div className="flex items-center gap-2">
                          <span className="truncate">localhost:3000/{link.shortUrl}</span>
                          <button
                            onClick={() => {
                              if (navigator.clipboard) {
                                navigator.clipboard.writeText(`http://localhost:3000/${link.shortUrl}`);
                                toast.success('Đã sao chép link rút gọn');
                              }
                            }}
                            className="text-xs px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                          >
                            Copy
                          </button>
                        </div>
                      </td>
                      <td className="border px-4 py-2">{link.clicks ?? 0}</td>
                      <td className="border px-4 py-2">{getLinkStatus(link)}</td>
                      <td className="border px-4 py-2">
                        <button
                          onClick={() => toggleLinkStatus(link)}
                          disabled={isLinkExpired(link)}
                          className={`px-3 py-1 rounded transition duration-200 ${isLinkExpired(link)
                            ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                            : link.status === 'disabled'
                              ? 'bg-green-500 text-white hover:bg-green-600'
                              : 'bg-orange-500 text-white hover:bg-orange-600'}`}
                        >
                          {link.status === 'disabled' ? 'Bật' : 'Tắt'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-4 flex items-center justify-between">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded bg-gray-200 text-gray-700 disabled:opacity-50"
                >
                  Trước
                </button>
                <div className="text-sm text-gray-700">
                  Trang {currentPage} / {totalPages}
                </div>
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded bg-gray-200 text-gray-700 disabled:opacity-50"
                >
                  Sau
                </button>
              </div>
            </>
          ) : (
            <p className="text-gray-500 text-center">Chưa có liên kết nào</p>
          )}
        </div>
      )}
    </div>
  );
};

export default CreateLink;
