export const getClientUrl = () => {
  const rawUrl = process.env.REACT_APP_CLIENT_URL || window.location.origin;
  try {
    const parsed = new URL(rawUrl);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return rawUrl.replace(/\/+$/, "");
  }
};

export const clientUrl = getClientUrl();
