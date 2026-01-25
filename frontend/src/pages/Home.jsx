import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { FiPackage, FiShield, FiMapPin, FiCheckCircle } from 'react-icons/fi';

const Home = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      
      {/* Hero Section */}
      <section className="bg-white py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="text-neutral-900">EXPLORE</span>{' '}
              <span className="text-primary-700">MORE</span>
              <br />
              <span className="text-neutral-900">PAY</span>{' '}
              <span className="text-primary-700">LESS</span>
              <br />
              <span className="text-neutral-900">RENT BIKES</span>{' '}
              <span className="text-primary-700">EASILY</span>
            </h1>
            <p className="text-xl text-neutral-600 mb-8 max-w-2xl mx-auto">
              Person-to-person bike rental platform with complete transparency, verification, and live tracking
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/bikes" className="btn-primary text-lg px-8 py-4">
                Rent a Bike
              </Link>
              <Link to="/register" className="btn-secondary text-lg px-8 py-4">
                Become an Owner
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-32 overflow-hidden">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <path d="M0,60 C240,20 480,100 720,60 C960,20 1200,100 1440,60 L1440,120 L0,120 Z" fill="#dcfce7" fillOpacity="0.6"/>
            <path d="M0,80 C240,40 480,120 720,80 C960,40 1200,120 1440,80 L1440,120 L0,120 Z" fill="#bbf7d0" fillOpacity="0.4"/>
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center text-neutral-900 mb-12">
            Why Choose RYDZO?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="card text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiShield className="text-primary-700 text-2xl" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Verified Users</h3>
              <p className="text-neutral-600">
                All owners and customers are verified with documents and admin approval
              </p>
            </div>
            <div className="card text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiMapPin className="text-primary-700 text-2xl" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Live Tracking</h3>
              <p className="text-neutral-600">
                Real-time GPS tracking during rental period with geo-fencing
              </p>
            </div>
            <div className="card text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiPackage className="text-primary-700 text-2xl" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Transparent</h3>
              <p className="text-neutral-600">
                View all bike documents, insurance status, and owner details before booking
              </p>
            </div>
            <div className="card text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiCheckCircle className="text-primary-700 text-2xl" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Digital Agreement</h3>
              <p className="text-neutral-600">
                Mandatory digital agreement with clear terms and conditions
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center text-neutral-900 mb-12">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary-700 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2">Get Verified</h3>
              <p className="text-neutral-600">
                Upload your documents and get verified by our admin team
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary-700 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2">Browse & Book</h3>
              <p className="text-neutral-600">
                Find your perfect bike, check documents, and make a booking
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary-700 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2">Ride & Return</h3>
              <p className="text-neutral-600">
                Meet owner, accept agreement, ride safely, and return the bike
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="py-12 bg-neutral-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-neutral-700 rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-3">Important Disclaimer</h3>
            <p className="text-neutral-300 mb-2">
              RYDZO acts only as an aggregator/platform. Vehicle ownership remains with the owner. 
              Bike delivery and return are handled directly by the owner and customer. 
              RYDZO is not responsible for vehicle condition, handover, or any incidents.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary-800 text-white py-5 relative overflow-hidden">
        <div className="absolute bottom-0 left-0 w-full h-24 overflow-hidden">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <path d="M0,40 C240,0 480,80 720,40 C960,0 1200,80 1440,40 L1440,120 L0,120 Z" fill="#14532d" fillOpacity="0.3"/>
            <path d="M0,60 C240,20 480,100 720,60 C960,20 1200,100 1440,60 L1440,120 L0,120 Z" fill="#166534" fillOpacity="0.2"/>
          </svg>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <p>&copy; 2024 RYDZO. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;

