<script setup>
import { ref } from 'vue'

const footerEmail = ref('')
</script>

<template>
  <footer class="footer-section">
    <div class="container">
      <div class="footer-grid">
        <div class="footer-brand-col">
          <span class="footer-brand">ModNest</span>
          <p class="footer-desc">
            Enhancing natural beauty with artistry, passion, and precision.
          </p>
          <div class="footer-socials">
            <a href="#" class="footer-social-link" aria-label="Instagram">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
              </svg>
            </a>
            <a href="#" class="footer-social-link" aria-label="Facebook">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
              </svg>
            </a>
            <a href="#" class="footer-social-link" aria-label="X">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 4l11.733 16h4.267l-11.733 -16z" />
                <path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772" />
              </svg>
            </a>
            <a href="#" class="footer-social-link" aria-label="Website">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M2 12h20" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
            </a>
          </div>
        </div>

        <div class="footer-links-col">
          <span class="footer-col-heading">Quick Links</span>
          <div class="footer-links-list">
            <a href="#home" class="footer-link">Home</a>
            <a href="#about" class="footer-link">About us</a>
            <a href="#services" class="footer-link">Services</a>
            <a href="#review" class="footer-link">Portfolio</a>
            <a href="#review" class="footer-link">Blog</a>
          </div>
        </div>

        <div class="footer-links-col">
          <span class="footer-col-heading">Quick Links</span>
          <div class="footer-links-list">
            <a href="#home" class="footer-link">Home</a>
            <a href="#about" class="footer-link">About us</a>
            <a href="#services" class="footer-link">Services</a>
            <a href="#review" class="footer-link">Portfolio</a>
            <a href="#review" class="footer-link">Blog</a>
          </div>
        </div>

        <div class="footer-links-col">
          <span class="footer-col-heading">Newsletter</span>
          <p class="footer-desc">
            Enter your email address to receive news and updates.
          </p>
          <div class="footer-newsletter-box">
            <input
              v-model="footerEmail"
              type="email"
              placeholder="Email Address..."
              class="footer-newsletter-input"
            />
            <button type="button" class="footer-newsletter-btn">
              Submit
            </button>
          </div>
        </div>
      </div>

      <div class="footer-copyright">
        <span>© 2026 ModNest. All rights reserved.</span>
      </div>
    </div>
  </footer>
</template>
