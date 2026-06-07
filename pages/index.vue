<script setup lang="ts">
// Root redirect — always go to dashboard
definePageMeta({ middleware: 'auth' })
await navigateTo('/dashboard', { replace: true })
</script>
