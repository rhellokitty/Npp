<script setup>
defineProps({
  stats: {
    type: Array,
    required: true,
  },
})
</script>

<template>
  <section class="stats-section">
    <div class="container stats-grid">
      <div v-for="stat in stats" :key="stat.id" class="stats-item">
        <span class="stats-number">{{ stat.number }}</span>
        <p class="stats-desc">{{ stat.description }}</p>
      </div>
    </div>
  </section>
</template>
