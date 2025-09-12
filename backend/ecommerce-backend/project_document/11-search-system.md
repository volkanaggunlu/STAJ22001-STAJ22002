# Search System Modülü

## Genel Bakış

Search System modülü, gelişmiş ürün arama, filtreleme, otomatik tamamlama ve arama önerilerini yönetir. MongoDB text search ve gelişmiş arama algoritmaları kullanır.

## Dosya Yapısı

```
src/
├── controllers/
│   └── search.js              # Arama controller
├── routes/
│   └── search.js             # Arama routes
├── services/
│   ├── searchService.js      # Arama business logic
│   └── elasticSearchService.js # Elasticsearch entegrasyonu
├── models/
│   └── SearchHistory.js      # Arama geçmişi model
└── validation/
    └── searchValidation.js   # Arama validation schemas
```

## Search Features

### 🔍 Arama Özellikleri
- **Text Search**: Ürün adı, açıklama ve tag'lerde arama
- **Faceted Search**: Kategori, marka, fiyat filtreleri
- **Autocomplete**: Anlık arama önerileri
- **Search Suggestions**: Popüler arama terimleri
- **Typo Tolerance**: Yazım hatası toleransı
- **Search Analytics**: Arama istatistikleri
- **Search History**: Kullanıcı arama geçmişi
- **Related Products**: İlgili ürün önerileri

## SearchHistory Model Schema

```javascript
// models/SearchHistory.js
const searchHistorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    sparse: true // Misafir kullanıcılar için null olabilir
  },
  sessionId: String, // Misafir kullanıcılar için
  query: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  normalizedQuery: String, // Temizlenmiş ve normalize edilmiş query
  filters: {
    category: String,
    minPrice: Number,
    maxPrice: Number,
    brand: String,
    rating: Number,
    inStock: Boolean
  },
  results: {
    count: { type: Number, default: 0 },
    clickedProducts: [{
      product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      position: Number,
      clickedAt: { type: Date, default: Date.now }
    }]
  },
  metadata: {
    userAgent: String,
    ip: String,
    language: { type: String, default: 'tr' },
    responseTime: Number, // ms
    source: { type: String, enum: ['web', 'mobile', 'api'], default: 'web' }
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 2592000 // 30 gün sonra otomatik sil
  }
});

// Indexes
searchHistorySchema.index({ user: 1, createdAt: -1 });
searchHistorySchema.index({ query: 1, createdAt: -1 });
searchHistorySchema.index({ normalizedQuery: 1 });
searchHistorySchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

// Query normalizing
searchHistorySchema.pre('save', function(next) {
  if (this.isModified('query')) {
    this.normalizedQuery = this.query
      .toLowerCase()
      .replace(/[^\wığüşöçĞÜŞÖÇİ\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
  next();
});
```

## API Endpoints

### GET `/api/search`
Ürün araması yapar.

**Query Parameters:**
- `q`: Arama terimi
- `category`: Kategori filtresi
- `minPrice`: Minimum fiyat
- `maxPrice`: Maximum fiyat
- `brand`: Marka filtresi
- `rating`: Minimum rating
- `inStock`: Stokta olanlar (true/false)
- `sort`: Sıralama (relevance, price_asc, price_desc, newest, rating)
- `page`: Sayfa numarası
- `limit`: Sayfa başına ürün

