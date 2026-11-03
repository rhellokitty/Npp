<script setup>
defineProps({
  avatars: {
    type: Array,
    required: true,
  },
  highlights: {
    type: Array,
    required: true,
  },
})
</script>

<template>
  <div class="container hero-wrapper">
    <section class="hero-section" id="home">
      <!-- Decorative Moge Line-Art Background Pattern -->
      <img
        src="/assets/hero-moge-pattern.webp"
        alt=""
        aria-hidden="true"
        class="hero-bg-pattern"
      />
      <!--
      <span aria-hidden="true" class="hero-dot-gold"></span>
      -->

      <div class="hero-top-grid">
        <h1 class="hero-title">
          Modern <strong class="hero-title-strong">Furniture</strong><br />
          for Inspired Living
          <span class="hero-inline-pill bg-carbon">
            <img
              src="https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=300&q=80"
              alt="Ducati SuperSport"
              class="hero-inline-pill-img"
            />
          </span>
        </h1>
        <p class="hero-subtitle">
          Discover timeless designs and functional elegance that turn every room into a statement. At ModNest, we bring your dream space to life.
        </p>
      </div>

      <div class="hero-bento-grid">
        <!-- Main Left Card with Cutouts (Inverted Border Radius UI) -->
        <div class="hero-main-card">
          <!-- Top-Left Cutout -->
          <div class="hero-cutout-tl">
            <svg
              class="cutout-svg cutout-svg-tl-right"
              viewBox="-2 -2 26 26"
              fill="currentColor"
              shape-rendering="geometricPrecision"
            >
              <path d="M-2 -2 L24 -2 L24 0 A24 24 0 0 0 0 24 L-2 24 Z" />
            </svg>
            <svg
              class="cutout-svg cutout-svg-tl-bottom"
              viewBox="-2 -2 26 26"
              fill="currentColor"
              shape-rendering="geometricPrecision"
            >
              <path d="M-2 -2 L24 -2 L24 0 A24 24 0 0 0 0 24 L-2 24 Z" />
            </svg>

            <div class="hero-avatar-list">
              <span
                v-for="(user, index) in avatars"
                :key="user.id"
                :class="['hero-avatar-item', index > 0 ? 'hero-avatar-overlap' : '']"
              >
                <img :src="user.src" :alt="user.name" class="hero-avatar-img" />
              </span>
            </div>
            <div class="hero-rating-badge">
              <span class="hero-rating-title">300+ happy customers</span>
              <span class="hero-rating-sub">
                <svg class="hero-star-icon" width="12" height="12" viewBox="0 0 24 24">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                4.7 (232 reviews)
              </span>
            </div>
          </div>

          <img
            src="https://images.unsplash.com/photo-1547549082-6bc09f2049ae?auto=format&fit=crop&w=1000&q=80"
            alt="Yamaha YZF-R6"
            class="hero-main-img"
          />

          <!-- Bottom-Right Cutout -->
          <div class="hero-cutout-br">
            <svg
              class="cutout-svg cutout-svg-br-top"
              viewBox="0 0 26 26"
              fill="currentColor"
              shape-rendering="geometricPrecision"
            >
              <path d="M26 26 L0 26 L0 24 A24 24 0 0 0 24 0 L26 0 Z" />
            </svg>
            <svg
              class="cutout-svg cutout-svg-br-left"
              viewBox="0 0 26 26"
              fill="currentColor"
              shape-rendering="geometricPrecision"
            >
              <path d="M26 26 L0 26 L0 24 A24 24 0 0 0 24 0 L26 0 Z" />
            </svg>

            <button class="btn-pill-dark">
              <span>Shop Now</span>
              <span class="btn-pill-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                  <path d="M7 17 17 7" />
                  <path d="M7 7h10v10" />
                </svg>
              </span>
            </button>
          </div>
        </div>

        <!-- Right Side Column -->
        <div class="hero-side-col">
          <div class="hero-side-photo-card">
            <img
              src="https://images.unsplash.com/photo-1558980664-769d59546b3d?auto=format&fit=crop&w=700&q=80"
              alt="Harley-Davidson Fat Bob"
              class="hero-side-photo-img"
            />
          </div>

          <div class="hero-highlights-list">
            <div
              v-for="item in highlights"
              :key="item.id"
              class="hero-highlight-card"
            >
              <div class="hero-highlight-info">
                <span class="hero-highlight-title">{{ item.title }}</span>
                <div class="hero-highlight-meta">
                  <div class="hero-highlight-dots">
                    <span class="hero-dot-item hero-dot-1"></span>
                    <span class="hero-dot-item hero-dot-2"></span>
                    <span class="hero-dot-item hero-dot-3"></span>
                  </div>
                  <span>{{ item.meta }}</span>
                </div>
              </div>
              <button
                class="hero-highlight-btn"
                :aria-label="'Open ' + item.title"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M7 17 17 7" />
                  <path d="M7 7h10v10" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
