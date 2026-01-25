import React from 'react';
import { FiCheckCircle, FiClock, FiActivity, FiMapPin } from 'react-icons/fi';

const RideStatus = ({ booking }) => {
  if (!booking) return null;

  const getStatusDisplay = () => {
    switch (booking.status) {
      case 'pending':
        return {
          color: 'text-yellow-600',
          bg: 'bg-yellow-50',
          icon: <FiClock />,
          text: 'Booking Pending'
        };
      case 'confirmed':
        return {
          color: 'text-green-600',
          bg: 'bg-green-50',
          icon: <FiCheckCircle />,
          text: 'Booking Confirmed'
        };
      case 'ongoing':
        return {
          color: 'text-blue-600',
          bg: 'bg-blue-50',
          icon: <FiActivity />,
          text: 'Ride Ongoing'
        };
      case 'completed':
        return {
          color: 'text-gray-600',
          bg: 'bg-gray-50',
          icon: <FiCheckCircle />,
          text: 'Ride Completed'
        };
      case 'cancelled':
        return {
          color: 'text-red-600',
          bg: 'bg-red-50',
          icon: <FiActivity />,
          text: 'Booking Cancelled'
        };
      default:
        return {
          color: 'text-gray-600',
          bg: 'bg-gray-50',
          icon: <FiClock />,
          text: booking.status
        };
    }
  };

  const status = getStatusDisplay();

  return (
    <div className={`card ${status.bg} border border-transparent`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className={`text-xl font-semibold flex items-center gap-2 ${status.color}`}>
          {status.icon}
          {status.text}
        </h3>
      </div>

      <div className="space-y-2 mt-4">
        <div className="flex items-start gap-2 text-neutral-700">
          <FiMapPin className="mt-1" />
          <div>
            <p className="font-semibold text-sm text-neutral-500">Pickup Location</p>
            <p>{booking.handoverLocation?.address || 'Location provided by owner'}</p>
          </div>
        </div>
      </div>

      {booking.status === 'ongoing' && (
        <div className="mt-4 p-3 bg-white rounded-lg border border-blue-100">
          <p className="text-sm text-blue-800">
            Ride is currently active. Enjoy your ride!
          </p>
        </div>
      )}
    </div>
  );
};

export default RideStatus;