**Response:**
```json
{
  "success": true,
  "data": {
    "query": "iphone",
    "results": {
      "products": [
        {
          "id": "64f8a123456789abcdef",
          "name": "iPhone 15 Pro",
          "slug": "iphone-15-pro",
          "price": 54999,
          "discountPrice": 49999,
          "images": [
            {
              "url": "https://example.com/images/iphone15.jpg",
              "alt": "iPhone 15 Pro"
            }
          ],
          "category": {
            "name": "Akıllı Telefonlar",
            "slug": "akilli-telefonlar"
          },
          "brand": "Apple",
          "ratings": {
            "average": 4.5,
            "count": 128
          },
          "stock": {
            "available": 15
          },
          "relevanceScore": 0.95,
          "highlightedText": {
            "name": "<mark>iPhone</mark> 15 Pro",
            "description": "En gelişmiş <mark>iPhone</mark> modeli..."
          }
        }
      ],
      "totalCount": 245,
      "pagination": {
        "currentPage": 1,
        "totalPages": 21,
        "hasNext": true,
        "hasPrev": false
      }
    },
    "facets": {
      "categories": [
        {
          "id": "64f8a123456789abcdef",
          "name": "Akıllı Telefonlar",
          "count": 45,
          "selected": false
        }
      ],
      "brands": [
        {
          "name": "Apple",
          "count": 25,
          "selected": false
        },
        {
          "name": "Samsung",
          "count": 20,
          "selected": false
        }
      ],
      "priceRanges": [
        {
          "min": 0,
          "max": 1000,
          "count": 12,
          "selected": false
        },
        {
          "min": 1000,
          "max": 5000,
          "count": 85,
          "selected": false
        }
      ],
      "ratings": [
        {
          "rating": 5,
          "count": 45
        },
        {
          "rating": 4,
          "count": 78
        }
      ]
    },
    "suggestions": [
      "iphone 15",
      "iphone 14",
      "iphone case",
      "iphone charger"
    ],
    "searchTime": 125,
    "correctedQuery": null
  }
}
```

### GET `/api/search/autocomplete`
Otomatik tamamlama önerileri getirir.

**Query Parameters:**
- `q`: Arama terimi (minimum 2 karakter)
- `limit`: Maksimum öneri sayısı (default: 10)

**Response:**
```json
{
  "success": true,
  "data": {
    "suggestions": [
      {
        "text": "iPhone 15 Pro",
        "type": "product",
        "count": 25,
        "highlight": "<mark>iPh</mark>one 15 Pro"
      },
      {
        "text": "iPhone",
        "type": "query",
        "count": 245,
        "highlight": "<mark>iPh</mark>one"
      },
      {
        "text": "iPhone Aksesuarları",
        "type": "category",
        "count": 156,
        "highlight": "<mark>iPh</mark>one Aksesuarları"
      }
    ]
  }
}
```

### GET `/api/search/popular`
Popüler arama terimlerini getirir.

**Response:**
```json
{
  "success": true,
  "data": {
    "popularSearches": [
      {
        "query": "iphone",
        "count": 1245,
        "trend": "up"
      },
      {
        "query": "samsung galaxy",
        "count": 987,
        "trend": "stable"
      },
      {
        "query": "laptop",
        "count": 756,
        "trend": "down"
      }
    ]
  }
}
```

### GET `/api/search/history`
Kullanıcının arama geçmişini getirir.

**Response:**
```json
{
  "success": true,
  "data": {
    "history": [
      {
        "query": "iphone 15",
        "searchedAt": "2023-10-01T10:00:00.000Z",
        "resultCount": 25
      },
      {
        "query": "samsung s24",
        "searchedAt": "2023-09-30T15:30:00.000Z",
        "resultCount": 18
      }
    ]
  }
}
```

### DELETE `/api/search/history`
Arama geçmişini temizler.

### GET `/api/search/suggestions/:query`
Belirli bir terim için öneriler getirir.

**Response:**
```json
{
  "success": true,
  "data": {
    "query": "iphon",
    "correctedQuery": "iphone",
    "suggestions": [
      "iphone 15",
      "iphone 14",
      "iphone pro",
      "iphone mini"
    ],
    "relatedProducts": [
      {
        "id": "64f8a123456789abcdef",
        "name": "iPhone 15 Pro",
        "price": 54999,
        "image": "https://example.com/images/iphone15.jpg"
      }
    ]
  }
}
```

## Search Service Implementation

