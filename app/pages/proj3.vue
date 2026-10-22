<script setup lang="ts">
import metricsAJson from "~~/public/photos/proj3/a/metrics.json";
import metricsBJson from "~~/public/photos/proj3/b/metrics.json";

definePageMeta({
  subtitle: "Project 3: Fun with Flow Models",
});

useHead({
  title: "Project 3",
});

// written by the notebooks (see nocommit/proj3/extract_part*.py)
interface MetricsA {
  blur_sigma: Record<string, number>;
  reconstruction_mse: Record<"blur" | "one_step" | "euler", number>;
  edit_prompts: Record<string, string>;
  anagram_pairs: [string, string, number][];
  hybrid_pairs: [string, string][];
}
interface MetricsB {
  pure_noise: Record<string, { mse_to_train_mean: number; output_std_across_samples: number }>;
  no_sched_lr: number;
}
const ma = metricsAJson as unknown as MetricsA;
const mb = metricsBJson as unknown as MetricsB;

const A = "/photos/proj3/a";
const B = "/photos/proj3/b";
const probeTimes = ["0.25", "0.5", "0.75"];
const velocityTimes = ["0.25", "0.50", "0.75"];
const epochs = [1, 5, 10];

const editSets = [
  { key: "campanile", label: "Campanile" },
  { key: "my_image_1", label: "Fatehpur Sikri (my photo)" },
  { key: "my_image_2", label: "waffle (my photo)" },
];
const creativeSets = [
  { key: "web_image", label: "web image: jumping cat" },
  { key: "drawing_1", label: "drawing 1: basketball" },
  { key: "drawing_2", label: "drawing 2: cat" },
];
</script>

