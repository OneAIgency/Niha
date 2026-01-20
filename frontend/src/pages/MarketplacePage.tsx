import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Filter,
  RefreshCw,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Eye,
  MessageSquare,
  ShoppingCart,
} from 'lucide-react';
import { Button, Card, Badge, Input } from '../components/common';
import { BlurOverlay } from '../components/common/BlurOverlay';
import { marketplaceApi } from '../services/api';
import { usePrices } from '../hooks/usePrices';
import { useAuthStore } from '../stores/useStore';
import { formatCurrency, formatQuantity, formatRelativeTime } from '../utils';
import type { Certificate } from '../types';

type SortOption = 'date_desc' | 'date_asc' | 'price_asc' | 'price_desc' | 'quantity_desc';

export function MarketplacePage() {
  const { user } = useAuthStore();
  const [listings, setListings] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 20,
    total: 0,
    total_pages: 0,
  });
  const [sortBy, setSortBy] = useState<SortOption>('date_desc');
  const [filters, setFilters] = useState({
    minQuantity: '',
    maxQuantity: '',
    minPrice: '',
    maxPrice: '',
    vintageYear: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  const { prices } = usePrices();
  const isBlurred = user?.role === 'APPROVED';

  const fetchListings = async (page = 1) => {
    setLoading(true);
    try {
      const params: any = {
        page,
        per_page: pagination.per_page,
        sort_by: sortBy,
      };

      if (filters.minQuantity) params.min_quantity = parseFloat(filters.minQuantity);
      if (filters.maxQuantity) params.max_quantity = parseFloat(filters.maxQuantity);
      if (filters.minPrice) params.min_price = parseFloat(filters.minPrice);
      if (filters.maxPrice) params.max_price = parseFloat(filters.maxPrice);
      if (filters.vintageYear) params.vintage_year = parseInt(filters.vintageYear);

      const response = await marketplaceApi.getCEAListings(params);
      setListings(response.data);
      setPagination(response.pagination);
    } catch (err) {
      console.error('Failed to fetch listings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [sortBy]);

  const handleApplyFilters = () => {
    fetchListings(1);
    setShowFilters(false);
  };

  const handleClearFilters = () => {
    setFilters({
      minQuantity: '',
      maxQuantity: '',
      minPrice: '',
      maxPrice: '',
      vintageYear: '',
    });
    fetchListings(1);
  };

  return (
    <div className="min-h-screen py-8 relative">
      {/* Blur Overlay for Approved (unfunded) users */}
      <BlurOverlay
        show={isBlurred}
        title="Account Not Funded"
        message="Fund your account to access the CEA Marketplace and start trading. Contact our support team to complete your account setup."
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-navy-900 dark:text-white mb-2">CEA Marketplace</h1>
          <p className="text-navy-600 dark:text-navy-300">
            Browse and purchase China Emission Allowances from verified sellers
          </p>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card padding="sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                <Badge variant="cea" className="text-xs font-bold">CEA</Badge>
              </div>
              <div>
                <p className="text-2xl font-bold text-navy-900 dark:text-white">
                  {pagination.total}
                </p>
                <p className="text-sm text-navy-500 dark:text-navy-400">Active Listings</p>
              </div>
            </div>
          </Card>

          <Card padding="sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-navy-900 dark:text-white font-mono">
                  {prices ? formatCurrency(prices.cea.price, 'EUR') : '---'}
                </p>
                <p className="text-sm text-navy-500 dark:text-navy-400">Market Price</p>
              </div>
            </div>
          </Card>

          <Card padding="sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <RefreshCw className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-navy-900 dark:text-white font-mono">
                  {prices ? prices.swap_rate.toFixed(2) : '---'}
                </p>
                <p className="text-sm text-navy-500 dark:text-navy-400">CEA per EUA</p>
              </div>
            </div>
          </Card>

          <Card padding="sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-navy-900 dark:text-white">35</p>
                <p className="text-sm text-navy-500 dark:text-navy-400">Trades Today</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Toolbar */}
        <Card padding="sm" className="mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant={showFilters ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                icon={<Filter className="w-4 h-4" />}
              >
                Filters
              </Button>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="py-2 px-4 text-sm w-48 rounded-xl border border-navy-200 dark:border-navy-600 bg-white dark:bg-navy-800 text-navy-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="date_desc">Newest First</option>
                <option value="date_asc">Oldest First</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="quantity_desc">Quantity: High to Low</option>
              </select>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => fetchListings(pagination.page)}
              icon={<RefreshCw className="w-4 h-4" />}
            >
              Refresh
            </Button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t border-navy-100 dark:border-navy-700"
            >
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Input
                  placeholder="Min Quantity"
                  type="number"
                  value={filters.minQuantity}
                  onChange={(e) =>
                    setFilters({ ...filters, minQuantity: e.target.value })
                  }
                />
                <Input
                  placeholder="Max Quantity"
                  type="number"
                  value={filters.maxQuantity}
                  onChange={(e) =>
                    setFilters({ ...filters, maxQuantity: e.target.value })
                  }
                />
                <Input
                  placeholder="Min Price (EUR)"
                  type="number"
                  value={filters.minPrice}
                  onChange={(e) =>
                    setFilters({ ...filters, minPrice: e.target.value })
                  }
                />
                <Input
                  placeholder="Max Price (EUR)"
                  type="number"
                  value={filters.maxPrice}
                  onChange={(e) =>
                    setFilters({ ...filters, maxPrice: e.target.value })
                  }
                />
                <select
                  value={filters.vintageYear}
                  onChange={(e) =>
                    setFilters({ ...filters, vintageYear: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-navy-200 dark:border-navy-600 bg-white dark:bg-navy-800 text-navy-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">All Vintages</option>
                  <option value="2025">2025</option>
                  <option value="2024">2024</option>
                  <option value="2023">2023</option>
                  <option value="2022">2022</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                  Clear
                </Button>
                <Button variant="primary" size="sm" onClick={handleApplyFilters}>
                  Apply Filters
                </Button>
              </div>
            </motion.div>
          )}
        </Card>

        {/* Listings Grid */}
        {loading ? (
          <div className="grid gap-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-navy-100 dark:bg-navy-700 rounded-xl" />
                  <div className="flex-1 space-y-3">
                    <div className="h-4 bg-navy-100 dark:bg-navy-700 rounded w-1/4" />
                    <div className="h-6 bg-navy-100 dark:bg-navy-700 rounded w-1/3" />
                    <div className="h-4 bg-navy-100 dark:bg-navy-700 rounded w-1/2" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {listings.map((listing, index) => (
                <motion.div
                  key={listing.anonymous_code}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card
                    variant="hover"
                    className="cursor-pointer group"
                  >
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      {/* Seller Code */}
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-900/40 dark:to-amber-800/20 rounded-xl flex items-center justify-center">
                          <span className="text-lg font-bold font-mono text-amber-700 dark:text-amber-400">
                            {listing.anonymous_code.split('-')[0]}
                          </span>
                        </div>
                        <div>
                          <Badge variant="cea">CEA</Badge>
                          <p className="font-mono text-lg font-bold text-navy-900 dark:text-white mt-1">
                            {listing.anonymous_code}
                          </p>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-navy-500 dark:text-navy-400">Quantity</p>
                          <p className="font-semibold text-navy-900 dark:text-white">
                            {formatQuantity(listing.quantity)} tCO2e
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-navy-500 dark:text-navy-400">Unit Price</p>
                          <p className="font-semibold font-mono text-navy-900 dark:text-white">
                            {formatCurrency(listing.unit_price, 'EUR')}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-navy-500 dark:text-navy-400">Total Value</p>
                          <p className="font-semibold font-mono text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(listing.total_value, 'EUR')}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-navy-500 dark:text-navy-400">Vintage</p>
                          <p className="font-semibold text-navy-900 dark:text-white">
                            {listing.vintage_year || 'N/A'}
                          </p>
                        </div>
                      </div>

                      {/* Activity & Action */}
                      <div className="flex items-center gap-4">
                        <div className="hidden md:flex items-center gap-3 text-navy-400 dark:text-navy-500 text-sm">
                          <span className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            {listing.views}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-4 h-4" />
                            {listing.inquiries}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-navy-400 dark:text-navy-500">
                            {formatRelativeTime(listing.created_at)}
                          </p>
                          <Button
                            variant="primary"
                            size="sm"
                            className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            Buy Now
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.total_pages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === 1}
                  onClick={() => fetchListings(pagination.page - 1)}
                  icon={<ChevronLeft className="w-4 h-4" />}
                >
                  Previous
                </Button>

                <span className="px-4 py-2 text-navy-600 dark:text-navy-300">
                  Page {pagination.page} of {pagination.total_pages}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === pagination.total_pages}
                  onClick={() => fetchListings(pagination.page + 1)}
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
