<template>
  <div v-if="show" :class="classes.wrapper">
    <svg :class="classes.icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path v-if="variant === 'success'" stroke-linecap="round" stroke-linejoin="round"
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      <path v-else-if="variant === 'danger'" stroke-linecap="round" stroke-linejoin="round"
        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      <path v-else stroke-linecap="round" stroke-linejoin="round"
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    <div class="flex-1 text-sm">
      <p v-if="title" class="font-medium">{{ title }}</p>
      <p :class="title ? 'mt-0.5 opacity-90' : ''">
        <slot />
      </p>
    </div>
    <button v-if="dismissible" class="ml-2 opacity-60 hover:opacity-100 transition-opacity" @click="show = false">
      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
type Variant = 'info' | 'success' | 'warning' | 'danger'

const props = withDefaults(defineProps<{
  variant?: Variant
  title?: string
  dismissible?: boolean
}>(), {
  variant: 'info',
})

const show = ref(true)

const wrapperVariants: Record<Variant, string> = {
  info: 'bg-blue-50 text-blue-800 border-blue-200',
  success: 'bg-green-50 text-green-800 border-green-200',
  warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
  danger: 'bg-red-50 text-red-800 border-red-200',
}

const iconVariants: Record<Variant, string> = {
  info: 'text-blue-500',
  success: 'text-green-500',
  warning: 'text-yellow-500',
  danger: 'text-red-500',
}

const classes = computed(() => ({
  wrapper: `flex items-start gap-3 p-4 rounded-lg border ${wrapperVariants[props.variant]}`,
  icon: `w-5 h-5 shrink-0 mt-0.5 ${iconVariants[props.variant]}`,
}))
</script>
