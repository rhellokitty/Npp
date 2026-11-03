<script setup>
defineProps({
  themes: {
    type: Array,
    required: true,
  },
  activeTheme: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['select-theme'])
</script>

<template>
  <div class="theme-switcher">
    <span class="theme-switcher-label">Tema Warna:</span>
    <button
      v-for="theme in themes"
      :key="theme.id"
      type="button"
      @click="emit('select-theme', theme.id)"
      :class="[
        'theme-switcher-btn',
        activeTheme === theme.id ? 'theme-switcher-btn-active' : '',
      ]"
    >
      <span :class="['theme-dot', `theme-dot-${theme.id}`]"></span>
      <span>{{ theme.label }}</span>
    </button>
  </div>
</template>
