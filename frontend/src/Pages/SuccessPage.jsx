import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/donations.css';

const SuccessPage = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [loading, setLoading] = useState(true);
  const [donationDetails, setDonationDetails] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSession = async () => {
      if (!sessionId) {
        setError('Missing checkout session.');
        setLoading(false);
        return;
      }
      try {
        const apiUrl = `${import.meta.env.VITE_API_BASE}/api/donation/session/${sessionId}`;
        const res = await fetch(apiUrl);
        if (!res.ok) {
          throw new Error('Failed to retrieve session details');
        }
        const data = await res.json();
        const formattedAmount = `PKR ${Number(data.amount).toLocaleString('en-PK', { maximumFractionDigits: 0 })}`;
        setDonationDetails({
          amount: formattedAmount,
          date: new Date().toLocaleDateString(),
          receiptId: (data.id || sessionId).substring(0, 12)
        });
      } catch (e) {
        setError('Could not load donation details.');
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [sessionId]);

  return (
    <>
      <Header />
      <div style={{ minHeight: '70vh', padding: '40px 20px', textAlign: 'center' }}>
        <div style={{
          maxWidth: '600px',
          margin: '0 auto',
          padding: '40px',
          backgroundColor: '#f0f9ff',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ fontSize: '60px', marginBottom: '20px' }}>✅</div>
          <h1 style={{ color: '#065f46', marginBottom: '10px' }}>Thank You!</h1>
          <p style={{ fontSize: '18px', color: '#666', marginBottom: '30px' }}>
            Your donation has been received successfully.
          </p>

          {loading ? (
            <p>Loading details...</p>
          ) : error ? (
            <p style={{ color: 'red' }}>{error}</p>
          ) : (
            <div style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '8px',
              marginBottom: '30px',
              textAlign: 'left'
            }}>
              <h3>Donation Details</h3>
              <p><strong>Amount:</strong> {donationDetails.amount}</p>
              <p><strong>Date:</strong> {donationDetails.date}</p>
              <p><strong>Receipt ID:</strong> {donationDetails.receiptId}</p>
              <p style={{ marginTop: '15px', fontSize: '14px', color: '#666' }}>
                A confirmation email has been sent to your email address.
              </p>
            </div>
          )}

          <a 
            href="/"
            style={{
              display: 'inline-block',
              padding: '12px 30px',
              backgroundColor: '#065f46',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            Back to Home
          </a>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default SuccessPage;
