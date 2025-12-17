import Header from "../components/Header";
import ContactForm from "../components/contact";
import Footer from "../components/Footer";

const Contact = () => {
  return (
    <div className="contact-page">
      <Header />
      <main className="contact-main">
        <ContactForm />
      </main>
      <Footer />
    </div>
  );
};

export default Contact;