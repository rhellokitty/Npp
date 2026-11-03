<script setup>
defineProps({
  collections: {
    type: Array,
    required: true,
  },
})
</script>

<template>
  <div class="container collection-wrapper">
    <section class="collection-section">
      <div class="collection-header">
        <h2 class="section-heading">
          Crafted New.<br />Designed for You
        </h2>
      </div>

      <div class="collection-bento-grid">
        <div
          v-for="col in collections"
          :key="col.id"
          class="collection-card"
        >
          <div class="collection-card-info">
            <span class="collection-tag">{{ col.tag }}</span>
            <h3 class="collection-title">{{ col.title }}</h3>
            <ul class="collection-list">
              <li v-for="item in col.items" :key="item">{{ item }}</li>
            </ul>
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
          <div class="collection-thumb">
            <img :src="col.image" :alt="col.alt" class="collection-thumb-img" />
          </div>
        </div>

        <div class="collection-promo-card bg-carbon">
          <span class="collection-promo-badge">Get Discount</span>
          <h3 class="collection-promo-title">30% Offer</h3>
        </div>
      </div>
    </section>
  </div>
</template>
