<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      @mousedown.self="$emit('cancel')"
    >
      <div class="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6">
        <h2 class="text-base font-semibold text-gray-900 mb-2">{{ title }}</h2>
        <p class="text-sm text-gray-500 mb-6">{{ message }}</p>

        <div class="flex items-center justify-end gap-3">
          <UiButton variant="secondary" :disabled="loading" @click="$emit('cancel')">Cancel</UiButton>
          <UiButton variant="danger" :loading="loading" @click="$emit('confirm')">
            {{ confirmLabel }}
          </UiButton>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  title: string
  message: string
  confirmLabel?: string
  loading?: boolean
}>(), {
  confirmLabel: 'Delete',
  loading: false,
})

defineEmits<{
  confirm: []
  cancel: []
}>()
</script>
