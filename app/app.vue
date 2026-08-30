<script setup lang="ts">
useHead({
  meta: [
    { name: 'theme-color', content: '#050608' },
  ],
  link: [
    { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
    { rel: 'icon', type: 'image/svg+xml', href: '/pwa-icon.svg' },
  ],
})
</script>

<template>
  <VitePwaManifest />
  <NuxtRouteAnnouncer />
  <NuxtPage />
</template>