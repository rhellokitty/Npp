<script setup>
import { ref } from 'vue'

defineProps({
  categories: {
    type: Array,
    required: true,
  },
  products: {
    type: Array,
    required: true,
  },
})

const emit = defineEmits(['select-product'])

const activeCategory = ref('Living room')
const wishlistedIds = ref([])

function toggleWishlist(id) {
  if (wishlistedIds.value.includes(id)) {
    wishlistedIds.value = wishlistedIds.value.filter((item) => item !== id)
  } else {
    wishlistedIds.value.push(id)
  }
}
</script>

<template>
  <section class="catalog-section">
    <div class="container catalog-inner">
      <div class="catalog-header">
        <div>
          <h2 class="section-heading">
            Discover what<br />everyone's loving right<br />now
          </h2>
        </div>
        <button class="btn-pill-dark">
          <span>View More</span>
          <span class="btn-pill-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <path d="M7 17 17 7" />
              <path d="M7 7h10v10" />
            </svg>
          </span>
        </button>
      </div>

      <div class="catalog-tabs">
        <button
          v-for="category in categories"
          :key="category"
          type="button"
          @click="activeCategory = category"
          :class="['catalog-tab-btn', activeCategory === category ? 'catalog-tab-active' : '']"
        >
          {{ category }}
        </button>
      </div>

      <div class="catalog-grid">
        <article
          v-for="product in products"
          :key="product.id"
          @click="emit('select-product', product)"
          class="catalog-card"
        >
          <span class="catalog-badge">{{ product.discount }}</span>
          <button
            type="button"
            @click.stop="toggleWishlist(product.id)"
            class="catalog-wishlist-btn"
            aria-label="Wishlist"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              :fill="wishlistedIds.includes(product.id) ? 'currentColor' : 'none'"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
            </svg>
          </button>
          <img
            :src="product.image"
            :alt="product.name"
            class="catalog-card-img"
          />
          <div class="catalog-card-overlay">
            <div>
              <h4 class="catalog-card-title">{{ product.name }}</h4>
              <span class="catalog-card-price">{{ product.price }}</span>
            </div>
            <button
              type="button"
              @click.stop="emit('select-product', product)"
              class="catalog-card-action"
              :aria-label="'View ' + product.name + ' details'"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M7 17 17 7" />
                <path d="M7 7h10v10" />
              </svg>
            </button>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>
