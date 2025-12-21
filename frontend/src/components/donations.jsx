import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/donations.css';

// Initialize Stripe with public key
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || '');

// Safe response parser to avoid JSON parse errors and handle non-JSON/empty bodies
const safeParse = async (response) => {
  // 204 No Content → return null immediately
  if (response.status === 204) return null;

  const ct = response.headers.get('content-type') || '';
  try {
    if (ct.includes('application/json')) {
      return await response.json();
    }
    // Fallback: treat as text
    const text = await response.text();
    return text?.length ? text : null;
  } catch {
    // Any parsing failure → return null
    return null;
  }
};

const Donations = () => {
  const [donationType, setDonationType] = useState('Cash');
  const [donationData, setDonationData] = useState({
    donorName: '',
    email: '',
    contact: '',
    amount: '',
    supplyDetails: '',
    quantity: 1,
    description: '',
    accountNumber: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const validateForm = () => {
    const newErrors = {};

    // Email
    if (!donationData.email.trim()) {
      newErrors.email = 'Email is required for receipt';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(donationData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    // Mobile
    const phoneRegex = /^(?:\+?\d{1,3}[\s-]?)?(?:\(?\d{3,4}\)?[\s-]?)?\d{7,8}$/;

      if (!donationData.contact.trim()) {
          newErrors.contact = 'Mobile number is required';
      }
      else if (!phoneRegex.test(donationData.contact)) {
          newErrors.contact = 'Please enter a valid mobile number';
      }
    // Cash
    if (donationType === 'Cash') {
      const amt = Number(donationData.amount);
      if (!amt || amt <= 0) {
        newErrors.amount = 'Please enter a valid donation amount (must be > 0)';
      }
    }

    // OtherSupplies
    if (donationType === 'OtherSupplies') {
      if (!donationData.supplyDetails.trim()) {
        newErrors.supplyDetails = 'Supply details are required';
      }
      const qty = Number(donationData.quantity);
      if (!qty || qty <= 0) {
        newErrors.quantity = 'Please enter valid quantity (must be > 0)';
      }
    }

    // Account Number
    if (!donationData.accountNumber.trim()) {
      newErrors.accountNumber = 'Account number is required';
    } else if (!/^[\d\s-]{6,30}$/.test(donationData.accountNumber.trim())) {
      newErrors.accountNumber = 'Please enter a valid account number';
    }

    return newErrors;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setDonationData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleDonationTypeChange = (type) => {
    setDonationType(type);
    setErrors({});
    if (type === 'OtherSupplies') {
      setDonationData(prev => ({ ...prev, amount: '' }));
    } else if (type === 'Cash') {
      setDonationData(prev => ({ ...prev, supplyDetails: '', quantity: 1, description: '' }));
    }
  };

  const quickAmounts = [500, 1000, 2000, 5000, 10000];

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      // Build payload for unified backend endpoint /api/donations/create
      const payload = {
        donationType: donationType === 'Cash' ? 0 : 1, // matches DonationType enum: 0=Cash, 1=OtherSupplies
        donorName: donationData.donorName || null,
        email: donationData.email,
        contact: donationData.contact,
        donorAccountNumber: donationData.accountNumber.trim(),
        ...(donationType === 'Cash' && {
          donationAmount: parseFloat(donationData.amount),
          isRecurring: false
        }),
        ...(donationType === 'OtherSupplies' && {
          quantity: parseInt(donationData.quantity, 10),
          itemName: donationData.supplyDetails,
          itemCondition: 'good',
          description: donationData.description || null
        })
      };
      const rawBase = import.meta.env.VITE_API_BASE || '';
      const apiBase = rawBase.replace(/\/$/, '');
      if (!apiBase) {
        setSubmitStatus({
          success: false,
          message: 'API base URL is not configured. Please set VITE_API_BASE in your .env file.'
        });
        return;
      }

      const response = await fetch(`${apiBase}/api/donations/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await safeParse(response);
      const errorMessage = typeof result === 'string' ? result : result?.message;

      if (!response.ok) {
        setSubmitStatus({
          success: false,
          message: errorMessage || 'Submission failed. Please try again.'
        });
        return;
      }

      if (donationType === 'Cash') {
        // Accept both sessionId and url
        const sessionUrl =
          (typeof result === 'object' && result && (result.url || result.sessionUrl)) || null;

        if (!sessionUrl) {
          // Handle cases like 204 or non-JSON
          setSubmitStatus({
            success: false,
            message: 'No Stripe session URL received.'
          });
          return;
        }

        // Redirect to the Checkout Session URL
        window.location.href = sessionUrl;
      } else {
        // Supplies flow: show confirmation
        setSubmitStatus({
          success: true,
          message: 'Thank you for your donation! You will receive a confirmation email shortly.',
          receiptId: typeof result === 'object' ? (result.receiptId || result.id) : undefined
        });

        // Reset form
        setDonationData({
          donorName: '',
          email: '',
          contact: '',
          amount: '',
          supplyDetails: '',
          quantity: 1,
          description: '',
          accountNumber: ''
        });
      }
    } catch (error) {
      setSubmitStatus({
        success: false,
        message: error.message || 'An error occurred. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="donation-page">
      <Header />
      <main className="donation-container">
        <div className="donation-header">
          <h1>Support Flood Relief Efforts</h1>
          <p className="subtitle">Your contribution makes a direct impact on affected communities</p>

          <div className="impact-stats">
            <div className="stat-item">
              <span className="stat-number">₹500</span>
              <span className="stat-label">Feeds a family for 3 days</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">₹1000</span>
              <span className="stat-label">Provides emergency medical kit</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">₹5000</span>
              <span className="stat-label">Supports temporary shelter</span>
            </div>
          </div>
        </div>

        <div className="donation-form-wrapper">
          {submitStatus && submitStatus.success && donationType === 'OtherSupplies' && (
            <div className="status-message success">
              <div className="confirmation-message">
                <h3>🎉 Thank You for Your Donation!</h3>
                <p>{submitStatus.message}</p>
                {submitStatus.receiptId && (
                  <p className="receipt-id">
                    Receipt ID: <strong>{submitStatus.receiptId}</strong>
                  </p>
                )}
                <p>Our team will contact you within 24 hours for collection details.</p>
              </div>
            </div>
          )}

          {submitStatus && !submitStatus.success && (
            <div className="status-message error">{submitStatus.message}</div>
          )}

          <div className="donation-type-selector">
            <button
              className={`type-btn ${donationType === 'money' ? 'active' : ''}`}
              onClick={() => handleDonationTypeChange('money')}
            >
              💰 Monetary Donation
            </button>
            <button
              className={`type-btn ${donationType === 'goods' ? 'active' : ''}`}
              onClick={() => handleDonationTypeChange('goods')}
            >
              📦 Goods Donation
            </button>
          </div>

          <form onSubmit={handleSubmit} className="donation-form">
            <div className="form-section">
              <h3>Donation Details</h3>

              {donationType === 'Cash' ? (
                <div className="money-donation">
                  <div className="quick-amounts">
                    {quickAmounts.map(amount => (
                      <button
                        key={amount}
                        type="button"
                        className={`amount-btn ${donationData.amount == amount ? 'selected' : ''}`}
                        onClick={() => setDonationData(prev => ({ ...prev, amount }))}
                      >
                        ₹{amount.toLocaleString('en-IN')}
                      </button>
                    ))}
                  </div>

                  <div className="form-group">
                    <label htmlFor="amount">
                      Custom Amount (₹) <span className="required">*</span>
                    </label>
                    <input
                      type="number"
                      id="amount"
                      name="amount"
                      value={donationData.amount}
                      onChange={handleInputChange}
                      placeholder="Enter amount in rupees"
                      min="10"
                      max="1000000"
                      className={errors.amount ? 'error' : ''}
                      disabled={isSubmitting}
                    />
                    {errors.amount && <div className="error-message">{errors.amount}</div>}
                  </div>
                  
                  <div className="form-group checkbox-group">
                    <input
                      type="checkbox"
                      id="isRecurring"
                      name="isRecurring"
                      checked={donationData.isRecurring}
                      onChange={handleInputChange}
                      disabled={isSubmitting}
                    />
                    <label htmlFor="isRecurring">
                      Make this a monthly recurring donation
                    </label>
                  </div>
                </div>
              ) : (
                <div className="goods-donation">
                  <div className="form-group">
                    <label htmlFor="itemName">
                      Item Name <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      id="itemName"
                      name="itemName"
                      value={donationData.itemName}
                      onChange={handleInputChange}
                      placeholder="e.g., Rice, Blankets, Medicines"
                      className={errors.itemName ? 'error' : ''}
                      disabled={isSubmitting}
                    />
                    {errors.itemName && <div className="error-message">{errors.itemName}</div>}
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="quantity">
                        Quantity <span className="required">*</span>
                      </label>
                      <input
                        type="number"
                        id="quantity"
                        name="quantity"
                        value={donationData.quantity}
                        onChange={handleInputChange}
                        min="1"
                        max="1000"
                        className={errors.quantity ? 'error' : ''}
                        disabled={isSubmitting}
                      />
                      {errors.quantity && <div className="error-message">{errors.quantity}</div>}
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="itemCondition">Condition</label>
                      <select
                        id="itemCondition"
                        name="itemCondition"
                        value={donationData.itemCondition}
                        onChange={handleInputChange}
                        disabled={isSubmitting}
                      >
                        <option value="new">New</option>
                        <option value="like-new">Like New</option>
                        <option value="good">Good</option>
                        <option value="usable">Usable</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="description">Description (Optional)</label>
                    <textarea
                      id="description"
                      name="description"
                      value={donationData.description}
                      onChange={handleInputChange}
                      placeholder="Provide details about the items..."
                      rows="3"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="form-section">
              <h3>Your Information</h3>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="donorName">Full Name (Optional)</label>
                  <input
                    type="text"
                    id="donorName"
                    name="donorName"
                    value={donationData.donorName}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">
                    Email Address <span className="required">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={donationData.email}
                    onChange={handleInputChange}
                    placeholder="you@example.com"
                    className={errors.email ? 'error' : ''}
                    disabled={isSubmitting}
                  />
                  {errors.email && <div className="error-message">{errors.email}</div>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="contact">Contact Number (Optional)</label>
                  <input
                    type="tel"
                    id="contact"
                    name="contact"
                    value={donationData.contact}
                    onChange={handleInputChange}
                    placeholder="+91 98765 43210"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="accountNumber">
                    Account Number <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="accountNumber"
                    name="accountNumber"
                    value={donationData.accountNumber}
                    onChange={handleInputChange}
                    placeholder="Enter your account number"
                    className={errors.accountNumber ? 'error' : ''}
                    disabled={isSubmitting}
                  />
                  {errors.accountNumber && <div className="error-message">{errors.accountNumber}</div>}
                </div>
              </div>
            </div>

            <div className="form-footer">
              <p className="disclaimer">
                By submitting this form, you agree that your donation will be used for flood relief efforts.
                All transactions are secure and processed through Stripe.
              </p>

              <button type="submit" className="submit-btn" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <span className="spinner"></span>
                    Processing...
                  </>
                ) : donationType === 'money' ? (
                  'Proceed to Payment'
                ) : (
                  'Submit Donation'
                )}
              </button>
            </div>
          </form>

          <div className="security-info">
            {donationType === 'Cash' ? (
              <>
                <h4>💳 Secure Payment</h4>
                <p>All cash donations are processed securely through Stripe</p>

                <h4>📄 Tax Benefits</h4>
                <p>All donations are eligible for tax deductions under Section 80G</p>

                <h4>🔒 Data Protection</h4>
                <p>Your payment information is encrypted and secure</p>
              </>
            ) : (
              <>
                <h4>📦 Supplies Collection</h4>
                <p>Our team will contact you within 24 hours for pickup details</p>

                <h4>✅ Accepted Supplies</h4>
                <p>Food, clothing, medicines, blankets, water, and other essentials</p>

                <h4>📍 Drop-off Points</h4>
                <p>Multiple collection centers available across the city</p>
              </>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Donations;