```javascript
// services/searchService.js
const Product = require('../models/Product');
const SearchHistory = require('../models/SearchHistory');

class SearchService {
  async searchProducts(query, filters = {}, pagination = {}, userId = null, sessionId = null) {
    const startTime = Date.now();
    
    try {
      // Arama pipeline'ı oluştur
      const pipeline = this.buildSearchPipeline(query, filters);
      
      // Arama sonuçlarını al
      const results = await this.executeSearch(pipeline, pagination);
      
      // Facet'ları hesapla
      const facets = await this.calculateFacets(query, filters);
      
      // Önerileri al
      const suggestions = await this.getSuggestions(query);
      
      // Arama geçmişine kaydet
      await this.saveSearchHistory(query, filters, results, userId, sessionId, Date.now() - startTime);
      
      return {
        query,
        results,
        facets,
        suggestions,
        searchTime: Date.now() - startTime,
        correctedQuery: await this.getSpellCorrection(query)
      };
    } catch (error) {
      throw new Error(`Search failed: ${error.message}`);
    }
  }

  buildSearchPipeline(query, filters) {
    const pipeline = [];
    
    // Text search stage
    if (query && query.trim()) {
      pipeline.push({
        $match: {
          $text: { $search: query },
          isActive: true
        }
      });
      
      // Add relevance score
      pipeline.push({
        $addFields: {
          relevanceScore: { $meta: 'textScore' }
        }
      });
    } else {
      pipeline.push({
        $match: { isActive: true }
      });
    }

    // Category filter
    if (filters.category) {
      pipeline.push({
        $match: {
          $or: [
            { category: new mongoose.Types.ObjectId(filters.category) },
            { subcategory: new mongoose.Types.ObjectId(filters.category) }
          ]
        }
      });
    }

    // Price range filter
    if (filters.minPrice || filters.maxPrice) {
      const priceMatch = {};
      if (filters.minPrice) priceMatch.$gte = filters.minPrice;
      if (filters.maxPrice) priceMatch.$lte = filters.maxPrice;
      
      pipeline.push({
        $match: {
          $expr: {
            $and: [
              { $gte: [{ $ifNull: ['$discountPrice', '$price'] }, priceMatch.$gte || 0] },
              { $lte: [{ $ifNull: ['$discountPrice', '$price'] }, priceMatch.$lte || Infinity] }
            ]
          }
        }
      });
    }

    // Brand filter
    if (filters.brand) {
      pipeline.push({
        $match: { brand: { $regex: filters.brand, $options: 'i' } }
      });
    }

    // Rating filter
    if (filters.rating) {
      pipeline.push({
        $match: { 'ratings.average': { $gte: filters.rating } }
      });
    }

    // Stock filter
    if (filters.inStock === true) {
      pipeline.push({
        $match: { 'stock.available': { $gt: 0 } }
      });
    }

    // Populate category ve diğer referanslar
    pipeline.push({
      $lookup: {
        from: 'categories',
        localField: 'category',
        foreignField: '_id',
        as: 'category'
      }
    });

    pipeline.push({
      $unwind: { path: '$category', preserveNullAndEmptyArrays: true }
    });

    // Select fields
    pipeline.push({
      $project: {
        name: 1,
        slug: 1,
        price: 1,
        discountPrice: 1,
        images: { $slice: ['$images', 1] },
        category: { name: 1, slug: 1 },
        brand: 1,
        ratings: 1,
        stock: { available: 1 },
        relevanceScore: 1,
        createdAt: 1
      }
    });

    return pipeline;
  }

  async executeSearch(pipeline, pagination) {
    const { page = 1, limit = 20, sort = 'relevance' } = pagination;
    
    // Add sorting
    const sortStage = this.getSortStage(sort);
    if (sortStage) pipeline.push(sortStage);

    // Get total count
    const countPipeline = [...pipeline, { $count: 'total' }];
    const [countResult] = await Product.aggregate(countPipeline);
    const totalCount = countResult?.total || 0;

    // Add pagination
    pipeline.push(
      { $skip: (page - 1) * limit },
      { $limit: limit }
    );

    const products = await Product.aggregate(pipeline);

    // Add highlighting
    const highlightedProducts = products.map(product => ({
      ...product,
      highlightedText: this.addHighlighting(product, pipeline[0].$match.$text?.$search)
    }));

    return {
      products: highlightedProducts,
      totalCount,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1
      }
    };
  }

  getSortStage(sort) {
    switch (sort) {
      case 'relevance':
        return { $sort: { relevanceScore: { $meta: 'textScore' }, 'ratings.average': -1 } };
      case 'price_asc':
        return { $sort: { price: 1 } };
      case 'price_desc':
        return { $sort: { price: -1 } };
      case 'newest':
        return { $sort: { createdAt: -1 } };
      case 'rating':
        return { $sort: { 'ratings.average': -1, 'ratings.count': -1 } };
      default:
        return { $sort: { 'ratings.average': -1, createdAt: -1 } };
    }
  }

  async calculateFacets(query, currentFilters) {
    const basePipeline = this.buildSearchPipeline(query, {});
    
    // Categories facet
    const categoriesPipeline = [
      ...basePipeline,
      {
        $group: {
          _id: '$category._id',
          name: { $first: '$category.name' },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ];

    // Brands facet
    const brandsPipeline = [
      ...basePipeline,
      {
        $group: {
          _id: '$brand',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 15 }
    ];

    // Price ranges facet
    const priceRangesPipeline = [
      ...basePipeline,
      {
        $bucket: {
          groupBy: { $ifNull: ['$discountPrice', '$price'] },
          boundaries: [0, 100, 500, 1000, 5000, 10000, Infinity],
          default: 'Other',
          output: {
            count: { $sum: 1 }
          }
        }
      }
    ];

    const [categories, brands, priceRanges] = await Promise.all([
      Product.aggregate(categoriesPipeline),
      Product.aggregate(brandsPipeline),
      Product.aggregate(priceRangesPipeline)
    ]);

    return {
      categories: categories.map(cat => ({
        id: cat._id,
        name: cat.name,
        count: cat.count,
        selected: currentFilters.category === cat._id?.toString()
      })),
      brands: brands.map(brand => ({
        name: brand._id,
        count: brand.count,
        selected: currentFilters.brand === brand._id
      })),
      priceRanges: this.formatPriceRanges(priceRanges)
    };
  }

  async getAutocompleteSuggestions(query, limit = 10) {
    if (!query || query.length < 2) return [];

    const suggestions = [];
    
    // Product name suggestions
    const productSuggestions = await Product.aggregate([
      {
        $match: {
          name: { $regex: query, $options: 'i' },
          isActive: true
        }
      },
      {
        $project: {
          text: '$name',
          type: { $literal: 'product' },
          count: { $literal: 1 }
        }
      },
      { $limit: 5 }
    ]);

    suggestions.push(...productSuggestions);

    // Popular search suggestions
    const popularSuggestions = await SearchHistory.aggregate([
      {
        $match: {
          normalizedQuery: { $regex: query.toLowerCase(), $options: 'i' }
        }
      },
      {
        $group: {
          _id: '$query',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          text: '$_id',
          type: { $literal: 'query' },
          count: 1
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    suggestions.push(...popularSuggestions);

    // Add highlighting
    return suggestions.slice(0, limit).map(suggestion => ({
      ...suggestion,
      highlight: this.addHighlightToText(suggestion.text, query)
    }));
  }

  async getSpellCorrection(query) {
    if (!query || query.length < 3) return null;

    // Simple spell correction implementation
    const popularQueries = await SearchHistory.aggregate([
      {
        $group: {
          _id: '$normalizedQuery',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 1000 }
    ]);

    const normalizedQuery = query.toLowerCase();
    let bestMatch = null;
    let bestScore = 0;

    for (const item of popularQueries) {
      const similarity = this.calculateSimilarity(normalizedQuery, item._id);
      if (similarity > bestScore && similarity > 0.7) {
        bestScore = similarity;
        bestMatch = item._id;
      }
    }

    return bestMatch && bestMatch !== normalizedQuery ? bestMatch : null;
  }

  calculateSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  addHighlighting(product, searchTerm) {
    if (!searchTerm) return {};
    
    const highlight = {};
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    
    if (product.name) {
      highlight.name = product.name.replace(regex, '<mark>$1</mark>');
    }
    
    if (product.description) {
      highlight.description = product.description.replace(regex, '<mark>$1</mark>');
    }
    
    return highlight;
  }

  addHighlightToText(text, query) {
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  async saveSearchHistory(query, filters, results, userId, sessionId, responseTime) {
    try {
      const searchHistory = new SearchHistory({
        user: userId || null,
        sessionId: sessionId || null,
        query: query.trim(),
        filters,
        results: {
          count: results.totalCount
        },
        metadata: {
          responseTime
        }
      });

      await searchHistory.save();
    } catch (error) {
      // Silent fail - arama geçmişi kritik değil
      console.warn('Search history save failed:', error.message);
    }
  }
}

module.exports = new SearchService();
```

