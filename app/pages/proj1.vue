<script setup lang="ts">
import { ref } from "vue";

definePageMeta({
  layout: false,
  subtitle: "Project 1: Images of the Russian Empire",
});

useHead({
  title: "Project 1",
});

const mode = ref<"ncc" | "l2">("ncc");
</script>

<template>
  <NuxtLayout name="default">
    <template #right>
      <div class="not-prose flex flex-col items-end">
        <div class="flex items-center gap-2">
          <span class="text-xs uppercase tracking-wide font-black text-brown-600">
            Mode
          </span>
          <div class="flex items-center gap-0.5 rounded-md bg-brown-900 p-1">
            <button
              type="button"
              class="rounded-md px-3 py-1 text-sm transition-colors"
              :class="mode === 'ncc' ? 'bg-brown-50 font-semibold text-brown-900' : 'font-medium text-brown-400 hover:text-brown-300'"
              @click="mode = 'ncc'"
            >
              NCC
            </button>
            <button
              type="button"
              class="rounded-md px-3 py-1 text-sm transition-colors"
              :class="mode === 'l2' ? 'bg-brown-50 font-semibold text-brown-900' : 'font-medium text-brown-400 hover:text-brown-300'"
              @click="mode = 'l2'"
            >
              L2
            </button>
          </div>
        </div>
        <p class="mt-1 text-right text-xs italic text-brown-400">
          (Hover image to see unaligned)
        </p>
      </div>
    </template>

    <h2>
      Approach
    </h2>
    <p>
      I take each source grayscale image and split it into thirds corresponding with the B, G, and R
      plates (from top to bottom). Afterwards, I search for the appropriate (x, y) translation
      needed to align the image channels, considering translations within a fixed pixel range ([-15, 15] by default).
      Each potential shift is scored with normalized cross-correlation and the L2 distance, and I naively
      crop 10% off the border for each channel before taking the score so that meaningless border misalignments
      don't throw off the metric for the main image contents. A brute-force search across all potential shifts in the window works
      alright for smaller images, but for the full-size .tif images, I use an image pyramid to improve performance (more details
      in <a href="#multi-scale">Multi-Scale Pyramid Alignment</a>). The formulas for L2 distance and NCC are shown below.
    </p>
    <div class="flex [&>*]:flex-1">
      <MathFormula
        label="L2 distance between images A and B:"
        tex="L_2(A, B) = \sqrt{\sum_{i,j} (A_{ij} - B_{ij})^2}"
      />
      <MathFormula
        label="NCC between images A and B:"
        tex="\mathrm{NCC}(A, B) = \dfrac{(A - \bar{A}) \cdot (B - \bar{B})}{\lVert A - \bar{A} \rVert \, \lVert B - \bar{B} \rVert}"
      />
    </div>

    <h2>
      Single-scale alignment
    </h2>
    <p>
      For the smaller JPG images here, I ran a brute force search for translations across [-15, 15].
      and I scored each independently across NCC and L2. Since the images are pretty small (~1024px), the
      alignment computations finished in under 0.2s. Since NCC uses cosine similarity, it matches
      images against broad intensity patterns while L2 distance just matches across direct pixel
      differences which I would think makes it more sensitive to inconsistencies with overall brightness and contrast.
      The L2 and NCC results agreed across all of these images and the results look good, but I'm inclined to think
      that NCC is more resilient in general.
    </p>
    <ImageRow>
      <ResultCard
        :mode="mode"
        label="cathedral"
        src-ncc="/photos/proj1/singlescale/cathedral_ncc.jpg"
        g-ncc="(2, 5)"
        r-ncc="(3, 12)"
        src-l2="/photos/proj1/singlescale/cathedral_l2.jpg"
        g-l2="(2, 5)"
        r-l2="(3, 12)"
        naive-src="/photos/proj1/singlescale/cathedral_naive.jpg"
        class="w-full sm:w-96"
      />
      <ResultCard
        :mode="mode"
        label="monastery"
        src-ncc="/photos/proj1/singlescale/monastery_ncc.jpg"
        g-ncc="(2, -3)"
        r-ncc="(2, 3)"
        src-l2="/photos/proj1/singlescale/monastery_l2.jpg"
        g-l2="(2, -3)"
        r-l2="(2, 3)"
        naive-src="/photos/proj1/singlescale/monastery_naive.jpg"
        class="w-full sm:w-96"
      />
      <ResultCard
        :mode="mode"
        label="tobolsk"
        src-ncc="/photos/proj1/singlescale/tobolsk_ncc.jpg"
        g-ncc="(3, 3)"
        r-ncc="(3, 6)"
        src-l2="/photos/proj1/singlescale/tobolsk_l2.jpg"
        g-l2="(3, 3)"
        r-l2="(3, 6)"
        naive-src="/photos/proj1/singlescale/tobolsk_naive.jpg"
        class="w-full sm:w-96"
      />
    </ImageRow>

    <h2 id="multi-scale">
      Multi-scale pyramid alignment
    </h2>
    <p>
      For the larger TIF files, I used an image pyramid, which is just a bunch of copies of the
      original image blurred and downsampled a few times over (see the visual below).
    </p>
    <PhotoFigure
      src="/photos/proj1/reference/image_pyramid_wikipedia.svg"
      alt="diagram of an image pyramid with 5 levels, each half the resolution of the one below"
      img-class="w-72 aspect-auto object-contain"
      class="mt-4 flex flex-col items-center"
      caption-class="mt-2 text-xs text-brown-500 text-center max-w-sm"
    >
      Visualization of image pyramid taken from
      <a href="https://en.wikipedia.org/wiki/Pyramid_(image_processing)">Wikipedia</a>,
      <a href="https://creativecommons.org/licenses/by-sa/3.0/">CC BY-SA 3.0</a>.
    </PhotoFigure>
    <p>
      The neat thing about using an image pyramid is that, even though the full-resolution images
      needs large pixel translations for alignment such that a brute-force search is computationally infeasible,
      a large pixel offset becomes much smaller when you downsample the image. Therefore, I created a pyramid that downsampled
      the image to less than 400px at the smallest level, and ran a brute-force alignment search within my original small pixel range
      ([-15, 15]). My pyramid halved the size of the image at each level, so I would just double my offset as I scaled the image.
      Each time I scaled the image, I would refine the alignment within a small pixel range of [-2, 2] since my previous alignments already
      ensured the existing alignment was close to the correct value :)
    </p>
    <p>
      All the images below were aligned using this pyramid approach, and they all ran in less than a second on my machine:
    </p>
    <ImageGrid class="grid-cols-1 sm:grid-cols-2 gap-4">
      <ResultCard
        :mode="mode"
        label="cathedral"
        src-ncc="/photos/proj1/pyramid/cathedral.jpg"
        src-l2="/photos/proj1/pyramid/cathedral_l2.jpg"
        g-ncc="(2, 5)"
        r-ncc="(3, 12)"
        g-l2="(2, 5)"
        r-l2="(3, 12)"
        naive-src="/photos/proj1/pyramid/cathedral_naive.jpg"
      />
      <ResultCard
        :mode="mode"
        label="monastery"
        src-ncc="/photos/proj1/pyramid/monastery.jpg"
        src-l2="/photos/proj1/pyramid/monastery_l2.jpg"
        g-ncc="(2, -3)"
        r-ncc="(2, 3)"
        g-l2="(2, -3)"
        r-l2="(2, 3)"
        naive-src="/photos/proj1/pyramid/monastery_naive.jpg"
      />
      <ResultCard
        :mode="mode"
        label="tobolsk"
        src-ncc="/photos/proj1/pyramid/tobolsk.jpg"
        src-l2="/photos/proj1/pyramid/tobolsk_l2.jpg"
        g-ncc="(3, 3)"
        r-ncc="(3, 6)"
        g-l2="(3, 3)"
        r-l2="(3, 6)"
        naive-src="/photos/proj1/pyramid/tobolsk_naive.jpg"
      />
      <ResultCard
        :mode="mode"
        label="church"
        src-ncc="/photos/proj1/pyramid/church.jpg"
        src-l2="/photos/proj1/pyramid/church_l2.jpg"
        g-ncc="(4, 25)"
        r-ncc="(-4, 58)"
        g-l2="(4, 25)"
        r-l2="(267, 64)"
        r-l2-class="text-red-600"
        naive-src="/photos/proj1/pyramid/church_naive.jpg"
      />
      <ResultCard
        :mode="mode"
        label="harvesters"
        src-ncc="/photos/proj1/pyramid/harvesters.jpg"
        src-l2="/photos/proj1/pyramid/harvesters_l2.jpg"
        g-ncc="(17, 60)"
        r-ncc="(13, 124)"
        g-l2="(16, 59)"
        r-l2="(13, 124)"
        naive-src="/photos/proj1/pyramid/harvesters_naive.jpg"
      />
      <ResultCard
        :mode="mode"
        label="icon"
        src-ncc="/photos/proj1/pyramid/icon.jpg"
        src-l2="/photos/proj1/pyramid/icon_l2.jpg"
        g-ncc="(17, 41)"
        r-ncc="(23, 89)"
        g-l2="(17, 41)"
        r-l2="(23, 90)"
        naive-src="/photos/proj1/pyramid/icon_naive.jpg"
      />
      <ResultCard
        :mode="mode"
        label="ilemselga"
        src-ncc="/photos/proj1/pyramid/ilemselga.jpg"
        src-l2="/photos/proj1/pyramid/ilemselga_l2.jpg"
        g-ncc="(7, 40)"
        r-ncc="(11, 130)"
        g-l2="(7, 39)"
        r-l2="(11, 130)"
        naive-src="/photos/proj1/pyramid/ilemselga_naive.jpg"
      />
      <ResultCard
        :mode="mode"
        label="melons"
        src-ncc="/photos/proj1/pyramid/melons.jpg"
        src-l2="/photos/proj1/pyramid/melons_l2.jpg"
        g-ncc="(11, 82)"
        r-ncc="(13, 178)"
        g-l2="(11, 82)"
        r-l2="(13, 178)"
        naive-src="/photos/proj1/pyramid/melons_naive.jpg"
      />
      <ResultCard
        :mode="mode"
        label="religous_painting"
        src-ncc="/photos/proj1/pyramid/religous_painting.jpg"
        src-l2="/photos/proj1/pyramid/religous_painting_l2.jpg"
        g-ncc="(3, 28)"
        r-ncc="(7, 68)"
        g-l2="(3, 28)"
        r-l2="(7, 68)"
        naive-src="/photos/proj1/pyramid/religous_painting_naive.jpg"
      />
      <ResultCard
        :mode="mode"
        label="self_portrait"
        src-ncc="/photos/proj1/pyramid/self_portrait.jpg"
        src-l2="/photos/proj1/pyramid/self_portrait_l2.jpg"
        g-ncc="(29, 79)"
        r-ncc="(37, 176)"
        g-l2="(29, 79)"
        r-l2="(37, 176)"
        naive-src="/photos/proj1/pyramid/self_portrait_naive.jpg"
      />
      <ResultCard
        :mode="mode"
        label="siren"
        src-ncc="/photos/proj1/pyramid/siren.jpg"
        src-l2="/photos/proj1/pyramid/siren_l2.jpg"
        g-ncc="(-6, 49)"
        r-ncc="(-25, 96)"
        g-l2="(-6, 49)"
        r-l2="(-25, 96)"
        naive-src="/photos/proj1/pyramid/siren_naive.jpg"
      />
      <ResultCard
        :mode="mode"
        label="three_generations"
        src-ncc="/photos/proj1/pyramid/three_generations.jpg"
        src-l2="/photos/proj1/pyramid/three_generations_l2.jpg"
        g-ncc="(14, 53)"
        r-ncc="(11, 112)"
        g-l2="(14, 53)"
        r-l2="(11, 112)"
        naive-src="/photos/proj1/pyramid/three_generations_naive.jpg"
      />
      <ResultCard
        :mode="mode"
        label="wharf"
        src-ncc="/photos/proj1/pyramid/wharf.jpg"
        src-l2="/photos/proj1/pyramid/wharf_l2.jpg"
        g-ncc="(-7, 15)"
        r-ncc="(-16, 83)"
        g-l2="(-7, 15)"
        r-l2="(-16, 83)"
        naive-src="/photos/proj1/pyramid/wharf_naive.jpg"
      />
      <ResultCard
        :mode="mode"
        label="emir"
        src-ncc="/photos/proj1/pyramid/emir.jpg"
        src-l2="/photos/proj1/pyramid/emir_l2.jpg"
        g-ncc="(24, 49)"
        r-ncc="(-205, 141)"
        g-l2="(24, 49)"
        r-l2="(57, 103)"
        naive-src="/photos/proj1/pyramid/emir_naive.jpg"
      />
    </ImageGrid>

    <p>
      The NCC and L2 distance scoring largely agreed for virtually every image, but both scoring modes
      had a singular image where it broke. I noticed in the cases where NCC and L2 varied by a few pixels,
      I felt NCC was closer to the correct value, but the difference is fairly negligible.
    </p>
    <p>
      For L2, the image it breaks under is "church". The red channel offset computed was (267, 64) when it
      should be closer to (-4, 58), the value computed via NCC. I think L2 was thrown off here because the
      squared-error sum computed by L2 is dominated by the bright reflective patch on the water right in
      front of the church and that drastically affects the brightness differently across the three channels.
      Since NCC is normalized, it isn't as sensitive to these absolute differences and it's alignment is visually
      accurate by inspection.
    </p>
    <p>
      For NCC, the image it really breaks under is "emir." The red channel gets an alignment of
      (-205, 141) instead of the correct alignment closer to (57, 103) which L2 found. I think
      this happens because Emir's blue and gold robe reflects quite differently across the B, G, R
      channels which results in the raw-pixel NCC on the main contents of the image locking onto the
      wrong high-contrast patterns in the robe. L2, just by inspection, does a much better job locking
      in on the right alignment for the image, although it isn't perfect.
    </p>
    <p>
      In general, I think NCC did a better job across all the detections overall, and it's why the default scoring mode
      used for the display images here is NCC.
    </p>
    <p>
      I used an identical approach for aligning the additional "portrait", "mosque", and "fortress" scans from
      the Prokudin-Gorskii collection, which weren't among the 14 provided. I picked a portrait, an architectural exterior, and a
      fortress landscape to cover a variety of subject types. NCC and L2 agreed exactly on all three, and they visually seem correct :)
    </p>
    <ImageRow>
      <ResultCard
        :mode="mode"
        label="“Ėtiud golovki” (study of a head)"
        src-ncc="/photos/proj1/own/portrait.jpg"
        g-ncc="(1, 5)"
        r-ncc="(1, 12)"
        g-l2="(1, 5)"
        r-l2="(1, 12)"
        naive-src="/photos/proj1/own/portrait_naive.jpg"
        class="w-full sm:w-96"
      />
      <ResultCard
        :mode="mode"
        label="Yusuf Hamadani mosque and mausoleum, Merv"
        src-ncc="/photos/proj1/own/mosque.jpg"
        g-ncc="(1, 3)"
        r-ncc="(1, 8)"
        g-l2="(1, 3)"
        r-l2="(1, 8)"
        naive-src="/photos/proj1/own/mosque_naive.jpg"
        class="w-full sm:w-96"
      />
      <ResultCard
        :mode="mode"
        label="Stone gate and Uzvarian fortress, Tsagvery"
        src-ncc="/photos/proj1/own/fortress.jpg"
        g-ncc="(0, 3)"
        r-ncc="(0, 10)"
        g-l2="(0, 3)"
        r-l2="(0, 10)"
        naive-src="/photos/proj1/own/fortress_naive.jpg"
        class="w-full sm:w-96"
      />
    </ImageRow>
  </NuxtLayout>
</template>
