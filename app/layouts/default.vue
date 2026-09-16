<script setup lang="ts">
const route = useRoute();
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-white to-brown-50 text-brown-950">
    <div class="max-w-4xl mx-auto px-6 py-10">
      <NavBar />
      <PageHeading>
        {{ route.meta.subtitle }}
        <template
          v-if="$slots.right"
          #right
        >
          <slot name="right" />
        </template>
      </PageHeading>
      <main class="rounded-b-md border-2 border-t-0 border-brown-200 bg-white p-6 prose prose-brown max-w-none">
        <slot />
      </main>
    </div>
  </div>
</template>
