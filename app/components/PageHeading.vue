<template>
  <div class="sticky top-0 z-10 bg-white pt-4">
    <div class="not-prose flex items-start justify-between gap-4 rounded-t-md border-2 border-brown-200 px-6 pt-4 pb-3">
      <div>
        <h1 class="text-2xl font-bold text-brown-950">
          Angad Bhargav
        </h1>
        <p class="mt-1 text-base text-brown-700">
          <slot />
        </p>
      </div>
      <div v-if="$slots.right">
        <slot name="right" />
      </div>
    </div>
  </div>
</template>
