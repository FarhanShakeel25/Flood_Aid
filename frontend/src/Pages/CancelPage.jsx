import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/donations.css';

const CancelPage = () => {
  return (
    <>
      <Header />
      <div style={{ minHeight: '70vh', padding: '40px 20px', textAlign: 'center' }}>
        <div style={{
          maxWidth: '600px',
          margin: '0 auto',
          padding: '40px',
          backgroundColor: '#fef2f2',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ fontSize: '60px', marginBottom: '20px' }}>❌</div>
          <h1 style={{ color: '#991b1b', marginBottom: '10px' }}>Payment Cancelled</h1>
          <p style={{ fontSize: '18px', color: '#666', marginBottom: '30px' }}>
            Your payment was cancelled. No charges have been made to your account.
          </p>

          <p style={{ color: '#666', marginBottom: '30px' }}>
            If you encountered any issues, please feel free to try again or contact us for support.
          </p>

          <a 
            href="/donate"
            style={{
              display: 'inline-block',
              padding: '12px 30px',
              backgroundColor: '#991b1b',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: 'bold',
              marginRight: '10px'
            }}
          >
            Try Again
          </a>
          <a 
            href="/"
            style={{
              display: 'inline-block',
              padding: '12px 30px',
              backgroundColor: '#666',
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

export default CancelPage;
