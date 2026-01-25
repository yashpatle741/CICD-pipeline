import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { FiShield, FiAlertTriangle, FiCheckCircle } from 'react-icons/fi';

const BikeDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [bike, setBike] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingData, setBookingData] = useState({
    bookingType: 'hourly',
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: ''
  });
  const [showBookingForm, setShowBookingForm] = useState(false);

  const fetchBikeDetails = useCallback(async () => {
    try {
      const response = await api.get(`/api/bikes/${id}`);
      setBike(response.data);
    } catch (error) {
      console.error('Error fetching bike details:', error);
      toast.error('Failed to load bike details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchBikeDetails();
  }, [fetchBikeDetails]);

  const handleBooking = async (e) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please login to book');
      navigate('/login');
      return;
    }

    if (user.role !== 'customer') {
      toast.error('Only customers can book bikes');
      return;
    }

    try {
      const response = await api.post('/api/bookings', {
        bikeId: id,
        ...bookingData
      });

      toast.success('Booking created! Please accept the agreement.');
      navigate(`/bookings/${response.data.booking._id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create booking');
    }
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

  if (!bike) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="text-center">Bike not found</div>
        </div>
      </div>
    );
  }

  const insuranceStatus = bike.insuranceStatus || 
    (bike.documents?.insurance?.documentUrl 
      ? (bike.documents.insurance.expiryDate && new Date(bike.documents.insurance.expiryDate) > new Date() 
          ? 'Insurance Available' 
          : 'Insurance Expired')
      : 'No Insurance');

  const imageUrls = [
    bike.images?.frontView,
    bike.images?.backView,
    bike.images?.sideView,
    bike.images?.meterPhoto,
    bike.images?.scratches
  ].filter(Boolean);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Images */}
          <div className="space-y-4">
            {imageUrls.length > 0 ? (
              <>
                <img
                  src={imageUrls[0]}
                  alt="Bike"
                  className="w-full rounded-lg"
                />
                <div className="grid grid-cols-2 gap-4">
                  {imageUrls.slice(1, 5).map((url, idx) => (
                    <img
                      key={`bike-img-${idx}`}
                      src={url}
                      alt={`Bike ${idx + 2}`}
                      className="rounded-lg w-full h-48 object-cover"
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="w-full h-80 bg-neutral-200 rounded-lg flex items-center justify-center">
                <span className="text-neutral-500">No Images</span>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-bold mb-2">{bike.brand} {bike.model}</h1>
              <p className="text-xl text-neutral-600">Number: {bike.bikeNumber}</p>
            </div>

            {/* Insurance Status */}
            <div className={`p-4 rounded-lg ${
              insuranceStatus === 'Insurance Available' 
                ? 'bg-primary-50 border border-primary-200' 
                : 'bg-accent-50 border border-accent-200'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {insuranceStatus === 'Insurance Available' ? (
                  <FiCheckCircle className="text-primary-700" />
                ) : (
                  <FiAlertTriangle className="text-accent-600" />
                )}
                <span className="font-semibold">Insurance Status: {insuranceStatus}</span>
              </div>
              {insuranceStatus === 'No Insurance' && (
                <p className="text-sm text-accent-800">
                  ⚠️ Warning: No Insurance Available. Any damage or repair cost will be borne by the renter.
                </p>
              )}
            </div>

            {/* Owner Verification */}
            <div className="card">
              <div className="flex items-center gap-2 mb-2">
                <FiShield className="text-primary-700" />
                <span className="font-semibold">Owner Verification</span>
              </div>
              <p className="text-neutral-600">
                Status: <span className={`font-semibold ${
                  bike.owner?.ownerApprovalStatus === 'approved' ? 'text-primary-700' : 'text-neutral-500'
                }`}>
                  {bike.owner?.ownerApprovalStatus === 'approved' ? 'Verified' : 'Pending'}
                </span>
              </p>
            </div>

            {/* Owner Details */}
            <div className="card">
              <h3 className="text-xl font-semibold mb-2">Owner Details</h3>
              <div className="space-y-1 text-neutral-700">
                <p><span className="font-semibold">Name:</span> {bike.owner?.name || '—'}</p>
                <p><span className="font-semibold">Phone:</span> {bike.owner?.phone || '—'}</p>
              </div>
              <p className="text-sm text-neutral-500 mt-3">
                Note: Booking request will be sent to the owner after you accept the agreement and complete advance payment.
              </p>
            </div>

            {/* Handover Note */}
            <div className="card bg-neutral-100">
              <h3 className="font-semibold mb-2">Handover Information</h3>
              <p className="text-neutral-700">
                The bike will be provided directly by the owner at the agreed location and time. 
                RYDZO acts only as an aggregator and is not responsible for bike handover.
              </p>
            </div>

            {/* Bike Details */}
            <div className="card">
              <h3 className="text-xl font-semibold mb-4">Bike Details</h3>
              <div className="space-y-2">
                <p><span className="font-semibold">Year:</span> {bike.manufacturingYear}</p>
                <p><span className="font-semibold">Mileage:</span> {bike.mileage} km</p>
                <p><span className="font-semibold">Condition:</span> {bike.condition}</p>
                {bike.description && (
                  <p><span className="font-semibold">Description:</span> {bike.description}</p>
                )}
              </div>
            </div>

            {/* Pricing */}
            <div className="card">
              <h3 className="text-xl font-semibold mb-4">Pricing</h3>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-3xl font-bold text-primary-700">₹{bike.pricing?.hourly}</p>
                  <p className="text-neutral-600">per hour</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-primary-700">₹{bike.pricing?.daily}</p>
                  <p className="text-neutral-600">per day</p>
                </div>
              </div>
            </div>

            {/* Booking Form */}
            {user?.role === 'customer' && (
              <div className="card">
                <button
                  onClick={() => setShowBookingForm(!showBookingForm)}
                  className="w-full btn-primary mb-4"
                >
                  {showBookingForm ? 'Cancel Booking' : 'Book This Bike'}
                </button>

                {showBookingForm && (
                  <form onSubmit={handleBooking} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Rental Type</label>
                      <select
                        value={bookingData.bookingType}
                        onChange={(e) => setBookingData({ ...bookingData, bookingType: e.target.value })}
                        className="input-field"
                      >
                        <option value="hourly">Hourly</option>
                        <option value="daily">Daily</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Start Date</label>
                        <input
                          type="date"
                          value={bookingData.startDate}
                          onChange={(e) => setBookingData({ ...bookingData, startDate: e.target.value })}
                          className="input-field"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">End Date</label>
                        <input
                          type="date"
                          value={bookingData.endDate}
                          onChange={(e) => setBookingData({ ...bookingData, endDate: e.target.value })}
                          className="input-field"
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Start Time</label>
                        <input
                          type="time"
                          value={bookingData.startTime}
                          onChange={(e) => setBookingData({ ...bookingData, startTime: e.target.value })}
                          className="input-field"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">End Time</label>
                        <input
                          type="time"
                          value={bookingData.endTime}
                          onChange={(e) => setBookingData({ ...bookingData, endTime: e.target.value })}
                          className="input-field"
                          required
                        />
                      </div>
                    </div>
                    <button type="submit" className="w-full btn-primary">
                      Create Booking
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BikeDetails;

