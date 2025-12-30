import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import L from 'leaflet';
import '../styles/HelpRequest.css';

const HelpRequestPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    requestorName: '',
    requestorPhoneNumber: '',
    requestorEmail: '',
    requestType: 0, // 0=Food, 1=Medical, 2=Rescue
    requestDescription: '',
    longitude: null,
    latitude: null,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [locationStatus, setLocationStatus] = useState('Getting location...');
  const [showMap, setShowMap] = useState(false);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  // Get GPS location on component mount
  useEffect(() => {
    getLocation();
  }, []);

  const getLocation = () => {
    setLocationStatus('Getting location...');
    setShowMap(false);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData((prev) => ({
            ...prev,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }));
          setLocationStatus(`✅ Location found`);
          setShowMap(false);
        },
        (error) => {
          console.error('Geolocation error:', error);
          setLocationStatus('📍 Click on map to set your location');
          setShowMap(true);
        },
        {
          enableHighAccuracy: false,
          timeout: 8000,
          maximumAge: 0,
        }
      );
    } else {
      setLocationStatus('📍 Click on map to set your location');
      setShowMap(true);
    }
  };

  // Initialize map when needed
  useEffect(() => {
    if (showMap && mapRef.current && !mapInstanceRef.current) {
      // Default center (Pakistan center)
      const defaultLat = 30.3753;
      const defaultLng = 69.3451;

      mapInstanceRef.current = L.map(mapRef.current).setView([defaultLat, defaultLng], 6);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(mapInstanceRef.current);

      const marker = L.marker([defaultLat, defaultLng]).addTo(mapInstanceRef.current);

      mapInstanceRef.current.on('click', (e) => {
        const { lat, lng } = e.latlng;
        setFormData((prev) => ({
          ...prev,
          latitude: lat,
          longitude: lng,
        }));
        marker.setLatLng([lat, lng]);
        setShowMap(false);
        setLocationStatus('✅ Location set from map');
      });
    }
  }, [showMap]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation
    if (!formData.requestorPhoneNumber) {
      setError('Phone number is required');
      setLoading(false);
      return;
    }

    if (!formData.requestDescription) {
      setError('Please describe your request');
      setLoading(false);
      return;
    }

    if (formData.latitude === null || formData.longitude === null) {
      setError('📍 Location is required. Please click "Get My Location" button and allow access to your location.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:5273/api/helpRequest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestorName: formData.requestorName || 'Anonymous',
          requestorPhoneNumber: formData.requestorPhoneNumber,
          requestorEmail: formData.requestorEmail || null,
          requestType: parseInt(formData.requestType),
          requestDescription: formData.requestDescription,
          latitude: formData.latitude,
          longitude: formData.longitude,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit request');
      }

      const data = await response.json();
      setSuccess(true);
      
      // Show success message for 2 seconds then redirect
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Error submitting request. Please try again.');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const requestTypeLabels = {
    0: 'Food & Supplies',
    1: 'Medical Assistance',
    2: 'Rescue & Evacuation',
  };

  return (
    <div className="help-request-page">
      <Header />
      
      <main className="help-request-container">
        <div className="help-request-content">
          <div className="help-request-header">
            <h1>Request Emergency Relief</h1>
            <p>Fill out this form to submit a help request during this emergency</p>
          </div>

          {success && (
            <div className="success-message">
              <svg className="success-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              <h2>Request Submitted Successfully!</h2>
              <p>Your help request has been submitted. Volunteers will be notified and will reach out soon.</p>
              <p className="redirect-message">Redirecting to home page...</p>
            </div>
          )}

          {!success && (
            <form className="help-request-form" onSubmit={handleSubmit}>
              {error && (
                <div className="error-message">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                  </svg>
                  {error}
                </div>
              )}

              {/* Personal Information */}
              <fieldset className="form-section">
                <legend>Personal Information</legend>

                <div className="form-group">
                  <label htmlFor="requestorName">Full Name (Optional)</label>
                  <input
                    type="text"
                    id="requestorName"
                    name="requestorName"
                    value={formData.requestorName}
                    onChange={handleChange}
                    placeholder="Your full name"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="requestorPhoneNumber">Phone Number *</label>
                  <input
                    type="tel"
                    id="requestorPhoneNumber"
                    name="requestorPhoneNumber"
                    value={formData.requestorPhoneNumber}
                    onChange={handleChange}
                    placeholder="03001234567"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="requestorEmail">Email (Optional)</label>
                  <input
                    type="email"
                    id="requestorEmail"
                    name="requestorEmail"
                    value={formData.requestorEmail}
                    onChange={handleChange}
                    placeholder="your.email@example.com"
                  />
                </div>
              </fieldset>

              {/* Request Type */}
              <fieldset className="form-section">
                <legend>What do you need help with? *</legend>

                <div className="request-type-options">
                  {[0, 1, 2].map((type) => (
                    <label key={type} className="request-type-label">
                      <input
                        type="radio"
                        name="requestType"
                        value={type}
                        checked={formData.requestType === type.toString()}
                        onChange={handleChange}
                      />
                      <span className="request-type-text">
                        {type === 0 && '🍽️'}
                        {type === 1 && '⚕️'}
                        {type === 2 && '🆘'}
                        {requestTypeLabels[type]}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              {/* Request Description */}
              <fieldset className="form-section">
                <legend>Request Details</legend>

                <div className="form-group">
                  <label htmlFor="requestDescription">Describe your situation *</label>
                  <textarea
                    id="requestDescription"
                    name="requestDescription"
                    value={formData.requestDescription}
                    onChange={handleChange}
                    placeholder="Please describe what help you need, any family members, medical conditions, etc."
                    rows="5"
                    required
                  />
                </div>

                {/* Location Status */}
                <div className="location-info">
                  <svg className="location-icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                  <span>{locationStatus}</span>
                </div>

                <p style={{
                  fontSize: '13px',
                  color: '#555',
                  marginTop: '10px',
                  marginBottom: '10px',
                  fontStyle: 'italic'
                }}
                >
                  We need your exact location so volunteers can find you quickly to provide help.
                </p>

                <button
                  type="button"
                  onClick={getLocation}
                  style={{
                    width: '100%',
                    marginBottom: '15px',
                    padding: '12px 16px',
                    backgroundColor: formData.latitude && formData.longitude ? '#4CAF50' : '#2196F3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: 'bold'
                  }}
                >
                  {formData.latitude && formData.longitude ? (
                    '✅ Location Captured'
                  ) : (
                    '📍 Get My Location'
                  )}
                </button>

                {formData.latitude && formData.longitude && (
                  <div className="location-coordinates" style={{
                    padding: '10px',
                    backgroundColor: '#e8f5e9',
                    borderRadius: '4px',
                    marginTop: '10px',
                    fontSize: '13px',
                    color: '#2e7d32'
                  }}
                  >
                    <p style={{ margin: '0' }}>✅ Your location is set and ready</p>
                  </div>
                )}

                {showMap && (
                  <div style={{
                    marginTop: '15px',
                    padding: '15px',
                    backgroundColor: '#e3f2fd',
                    borderRadius: '4px',
                    borderLeft: '4px solid #2196F3'
                  }}>
                    <p style={{ marginTop: '0', fontSize: '13px', fontWeight: 'bold', color: '#1976d2' }}>
                      📍 Click on the map to set your location
                    </p>
                    
                    <div 
                      ref={mapRef}
                      style={{
                        width: '100%',
                        height: '300px',
                        borderRadius: '4px',
                        border: '2px solid #2196F3',
                        marginTop: '10px'
                      }}
                    />
                    
                    <p style={{ marginBottom: '0', fontSize: '12px', color: '#666', marginTop: '10px' }}>
                      Drag the map and click where you are located
                    </p>
                  </div>
                )}
              </fieldset>

              {/* Submit Button */}
              <button
                type="submit"
                className="submit-btn"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="loading-spinner"></span>
                    Submitting...
                  </>
                ) : (
                  <>
                    <svg className="btn-icon" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M16.6915026,12.4744748 L3.50612381,13.2599618 C3.19218622,13.2599618 3.03521743,13.4170592 3.03521743,13.5741566 L1.15159189,20.0151496 C0.8376543,20.8006365 0.99,21.89 1.77946707,22.52 C2.41,22.99 3.50612381,23.1 4.13399899,22.9429026 L21.714504,14.0454487 C22.6563168,13.5741566 23.1272231,12.6315722 22.6563168,11.6889879 L4.13399899,2.79156848 C3.34915502,2.40199706 2.40734225,2.5590945 1.77946707,3.0303866 C0.994623095,3.50168276 0.837654326,4.59098075 1.15159189,5.37647765 L3.03521743,11.8174706 C3.03521743,11.9745681 3.34915502,12.1316655 3.50612381,12.1316655 L16.6915026,12.9171523 C16.6915026,12.9171523 17.1624089,12.9171523 17.1624089,12.4744748 C17.1624089,12.0317972 16.6915026,12.4744748 16.6915026,12.4744748 Z"/>
                    </svg>
                    Submit Request
                  </>
                )}
              </button>

              <p className="required-note">* Required fields</p>
            </form>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default HelpRequestPage;
