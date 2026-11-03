<script setup>
import { ref } from 'vue'

const email = ref('')
const subscribed = ref(false)

function handleSubscribe() {
  if (email.value.trim()) {
    subscribed.value = true
    email.value = ''
  }
}
</script>

<template>
  <section class="newsletter-section">
    <div class="newsletter-inner">
      <svg
        class="newsletter-icon-side"
        width="84"
        height="84"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
      >
        <path d="M20 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v3" />
        <path d="M2 11v5a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v2H6v-2a2 2 0 0 0-4 0Z" />
        <path d="M4 18v2" />
        <path d="M20 18v2" />
      </svg>

      <div class="newsletter-content">
        <h2 class="newsletter-title">
          Subscribe to our newsletter and<br />
          grab <strong class="newsletter-highlight">30% off</strong>
        </h2>
        <form class="newsletter-form" @submit.prevent="handleSubscribe">
          <input
            v-model="email"
            type="email"
            class="newsletter-input"
            placeholder="Email Address"
          />
          <button type="submit" class="newsletter-submit-btn">
            {{ subscribed ? 'Subscribed!' : 'Subscribe' }}
          </button>
        </form>
      </div>

      <svg
        class="newsletter-icon-side"
        width="84"
        height="84"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
      >
        <path d="M3 7h18" />
        <path d="M5 7v12" />
        <path d="M19 7v12" />
        <path d="M9 7v6a3 3 0 0 0 6 0V7" />
      </svg>
    </div>
  </section>
</template>