<template>
  <div>
    <h2
      id="part-a"
      class="mt-0"
    >
      Part A: Exploring the Power of Flow Models
    </h2>

    <h3 id="part-a-1-1">
      1.1 Constructing Noisy Training Inputs
    </h3>
    <PhotoFigure
      :src="`${A}/training_inputs.jpg`"
      img-class="aspect-auto"
      class="not-prose mt-3"
    >
      my photo (Fatehpur Sikri) and its noisy versions at t = {{ probeTimes.join(", ") }}
    </PhotoFigure>

    <h3 id="part-a-1-2">
      1.2 Classical Denoising
    </h3>
    <ImageGrid class="grid-cols-1 sm:grid-cols-3">
      <PhotoFigure
        v-for="t in probeTimes"
        :key="t"
        :src="`${A}/blur_${t}.jpg`"
        img-class="aspect-auto"
      >
        t = {{ t }}, best blur σ = {{ ma.blur_sigma[t] }}
      </PhotoFigure>
    </ImageGrid>

    <h3 id="part-a-1-3">
      1.3 One-Step Denoising
    </h3>
    <PhotoFigure
      v-for="t in probeTimes"
      :key="t"
      :src="`${A}/one_step_${t}.jpg`"
      img-class="aspect-auto"
      class="not-prose mt-3"
    >
      t = {{ t }}
    </PhotoFigure>

    <h3 id="part-a-1-4">
      1.4 Visualizing Velocity
    </h3>
    <ImageRow>
      <PhotoFigure
        :src="`${A}/velocity_original.jpg`"
        img-class="aspect-square"
        class="w-40"
      >
        original
      </PhotoFigure>
    </ImageRow>
    <PhotoFigure
      v-for="t in velocityTimes"
      :key="t"
      :src="`${A}/velocity_${t}.jpg`"
      img-class="aspect-auto"
      class="not-prose mt-3"
    >
      t = {{ t }}
    </PhotoFigure>

    <h3 id="part-a-1-5">
      1.5 Iterative Denoising with Euler Sampling
    </h3>
    <PhotoFigure
      :src="`${A}/trajectory.jpg`"
      img-class="aspect-auto"
      class="not-prose mt-3"
    >
      Euler trajectory from t = 0.5, every fifth step
    </PhotoFigure>
    <PhotoFigure
      :src="`${A}/comparison.jpg`"
      img-class="aspect-auto"
      class="not-prose mt-3"
    >
      same t = 0.5 input. MSE: blur {{ ma.reconstruction_mse.blur.toFixed(4) }}, one step
      {{ ma.reconstruction_mse.one_step.toFixed(4) }}, Euler {{ ma.reconstruction_mse.euler.toFixed(4) }}
    </PhotoFigure>
    <p>
      The blur is grainy and smears a lot of the finer details in the arches of the mosque. Both one step and Euler
      are able to recover the image of the building pretty well, with Euler being a little sharper. One step has
      the lower MSE, because its estimate is just the average of plausible images. On the other hand, Euler will
      show sharper detail that doesn't neccessary show up in the original image.
    </p>

    <h3 id="part-a-1-6">
      1.6 Generating Images from Noise
    </h3>
    <PhotoFigure
      :src="`${A}/conditional_samples.jpg`"
      img-class="aspect-auto"
      class="not-prose mt-3"
    >
      seeds 180–184
    </PhotoFigure>
    <p>
      Since every sample is a portrait, the generic prompt favors people. Seeds 182 and 184 are relatively clean, but
      180, 181 and 183 have smeared or distorted faces and bodies that are super uncanny valley.
    </p>

    <h3 id="part-a-2-1">
      2.1 Classifier-Free Guidance
    </h3>
    <PhotoFigure
      :src="`${A}/cfg_samples.jpg`"
      img-class="aspect-auto"
      class="not-prose mt-3"
    >
      seeds 180–184, w = 7
    </PhotoFigure>
    <p>
      Using CFG, every sample is a sharp centered headshot and the uncanny distortions are basically completely gone,
      Some of the layout carries over from the original noise (ex. seed 182 still has the hand left of the face). That
      being said, diversity drops and all five now look like the same general type of studio portrait.
    </p>

    <h3 id="part-a-3-1">
      3.1 Image-to-Image Editing
    </h3>
    <PhotoFigure
      v-for="set in [...editSets, ...creativeSets]"
      :key="set.key"
      :src="`${A}/edit_${set.key}.jpg`"
      img-class="aspect-auto"
      class="not-prose mt-3"
    >
      {{ set.label }}
    </PhotoFigure>

    <h3 id="part-a-3-2">
      3.2 Text-Guided Image Editing
    </h3>
    <PhotoFigure
      v-for="set in editSets"
      :key="set.key"
      :src="`${A}/text_edit_${set.key}.jpg`"
      img-class="aspect-auto"
      class="not-prose mt-3"
    >
      {{ set.label }}, prompt: "{{ ma.edit_prompts[set.key] }}"
    </PhotoFigure>

    <h3 id="part-a-3-3">
      3.3 Visual Anagrams
    </h3>
    <PhotoFigure
      v-for="(pair, i) in ma.anagram_pairs"
      :key="i"
      :src="`${A}/anagram_views_${i}.jpg`"
      img-class="aspect-auto"
      class="not-prose mt-3 max-w-xl mx-auto"
    >
      upright: "{{ pair[0] }}", flipped: "{{ pair[1] }}"
    </PhotoFigure>

    <h3 id="part-a-3-4">
      3.4 Hybrid Images
    </h3>
    <ImageRow
      v-for="(pair, i) in ma.hybrid_pairs"
      :key="i"
      class="items-end"
    >
      <PhotoFigure
        :src="`${A}/hybrid_${i}.jpg`"
        img-class="aspect-square"
        class="w-full sm:w-80"
      >
        near: "{{ pair[1] }}"
      </PhotoFigure>
      <PhotoFigure
        :src="`${A}/hybrid_${i}.jpg`"
        img-class="aspect-square"
        class="w-16"
      >
        distant: "{{ pair[0] }}"
      </PhotoFigure>
    </ImageRow>

    <h2 id="part-b">
      Part B: Flow Matching from Scratch
    </h2>

    <h3 id="part-b-1-2">
      1.2 Using the UNet to Train a Denoiser
    </h3>
    <PhotoFigure
      :src="`${B}/1_2_noising.png`"
      img-class="aspect-auto"
      class="not-prose mt-3"
    >
      noising process
    </PhotoFigure>

    <h4 id="part-b-1-2-1">
      1.2.1 Training
    </h4>
    <PhotoFigure
      :src="`${B}/1_2_1_loss.png`"
      img-class="aspect-auto"
      class="not-prose mt-3"
    >
      training loss
    </PhotoFigure>
    <ImageGrid class="grid-cols-1 sm:grid-cols-2">
      <PhotoFigure
        v-for="e in [1, 5]"
        :key="e"
        :src="`${B}/1_2_1_epoch${e}.png`"
        img-class="aspect-auto"
      >
        test set, σ = 0.5, epoch {{ e }}
      </PhotoFigure>
    </ImageGrid>

    <h4 id="part-b-1-2-2">
      1.2.2 Out-of-Distribution Testing
    </h4>
    <PhotoFigure
      :src="`${B}/1_2_2_ood.png`"
      img-class="aspect-auto"
      class="not-prose mt-3"
    >
      same test digits at varying σ
    </PhotoFigure>

    <h4 id="part-b-1-2-3">
      1.2.3 Denoising Pure Noise
    </h4>
    <PhotoFigure
      :src="`${B}/1_2_3_loss.png`"
      img-class="aspect-auto"
      class="not-prose mt-3"
    >
      training loss
    </PhotoFigure>
    <ImageGrid class="grid-cols-1 sm:grid-cols-2">
      <PhotoFigure
        v-for="e in [1, 5]"
        :key="e"
        :src="`${B}/1_2_3_epoch${e}.png`"
        img-class="aspect-auto"
      >
        epoch {{ e }}
      </PhotoFigure>
    </ImageGrid>
    <ImageRow>
      <PhotoFigure
        :src="`${B}/1_2_3_train_mean.png`"
        img-class="aspect-auto"
        class="w-32"
      >
        mean of all training digits
      </PhotoFigure>
    </ImageRow>
    <p>
      All of the outputs are basically the exact same blurry blob regardless of what the source noise is. The blob
      looks like something between a 0, 3, 8, or a 9. It matches the mean of the training digits (MSE
      {{ mb.pure_noise.epoch5.mse_to_train_mean.toExponential(1) }} after 5 epochs). This is because pure noise carries
      0 information about the target, so the MSE_optimal output is just the image that is closest to all training digits
      all at once.
    </p>

    <h3 id="part-b-2-2">
      2.2 Training the Time-Conditioned UNet
    </h3>
    <PhotoFigure
      :src="`${B}/2_2_loss.png`"
      img-class="aspect-auto"
      class="not-prose mt-3"
    >
      training loss
    </PhotoFigure>

    <h3 id="part-b-2-3">
      2.3 Sampling from the Time-Conditioned UNet
    </h3>
    <ImageGrid class="grid-cols-1 sm:grid-cols-3">
      <PhotoFigure
        v-for="e in epochs"
        :key="e"
        :src="`${B}/2_3_epoch${e}.png`"
        img-class="aspect-auto"
      >
        epoch {{ e }}
      </PhotoFigure>
    </ImageGrid>

    <h3 id="part-b-2-5">
      2.5 Training the Class-Conditioned UNet
    </h3>
    <PhotoFigure
      :src="`${B}/2_5_loss.png`"
      img-class="aspect-auto"
      class="not-prose mt-3"
    >
      training loss
    </PhotoFigure>

    <h3 id="part-b-2-6">
      2.6 Sampling from the Class-Conditioned UNet
    </h3>
    <PhotoFigure
      v-for="e in epochs"
      :key="e"
      :src="`${B}/2_6_epoch${e}.png`"
      img-class="aspect-auto"
      class="not-prose mt-3"
    >
      epoch {{ e }}
    </PhotoFigure>

    <h4 id="part-b-2-6-nosched">
      Without the Learning Rate Scheduler
    </h4>
    <p>
      To make up for the lack of a scheduler, I use a constant learning rate of {{ mb.no_sched_lr }} instead of 1e-2. Since
      that's where the exponential schedule ends up, the training still resolves at the end. ADam's per-parameter step sizes
      make up for the lack of a large early learning rate. The results at epoch 10 are the same as the scheduled run.
    </p>
    <PhotoFigure
      :src="`${B}/2_6_nosched_loss.png`"
      img-class="aspect-auto"
      class="not-prose mt-3"
    >
      training loss, constant lr {{ mb.no_sched_lr }}
    </PhotoFigure>
    <PhotoFigure
      v-for="e in epochs"
      :key="e"
      :src="`${B}/2_6_nosched_epoch${e}.png`"
      img-class="aspect-auto"
      class="not-prose mt-3"
    >
      no scheduler, epoch {{ e }}
    </PhotoFigure>
  </div>
</template>
