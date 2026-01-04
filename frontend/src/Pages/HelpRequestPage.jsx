import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../styles/HelpRequest.css';

const HelpRequestPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    requestorName: '',
    requestorPhoneNumber: '',
    requestorEmail: '',
    requestType: 0, // 0=Medical, 1=Food, 2=Rescue (aligns with backend enum ordering)
    requestDescription: '',
    longitude: null,
    latitude: null,
  });

  const [selectedTags, setSelectedTags] = useState([]);

  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [locationStatus, setLocationStatus] = useState('📍 Click the locate button or click on the map to set your location');
  const [showMap] = useState(true); // always render map to avoid flicker/visibility issues
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  const locateMe = () => {
    if (!('geolocation' in navigator)) {
      setLocationStatus('⚠️ Geolocation not supported in this browser');
      return;
    }

    setLocationStatus('Getting your location...');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setFormData((prev) => ({
          ...prev,
          latitude,
          longitude,
        }));
        markerRef.current?.setLatLng([latitude, longitude]);
        mapInstanceRef.current?.setView([latitude, longitude], 14);
        setLocationStatus('✅ Centered on your location');
      },
      (err) => {
        console.error('Locate me error:', err);
        setLocationStatus('⚠️ Could not get your location');
      },
      {
        enableHighAccuracy: false,
        timeout: 8000,
        maximumAge: 0,
      }
    );
  };

  // Initialize map once on mount
  useEffect(() => {
    const container = mapRef.current;
    if (!container) return;

    // Avoid double-initialization (React StrictMode) and Leaflet container reuse errors
    if (mapInstanceRef.current) return;
    if (container._leaflet_id) {
      container.innerHTML = '';
    }

    const defaultLat = 30.3753;
    const defaultLng = 69.3451;

    const map = L.map(container, { zoomControl: true }).setView([defaultLat, defaultLng], 6);
    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    const marker = L.marker([defaultLat, defaultLng]).addTo(map);
    markerRef.current = marker;

    // Add a locate control inside the map (top-left)
    const locateControl = L.control({ position: 'topleft' });
    locateControl.onAdd = () => {
      const btn = L.DomUtil.create('button', 'locate-control');
      btn.type = 'button';
      btn.title = 'Locate me';
      btn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2" fill="none"/>
          <path d="M12 2v4M12 18v4M2 12h4M18 12h4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      `;
      btn.style.width = '34px';
      btn.style.height = '34px';
      btn.style.border = 'none';
      btn.style.borderRadius = '2px';
      btn.style.background = 'white';
      btn.style.color = '#666';
      btn.style.cursor = 'pointer';
      btn.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
      btn.style.display = 'flex';
      btn.style.alignItems = 'center';
      btn.style.justifyContent = 'center';
      btn.style.padding = '0';
      btn.style.transition = 'all 0.2s ease';

      L.DomEvent.on(btn, 'click', (e) => {
        L.DomEvent.stopPropagation(e);
        locateMe();
      });

      return btn;
    };
    locateControl.addTo(map);

    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      setFormData((prev) => ({
        ...prev,
        latitude: lat,
        longitude: lng,
      }));
      marker.setLatLng([lat, lng]);
      setLocationStatus('✅ Location set from map');
    });

    setTimeout(() => map.invalidateSize(), 50);

    return () => {
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    };
  }, []);

  // Update marker when coordinates change
  useEffect(() => {
    if (!markerRef.current || formData.latitude === null || formData.longitude === null) return;
    markerRef.current.setLatLng([formData.latitude, formData.longitude]);
    mapInstanceRef.current?.setView([formData.latitude, formData.longitude], 14);
    setLocationStatus('✅ Location set');
  }, [formData.latitude, formData.longitude]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'requestType') {
      setSelectedTags([]);
    }
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear field-level error on change
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const toggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const newFieldErrors = {};

    const phone = formData.requestorPhoneNumber?.trim();
    const email = formData.requestorEmail?.trim();
    const description = formData.requestDescription?.trim();

    if (!phone) {
      newFieldErrors.requestorPhoneNumber = 'Phone number is required.';
    } else if (!/^[- +()0-9]{8,20}$/.test(phone)) {
      newFieldErrors.requestorPhoneNumber = 'Enter a valid phone number (digits, +, -, spaces, parentheses).';
    }

    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
      newFieldErrors.requestorEmail = 'Enter a valid email address.';
    }

    if (!description) {
      newFieldErrors.requestDescription = 'Please describe your request.';
    }

    if (formData.latitude === null || formData.longitude === null) {
      newFieldErrors.location = 'Location is required. Use the locate button or click the map.';
    }

    setFieldErrors(newFieldErrors);
    if (Object.keys(newFieldErrors).length > 0) {
      return;
    }

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
      setError('📍 Location is required. Please use the locate button on the map or click on the map to set your location.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('https://floodaid-api.onrender.com/api/helpRequest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestorName: formData.requestorName || 'Anonymous',
          requestorPhoneNumber: formData.requestorPhoneNumber,
          requestorEmail: formData.requestorEmail || null,
          requestType: parseInt(formData.requestType),
          requestDescription: buildDescriptionWithTags(formData.requestDescription, selectedTags),
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
      
      // Show success message a bit longer before redirecting
      setTimeout(() => {
        navigate('/');
      }, 5500);
    } catch (err) {
      setError(err.message || 'Error submitting request. Please try again.');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const requestTypeLabels = {
    0: 'Medical Assistance',
    1: 'Food & Supplies',
    2: 'Rescue & Evacuation',
  };

  const tagOptions = {
    0: ['First aid', 'Medication', 'Chronic condition', 'Injury', 'Illness'],
    1: ['Food', 'Water', 'Hygiene', 'Baby supplies', 'Blankets'],
    2: ['Evacuation needed', 'Stranded', 'Mobility issue', 'Shelter needed', 'Transport required'],
  };

  const buildDescriptionWithTags = (description, tags) => {
    if (!tags.length) return description;
    const tagsLine = `Tags: ${tags.join(', ')}`;
    return description ? `${description}\n\n${tagsLine}` : tagsLine;
  };

  return (
    <div className="help-request-page">
      <Header />
      
      <main className="help-request-container">
        <div className="help-request-content">
          {!success && (
            <div className="help-request-header">
              <h1>Request Emergency Relief</h1>
              <p>Fill out this form to submit a help request during this emergency</p>
            </div>
          )}

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
                  {fieldErrors.requestorPhoneNumber && (
                    <p style={{ color: '#b91c1c', fontSize: '0.85rem', marginTop: '0.35rem' }}>{fieldErrors.requestorPhoneNumber}</p>
                  )}
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
                  {fieldErrors.requestorEmail && (
                    <p style={{ color: '#b91c1c', fontSize: '0.85rem', marginTop: '0.35rem' }}>{fieldErrors.requestorEmail}</p>
                  )}
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
                        checked={parseInt(formData.requestType) === type}
                        onChange={handleChange}
                      />
                      <span className="request-type-text">
                        {type === 0 && '⚕️'}
                        {type === 1 && '🍽️'}
                        {type === 2 && '🆘'}
                        {requestTypeLabels[type]}
                      </span>
                    </label>
                  ))}
                </div>

                <div style={{ marginTop: '0.75rem' }}>
                  <p style={{ margin: '0 0 0.25rem 0', fontSize: '13px', color: '#475569' }}>Select specific needs (optional)</p>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {tagOptions[parseInt(formData.requestType)]?.map((tag) => (
                      <button
                        type="button"
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '999px',
                          border: selectedTags.includes(tag) ? '1px solid #2563eb' : '1px solid #cbd5e1',
                          background: selectedTags.includes(tag) ? '#eff6ff' : '#fff',
                          color: '#0f172a',
                          cursor: 'pointer',
                          fontSize: '13px'
                        }}
                      >
                        {selectedTags.includes(tag) ? '✓ ' : ''}{tag}
                      </button>
                    ))}
                  </div>
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
                    placeholder="Describe what you need and any details that help us respond quickly. Tags selected above will be added for clarity."
                    rows="5"
                    required
                  />
                  {fieldErrors.requestDescription && (
                    <p style={{ color: '#b91c1c', fontSize: '0.85rem', marginTop: '0.35rem' }}>{fieldErrors.requestDescription}</p>
                  )}
                </div>

                {/* Location Status */}
                <div className="location-info">
                  <svg className="location-icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                  <span>{locationStatus}</span>
                </div>

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
                {fieldErrors.location && (
                  <div style={{ marginTop: '8px', color: '#b91c1c', fontSize: '0.85rem' }}>
                    {fieldErrors.location}
                  </div>
                )}

                <div style={{
                  marginTop: '15px',
                  padding: '15px',
                  backgroundColor: '#e3f2fd',
                  borderRadius: '8px',
                  borderLeft: '4px solid #2196F3'
                }}>
                  <p style={{ marginTop: '0', fontSize: '14px', fontWeight: '500', color: '#1976d2', marginBottom: '12px' }}>
                    📍 Set Your Location
                  </p>
                  
                  <div ref={mapRef} className="location-map" />
                  
                  <p style={{ marginBottom: '0', fontSize: '12px', color: '#666', marginTop: '10px' }}>
                    Use the locate button (top-left of map) or click anywhere on the map
                  </p>
                </div>
              </fieldset>

              {/* Submit Button */}
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.5rem' }}>
                <button
                  type="submit"
                  className="submit-btn"
                  disabled={loading}
                  style={{ maxWidth: '400px' }}
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
              </div>

              <p className="required-note" style={{ textAlign: 'center' }}>* Required fields</p>
            </form>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default HelpRequestPage;
