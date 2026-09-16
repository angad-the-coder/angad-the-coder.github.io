<script setup lang="ts">
import { computed, useAttrs } from "vue";

defineOptions({ inheritAttrs: false });
const attrs = useAttrs();

const props = defineProps<{
  mode: "ncc" | "l2";
  label: string;
  srcNcc?: string;
  gNcc?: string;
  rNcc?: string;
  rNccClass?: string;
  srcL2?: string;
  gL2?: string;
  rL2?: string;
  rL2Class?: string;
  naiveSrc?: string;
  imgClass?: string;
}>();

const activeSrc = computed(() => (props.mode === "ncc" ? props.srcNcc ?? props.srcL2 : props.srcL2 ?? props.srcNcc));
const activeG = computed(() => (props.mode === "ncc" ? props.gNcc : props.gL2));
const activeR = computed(() => (props.mode === "ncc" ? props.rNcc : props.rL2));
const activeRClass = computed(() => (props.mode === "ncc" ? props.rNccClass : props.rL2Class));
</script>

<template>
  <figure :class="cn('not-prose flex flex-col items-center', attrs.class as string)">
    <div class="group relative w-full">
      <img
        :src="activeSrc"
        :alt="label"
        :class="cn('rounded border-2 border-brown-200 w-full', props.imgClass)"
      >
      <img
        v-if="naiveSrc"
        :src="naiveSrc"
        alt=""
        :class="cn('absolute inset-0 rounded border-2 border-brown-200 opacity-0 transition-opacity duration-150 group-hover:opacity-100 w-full', props.imgClass)"
      >
    </div>
    <figcaption class="mt-2 text-sm text-brown-700 text-center">
      {{ label }}
    </figcaption>
    <p
      v-if="activeG"
      class="text-xs font-mono text-brown-500 text-center"
    >
      g {{ activeG }} <span :class="cn(activeRClass)">r {{ activeR }}</span>
    </p>
  </figure>
</template>