## Frontend Entegrasyonu

### Search Hook (React)
```javascript
import { useState, useEffect, useCallback } from 'react';
import { debounce } from 'lodash';

export const useSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({});

  const searchProducts = async (searchQuery, searchFilters = {}, page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        q: searchQuery,
        page: page.toString(),
        ...searchFilters
      });

      const response = await api.get(`/search?${params}`);
      setResults(response.data.data);
      return response.data.data;
    } catch (error) {
      console.error('Search error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getAutocompleteSuggestions = useCallback(
    debounce(async (searchQuery) => {
      if (!searchQuery || searchQuery.length < 2) {
        setSuggestions([]);
        return;
      }

      try {
        const response = await api.get(`/search/autocomplete?q=${encodeURIComponent(searchQuery)}`);
        setSuggestions(response.data.data.suggestions);
      } catch (error) {
        console.error('Autocomplete error:', error);
        setSuggestions([]);
      }
    }, 300),
    []
  );

  const getSearchHistory = async () => {
    try {
      const response = await api.get('/search/history');
      return response.data.data.history;
    } catch (error) {
      console.error('Search history error:', error);
      return [];
    }
  };

  const clearSearchHistory = async () => {
    try {
      await api.delete('/search/history');
    } catch (error) {
      console.error('Clear search history error:', error);
    }
  };

  useEffect(() => {
    if (query) {
      getAutocompleteSuggestions(query);
    } else {
      setSuggestions([]);
    }
  }, [query, getAutocompleteSuggestions]);

  return {
    query,
    setQuery,
    results,
    suggestions,
    loading,
    filters,
    setFilters,
    searchProducts,
    getSearchHistory,
    clearSearchHistory
  };
};
```

