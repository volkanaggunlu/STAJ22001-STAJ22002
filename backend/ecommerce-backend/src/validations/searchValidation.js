const validateSearchQuery = (query) => {
  const {
    q,
    minPrice,
    maxPrice,
    page,
    limit,
    sortBy,
    sortOrder
  } = query;

  // Fiyat validasyonu
  if (minPrice !== undefined) {
    const min = Number(minPrice);
    if (isNaN(min) || min < 0) {
      return 'Minimum fiyat geçersiz';
    }
  }

  if (maxPrice !== undefined) {
    const max = Number(maxPrice);
    if (isNaN(max) || max < 0) {
      return 'Maksimum fiyat geçersiz';
    }
  }

  if (minPrice && maxPrice && Number(minPrice) > Number(maxPrice)) {
    return 'Minimum fiyat maksimum fiyattan büyük olamaz';
  }

  // Sayfalama validasyonu
  if (page !== undefined) {
    const pageNum = Number(page);
    if (isNaN(pageNum) || pageNum < 1) {
      return 'Geçersiz sayfa numarası';
    }
  }

  if (limit !== undefined) {
    const limitNum = Number(limit);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return 'Geçersiz limit değeri (1-100 arası olmalı)';
    }
  }

  // Sıralama validasyonu
  const validSortFields = ['createdAt', 'price', 'name', 'rating.average', 'relevance'];
  if (sortBy && !validSortFields.includes(sortBy)) {
    return 'Geçersiz sıralama alanı';
  }

  const validSortOrders = ['asc', 'desc'];
  if (sortOrder && !validSortOrders.includes(sortOrder)) {
    return 'Geçersiz sıralama yönü';
  }

  return null;
};

module.exports = {
  validateSearchQuery
}; 