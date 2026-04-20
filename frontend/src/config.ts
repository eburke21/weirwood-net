// Centralized frontend config. Import API_BASE from here rather than
// reading import.meta.env.VITE_API_URL directly — this module strips any
// trailing slash, which avoids double-slash paths like "https://host//api/..."
// when the env var is copy-pasted with the trailing slash that Railway's
// and many platforms' dashboards show by default.

const rawApiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export const API_BASE = rawApiUrl.replace(/\/+$/, "");
