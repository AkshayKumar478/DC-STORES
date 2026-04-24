const DEFAULT_PAGE_SIZE = 5;

function normalizePage(value) {
    const page = parseInt(value, 10);
    return Number.isNaN(page) || page < 1 ? 1 : page;
}

function normalizeLimit(value, fallback = DEFAULT_PAGE_SIZE) {
    const limit = parseInt(value, 10);
    return Number.isNaN(limit) || limit < 1 ? fallback : limit;
}

function buildPagination(page, limit, totalItems, extraQuery = {}) {
    const totalPages = Math.max(1, Math.ceil(totalItems / limit));
    const currentPage = Math.min(page, totalPages);
    const query = Object.entries(extraQuery).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            acc[key] = value;
        }
        return acc;
    }, {});

    return {
        currentPage,
        limit,
        totalItems,
        totalPages,
        hasPrev: currentPage > 1,
        hasNext: currentPage < totalPages,
        prevPage: currentPage - 1,
        nextPage: currentPage + 1,
        pages: Array.from({ length: totalPages }, (_, index) => index + 1),
        query
    };
}

module.exports = {
    DEFAULT_PAGE_SIZE,
    normalizePage,
    normalizeLimit,
    buildPagination
};
