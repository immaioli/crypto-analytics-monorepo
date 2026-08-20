export const API_ROUTES = {
    top: "/api/v1/coins/top",
    coin: (id) => `/api/v1/coins/${id}`,
    ohlc: (id, days) => `/api/v1/coins/${id}/ohlc?days=${days}`,
    history: (id, days) => `/api/v1/coins/${id}/history?days=${days}`,
    compare: (ids, days) => `/api/v1/coins/compare?ids=${ids.join(",")}&days=${days}`,
};
//# sourceMappingURL=index.js.map