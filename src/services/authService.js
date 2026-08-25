/**
 * src/services/authService.js
 * QuickBite Single Sign-On (SSO) Authentication Service
 */
import axios from "axios";
import { mapQuickBiteRoleToLocalRole } from "../constants/roles";

const identityBaseUrl =
  process.env.REACT_APP_IDENTITY_SERVICE_URL ||
  "https://quick-bite-identity.onrender.com";

const clientId = process.env.REACT_APP_OIDC_CLIENT_ID || "QuickBite_Portal";
const scope =
  process.env.REACT_APP_OIDC_SCOPE ||
  "openid profile email roles offline_access Identity";

const identityClient = axios.create({
  baseURL: identityBaseUrl,
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
  },
  timeout: 30000,
});

/**
 * Decode JWT token payload client-side safely with UTF-8 support
 */
export function parseJwt(token) {
  if (!token || typeof token !== "string") return null;
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

/**
 * Extract standardized user object from QuickBite JWT claims
 */
export function extractUserFromClaims(claims) {
  if (!claims) return null;

  const rawRoles = [];
  const roleClaim =
    claims.role ||
    claims.roles ||
    claims["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];

  if (Array.isArray(roleClaim)) {
    rawRoles.push(...roleClaim.map((r) => String(r).toLowerCase().trim()));
  } else if (typeof roleClaim === "string") {
    rawRoles.push(
      ...roleClaim
        .split(",")
        .map((r) => r.toLowerCase().trim())
        .filter(Boolean)
    );
  }

  const localRole = mapQuickBiteRoleToLocalRole(rawRoles);

  const username =
    claims.preferred_username ||
    claims.unique_name ||
    claims.username ||
    claims.email ||
    claims.sub ||
    "user";

  let fullname = claims.name;
  if (!fullname && (claims.given_name || claims.family_name)) {
    fullname = [claims.given_name, claims.family_name]
      .filter(Boolean)
      .join(" ");
  }
  if (!fullname) {
    fullname = username;
  }

  return {
    sub: claims.sub,
    username: String(username).toLowerCase(),
    fullname: String(fullname),
    email: claims.email,
    role: localRole,
    roles: rawRoles,
    permissions: Array.isArray(claims.permissions) ? claims.permissions : [],
    isSso: true,
  };
}

/**
 * Login via QuickBite Password Grant
 */
export async function loginWithQuickBite(username, password) {
  const params = new URLSearchParams();
  params.append("grant_type", "password");
  params.append("client_id", clientId);
  params.append("scope", scope);
  params.append("username", username);
  params.append("password", password);

  const res = await identityClient.post("/connect/token", params);
  const { access_token, refresh_token, id_token, expires_in } = res.data;

  const claims = parseJwt(access_token) || parseJwt(id_token || "");
  const user = extractUserFromClaims(claims);

  return {
    accessToken: access_token,
    refreshToken: refresh_token,
    idToken: id_token,
    expiresIn: expires_in || 3600,
    user,
  };
}

/**
 * Login via Google OAuth Token Exchange with QuickBite Identity
 */
export async function loginWithGoogle(idToken) {
  const res = await axios.post(
    `${identityBaseUrl}/api/app/auth/google-login`,
    { idToken },
    { headers: { "Content-Type": "application/json" } }
  );

  const { access_token, refresh_token, id_token, expires_in } = res.data;
  const claims = parseJwt(access_token) || parseJwt(id_token || "");
  const user = extractUserFromClaims(claims);

  return {
    accessToken: access_token,
    refreshToken: refresh_token,
    idToken: id_token,
    expiresIn: expires_in || 3600,
    user,
  };
}

/**
 * Refresh Access Token using QuickBite Refresh Token
 */
export async function refreshQuickBiteAccessToken(refreshToken) {
  if (!refreshToken) {
    throw new Error("No refresh token available");
  }

  const params = new URLSearchParams();
  params.append("grant_type", "refresh_token");
  params.append("client_id", clientId);
  params.append("refresh_token", refreshToken);
  params.append("scope", scope);

  const res = await identityClient.post("/connect/token", params);
  const newAccessToken = res.data.access_token;
  const newRefreshToken = res.data.refresh_token || refreshToken;
  const expiresIn = res.data.expires_in || 3600;

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    expiresIn,
  };
}

/**
 * Fetch detailed User Info from QuickBite UserInfo endpoint
 */
export async function fetchUserInfo(accessToken) {
  const res = await axios.get(`${identityBaseUrl}/connect/userinfo`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return res.data;
}
