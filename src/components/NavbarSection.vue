<script setup>
defineProps({
  links: {
    type: Array,
    required: true,
  },
})

const emit = defineEmits(['navigate-home'])
</script>

<template>
  <div class="container navbar-wrapper">
    <header class="navbar-header">
      <a href="#home" @click="emit('navigate-home')" class="navbar-brand">
        ModNest
      </a>
      <nav class="navbar-nav">
        <a
          v-for="link in links"
          :key="link.label"
          :href="link.href"
          @click="emit('navigate-home')"
          :class="['navbar-link', link.active ? 'navbar-link-active' : '']"
        >
          {{ link.label }}
        </a>
      </nav>
      <div class="navbar-actions">
        <button class="navbar-icon-btn" aria-label="Search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </button>
        <button class="navbar-icon-btn" aria-label="Cart">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
            <path d="M3 6h18" />
            <path d="M16 10a4 4 0 0 1-8 0" />
          </svg>
        </button>
        <button class="navbar-icon-btn" aria-label="Account">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </button>
      </div>
    </header>
  </div>
</template>
