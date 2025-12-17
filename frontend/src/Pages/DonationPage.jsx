import Header from "../components/Header";
import Footer from "../components/Footer";
import Donations from "../components/donations";
import "./DonationPage.css";

const DonationPage = () => {
  return (
    <div className="donation-page-wrapper">
      <Header />
      <main className="donation-main">
        <Donations />
      </main>
      <Footer />
    </div>
  );
};

export default DonationPage;