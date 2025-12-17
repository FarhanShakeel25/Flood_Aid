import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/donations.css';

// Initialize Stripe with public key
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const Donations = () => {
  const [donationType, setDonationType] = useState('money');
  const [donationData, setDonationData] = useState({
    // Common fields
    donorName: '',
    email: '',
    contact: '',
    donorAccountNumber: '',
    
    // Money donation fields
    amount: '',
    isRecurring: false,
    
    // Goods donation fields
    itemName: '',
    quantity: 1,
    itemCondition: 'new',
    description: ''
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const validateForm = () => {
    const newErrors = {};
    
    // Common validations
    if (!donationData.donorAccountNumber.trim()) {
      newErrors.donorAccountNumber = 'Account number is required';
    }
    
    if (!donationData.email.trim()) {
      newErrors.email = 'Email is required for receipt';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(donationData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    // Money donation validations
    if (donationType === 'money') {
      if (!donationData.amount || donationData.amount <= 0) {
        newErrors.amount = 'Please enter a valid donation amount';
      } else if (donationData.amount > 1000000) {
        newErrors.amount = 'Maximum donation amount is ₹10,00,000';
      }
    }
    
    // Goods donation validations
    if (donationType === 'goods') {
      if (!donationData.itemName.trim()) {
        newErrors.itemName = 'Item name is required';
      }
      if (!donationData.quantity || donationData.quantity <= 0) {
        newErrors.quantity = 'Please enter valid quantity';
      }
    }
    
    return newErrors;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setDonationData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleDonationTypeChange = (type) => {
    setDonationType(type);
    setErrors({});
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
      // Prepare payload according to C# class structure
      const payload = {
        donationType: donationType === 'money' ? 0 : 1, // 0: Money, 1: Goods (based on DonationType enum)
        donorAccountNumber: donationData.donorAccountNumber,
        donorName: donationData.donorName || null,
        email: donationData.email,
        contact: donationData.contact || null,
        
        // Conditional fields
        ...(donationType === 'money' && {
          donationAmount: parseFloat(donationData.amount),
          isRecurring: donationData.isRecurring
        }),
        
        ...(donationType === 'goods' && {
          quantity: parseInt(donationData.quantity),
          itemName: donationData.itemName,
          itemCondition: donationData.itemCondition,
          description: donationData.description || null
        })
      };

      // Call backend API
      const response = await fetch('/api/donation/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.ok) {
        if (donationType === 'money' && result.sessionId) {
          // Redirect to Stripe Checkout for money donations
          const stripe = await stripePromise;
          const { error } = await stripe.redirectToCheckout({
            sessionId: result.sessionId
          });
          
          if (error) {
            throw new Error(error.message);
          }
        } else {
          // For goods donations or if no Stripe redirect needed
          setSubmitStatus({
            success: true,
            message: 'Thank you for your donation! You will receive a confirmation email shortly.',
            receiptId: result.receiptId
          });
          
          // Reset form
          if (donationType === 'goods') {
            setDonationData({
              donorName: '',
              email: '',
              contact: '',
              donorAccountNumber: '',
              itemName: '',
              quantity: 1,
              itemCondition: 'new',
              description: ''
            });
          }
        }
      } else {
        setSubmitStatus({
          success: false,
          message: result.message || 'Submission failed. Please try again.'
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
          {submitStatus && (
            <div className={`status-message ${submitStatus.success ? 'success' : 'error'}`}>
              {submitStatus.message}
            </div>
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
              
              {donationType === 'money' ? (
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
                  <label htmlFor="donorAccountNumber">
                    Account Number <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="donorAccountNumber"
                    name="donorAccountNumber"
                    value={donationData.donorAccountNumber}
                    onChange={handleInputChange}
                    placeholder="Enter your account number"
                    className={errors.donorAccountNumber ? 'error' : ''}
                    disabled={isSubmitting}
                  />
                  {errors.donorAccountNumber && (
                    <div className="error-message">{errors.donorAccountNumber}</div>
                  )}
                </div>
              </div>
            </div>

            <div className="form-footer">
              <p className="disclaimer">
                By submitting this form, you agree that your donation will be used for flood relief efforts.
                All transactions are secure and processed through Stripe.
              </p>
              
              <button
                type="submit"
                className="submit-btn"
                disabled={isSubmitting}
              >
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
            <h4>💳 Secure Payment</h4>
            <p>All monetary donations are processed securely through Stripe</p>
            
            <h4>📦 Goods Collection</h4>
            <p>Our team will contact you for goods pickup details</p>
            
            <h4>📄 Receipt</h4>
            <p>A donation receipt will be emailed to you immediately</p>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Donations;