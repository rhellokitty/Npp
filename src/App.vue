<script setup>
import { ref, computed, watchEffect } from 'vue'
import NavbarSection from './components/NavbarSection.vue'
import HeroSection from './components/HeroSection.vue'
import StatsStrip from './components/StatsStrip.vue'
import AboutFeaturesSection from './components/AboutFeaturesSection.vue'
import ProductCatalogSection from './components/ProductCatalogSection.vue'
import CraftedCollectionSection from './components/CraftedCollectionSection.vue'
import TestimonialSection from './components/TestimonialSection.vue'
import NewsletterSection from './components/NewsletterSection.vue'
import FooterSection from './components/FooterSection.vue'
import ThemeSwitcher from './components/ThemeSwitcher.vue'
import ProductDetailView from './components/ProductDetailView.vue'

import {
  navLinks,
  heroAvatars,
  heroMiniHighlights,
  statsList,
  featuresList,
  catalogCategories,
  productsList,
  craftedCollections,
  testimonialsList,
  themeOptions,
} from './data/modnestData.js'

const currentTheme = ref('light')
const selectedProduct = ref(null)

const relatedProducts = computed(() => {
  if (!selectedProduct.value) return []
  return productsList.filter((p) => p.id !== selectedProduct.value.id).slice(0, 3)
})

function openProductDetail(product) {
  selectedProduct.value = product
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function closeProductDetail() {
  selectedProduct.value = null
}

watchEffect(() => {
  document.documentElement.setAttribute('data-theme', currentTheme.value)
})
</script>

<template>
  <div>
    <NavbarSection :links="navLinks" @navigate-home="closeProductDetail" />
    <ProductDetailView
      v-if="selectedProduct"
      :product="selectedProduct"
      :related-products="relatedProducts"
      @close="closeProductDetail"
      @select-product="openProductDetail"
    />
    <template v-else>
      <HeroSection :avatars="heroAvatars" :highlights="heroMiniHighlights" />
      <StatsStrip :stats="statsList" />
      <AboutFeaturesSection :features="featuresList" />
      <ProductCatalogSection
        :categories="catalogCategories"
        :products="productsList"
        @select-product="openProductDetail"
      />
      <CraftedCollectionSection :collections="craftedCollections" />
      <TestimonialSection :testimonials="testimonialsList" />
      <NewsletterSection />
    </template>
    <FooterSection />
    <ThemeSwitcher
      :themes="themeOptions"
      :active-theme="currentTheme"
      @select-theme="currentTheme = $event"
    />
  </div>
</template>
