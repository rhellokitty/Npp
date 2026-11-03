<script setup>
import { ref, computed, watch } from 'vue'
import { marketingContacts } from '../data/modnestData.js'

const props = defineProps({
  product: {
    type: Object,
    required: true,
  },
  relatedProducts: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['close', 'select-product'])

const activeImage = ref(props.product.image)
const activeSpecTab = ref('engine')

watch(
  () => props.product,
  (newProduct) => {
    if (newProduct) {
      activeImage.value = newProduct.image
      activeSpecTab.value = 'engine'
    }
  },
  { immediate: true }
)

const totalModItemsCount = computed(() => {
  if (!props.product.modCategories) return 0
  return props.product.modCategories.reduce((sum, cat) => sum + cat.items.length, 0)
})

const specTabs = [
  { id: 'engine', label: 'Engine & Performance' },
  { id: 'chassis', label: 'Chassis & Brakes' },
  { id: 'dimensions', label: 'Dimensions & Weight' },
]

function buildWhatsAppLink(phoneUrl, productName) {
  const text = encodeURIComponent(`Halo Buya Garage, saya tertarik dengan unit ${productName} (${props.product.price}). Apakah unit masih tersedia?`)
  return `${phoneUrl}?text=${text}`
}
</script>

<template>
  <div class="detail-wrapper">
    <!-- Top Breadcrumb & Back Navigation -->
    <div class="container detail-topbar">
      <button type="button" @click="emit('close')" class="detail-back-btn">
        <span class="detail-back-icon">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </span>
        <span>Back to Showroom</span>
      </button>

      <div class="detail-breadcrumb">
        <button type="button" @click="emit('close')" class="detail-breadcrumb-link">Garage Catalog</button>
        <span>/</span>
        <span>For Sale (FS)</span>
        <span>/</span>
        <span class="detail-breadcrumb-current">{{ product.name }}</span>
      </div>
    </div>

    <!-- Main Bento Product Showcase -->
    <section class="container detail-section">
      <div class="detail-hero-grid">
        <!-- Left Column: Hero Image with Inverted Radius Cutouts + Gallery Thumbnails -->
        <div class="detail-gallery-col">
          <div class="detail-main-photo">
            <!-- Top-Left Inverted Cutout: Rarity & Rating -->
            <div class="detail-cutout-tl">
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

              <span class="detail-rarity-pill">{{ product.discount }}</span>
              <div class="detail-rating-pill">
                <svg class="hero-star-icon" width="12" height="12" viewBox="0 0 24 24">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                <span>{{ product.rating }}</span>
                <span>({{ product.reviewsCount }})</span>
              </div>
            </div>

            <img
              :src="activeImage"
              :alt="product.name"
              class="detail-main-img"
            />

            <!-- Bottom-Right Inverted Cutout: Status Pill -->
            <div class="detail-cutout-br">
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

              <div class="detail-status-pill">
                <span class="detail-status-dot"></span>
                <span>{{ product.badge }}</span>
              </div>
            </div>
          </div>

          <!-- Thumbnail Selector Strip -->
          <div v-if="product.gallery && product.gallery.length" class="detail-thumbs-grid">
            <button
              v-for="(imgUrl, idx) in product.gallery"
              :key="idx"
              type="button"
              @click="activeImage = imgUrl"
              :class="['detail-thumb-btn', activeImage === imgUrl ? 'detail-thumb-active' : '']"
            >
              <img :src="imgUrl" :alt="product.name + ' view ' + (idx + 1)" class="detail-thumb-img" />
            </button>
          </div>
        </div>

        <!-- Right Column: Showroom Summary, Price, Unit Condition & Direct Marketing Contacts -->
        <div class="detail-summary-card">
          <div class="detail-summary-header">
            <span class="detail-subtitle">{{ product.subtitle }}</span>
            <h1 class="detail-title">{{ product.name }}</h1>
          </div>

          <!-- Price Box -->
          <div class="detail-price-box">
            <div>
              <span class="detail-price-label">Offering Price</span>
              <span class="detail-price-value">{{ product.price }}</span>
            </div>
            <span class="detail-price-note">
              {{ product.priceNote || 'Negotiable' }}
            </span>
          </div>

          <!-- Unit Overview / Document Checklist (IG Style) -->
          <div v-if="product.unitOverview && product.unitOverview.length" class="detail-checklist-box">
            <span class="detail-checklist-heading">Unit & Document Status</span>
            <ul class="detail-checklist">
              <li
                v-for="point in product.unitOverview"
                :key="point"
                class="detail-checklist-item"
              >
                <span class="detail-check-icon">✓</span>
                <span>{{ point }}</span>
              </li>
            </ul>
          </div>

          <!-- 2x2 Key Metrics -->
          <div class="detail-metrics-grid">
            <div
              v-for="metric in product.keyMetrics"
              :key="metric.label"
              class="detail-metric-card"
            >
              <span class="detail-metric-label">{{ metric.label }}</span>
              <span class="detail-metric-value">{{ metric.value }}</span>
              <span class="detail-metric-sub">{{ metric.sub }}</span>
            </div>
          </div>

          <!-- Direct Marketing WhatsApp Contacts -->
          <div class="detail-contact-block">
            <span class="detail-contact-caption">
              Contact our marketing for more information & unit inspection:
            </span>
            <div class="detail-contact-grid">
              <a
                v-for="contact in marketingContacts"
                :key="contact.phone"
                :href="buildWhatsAppLink(contact.waUrl, product.name)"
                target="_blank"
                rel="noopener noreferrer"
                class="detail-wa-btn"
              >
                <div class="detail-wa-info">
                  <span class="detail-wa-label">{{ contact.label }}</span>
                  <span>{{ contact.phone }}</span>
                </div>
                <span class="btn-pill-icon">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                    <path d="M7 17 17 7" />
                    <path d="M7 7h10v10" />
                  </svg>
                </span>
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- Dedicated Showroom Description & Aftermarket Modification Specs (#specs) -->
      <div class="detail-mods-panel">
        <div class="detail-mods-header">
          <div class="detail-mods-topline">
            <span class="detail-mods-tag">
              #specs • Showroom Unit Description & Modification List
            </span>
            <span v-if="totalModItemsCount" class="detail-mods-count">
              {{ totalModItemsCount }}+ Premium Aftermarket Parts Installed
            </span>
          </div>
          <h2 class="detail-panel-heading">Full Modification & Part Breakdown</h2>
          <p class="detail-mods-desc">{{ product.description }}</p>
        </div>

        <!-- Categorized Modification Bento Grid -->
        <div
          v-if="product.modCategories && product.modCategories.length"
          class="detail-mods-grid"
        >
          <div
            v-for="modGroup in product.modCategories"
            :key="modGroup.title"
            class="detail-mod-card"
          >
            <div class="detail-mod-card-head">
              <h3 class="detail-mod-title">{{ modGroup.title }}</h3>
              <span class="detail-mod-badge">{{ modGroup.items.length }} items</span>
            </div>
            <ul class="detail-mod-list">
              <li
                v-for="part in modGroup.items"
                :key="part"
                class="detail-mod-item"
              >
                <span class="detail-mod-bullet"></span>
                <span>{{ part }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Factory Technical Specifications Section -->
      <div class="detail-specs-panel">
        <div class="detail-specs-header">
          <div>
            <span class="detail-mods-tag">Factory Data Sheet</span>
            <h2 class="detail-panel-heading">Base Technical Specifications</h2>
          </div>

          <div class="detail-spec-tabs">
            <button
              v-for="tab in specTabs"
              :key="tab.id"
              type="button"
              @click="activeSpecTab = tab.id"
              :class="['detail-spec-tab', activeSpecTab === tab.id ? 'detail-spec-tab-active' : '']"
            >
              {{ tab.label }}
            </button>
          </div>
        </div>

        <div class="detail-specs-grid">
          <div
            v-for="row in product.specs[activeSpecTab]"
            :key="row.label"
            class="detail-spec-row"
          >
            <span class="detail-spec-label">{{ row.label }}</span>
            <span class="detail-spec-val">{{ row.value }}</span>
          </div>
        </div>
      </div>

      <!-- Other Garage Units -->
      <div v-if="relatedProducts.length" class="detail-related-block">
        <div class="detail-related-header">
          <h3 class="detail-related-title">Explore Other Garage Units</h3>
          <button type="button" @click="emit('close')" class="detail-related-link">
            View All Catalog
          </button>
        </div>

        <div class="catalog-grid">
          <article
            v-for="item in relatedProducts"
            :key="item.id"
            @click="emit('select-product', item)"
            class="catalog-card"
          >
            <span class="catalog-badge">{{ item.discount }}</span>
            <img :src="item.image" :alt="item.name" class="catalog-card-img" />
            <div class="catalog-card-overlay">
              <div>
                <h4 class="catalog-card-title">{{ item.name }}</h4>
                <span class="catalog-card-price">{{ item.price }}</span>
              </div>
              <span class="catalog-card-action">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                  <path d="M7 17 17 7" />
                  <path d="M7 7h10v10" />
                </svg>
              </span>
            </div>
          </article>
        </div>
      </div>
    </section>
  </div>
</template>
