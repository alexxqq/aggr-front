<template>
  <UiBadge :variant="variant">{{ label }}</UiBadge>
</template>

<script setup lang="ts">
import type { PaymentIntentStatus } from '~/types'

const props = defineProps<{ status: string }>()

const variantMap: Record<string, 'default' | 'warning' | 'info' | 'success' | 'danger'> = {
  pending:   'warning',
  confirmed: 'info',
  completed: 'success',
  failed:    'danger',
  expired:   'default',
}

const labelMap: Record<string, string> = {
  pending:   'Pending',
  confirmed: 'Confirmed',
  completed: 'Completed',
  failed:    'Failed',
  expired:   'Expired',
}

const variant = computed(() => variantMap[props.status] ?? 'default')
const label   = computed(() => labelMap[props.status] ?? props.status)
</script>
