import React, { useEffect, useState, useCallback } from 'react';
import Navbar from '../components/Navbar';
import api from '../services/api';
import toast from 'react-hot-toast';
import { FiUsers, FiPackage, FiCalendar } from 'react-icons/fi';

const AdminPanel = () => {
  const [stats, setStats] = useState({});
  const [pendingApprovals, setPendingApprovals] = useState({});
  const [activeTab, setActiveTab] = useState('dashboard');
  const [expandedRows, setExpandedRows] = useState({});
  const [adminBookings, setAdminBookings] = useState([]);
  const [adminBikes, setAdminBikes] = useState([]);
  const [liveRentals, setLiveRentals] = useState([]);
  const [adminCustomers, setAdminCustomers] = useState([]);
  const [adminOwners, setAdminOwners] = useState([]);
  const [loadingTabData, setLoadingTabData] = useState(false);
  const [bookingFilters, setBookingFilters] = useState({
    status: '',
    sentToOwner: '',
    ownerDecisionStatus: '',
    agreementAccepted: '',
    advancePaymentStatus: '',
    securityDepositStatus: ''
  });

  const toggleExpanded = (key) => {
    setExpandedRows((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const formatDateTime = (value) => {
    if (!value) return '—';
    try {
      return new Date(value).toLocaleString();
    } catch {
      return String(value);
    }
  };

  const isLikelyPdf = (url) =>
    typeof url === 'string' && url.toLowerCase().includes('.pdf');

  const renderDoc = (label, url) => {
    if (!url) return <p className="text-sm text-neutral-500">{label}: Not uploaded</p>;
    return (
      <div className="space-y-2">
        <p className="text-sm font-medium text-neutral-700">{label}</p>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="text-sm text-primary-700 underline break-all"
        >
          Open document
        </a>
        {!isLikelyPdf(url) && (
          <img
            src={url}
            alt={label}
            className="w-48 h-48 object-cover rounded-lg border border-neutral-200"
          />
        )}
      </div>
    );
  };

  const renderImageGallery = (images) => {
    if (!images) {
      return <p className="text-sm text-neutral-500">No images uploaded</p>;
    }

    const entries = [
      { key: 'frontView', label: 'Front View', url: images.frontView },
      { key: 'backView', label: 'Back View', url: images.backView },
      { key: 'sideView', label: 'Side View', url: images.sideView },
      { key: 'meterPhoto', label: 'Meter Photo', url: images.meterPhoto },
      { key: 'scratches', label: 'Scratches', url: images.scratches }
    ].filter((x) => !!x.url);

    if (entries.length === 0) {
      return <p className="text-sm text-neutral-500">No images uploaded</p>;
    }

    return (
      <div className="grid grid-cols-2 gap-4">
        {entries.map((img) => (
          <div key={img.key} className="space-y-2">
            <p className="text-sm font-medium text-neutral-700">{img.label}</p>
            <a
              href={img.url}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-primary-700 underline break-all"
            >
              Open image
            </a>
            <img
              src={img.url}
              alt={img.label}
              className="w-full h-40 object-cover rounded-lg border border-neutral-200"
            />
          </div>
        ))}
      </div>
    );
  };

  const fetchDashboardData = useCallback(async () => {
    try {
      const [statsRes, approvalsRes] = await Promise.all([
        api.get('/api/admin/dashboard'),
        api.get('/api/admin/pending-approvals')
      ]);
      setStats(statsRes.data);
      setPendingApprovals(approvalsRes.data);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const fetchBookings = useCallback(async () => {
    try {
      setLoadingTabData(true);
      const params = new URLSearchParams();
      Object.entries(bookingFilters).forEach(([k, v]) => {
        if (v !== '' && v != null) params.append(k, v);
      });
      const res = await api.get(`/api/admin/bookings?${params.toString()}`);
      setAdminBookings(res.data);
    } catch (error) {
      console.error('Error fetching admin bookings:', error);
      toast.error('Failed to load bookings');
    } finally {
      setLoadingTabData(false);
    }
  }, [bookingFilters]);

  const fetchBikes = useCallback(async () => {
    try {
      setLoadingTabData(true);
      const res = await api.get('/api/admin/bikes');
      setAdminBikes(res.data);
    } catch (error) {
      console.error('Error fetching admin bikes:', error);
      toast.error('Failed to load bikes');
    } finally {
      setLoadingTabData(false);
    }
  }, []);

  const fetchLiveRentals = useCallback(async () => {
    try {
      setLoadingTabData(true);
      const res = await api.get('/api/admin/live-rentals');
      setLiveRentals(res.data);
    } catch (error) {
      console.error('Error fetching live rentals:', error);
      toast.error('Failed to load live rentals');
    } finally {
      setLoadingTabData(false);
    }
  }, []);

  const fetchCustomers = useCallback(async () => {
    try {
      setLoadingTabData(true);
      const res = await api.get('/api/admin/customers');
      setAdminCustomers(res.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Failed to load customers');
    } finally {
      setLoadingTabData(false);
    }
  }, []);

  const fetchOwners = useCallback(async () => {
    try {
      setLoadingTabData(true);
      const res = await api.get('/api/admin/owners');
      setAdminOwners(res.data);
    } catch (error) {
      console.error('Error fetching owners:', error);
      toast.error('Failed to load owners');
    } finally {
      setLoadingTabData(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'bookings') fetchBookings();
    if (activeTab === 'bikes') fetchBikes();
    if (activeTab === 'live') fetchLiveRentals();
    if (activeTab === 'customers') fetchCustomers();
    if (activeTab === 'owners') fetchOwners();
  }, [activeTab, fetchBookings, fetchBikes, fetchLiveRentals, fetchCustomers, fetchOwners]);

  const handleApprove = async (type, id, note = '') => {
    try {
      if (type === 'customer') {
        await api.put(`/api/admin/customers/${id}/approve`, { note });
      } else if (type === 'owner') {
        await api.put(`/api/admin/owners/${id}/approve`, { note });
      } else if (type === 'bike') {
        await api.put(`/api/admin/bikes/${id}/approve`, { note });
      }
      toast.success('Approved successfully');
      fetchDashboardData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve');
    }
  };

  const handleReject = async (type, id, note) => {
    if (!note) {
      toast.error('Rejection note is required');
      return;
    }
    try {
      if (type === 'customer') {
        await api.put(`/api/admin/customers/${id}/reject`, { note });
      } else if (type === 'owner') {
        await api.put(`/api/admin/owners/${id}/reject`, { note });
      } else if (type === 'bike') {
        await api.put(`/api/admin/bikes/${id}/reject`, { note });
      }
      toast.success('Rejected');
      fetchDashboardData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8 text-neutral-900">Admin Panel</h1>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-neutral-200 flex-wrap">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2 font-semibold ${activeTab === 'dashboard' ? 'border-b-2 border-primary-700 text-primary-700' : 'text-neutral-600'
              }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('approvals')}
            className={`px-4 py-2 font-semibold ${activeTab === 'approvals' ? 'border-b-2 border-primary-700 text-primary-700' : 'text-neutral-600'
              }`}
          >
            Pending Approvals
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            className={`px-4 py-2 font-semibold ${activeTab === 'bookings' ? 'border-b-2 border-primary-700 text-primary-700' : 'text-neutral-600'
              }`}
          >
            All Bookings
          </button>
          <button
            onClick={() => setActiveTab('live')}
            className={`px-4 py-2 font-semibold ${activeTab === 'live' ? 'border-b-2 border-primary-700 text-primary-700' : 'text-neutral-600'
              }`}
          >
            Live Rides
          </button>
          <button
            onClick={() => setActiveTab('bikes')}
            className={`px-4 py-2 font-semibold ${activeTab === 'bikes' ? 'border-b-2 border-primary-700 text-primary-700' : 'text-neutral-600'
              }`}
          >
            All Bikes
          </button>
          <button
            onClick={() => setActiveTab('customers')}
            className={`px-4 py-2 font-semibold ${activeTab === 'customers' ? 'border-b-2 border-primary-700 text-primary-700' : 'text-neutral-600'
              }`}
          >
            All Customers
          </button>
          <button
            onClick={() => setActiveTab('owners')}
            className={`px-4 py-2 font-semibold ${activeTab === 'owners' ? 'border-b-2 border-primary-700 text-primary-700' : 'text-neutral-600'
              }`}
          >
            All Owners
          </button>
        </div>

        {activeTab === 'dashboard' && (
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div
              className="card cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setActiveTab('customers')}
            >
              <div className="flex items-center gap-3 mb-2">
                <FiUsers className="text-primary-700 text-2xl" />
                <h3 className="text-xl font-semibold">Customers</h3>
              </div>
              <p className="text-3xl font-bold text-primary-700">{stats.totalCustomers}</p>
              <p className="text-sm text-neutral-600">Pending: {stats.pendingCustomers}</p>
            </div>
            <div
              className="card cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setActiveTab('owners')}
            >
              <div className="flex items-center gap-3 mb-2">
                <FiUsers className="text-accent-600 text-2xl" />
                <h3 className="text-xl font-semibold">Owners</h3>
              </div>
              <p className="text-3xl font-bold text-accent-600">{stats.totalOwners}</p>
              <p className="text-sm text-neutral-600">Pending: {stats.pendingOwners}</p>
            </div>
            <div className="card">
              <div className="flex items-center gap-3 mb-2">
                <FiPackage className="text-primary-700 text-2xl" />
                <h3 className="text-xl font-semibold">Bikes</h3>
              </div>
              <p className="text-3xl font-bold text-primary-700">{stats.totalBikes}</p>
              <p className="text-sm text-neutral-600">Pending: {stats.pendingBikes}</p>
              <p className="text-sm text-neutral-600">Approved: {stats.approvedBikes}</p>
              <p className="text-sm text-neutral-600">Active (Browse): {stats.activeAvailableBikes}</p>
              <p className="text-sm text-neutral-600">Hidden/Inactive: {stats.hiddenOrInactiveBikes}</p>
            </div>
            <div className="card">
              <div className="flex items-center gap-3 mb-2">
                <FiCalendar className="text-accent-600 text-2xl" />
                <h3 className="text-xl font-semibold">Bookings</h3>
              </div>
              <p className="text-3xl font-bold text-accent-600">{stats.totalBookings}</p>
              <p className="text-sm text-neutral-600">Draft (not sent): {stats.pendingBookingDrafts}</p>
              <p className="text-sm text-neutral-600">Pending Owner Requests: {stats.pendingOwnerRequests}</p>
              <p className="text-sm text-neutral-600">Confirmed: {stats.confirmedBookings}</p>
              <p className="text-sm text-neutral-600">Live (Ongoing): {stats.liveRentals}</p>
              <p className="text-sm text-neutral-600">Completed: {stats.completedBookings}</p>
              <p className="text-sm text-neutral-600">Cancelled: {stats.cancelledBookings}</p>
              <p className="text-sm text-neutral-600">Booked Bikes: {stats.bookedBikesDistinct}</p>
              <p className="text-sm text-neutral-600">Running Bikes: {stats.runningBikesDistinct}</p>
            </div>
          </div>
        )}

        {activeTab === 'bookings' && (
          <div className="space-y-6">
            <div className="card">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <h2 className="text-2xl font-semibold">All Bookings</h2>
                <button
                  onClick={fetchBookings}
                  className="px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50"
                  disabled={loadingTabData}
                >
                  {loadingTabData ? 'Loading...' : 'Refresh'}
                </button>
              </div>

              <div className="mt-4 grid md:grid-cols-3 gap-4">
                <select
                  value={bookingFilters.status}
                  onChange={(e) => setBookingFilters((p) => ({ ...p, status: e.target.value }))}
                  className="input-field"
                >
                  <option value="">All Status</option>
                  <option value="pending">pending</option>
                  <option value="confirmed">confirmed</option>
                  <option value="ongoing">ongoing</option>
                  <option value="completed">completed</option>
                  <option value="cancelled">cancelled</option>
                  <option value="disputed">disputed</option>
                </select>

                <select
                  value={bookingFilters.sentToOwner}
                  onChange={(e) => setBookingFilters((p) => ({ ...p, sentToOwner: e.target.value }))}
                  className="input-field"
                >
                  <option value="">Sent to Owner (All)</option>
                  <option value="true">true</option>
                  <option value="false">false</option>
                </select>

                <select
                  value={bookingFilters.ownerDecisionStatus}
                  onChange={(e) => setBookingFilters((p) => ({ ...p, ownerDecisionStatus: e.target.value }))}
                  className="input-field"
                >
                  <option value="">Owner Decision (All)</option>
                  <option value="pending">pending</option>
                  <option value="accepted">accepted</option>
                  <option value="declined">declined</option>
                </select>

                <select
                  value={bookingFilters.agreementAccepted}
                  onChange={(e) => setBookingFilters((p) => ({ ...p, agreementAccepted: e.target.value }))}
                  className="input-field"
                >
                  <option value="">Agreement Accepted (All)</option>
                  <option value="true">true</option>
                  <option value="false">false</option>
                </select>

                <select
                  value={bookingFilters.advancePaymentStatus}
                  onChange={(e) => setBookingFilters((p) => ({ ...p, advancePaymentStatus: e.target.value }))}
                  className="input-field"
                >
                  <option value="">Advance Payment (All)</option>
                  <option value="pending">pending</option>
                  <option value="paid">paid</option>
                </select>

                <select
                  value={bookingFilters.securityDepositStatus}
                  onChange={(e) => setBookingFilters((p) => ({ ...p, securityDepositStatus: e.target.value }))}
                  className="input-field"
                >
                  <option value="">Security Deposit (All)</option>
                  <option value="pending">pending</option>
                  <option value="collected">collected</option>
                  <option value="refunded">refunded</option>
                  <option value="forfeited">forfeited</option>
                </select>
              </div>
            </div>

            <div className="card">
              {adminBookings.length === 0 ? (
                <p className="text-neutral-600">No bookings found for selected filters.</p>
              ) : (
                <div className="space-y-4">
                  {adminBookings.map((b) => (
                    <div key={b._id} className="border border-neutral-200 rounded-lg p-4">
                      <div className="flex justify-between items-start gap-4">
                        <div className="space-y-1">
                          <p className="font-semibold">
                            {b.bike?.brand} {b.bike?.model} ({b.bike?.bikeNumber})
                          </p>
                          <p className="text-sm text-neutral-600">
                            Customer: {b.customer?.name} ({b.customer?.phone}) | Owner: {b.owner?.name} ({b.owner?.phone})
                          </p>
                          <p className="text-sm text-neutral-600">
                            Start: {formatDateTime(b.startTime)} | End: {formatDateTime(b.endTime)}
                          </p>
                          <p className="text-sm text-neutral-600">
                            Total: ₹{b.totalAmount} | Deposit: ₹{b.securityDeposit} | Advance: ₹{b.advancePayment?.requiredAmount || 0} ({b.advancePayment?.status || 'pending'})
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold">Status: {b.status}</p>
                          <p className="text-sm text-neutral-600">SentToOwner: {String(!!b.isSentToOwner)}</p>
                          <p className="text-sm text-neutral-600">OwnerDecision: {b.ownerDecision?.status || 'pending'}</p>
                          <button
                            onClick={() => toggleExpanded(`booking:${b._id}`)}
                            className="mt-2 px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50"
                          >
                            {expandedRows[`booking:${b._id}`] ? 'Hide' : 'View'} Details
                          </button>
                        </div>
                      </div>

                      {expandedRows[`booking:${b._id}`] && (
                        <div className="mt-4 grid md:grid-cols-2 gap-6 border-t border-neutral-200 pt-4">
                          <div className="space-y-2 text-sm text-neutral-700">
                            <p><span className="font-semibold">Agreement Accepted:</span> {String(!!b.agreementAccepted)}</p>
                            <p><span className="font-semibold">Agreement Time:</span> {formatDateTime(b.agreementTimestamp)}</p>
                            <p><span className="font-semibold">Advance Txn:</span> {b.advancePayment?.transactionId || '—'}</p>
                            <p><span className="font-semibold">Advance Paid At:</span> {formatDateTime(b.advancePayment?.paidAt)}</p>
                            <p><span className="font-semibold">Sent To Owner At:</span> {formatDateTime(b.sentToOwnerAt)}</p>
                            <p><span className="font-semibold">Owner Decision Note:</span> {b.ownerDecision?.note || '—'}</p>
                            <p><span className="font-semibold">Owner Decided At:</span> {formatDateTime(b.ownerDecision?.decidedAt)}</p>
                          </div>
                          <div className="space-y-2 text-sm text-neutral-700">
                            <p><span className="font-semibold">Security Deposit Status:</span> {b.securityDepositStatus || 'pending'}</p>
                            <p><span className="font-semibold">Deposit Collected At:</span> {formatDateTime(b.securityDepositCollectedAt)}</p>
                            <p><span className="font-semibold">Handover Address:</span> {b.handoverLocation?.address || '—'}</p>
                            <p><span className="font-semibold">Actual Handover:</span> {formatDateTime(b.actualHandoverTime)}</p>
                            <p><span className="font-semibold">Actual Return:</span> {formatDateTime(b.actualReturnTime)}</p>
                            <p><span className="font-semibold">Payment Status:</span> {b.paymentStatus}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'live' && (
          <div className="card">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <h2 className="text-2xl font-semibold">Live Rides (Ongoing)</h2>
              <button
                onClick={fetchLiveRentals}
                className="px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50"
                disabled={loadingTabData}
              >
                {loadingTabData ? 'Loading...' : 'Refresh'}
              </button>
            </div>

            {liveRentals.length === 0 ? (
              <p className="text-neutral-600 mt-4">No ongoing rides right now.</p>
            ) : (
              <div className="space-y-4 mt-4">
                {liveRentals.map((r) => (
                  <div key={r._id} className="border border-neutral-200 rounded-lg p-4">
                    <p className="font-semibold">{r.bike?.brand} {r.bike?.model} ({r.bike?.bikeNumber})</p>
                    <p className="text-sm text-neutral-600">
                      Customer: {r.customer?.name} ({r.customer?.phone}) | Owner: {r.owner?.name} ({r.owner?.phone})
                    </p>
                    <p className="text-sm text-neutral-600">
                      Started: {formatDateTime(r.actualHandoverTime)} | Scheduled End: {formatDateTime(r.endTime)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'bikes' && (
          <div className="card">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <h2 className="text-2xl font-semibold">All Bikes</h2>
              <button
                onClick={fetchBikes}
                className="px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50"
                disabled={loadingTabData}
              >
                {loadingTabData ? 'Loading...' : 'Refresh'}
              </button>
            </div>

            {adminBikes.length === 0 ? (
              <p className="text-neutral-600 mt-4">No bikes found.</p>
            ) : (
              <div className="space-y-4 mt-4">
                {adminBikes.map((b) => (
                  <div key={b._id} className="border border-neutral-200 rounded-lg p-4">
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1">
                        <p className="font-semibold">{b.brand} {b.model} ({b.bikeNumber})</p>
                        <p className="text-sm text-neutral-600">
                          Owner: {b.owner?.name} ({b.owner?.phone}) | Approval: {b.approvalStatus}
                        </p>
                        <p className="text-sm text-neutral-600">
                          Bike Status: {b.status} | Available (Browse): {String(!!b.isAvailable)}
                        </p>
                      </div>
                      <button
                        onClick={() => toggleExpanded(`bikeAll:${b._id}`)}
                        className="px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50"
                      >
                        {expandedRows[`bikeAll:${b._id}`] ? 'Hide' : 'View'} Details
                      </button>
                    </div>

                    {expandedRows[`bikeAll:${b._id}`] && (
                      <div className="mt-4 grid md:grid-cols-2 gap-6 border-t border-neutral-200 pt-4">
                        <div className="space-y-2">
                          <p className="text-sm text-neutral-600">
                            <span className="font-semibold">Hourly:</span> ₹{b.pricing?.hourly} | <span className="font-semibold">Daily:</span> ₹{b.pricing?.daily}
                          </p>
                          <p className="text-sm text-neutral-600">
                            <span className="font-semibold">Handover:</span> {b.handoverLocation?.address || '—'}
                          </p>
                          {b.description && (
                            <p className="text-sm text-neutral-600">
                              <span className="font-semibold">Description:</span> {b.description}
                            </p>
                          )}
                        </div>
                        <div className="space-y-6">
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-neutral-700">Bike Images</p>
                            {renderImageGallery(b.images)}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'approvals' && (
          <div className="space-y-6">
            {/* Pending Customers */}
            {pendingApprovals.customers?.length > 0 && (
              <div className="card">
                <h2 className="text-2xl font-semibold mb-4">Pending Customer Approvals</h2>
                <div className="space-y-4">
                  {pendingApprovals.customers.map((customer) => (
                    <div key={customer._id} className="border border-neutral-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold">{customer.name}</p>
                          <p className="text-sm text-neutral-600">{customer.phone}</p>
                          <p className="text-sm text-neutral-600">{customer.email}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => toggleExpanded(`customer:${customer._id}`)}
                            className="px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50"
                          >
                            {expandedRows[`customer:${customer._id}`] ? 'Hide' : 'View'} Details
                          </button>
                          <button
                            onClick={() => handleApprove('customer', customer._id)}
                            className="px-4 py-2 bg-primary-700 text-white rounded-lg hover:bg-primary-800"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              const note = prompt('Enter rejection reason:');
                              if (note) handleReject('customer', customer._id, note);
                            }}
                            className="px-4 py-2 bg-accent-600 text-white rounded-lg hover:bg-accent-700"
                          >
                            Reject
                          </button>
                        </div>
                      </div>

                      {expandedRows[`customer:${customer._id}`] && (
                        <div className="mt-4 grid md:grid-cols-2 gap-6 border-t border-neutral-200 pt-4">
                          <div className="space-y-2">
                            <p className="text-sm text-neutral-600">
                              <span className="font-semibold">Created:</span> {formatDateTime(customer.createdAt)}
                            </p>
                            <p className="text-sm text-neutral-600">
                              <span className="font-semibold">Address:</span>{' '}
                              {customer.address?.street || customer.address?.city || customer.address?.state
                                ? `${customer.address?.street || ''} ${customer.address?.city || ''} ${customer.address?.state || ''} ${customer.address?.pincode || ''}`.trim()
                                : '—'}
                            </p>
                            <p className="text-sm text-neutral-600">
                              <span className="font-semibold">License Number:</span> {customer.drivingLicense?.number || '—'}
                            </p>
                            <p className="text-sm text-neutral-600">
                              <span className="font-semibold">Aadhaar Number:</span> {customer.aadhaarNumber || '—'}
                            </p>
                            <p className="text-sm text-neutral-600">
                              <span className="font-semibold">PAN Number:</span> {customer.panNumber || '—'}
                            </p>
                            <p className="text-sm text-neutral-600">
                              <span className="font-semibold">Status:</span> {customer.customerApprovalStatus || 'pending'}
                            </p>
                          </div>
                          <div className="flex items-center space-x-6">
                            {renderDoc('Driving License', customer.drivingLicense?.documentUrl)}
                            {renderDoc('Selfie', customer.selfieUrl)}
                            {renderDoc('Aadhaar Card', customer.aadhaarDocumentUrl)}
                            {renderDoc('PAN Card', customer.panDocumentUrl)}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pending Owners */}
            {pendingApprovals.owners?.length > 0 && (
              <div className="card">
                <h2 className="text-2xl font-semibold mb-4">Pending Owner Approvals</h2>
                <div className="space-y-4">
                  {pendingApprovals.owners.map((owner) => (
                    <div key={owner._id} className="border border-neutral-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold">{owner.name}</p>
                          <p className="text-sm text-neutral-600">{owner.phone}</p>
                          <p className="text-sm text-neutral-600">{owner.email}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => toggleExpanded(`owner:${owner._id}`)}
                            className="px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50"
                          >
                            {expandedRows[`owner:${owner._id}`] ? 'Hide' : 'Verify'} Details
                          </button>
                        </div>
                      </div>

                      {expandedRows[`owner:${owner._id}`] && (
                        <div className="mt-4 border-t border-neutral-200 pt-4">
                          <div className="grid md:grid-cols-2 gap-6 mb-6">
                            <div className="space-y-3">
                              <h3 className="font-semibold text-lg border-b pb-2">Owner Details</h3>
                              <p className="text-sm text-neutral-600">
                                <span className="font-semibold">Created:</span> {formatDateTime(owner.createdAt)}
                              </p>
                              <p className="text-sm text-neutral-600">
                                <span className="font-semibold">Name:</span> {owner.name}
                              </p>
                              <p className="text-sm text-neutral-600">
                                <span className="font-semibold">Address:</span>{' '}
                                {owner.address?.street || owner.address?.city || owner.address?.state
                                  ? `${owner.address?.street || ''} ${owner.address?.city || ''} ${owner.address?.state || ''} ${owner.address?.pincode || ''}`.trim()
                                  : '—'}
                              </p>
                              <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-200">
                                <p className="text-sm text-neutral-800 mb-1">
                                  <span className="font-semibold">Aadhaar Number:</span> {owner.aadhaarNumber || '—'}
                                </p>
                                <p className="text-sm text-neutral-800">
                                  <span className="font-semibold">PAN Number:</span> {owner.panNumber || '—'}
                                </p>
                              </div>
                              <p className="text-sm text-neutral-600">
                                <span className="font-semibold">Current Status:</span> {owner.ownerApprovalStatus || 'pending'}
                              </p>
                            </div>
                            <div className="space-y-6">
                              <h3 className="font-semibold text-lg border-b pb-2">Documents</h3>
                              {renderDoc('Aadhaar Card', owner.aadhaarDocumentUrl)}
                              {renderDoc('PAN Card', owner.panDocumentUrl)}
                            </div>
                          </div>

                          <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100">
                            <button
                              onClick={() => {
                                const note = prompt('Enter rejection reason:');
                                if (note) handleReject('owner', owner._id, note);
                              }}
                              className="px-6 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium"
                            >
                              Reject Owner
                            </button>
                            <button
                              onClick={() => handleApprove('owner', owner._id)}
                              className="px-6 py-2 bg-primary-700 text-white rounded-lg hover:bg-primary-800 font-medium"
                            >
                              Approve Owner
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pending Bikes */}
            {pendingApprovals.bikes?.length > 0 && (
              <div className="card">
                <h2 className="text-2xl font-semibold mb-4">Pending Bike Approvals</h2>
                <div className="space-y-4">
                  {pendingApprovals.bikes.map((bike) => (
                    <div key={bike._id} className="border border-neutral-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold">{bike.brand} {bike.model}</p>
                          <p className="text-sm text-neutral-600">Number: {bike.bikeNumber}</p>
                          <p className="text-sm text-neutral-600">Owner: {bike.owner?.name}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => toggleExpanded(`bike:${bike._id}`)}
                            className="px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50"
                          >
                            {expandedRows[`bike:${bike._id}`] ? 'Hide' : 'View'} Details
                          </button>
                          <button
                            onClick={() => handleApprove('bike', bike._id)}
                            className="px-4 py-2 bg-primary-700 text-white rounded-lg hover:bg-primary-800"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              const note = prompt('Enter rejection reason:');
                              if (note) handleReject('bike', bike._id, note);
                            }}
                            className="px-4 py-2 bg-accent-600 text-white rounded-lg hover:bg-accent-700"
                          >
                            Reject
                          </button>
                        </div>
                      </div>

                      {expandedRows[`bike:${bike._id}`] && (
                        <div className="mt-4 grid md:grid-cols-2 gap-6 border-t border-neutral-200 pt-4">
                          <div className="space-y-2">
                            <p className="text-sm text-neutral-600">
                              <span className="font-semibold">Year:</span> {bike.manufacturingYear}
                            </p>
                            <p className="text-sm text-neutral-600">
                              <span className="font-semibold">Mileage:</span> {bike.mileage} km
                            </p>
                            <p className="text-sm text-neutral-600">
                              <span className="font-semibold">Condition:</span> {bike.condition}
                            </p>
                            <p className="text-sm text-neutral-600">
                              <span className="font-semibold">Hourly:</span> ₹{bike.pricing?.hourly}
                            </p>
                            <p className="text-sm text-neutral-600">
                              <span className="font-semibold">Daily:</span> ₹{bike.pricing?.daily}
                            </p>
                            <p className="text-sm text-neutral-600">
                              <span className="font-semibold">Handover:</span> {bike.handoverLocation?.address || '—'}
                            </p>
                            {bike.description && (
                              <p className="text-sm text-neutral-600">
                                <span className="font-semibold">Description:</span> {bike.description}
                              </p>
                            )}
                          </div>
                          <div className="space-y-6">
                            <div className="space-y-2">
                              <p className="text-sm font-medium text-neutral-700">Bike Images</p>
                              {renderImageGallery(bike.images)}
                            </div>
                            {renderDoc('RC Document', bike.documents?.rc?.documentUrl)}
                            {renderDoc('PUC Document', bike.documents?.puc?.documentUrl)}
                            <div className="space-y-2">
                              <p className="text-sm font-medium text-neutral-700">Insurance</p>
                              {bike.documents?.insurance?.documentUrl ? (
                                <>
                                  <a
                                    href={bike.documents.insurance.documentUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-sm text-primary-700 underline break-all"
                                  >
                                    Open document
                                  </a>
                                  <p className="text-sm text-neutral-600">
                                    <span className="font-semibold">Expiry:</span> {formatDateTime(bike.documents.insurance.expiryDate)}
                                  </p>
                                </>
                              ) : (
                                <p className="text-sm text-neutral-500">Not uploaded</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {pendingApprovals.customers?.length === 0 &&
              pendingApprovals.owners?.length === 0 &&
              pendingApprovals.bikes?.length === 0 && (
                <div className="card text-center py-12">
                  <p className="text-xl text-neutral-600">No pending approvals</p>
                </div>
              )}
          </div>
        )}
        {activeTab === 'customers' && (
          <div className="card">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <h2 className="text-2xl font-semibold">All Customers</h2>
              <button
                onClick={fetchCustomers}
                className="px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50"
                disabled={loadingTabData}
              >
                {loadingTabData ? 'Loading...' : 'Refresh'}
              </button>
            </div>

            {adminCustomers.length === 0 ? (
              <p className="text-neutral-600 mt-4">No customers found.</p>
            ) : (
              <div className="space-y-4 mt-4">
                {adminCustomers.map((customer) => (
                  <div key={customer._id} className="border border-neutral-200 rounded-lg p-4">
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1">
                        <p className="font-semibold">{customer.name}</p>
                        <p className="text-sm text-neutral-600">
                          {customer.phone} | {customer.email}
                        </p>
                        <p className="text-sm text-neutral-600">
                          Status: <span className={`font-semibold ${customer.customerApprovalStatus === 'approved' ? 'text-green-600' : customer.customerApprovalStatus === 'rejected' ? 'text-red-600' : 'text-yellow-600'}`}>
                            {customer.customerApprovalStatus || 'pending'}
                          </span>
                        </p>
                      </div>
                      <button
                        onClick={() => toggleExpanded(`activeCustomer:${customer._id}`)}
                        className="px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50"
                      >
                        {expandedRows[`activeCustomer:${customer._id}`] ? 'Hide' : 'View'} Details
                      </button>
                    </div>

                    {expandedRows[`activeCustomer:${customer._id}`] && (
                      <div className="mt-4 border-t border-neutral-200 pt-4">
                        <div className="grid md:grid-cols-2 gap-6">
                          <div className="space-y-2 text-sm text-neutral-600">
                            <p><span className="font-semibold">Joined:</span> {formatDateTime(customer.createdAt)}</p>
                            <p>
                              <span className="font-semibold">Address:</span>{' '}
                              {customer.address?.street || customer.address?.city || customer.address?.state
                                ? `${customer.address?.street || ''} ${customer.address?.city || ''} ${customer.address?.state || ''} ${customer.address?.pincode || ''}`.trim()
                                : '—'}
                            </p>
                            <p><span className="font-semibold">License No:</span> {customer.drivingLicense?.number || '—'}</p>
                            <p><span className="font-semibold">Aadhaar No:</span> {customer.aadhaarNumber || '—'}</p>
                            <p><span className="font-semibold">PAN No:</span> {customer.panNumber || '—'}</p>
                            <p><span className="font-semibold">Active:</span> {String(customer.isActive)}</p>
                          </div>
                          <div className="flex items-center gap-4 flex-wrap">
                            {renderDoc('Driving License', customer.drivingLicense?.documentUrl)}
                            {renderDoc('Selfie', customer.selfieUrl)}
                            {renderDoc('Aadhaar', customer.aadhaarDocumentUrl)}
                            {renderDoc('PAN', customer.panDocumentUrl)}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'owners' && (
          <div className="card">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <h2 className="text-2xl font-semibold">All Owners</h2>
              <button
                onClick={fetchOwners}
                className="px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50"
                disabled={loadingTabData}
              >
                {loadingTabData ? 'Loading...' : 'Refresh'}
              </button>
            </div>

            {adminOwners.length === 0 ? (
              <p className="text-neutral-600 mt-4">No owners found.</p>
            ) : (
              <div className="space-y-4 mt-4">
                {adminOwners.map((owner) => (
                  <div key={owner._id} className="border border-neutral-200 rounded-lg p-4">
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1">
                        <p className="font-semibold">{owner.name}</p>
                        <p className="text-sm text-neutral-600">
                          {owner.phone} | {owner.email}
                        </p>
                        <p className="text-sm text-neutral-600">
                          Status: <span className={`font-semibold ${owner.ownerApprovalStatus === 'approved' ? 'text-green-600' : owner.ownerApprovalStatus === 'rejected' ? 'text-red-600' : 'text-yellow-600'}`}>
                            {owner.ownerApprovalStatus || 'pending'}
                          </span>
                        </p>
                      </div>
                      <button
                        onClick={() => toggleExpanded(`activeOwner:${owner._id}`)}
                        className="px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50"
                      >
                        {expandedRows[`activeOwner:${owner._id}`] ? 'Hide' : 'View'} Details
                      </button>
                    </div>

                    {expandedRows[`activeOwner:${owner._id}`] && (
                      <div className="mt-4 border-t border-neutral-200 pt-4">
                        <div className="grid md:grid-cols-2 gap-6">
                          <div className="space-y-2 text-sm text-neutral-600">
                            <p><span className="font-semibold">Joined:</span> {formatDateTime(owner.createdAt)}</p>
                            <p>
                              <span className="font-semibold">Address:</span>{' '}
                              {owner.address?.street || owner.address?.city || owner.address?.state
                                ? `${owner.address?.street || ''} ${owner.address?.city || ''} ${owner.address?.state || ''} ${owner.address?.pincode || ''}`.trim()
                                : '—'}
                            </p>
                            <p><span className="font-semibold">Aadhaar No:</span> {owner.aadhaarNumber || '—'}</p>
                            <p><span className="font-semibold">PAN No:</span> {owner.panNumber || '—'}</p>
                            <p><span className="font-semibold">Active:</span> {String(owner.isActive)}</p>
                          </div>
                          <div className="flex items-center gap-4 flex-wrap">
                            {renderDoc('Aadhaar', owner.aadhaarDocumentUrl)}
                            {renderDoc('PAN', owner.panDocumentUrl)}
                          </div>
                        </div>

                        {owner.ownerApprovalStatus === 'pending' && (
                          <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100 mt-4">
                            <button
                              onClick={() => {
                                const note = prompt('Enter rejection reason:');
                                if (note) handleReject('owner', owner._id, note);
                              }}
                              className="px-6 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium"
                            >
                              Reject Owner
                            </button>
                            <button
                              onClick={() => handleApprove('owner', owner._id)}
                              className="px-6 py-2 bg-primary-700 text-white rounded-lg hover:bg-primary-800 font-medium"
                            >
                              Approve Owner
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;

