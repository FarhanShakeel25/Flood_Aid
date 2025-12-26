import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/donations.css';

// Initialize Stripe with public key
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const Donations = () => {
<<<<<<< HEAD
  const [donationType, setDonationType] = useState('money');
=======
  // Updated to use "Cash" and "OtherSupplies" as per requirements
  const [donationType, setDonationType] = useState('Cash');
>>>>>>> 8868d361101f8fe0eff829379a090558c56d7d03
  const [donationData, setDonationData] = useState({
    // Common fields
    donorName: '',
    email: '',
    contact: '',
<<<<<<< HEAD
    donorAccountNumber: '',
    
    // Money donation fields
    amount: '',
    isRecurring: false,
    
    // Goods donation fields
    itemName: '',
    quantity: 1,
    itemCondition: 'new',
=======
    
    // Cash donation fields
    amount: '',
    
    // OtherSupplies donation fields
    supplyDetails: '', // Replaces itemName
    quantity: 1,
>>>>>>> 8868d361101f8fe0eff829379a090558c56d7d03
    description: ''
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const validateForm = () => {
    const newErrors = {};
    
<<<<<<< HEAD
    // Common validations
    if (!donationData.donorAccountNumber.trim()) {
      newErrors.donorAccountNumber = 'Account number is required';
    }
    
    if (!donationData.email.trim()) {
      newErrors.email = 'Email is required for receipt';
=======
    // Email validation - required for all donation types
    if (!donationData.email.trim()) {
      newErrors.email = 'Email is required';
>>>>>>> 8868d361101f8fe0eff829379a090558c56d7d03
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(donationData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
<<<<<<< HEAD
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
=======
    // Mobile number validation - required for all donation types
    if (!donationData.contact.trim()) {
      newErrors.contact = 'Mobile number is required';
    } else if (!/^[+]?[0-9\s\-\(\)]{10,}$/.test(donationData.contact)) {
      newErrors.contact = 'Please enter a valid mobile number';
    }
    
    // Cash donation validations
    if (donationType === 'Cash') {
      if (!donationData.amount || donationData.amount <= 0) {
        newErrors.amount = 'Please enter a valid donation amount (must be > 0)';
      }
      // Removed max amount validation as per instruction #4
    }
    
    // OtherSupplies donation validations
    if (donationType === 'OtherSupplies') {
      if (!donationData.supplyDetails.trim()) {
        newErrors.supplyDetails = 'Supply details are required';
      }
      if (!donationData.quantity || donationData.quantity <= 0) {
        newErrors.quantity = 'Please enter valid quantity (must be > 0)';
>>>>>>> 8868d361101f8fe0eff829379a090558c56d7d03
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
<<<<<<< HEAD
=======
    // Clear specific fields when switching donation types
    if (type === 'OtherSupplies') {
      setDonationData(prev => ({
        ...prev,
        amount: ''
      }));
    } else if (type === 'Cash') {
      setDonationData(prev => ({
        ...prev,
        supplyDetails: '',
        quantity: 1,
        description: ''
      }));
    }
>>>>>>> 8868d361101f8fe0eff829379a090558c56d7d03
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
<<<<<<< HEAD
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
=======
      // Prepare payload according to backend DTO structure (Instruction #3)
      const payload = {
        donationType: donationType === 'Cash' ? 'Cash' : 'OtherSupplies', // Use string values as per enum
        donorName: donationData.donorName || null,
        email: donationData.email,
        contact: donationData.contact,
        
        // Conditional fields based on donation type (Instruction #1)
        ...(donationType === 'Cash' && {
          amount: parseFloat(donationData.amount)
          // Note: AccountNumber is generated by backend, not sent from frontend
          // Note: No more donorAccountNumber field
        }),
        
        ...(donationType === 'OtherSupplies' && {
          quantity: parseInt(donationData.quantity),
          supplyDetails: donationData.supplyDetails,
          description: donationData.description || null
          // Note: No more itemCondition field
        })
      };

      if (donationType === 'Cash') {
        // For Cash donations: call Stripe session creation endpoint (Instruction #4)
        const apiUrl = `${import.meta.env.VITE_API_BASE}/api/donation/create-session`;
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: donationData.donorName,
            email: donationData.email,
            amount: parseFloat(donationData.amount)
          })
        });

        const result = await response.json();

        if (response.ok) {
          if (result.url) {
            // Redirect to Stripe Checkout using the session URL
            window.location.assign(result.url);
          } else {
            throw new Error('No Stripe session URL received');
          }
        } else {
          setSubmitStatus({
            success: false,
            message: result.message || 'Submission failed. Please try again.'
          });
        }
      } else {
        // For OtherSupplies donations
        const apiUrl = `${import.meta.env.VITE_API_BASE}/api/donation/create-supplies`;
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: donationData.donorName,
            email: donationData.email,
            description: donationData.supplyDetails
          })
        });

        const result = await response.json();

        if (response.ok) {
          // Show confirmation after successful POST for OtherSupplies (Instruction #5)
          setSubmitStatus({
            success: true,
            message: 'Thank you for your donation! You will receive a confirmation email shortly.',
            receiptId: result.receiptId || result.id
          });
          
          // Reset form
          setDonationData({
            donorName: '',
            email: '',
            contact: '',
            amount: '',
            supplyDetails: '',
            quantity: 1,
            description: ''
          });
        } else {
          setSubmitStatus({
            success: false,
            message: result.message || 'Submission failed. Please try again.'
          });
        }
>>>>>>> 8868d361101f8fe0eff829379a090558c56d7d03
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
<<<<<<< HEAD
              <span className="stat-number">₹500</span>
              <span className="stat-label">Feeds a family for 3 days</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">₹1000</span>
              <span className="stat-label">Provides emergency medical kit</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">₹5000</span>
=======
              <span className="stat-number">RS 500</span>
              <span className="stat-label">Feeds a family for 3 days</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">RS 1000</span>
              <span className="stat-label">Provides emergency medical kit</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">RS 5000</span>
>>>>>>> 8868d361101f8fe0eff829379a090558c56d7d03
              <span className="stat-label">Supports temporary shelter</span>
            </div>
          </div>
        </div>

        <div className="donation-form-wrapper">
<<<<<<< HEAD
          {submitStatus && (
            <div className={`status-message ${submitStatus.success ? 'success' : 'error'}`}>
=======
          {submitStatus && submitStatus.success && donationType === 'OtherSupplies' && (
            <div className={`status-message ${submitStatus.success ? 'success' : 'error'}`}>
              <div className="confirmation-message">
                <h3>🎉 Thank You for Your Donation!</h3>
                <p>{submitStatus.message}</p>
                {submitStatus.receiptId && (
                  <p className="receipt-id">Receipt ID: <strong>{submitStatus.receiptId}</strong></p>
                )}
                <p>Our team will contact you within 24 hours for collection details.</p>
              </div>
            </div>
          )}

          {submitStatus && !submitStatus.success && (
            <div className="status-message error">
>>>>>>> 8868d361101f8fe0eff829379a090558c56d7d03
              {submitStatus.message}
            </div>
          )}

          <div className="donation-type-selector">
            <button
<<<<<<< HEAD
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
=======
              className={`type-btn ${donationType === 'Cash' ? 'active' : ''}`}
              onClick={() => handleDonationTypeChange('Cash')}
              type="button"
            >
              💰 Cash Donation
            </button>
            <button
              className={`type-btn ${donationType === 'OtherSupplies' ? 'active' : ''}`}
              onClick={() => handleDonationTypeChange('OtherSupplies')}
              type="button"
            >
              📦 Other Supplies Donation
>>>>>>> 8868d361101f8fe0eff829379a090558c56d7d03
            </button>
          </div>

          <form onSubmit={handleSubmit} className="donation-form">
            <div className="form-section">
              <h3>Donation Details</h3>
              
<<<<<<< HEAD
              {donationType === 'money' ? (
=======
              {/* Show only relevant fields based on donation type (Instruction #1) */}
              {donationType === 'Cash' ? (
>>>>>>> 8868d361101f8fe0eff829379a090558c56d7d03
                <div className="money-donation">
                  <div className="quick-amounts">
                    {quickAmounts.map(amount => (
                      <button
                        key={amount}
                        type="button"
                        className={`amount-btn ${donationData.amount == amount ? 'selected' : ''}`}
                        onClick={() => setDonationData(prev => ({ ...prev, amount }))}
                      >
<<<<<<< HEAD
                        ₹{amount.toLocaleString('en-IN')}
=======
                        RS {amount.toLocaleString('en-IN')}
>>>>>>> 8868d361101f8fe0eff829379a090558c56d7d03
                      </button>
                    ))}
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="amount">
<<<<<<< HEAD
                      Custom Amount (₹) <span className="required">*</span>
=======
                      Donation Amount (RS) <span className="required">*</span>
>>>>>>> 8868d361101f8fe0eff829379a090558c56d7d03
                    </label>
                    <input
                      type="number"
                      id="amount"
                      name="amount"
                      value={donationData.amount}
                      onChange={handleInputChange}
                      placeholder="Enter amount in rupees"
<<<<<<< HEAD
                      min="10"
                      max="1000000"
=======
                      min="1"
                      step="0.01"
>>>>>>> 8868d361101f8fe0eff829379a090558c56d7d03
                      className={errors.amount ? 'error' : ''}
                      disabled={isSubmitting}
                    />
                    {errors.amount && <div className="error-message">{errors.amount}</div>}
<<<<<<< HEAD
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
=======
                    <p className="field-note">Enter amount greater than 0</p>
>>>>>>> 8868d361101f8fe0eff829379a090558c56d7d03
                  </div>
                </div>
              ) : (
                <div className="goods-donation">
                  <div className="form-group">
<<<<<<< HEAD
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
=======
                    <label htmlFor="supplyDetails">
                      Supply Details <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      id="supplyDetails"
                      name="supplyDetails"
                      value={donationData.supplyDetails}
                      onChange={handleInputChange}
                      placeholder="e.g., Rice, Blankets, Medicines, Water Bottles"
                      className={errors.supplyDetails ? 'error' : ''}
                      disabled={isSubmitting}
                    />
                    {errors.supplyDetails && <div className="error-message">{errors.supplyDetails}</div>}
>>>>>>> 8868d361101f8fe0eff829379a090558c56d7d03
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
<<<<<<< HEAD
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
=======
                      <p className="field-note">Enter quantity greater than 0</p>
>>>>>>> 8868d361101f8fe0eff829379a090558c56d7d03
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="description">Description (Optional)</label>
                    <textarea
                      id="description"
                      name="description"
                      value={donationData.description}
                      onChange={handleInputChange}
<<<<<<< HEAD
                      placeholder="Provide details about the items..."
=======
                      placeholder="Provide details about the supplies..."
>>>>>>> 8868d361101f8fe0eff829379a090558c56d7d03
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
<<<<<<< HEAD
                  <label htmlFor="contact">Contact Number (Optional)</label>
=======
                  <label htmlFor="contact">
                    Mobile Number <span className="required">*</span>
                  </label>
>>>>>>> 8868d361101f8fe0eff829379a090558c56d7d03
                  <input
                    type="tel"
                    id="contact"
                    name="contact"
                    value={donationData.contact}
                    onChange={handleInputChange}
                    placeholder="+91 98765 43210"
<<<<<<< HEAD
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
=======
                    className={errors.contact ? 'error' : ''}
                    disabled={isSubmitting}
                  />
                  {errors.contact && <div className="error-message">{errors.contact}</div>}
                </div>
                
                {/* Removed donorAccountNumber field as AccountNumber is generated by backend */}
>>>>>>> 8868d361101f8fe0eff829379a090558c56d7d03
              </div>
            </div>

            <div className="form-footer">
              <p className="disclaimer">
                By submitting this form, you agree that your donation will be used for flood relief efforts.
<<<<<<< HEAD
                All transactions are secure and processed through Stripe.
=======
                {donationType === 'Cash' && ' All transactions are secure and processed through Stripe.'}
                {donationType === 'OtherSupplies' && ' Our team will contact you within 24 hours for collection details.'}
>>>>>>> 8868d361101f8fe0eff829379a090558c56d7d03
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
<<<<<<< HEAD
                ) : donationType === 'money' ? (
=======
                ) : donationType === 'Cash' ? (
>>>>>>> 8868d361101f8fe0eff829379a090558c56d7d03
                  'Proceed to Payment'
                ) : (
                  'Submit Donation'
                )}
              </button>
            </div>
          </form>
          
          <div className="security-info">
<<<<<<< HEAD
            <h4>💳 Secure Payment</h4>
            <p>All monetary donations are processed securely through Stripe</p>
            
            <h4>📦 Goods Collection</h4>
            <p>Our team will contact you for goods pickup details</p>
            
            <h4>📄 Receipt</h4>
            <p>A donation receipt will be emailed to you immediately</p>
=======
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
>>>>>>> 8868d361101f8fe0eff829379a090558c56d7d03
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Donations;