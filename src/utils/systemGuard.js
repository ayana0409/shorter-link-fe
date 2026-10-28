/**
 * System Guard Utility
 *
 * Centralized governance module for:
 * 1. Maintenance mode (IS_MAINTAIN)
 * 2. Operating hours window (STARTUP - SHUTDOWN in UTC+7 / Vietnam Timezone)
 * 3. Near-shutdown warning threshold
 *
 * Ensures strict enforcement preventing network requests and socket connections
 * when the system is under maintenance or outside operating hours.
 */

// Environment variable normalization (supports both REACT_APP_ prefix and bare names)
const parseBoolean = (val) => {
    if (typeof val === "boolean") return val;
    if (typeof val === "string") {
        const normalized = val.trim().toLowerCase();
        return normalized === "true" || normalized === "1";
    }
    return false;
};

const IS_MAINTAIN_ENV =
    parseBoolean(process.env.REACT_APP_IS_MAINTAIN) ||
    parseBoolean(process.env.IS_MAINTAIN);

const STARTUP_ENV =
    process.env.REACT_APP_STARTUP || process.env.STARTUP || "08:00";

const SHUTDOWN_ENV =
    process.env.REACT_APP_SHUTDOWN || process.env.SHUTDOWN || "22:00";

const WARNING_MINUTES_ENV = Number(
    process.env.REACT_APP_NEAR_SHUTDOWN_WARNING_MINUTES ||
    process.env.NEAR_SHUTDOWN_WARNING_MINUTES ||
    15,
);

/**
 * Returns current Date object in Vietnam timezone (UTC+7)
 */
export const getVietnamDate = () => {
    const now = new Date();
    const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
    return new Date(utcMs + 7 * 3600000);
};

/**
 * Parses time string (HH:mm) into minutes since midnight
 */
export const parseTimeToMinutes = (timeStr, defaultMinutes = 0) => {
    if (!timeStr || typeof timeStr !== "string") return defaultMinutes;
    const parts = timeStr.trim().split(":");
    const hours = parseInt(parts[0], 10) || 0;
    const minutes = parseInt(parts[1], 10) || 0;
    return hours * 60 + minutes;
};

/**
 * Formats 2-digit numbers
 */
const padZero = (num) => String(num).padStart(2, "0");

/**
 * Evaluates operating hours for the current UTC+7 time
 */
export const checkOperatingHours = () => {
    const vnDate = getVietnamDate();
    const currentHours = vnDate.getHours();
    const currentMinutes = vnDate.getMinutes();
    const currentSeconds = vnDate.getSeconds();

    const currentTotalMinutes =
        currentHours * 60 + currentMinutes + currentSeconds / 60;
    const startMinutes = parseTimeToMinutes(STARTUP_ENV, 8 * 60);
    const endMinutes = parseTimeToMinutes(SHUTDOWN_ENV, 22 * 60);

    const formattedCurrentTime = `${padZero(currentHours)}:${padZero(currentMinutes)}:${padZero(currentSeconds)}`;

    let isOperating = false;
    let minutesUntilShutdown = 0;

    if (startMinutes < endMinutes) {
        // Standard daytime window (e.g., 08:00 - 22:00)
        isOperating =
            currentTotalMinutes >= startMinutes &&
            currentTotalMinutes < endMinutes;
        if (isOperating) {
            minutesUntilShutdown = Math.max(
                0,
                Math.ceil(endMinutes - currentTotalMinutes),
            );
        }
    } else {
        // Overnight window (e.g., 22:00 - 06:00)
        isOperating =
            currentTotalMinutes >= startMinutes ||
            currentTotalMinutes < endMinutes;
        if (isOperating) {
            if (currentTotalMinutes >= startMinutes) {
                minutesUntilShutdown = Math.max(
                    0,
                    Math.ceil(1440 - currentTotalMinutes + endMinutes),
                );
            } else {
                minutesUntilShutdown = Math.max(
                    0,
                    Math.ceil(endMinutes - currentTotalMinutes),
                );
            }
        }
    }

    const isWarning =
        isOperating &&
        minutesUntilShutdown > 0 &&
        minutesUntilShutdown <= WARNING_MINUTES_ENV;

    return {
        isOperating,
        minutesUntilShutdown,
        isWarning,
        formattedCurrentTime,
        startup: STARTUP_ENV,
        shutdown: SHUTDOWN_ENV,
        warningMinutes: WARNING_MINUTES_ENV,
    };
};

/**
 * Returns true if maintenance mode is enabled
 */
export const isMaintenanceActive = () => IS_MAINTAIN_ENV;

/**
 * Overall system status calculation
 */
export const getSystemStatus = () => {
    if (isMaintenanceActive()) {
        const vnDate = getVietnamDate();
        return {
            status: "MAINTENANCE",
            canAccess: false,
            isMaintain: true,
            isOutOfHours: false,
            isWarning: false,
            minutesLeft: 0,
            startup: STARTUP_ENV,
            shutdown: SHUTDOWN_ENV,
            formattedCurrentTime: `${padZero(vnDate.getHours())}:${padZero(vnDate.getMinutes())}:${padZero(vnDate.getSeconds())}`,
        };
    }

    const hoursInfo = checkOperatingHours();
    if (!hoursInfo.isOperating) {
        return {
            status: "OUT_OF_HOURS",
            canAccess: false,
            isMaintain: false,
            isOutOfHours: true,
            isWarning: false,
            minutesLeft: 0,
            startup: STARTUP_ENV,
            shutdown: SHUTDOWN_ENV,
            formattedCurrentTime: hoursInfo.formattedCurrentTime,
        };
    }

    return {
        status: hoursInfo.isWarning ? "WARNING" : "OPERATIONAL",
        canAccess: true,
        isMaintain: false,
        isOutOfHours: false,
        isWarning: hoursInfo.isWarning,
        minutesLeft: hoursInfo.minutesUntilShutdown,
        startup: STARTUP_ENV,
        shutdown: SHUTDOWN_ENV,
        formattedCurrentTime: hoursInfo.formattedCurrentTime,
    };
};

/**
 * Gatekeeper function for network and WebSocket requests
 * Returns false if requests must be blocked
 */
export const canMakeNetworkRequests = () => {
    return getSystemStatus().canAccess;
};

