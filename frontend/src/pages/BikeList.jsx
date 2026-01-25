import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../services/api';
import { FiSearch, FiPackage } from 'react-icons/fi';

const BikeList = () => {
  const [bikes, setBikes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    minPrice: '',
    maxPrice: '',
    condition: '',
    brand: ''
  });

  const fetchBikes = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (filters.minPrice) params.append('minPrice', filters.minPrice);
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
      if (filters.condition) params.append('condition', filters.condition);
      if (filters.brand) params.append('brand', filters.brand);

      const response = await api.get(`/api/bikes?${params.toString()}`);
      setBikes(response.data);
    } catch (error) {
      console.error('Error fetching bikes:', error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filters]);

  useEffect(() => {
    fetchBikes();
  }, [fetchBikes]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchBikes();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  const getBikeImageUrls = (bike) => {
    const images = bike?.images || {};
    return [
      images.frontView,
      images.backView,
      images.sideView,
      images.meterPhoto,
      images.scratches
    ].filter(Boolean);
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8 text-neutral-900">Browse Bikes</h1>

        {/* Search and Filters */}
        <div className="card mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field pl-10"
                  placeholder="Search by bike number, brand, or model..."
                />
              </div>
              <button type="submit" className="btn-primary">
                Search
              </button>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
              <input
                type="number"
                placeholder="Min Price/Hour"
                value={filters.minPrice}
                onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                className="input-field"
              />
              <input
                type="number"
                placeholder="Max Price/Hour"
                value={filters.maxPrice}
                onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                className="input-field"
              />
              <select
                value={filters.condition}
                onChange={(e) => setFilters({ ...filters, condition: e.target.value })}
                className="input-field"
              >
                <option value="">All Conditions</option>
                <option value="excellent">Excellent</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Poor</option>
              </select>
              <input
                type="text"
                placeholder="Brand"
                value={filters.brand}
                onChange={(e) => setFilters({ ...filters, brand: e.target.value })}
                className="input-field"
              />
            </div>
          </form>
        </div>

        {/* Bike Grid */}
        {bikes.length === 0 ? (
          <div className="card text-center py-12">
            <FiPackage className="text-6xl text-neutral-400 mx-auto mb-4" />
            <p className="text-xl text-neutral-600">No bikes found</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bikes.map((bike) => (
              (() => {
                const imageUrls = getBikeImageUrls(bike);
                const mainImage = imageUrls[0];
                return (
              <Link
                key={bike._id}
                to={`/bikes/${bike._id}`}
                className="card hover:shadow-xl transition-shadow"
              >
                {mainImage ? (
                  <img
                    src={mainImage}
                    alt={bike.bikeNumber}
                    className="w-full h-48 object-cover rounded-lg mb-4"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div 
                  className="w-full h-48 bg-neutral-200 rounded-lg mb-4 flex items-center justify-center"
                  style={{ display: mainImage ? 'none' : 'flex' }}
                >
                  <span className="text-neutral-400">No Image</span>
                </div>

                {imageUrls.length > 1 && (
                  <div className="flex gap-2 mb-4 overflow-x-auto">
                    {imageUrls.slice(0, 5).map((url, idx) => (
                      <img
                        key={`${bike._id}-thumb-${idx}`}
                        src={url}
                        alt={`Bike ${bike.bikeNumber} ${idx + 1}`}
                        className="w-14 h-14 object-cover rounded-md border border-neutral-200 flex-shrink-0"
                      />
                    ))}
                  </div>
                )}

                <h3 className="text-xl font-semibold mb-2">
                  {bike.brand} {bike.model}
                </h3>
                <p className="text-neutral-600 mb-2">Number: {bike.bikeNumber}</p>
                <p className="text-neutral-600 mb-2">Year: {bike.manufacturingYear}</p>
                <p className="text-neutral-600 mb-2">Mileage: {bike.mileage} km</p>
                <div className="flex justify-between items-center mt-4">
                  <span className="text-2xl font-bold text-primary-700">
                    ₹{bike.pricing?.hourly}/hr
                  </span>
                  <span className="text-neutral-600">
                    ₹{bike.pricing?.daily}/day
                  </span>
                </div>
              </Link>
                );
              })()
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BikeList;

