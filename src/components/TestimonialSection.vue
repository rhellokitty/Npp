<script setup>
defineProps({
  testimonials: {
    type: Array,
    required: true,
  },
})
</script>

<template>
  <section class="testimonial-section" id="review">
    <div class="container testimonial-inner">
      <div class="testimonial-header">
        <h2 class="section-heading">What Our Customer<br />Say About Us</h2>
        <button class="btn-pill-dark">
          <span>View All</span>
          <span class="btn-pill-icon">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <path d="M7 17 17 7" />
              <path d="M7 7h10v10" />
            </svg>
          </span>
        </button>
      </div>

      <div class="testimonial-grid">
        <article v-for="item in testimonials" :key="item.id" class="testimonial-card">
          <div class="testimonial-avatar-cutout">
            <!-- Inverted Corner Connector: Top-Left of Cutout -->
            <svg
              class="cutout-alt-svg cutout-alt-tl"
              viewBox="0 -2 26 26"
              fill="currentColor"
              shape-rendering="geometricPrecision"
            >
              <path d="M26 -2 L0 -2 L0 0 A24 24 0 0 1 24 24 L26 24 Z" />
            </svg>
            <!-- Inverted Corner Connector: Bottom-Right of Cutout -->
            <svg
              class="cutout-alt-svg cutout-alt-br"
              viewBox="0 -2 26 26"
              fill="currentColor"
              shape-rendering="geometricPrecision"
            >
              <path d="M26 -2 L0 -2 L0 0 A24 24 0 0 1 24 24 L26 24 Z" />
            </svg>
            <img :src="item.avatar" :alt="item.name" />
          </div>
          <svg class="quote-icon" width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
            <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
          </svg>
          <p class="testimonial-text">{{ item.quote }}</p>
          <div class="testimonial-author">
            <span class="author-name">{{ item.name }}</span>
            <span class="author-role">{{ item.role }}</span>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>