### Search Component
```javascript
import React, { useState, useRef, useEffect } from 'react';
import { useSearch } from '../hooks/useSearch';
import { useNavigate } from 'react-router-dom';

const SearchComponent = () => {
  const { 
    query, 
    setQuery, 
    suggestions, 
    loading, 
    searchProducts 
  } = useSearch();
  
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const handleSearch = async (searchQuery = query) => {
    if (!searchQuery.trim()) return;
    
    setShowSuggestions(false);
    navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion.text);
    handleSearch(suggestion.text);
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
        
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSuggestionClick(suggestions[selectedIndex]);
        } else {
          handleSearch();
        }
        break;
        
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const getSuggestionIcon = (type) => {
    switch (type) {
      case 'product': return '📦';
      case 'category': return '📂';
      case 'query': return '🔍';
      default: return '💡';
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (inputRef.current && !inputRef.current.contains(event.target)) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="search-container" ref={inputRef}>
      <div className="search-input-wrapper">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowSuggestions(true);
            setSelectedIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          placeholder="Ürün, kategori veya marka ara..."
          className="search-input"
        />
        
        <button 
          onClick={() => handleSearch()}
          disabled={loading}
          className="search-button"
        >
          {loading ? '⏳' : '🔍'}
        </button>
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="suggestions-dropdown">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className={`suggestion-item ${index === selectedIndex ? 'selected' : ''}`}
              onClick={() => handleSuggestionClick(suggestion)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <span className="suggestion-icon">
                {getSuggestionIcon(suggestion.type)}
              </span>
              <span 
                className="suggestion-text"
                dangerouslySetInnerHTML={{ __html: suggestion.highlight }}
              />
              {suggestion.count && (
                <span className="suggestion-count">
                  ({suggestion.count})
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

### Search Results Page
```javascript
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSearch } from '../hooks/useSearch';

const SearchResultsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { results, loading, searchProducts, filters, setFilters } = useSearch();
  const [currentPage, setCurrentPage] = useState(1);

  const query = searchParams.get('q') || '';

  useEffect(() => {
    if (query) {
      const searchFilters = {
        category: searchParams.get('category'),
        minPrice: searchParams.get('minPrice'),
        maxPrice: searchParams.get('maxPrice'),
        brand: searchParams.get('brand'),
        rating: searchParams.get('rating'),
        inStock: searchParams.get('inStock') === 'true',
        sort: searchParams.get('sort') || 'relevance'
      };

      // Remove null/undefined values
      Object.keys(searchFilters).forEach(key => {
        if (!searchFilters[key]) delete searchFilters[key];
      });

      setFilters(searchFilters);
      searchProducts(query, searchFilters, currentPage);
    }
  }, [query, searchParams, currentPage]);

  const handleFilterChange = (filterName, value) => {
    const newParams = new URLSearchParams(searchParams);
    
    if (value) {
      newParams.set(filterName, value);
    } else {
      newParams.delete(filterName);
    }
    
    setSearchParams(newParams);
    setCurrentPage(1);
  };

  const handleSortChange = (sortValue) => {
    handleFilterChange('sort', sortValue);
  };

  if (loading && !results) {
    return <div className="search-loading">Aranıyor...</div>;
  }

  if (!results) {
    return <div>Arama yapılmadı</div>;
  }

  return (
    <div className="search-results-page">
      <div className="search-header">
        <h1>"{query}" için arama sonuçları</h1>
        <div className="search-meta">
          {results.results.totalCount} ürün bulundu 
          ({results.searchTime}ms)
        </div>
        
        {results.correctedQuery && (
          <div className="spell-correction">
            Şunu mu demek istediniz: 
            <button 
              className="corrected-query"
              onClick={() => {
                const newParams = new URLSearchParams(searchParams);
                newParams.set('q', results.correctedQuery);
                setSearchParams(newParams);
              }}
            >
              {results.correctedQuery}
            </button>
          </div>
        )}
      </div>

      <div className="search-content">
        <aside className="search-filters">
          <h3>Filtreler</h3>
          
          {/* Category Filter */}
          {results.facets.categories.length > 0 && (
            <div className="filter-group">
              <h4>Kategoriler</h4>
              {results.facets.categories.map(category => (
                <label key={category.id} className="filter-item">
                  <input
                    type="radio"
                    name="category"
                    checked={category.selected}
                    onChange={(e) => 
                      handleFilterChange('category', e.target.checked ? category.id : '')
                    }
                  />
                  {category.name} ({category.count})
                </label>
              ))}
            </div>
          )}

          {/* Brand Filter */}
          {results.facets.brands.length > 0 && (
            <div className="filter-group">
              <h4>Markalar</h4>
              {results.facets.brands.map(brand => (
                <label key={brand.name} className="filter-item">
                  <input
                    type="checkbox"
                    checked={brand.selected}
                    onChange={(e) => 
                      handleFilterChange('brand', e.target.checked ? brand.name : '')
                    }
                  />
                  {brand.name} ({brand.count})
                </label>
              ))}
            </div>
          )}

          {/* Price Range Filter */}
          <div className="filter-group">
            <h4>Fiyat Aralığı</h4>
            <div className="price-range">
              <input
                type="number"
                placeholder="Min"
                value={filters.minPrice || ''}
                onChange={(e) => handleFilterChange('minPrice', e.target.value)}
              />
              <span>-</span>
              <input
                type="number"
                placeholder="Max"
                value={filters.maxPrice || ''}
                onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
              />
            </div>
          </div>
        </aside>

        <main className="search-results">
          <div className="results-header">
            <div className="sort-controls">
              <label>Sırala:</label>
              <select 
                value={filters.sort || 'relevance'}
                onChange={(e) => handleSortChange(e.target.value)}
              >
                <option value="relevance">İlgililik</option>
                <option value="price_asc">Fiyat (Düşük → Yüksek)</option>
                <option value="price_desc">Fiyat (Yüksek → Düşük)</option>
                <option value="newest">En Yeni</option>
                <option value="rating">En Yüksek Puan</option>
              </select>
            </div>
          </div>

          <div className="products-grid">
            {results.results.products.map(product => (
              <div key={product.id} className="product-card">
                <img 
                  src={product.images[0]?.url} 
                  alt={product.name}
                  loading="lazy"
                />
                <div className="product-info">
                  <h3 
                    dangerouslySetInnerHTML={{ 
                      __html: product.highlightedText?.name || product.name 
                    }}
                  />
                  <div className="product-price">
                    {product.discountPrice ? (
                      <>
                        <span className="current-price">
                          ₺{product.discountPrice.toLocaleString('tr-TR')}
                        </span>
                        <span className="original-price">
                          ₺{product.price.toLocaleString('tr-TR')}
                        </span>
                      </>
                    ) : (
                      <span className="current-price">
                        ₺{product.price.toLocaleString('tr-TR')}
                      </span>
                    )}
                  </div>
                  <div className="product-rating">
                    ⭐ {product.ratings.average} ({product.ratings.count})
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {results.results.pagination.totalPages > 1 && (
            <div className="pagination">
              {Array.from({ length: results.results.pagination.totalPages }, (_, i) => (
                <button
                  key={i + 1}
                  className={`page-btn ${currentPage === i + 1 ? 'active' : ''}`}
                  onClick={() => setCurrentPage(i + 1)}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
```

## Search Analytics

### Search Analytics Service
```javascript
// services/searchAnalytics.js
class SearchAnalytics {
  async getPopularSearchTerms(limit = 20, timeframe = '7d') {
    const startDate = new Date();
    
    switch (timeframe) {
      case '1d': startDate.setDate(startDate.getDate() - 1); break;
      case '7d': startDate.setDate(startDate.getDate() - 7); break;
      case '30d': startDate.setDate(startDate.getDate() - 30); break;
      default: startDate.setDate(startDate.getDate() - 7);
    }

    return await SearchHistory.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$normalizedQuery',
          count: { $sum: 1 },
          avgResponseTime: { $avg: '$metadata.responseTime' },
          totalClicks: { $sum: { $size: '$results.clickedProducts' } }
        }
      },
      {
        $project: {
          query: '$_id',
          count: 1,
          avgResponseTime: { $round: ['$avgResponseTime', 2] },
          totalClicks: 1,
          ctr: { $divide: ['$totalClicks', '$count'] }
        }
      },
      { $sort: { count: -1 } },
      { $limit: limit }
    ]);
  }

  async getSearchTrends(timeframe = '30d') {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(timeframe.replace('d', '')));

    return await SearchHistory.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          searches: { $sum: 1 },
          uniqueQueries: { $addToSet: '$normalizedQuery' }
        }
      },
      {
        $project: {
          date: {
            $dateFromParts: {
              year: '$_id.year',
              month: '$_id.month',
              day: '$_id.day'
            }
          },
          searches: 1,
          uniqueQueries: { $size: '$uniqueQueries' }
        }
      },
      { $sort: { date: 1 } }
    ]);
  }

  async getNoResultsQueries(limit = 50) {
    return await SearchHistory.aggregate([
      {
        $match: {
          'results.count': 0
        }
      },
      {
        $group: {
          _id: '$normalizedQuery',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          query: '$_id',
          count: 1
        }
      },
      { $sort: { count: -1 } },
      { $limit: limit }
    ]);
  }
}
```

## Test Örnekleri

```javascript
describe('Search System', () => {
  test('should search products by text', async () => {
    const response = await request(app)
      .get('/api/search?q=iphone');

    expect(response.status).toBe(200);
    expect(response.body.data.results.products).toBeInstanceOf(Array);
    expect(response.body.data.results.totalCount).toBeGreaterThanOrEqual(0);
  });

  test('should provide autocomplete suggestions', async () => {
    const response = await request(app)
      .get('/api/search/autocomplete?q=iph');

    expect(response.status).toBe(200);
    expect(response.body.data.suggestions).toBeInstanceOf(Array);
  });

  test('should apply filters correctly', async () => {
    const response = await request(app)
      .get('/api/search?q=phone&category=smartphones&minPrice=1000&maxPrice=5000');

    expect(response.status).toBe(200);
    expect(response.body.data.results.products.every(product => 
      product.price >= 1000 && product.price <= 5000
    )).toBe(true);
  });
});
```

---

**Son Güncelleme**: `{new Date().toLocaleDateString('tr-TR')}` 