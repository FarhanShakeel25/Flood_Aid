// pages/Contact.jsx
import ContactForm from "../components/contact";

const Contact = () => {
  return (
    <div className="contact-page-container">
      <div className="contact-hero">
        <h1>Emergency Contact & Support</h1>
        <p>Get immediate assistance or report flood situations</p>
      </div>
      <ContactForm />
    </div>
  );
};

export default Contact;