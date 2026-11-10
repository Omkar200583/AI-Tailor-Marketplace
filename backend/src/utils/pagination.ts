export const getPagination = (query: any, defaultLimit = 20, maxLimit = 100) => {
  const page = Math.max(1, parseInt(query.page as string) || 1);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(query.limit as string) || defaultLimit));
  return { page, limit, skip: (page - 1) * limit };
};

export const pageMeta = (total: number, page: number, limit: number) => ({
  total,
  page,
  limit,
  pages: Math.ceil(total / limit),
});
