<script setup>
defineProps({
  features: {
    type: Array,
    required: true,
  },
})
</script>

<template>
  <div class="container about-wrapper">
    <section class="about-section" id="about">
      <div class="about-top-grid">
        <div class="about-content">
          <h2 class="section-heading">
            More than just furniture — create a home you love.
          </h2>
          <p class="about-desc">
            At ModNest, we believe your home should reflect your lifestyle, your taste, and your values. That's why we do more than sell beautiful furniture.
          </p>
          <button class="btn-pill-dark">
            <span>Read More</span>
            <span class="btn-pill-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <path d="M7 17 17 7" />
                <path d="M7 7h10v10" />
              </svg>
            </span>
          </button>
        </div>

        <div class="about-media">
          <div class="about-main-photo">
            <img
              src="https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80"
              alt="Harley-Davidson LiveWire"
              class="about-main-img"
            />
          </div>
          <div class="about-overlap-photo">
            <img
              src="https://images.unsplash.com/photo-1515777315835-281b94c9589f?auto=format&fit=crop&w=400&q=80"
              alt="Harley-Davidson Breakout"
              class="about-overlap-img"
            />
          </div>
        </div>
      </div>

      <div class="about-features-grid" id="services">
        <div v-for="feat in features" :key="feat.id" class="about-feature-card">
          <div class="about-feature-icon">
            <svg v-if="feat.id === 'shield'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <svg v-else-if="feat.id === 'leaf'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
              <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
            </svg>
            <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M20 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v3" />
              <path d="M2 11v5a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v2H6v-2a2 2 0 0 0-4 0Z" />
              <path d="M4 18v2" />
              <path d="M20 18v2" />
            </svg>
          </div>
          <h3 class="about-feature-title">{{ feat.title }}</h3>
          <p class="about-feature-desc">{{ feat.description }}</p>
        </div>
      </div>
    </section>
  </div>
</template>
