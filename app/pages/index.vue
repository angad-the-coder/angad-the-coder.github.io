<script setup lang="ts">
definePageMeta({
  subtitle: "CS180: Intro to Computer Vision and Computational Photography",
});

useHead({
  title: "Home",
});
</script>

<template>
  <div>
    <ul class="mt-8 space-y-2">
      <li>
        <NuxtLink to="/proj0">
          Project 0: Becoming Friends with Your Camera
        </NuxtLink>
      </li>
      <li>
        <NuxtLink to="/proj1">
          Project 1: Images of the Russian Empire
        </NuxtLink>
      </li>
    </ul>
  </div>
</template>
