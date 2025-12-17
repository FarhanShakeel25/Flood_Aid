import React, { useState } from "react";
import "../styles/contact.css";

const ContactForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    mobile: "",
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const subjects = [
    { value: "", label: "Select a subject" },
    { value: "website_feedback", label: "Website Feedback" },
    { value: "flood_alert", label: "Flood Alert Report" },
    { value: "assistance", label: "Request Assistance" },
    { value: "general", label: "General Inquiry" },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    } else if (formData.name.length > 100) {
      newErrors.name = "Name must be less than 100 characters";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.subject) {
      newErrors.subject = "Please select a subject";
    }

    if (!formData.message.trim()) {
      newErrors.message = "Message is required";
    } else if (formData.message.length > 5000) {
      newErrors.message = "Message must be less than 5000 characters";
    }

    if (formData.mobile && formData.mobile.length > 20) {
      newErrors.mobile = "Mobile number is too long";
    }

    return newErrors;
  };

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
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        subject: formData.subject,
        message: formData.message.trim(),
        mobile: formData.mobile.trim() || null,
      };

      const response = await fetch("/api/submit-contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSubmitStatus({
          type: "success",
          message:
            data.message || "Your message has been submitted successfully.",
        });
        // Reset form
        setFormData({
          name: "",
          email: "",
          subject: "",
          message: "",
          mobile: "",
        });
        setErrors({});
      } else {
        // Handle validation errors from server
        if (data.errors) {
          setErrors(data.errors);
          setSubmitStatus({
            type: "error",
            message: "Please correct the errors below.",
          });
        } else {
          setSubmitStatus({
            type: "error",
            message: data.message || "Failed to submit. Please try again.",
          });
        }
      }
    } catch (error) {
      setSubmitStatus({
        type: "error",
        message: "Network error. Please check your connection and try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="contact-form-container">
      <div className="form-header">
        <div className="instructions">
          <p>
            <strong>Before submitting, please note:</strong>
          </p>
          <ul>
            <li>
              For emergency flood assistance, call the national helpline:{" "}
              <strong>1090</strong>
            </li>
            <li>Select the appropriate subject to ensure timely response</li>
            <li>Provide accurate contact information for follow-up</li>
            <li>
              For flood alerts, include specific location details in your
              message
            </li>
            <li>Response time: Within 24 hours for non-emergency queries</li>
          </ul>
        </div>
      </div>

      {submitStatus && (
        <div className={`status-message ${submitStatus.type}`}>
          {submitStatus.message}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="name">
              Full Name <span className="required">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              className={errors.name ? "error" : ""}
              disabled={isSubmitting}
            />
            {errors.name && <div className="error-message">{errors.name}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="email">
              Email Address <span className="required">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="example@gmail.com"
              className={errors.email ? "error" : ""}
              disabled={isSubmitting}
            />
            {errors.email && (
              <div className="error-message">{errors.email}</div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="mobile">Mobile Number (Optional)</label>
            <input
              type="tel"
              id="mobile"
              name="mobile"
              value={formData.mobile}
              onChange={handleChange}
              placeholder="+91 98765 43210"
              className={errors.mobile ? "error" : ""}
              disabled={isSubmitting}
            />
            {errors.mobile && (
              <div className="error-message">{errors.mobile}</div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="subject">
              Subject <span className="required">*</span>
            </label>
            <select
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              className={errors.subject ? "error" : ""}
              disabled={isSubmitting}
            >
              {subjects.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.subject && (
              <div className="error-message">{errors.subject}</div>
            )}
          </div>

          <div className="form-group full-width">
            <label htmlFor="message">
              Message <span className="required">*</span>
            </label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="Please provide detailed information..."
              rows="6"
              className={errors.message ? "error" : ""}
              disabled={isSubmitting}
            />
            <div className="char-counter">
              {formData.message.length}/5000 characters
            </div>
            {errors.message && (
              <div className="error-message">{errors.message}</div>
            )}
          </div>
        </div>

        <div className="form-footer">
          <p className="disclaimer">
            By submitting this form, you agree to our privacy policy. Your
            information will be used solely for flood management purposes.
          </p>

          <button type="submit" className="submit-btn" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <span className="spinner"></span>
                Sending...
              </>
            ) : (
              "Submit Message"
            )}
          </button>
        </div>
      </form>

      <div className="contact-info">
        <h3>Additional Contact Information</h3>
        <div className="info-grid">
          <div className="info-item">
            <h4>Emergency Helpline</h4>
            <p>1090 (24x7)</p>
          </div>
          <div className="info-item">
            <h4>Email</h4>
            <p>support@floodaid.gov.in</p>
          </div>
          <div className="info-item">
            <h4>Office Address</h4>
            <p>National Disaster Management Authority, New Delhi</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactForm;
