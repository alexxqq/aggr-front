<template>
  <div :class="['bg-white rounded-xl border border-gray-200 shadow-sm', padding ? 'p-6' : '', $attrs.class]">
    <div v-if="title || $slots.header" class="flex items-center justify-between mb-4">
      <div>
        <h3 v-if="title" class="text-base font-semibold text-gray-900">{{ title }}</h3>
        <p v-if="subtitle" class="text-sm text-gray-500 mt-0.5">{{ subtitle }}</p>
      </div>
      <slot name="header" />
    </div>
    <slot />
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  title?: string
  subtitle?: string
  padding?: boolean
}>(), {
  padding: true,
})
</script>
