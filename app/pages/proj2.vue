<script setup lang="ts">
definePageMeta({
  subtitle: "Project 2: Fun with Filters and Frequencies",
});

useHead({
  title: "Project 2",
});

const fourLoopCode = `def conv2d_4loop(im, kernel, mode="same"):
    kernel = kernel[::-1, ::-1]
    kh, kw = kernel.shape
    padded = np.pad(im, ((kh - 1, kh - 1), (kw - 1, kw - 1)))
    out_h, out_w = padded.shape[0] - kh + 1, padded.shape[1] - kw + 1
    out = np.zeros((out_h, out_w))
    for i in range(out_h):
        for j in range(out_w):
            total = 0.0
            for u in range(kh):
                for v in range(kw):
                    total += padded[i + u, j + v] * kernel[u, v]
            out[i, j] = total
    return out if mode == "full" else _crop_same(out, im.shape, kernel.shape)`;

const twoLoopCode = `def conv2d_2loop(im, kernel, mode="same"):
    kernel = kernel[::-1, ::-1]
    kh, kw = kernel.shape
    padded = np.pad(im, ((kh - 1, kh - 1), (kw - 1, kw - 1)))
    out_h, out_w = padded.shape[0] - kh + 1, padded.shape[1] - kw + 1
    out = np.zeros((out_h, out_w))
    for i in range(out_h):
        for j in range(out_w):
            out[i, j] = np.sum(padded[i : i + kh, j : j + kw] * kernel)
    return out if mode == "full" else _crop_same(out, im.shape, kernel.shape)`;
</script>

<template>
  <!-- typography plugin wraps inline <code> in literal backticks by default, drop those -->
  <div class="prose-code:before:content-none prose-code:after:content-none">
    <h3 id="part-1-1" class="mt-0">
      Part 1.1: Convolutions from scratch
    </h3>
    <p>
      Both of my numpy implementations flip the kernel, zero-pad the image by <code>(kh - 1, kw - 1)</code>, and slide the
      kernel over every position where it overlaps the image. That gives the "full" output, and
      for "same" I take the centered <code>h * w</code> window, which is how
      <code>scipy.signal.convolve2d</code> does it too. The four nested loops version has two loops each over output pixels and
      kernel entries. The two loop version swaps the inner two loops for an elementwise multiply and sum over the patch.
    </p>
    <CodeBlock :code="fourLoopCode" />
    <CodeBlock :code="twoLoopCode" />
    <p>
      Both match <code>scipy.signal.convolve2d</code> with a max abs difference of 2.2e-16
      on the box filter. Runtimes:
    </p>
    <table class="not-prose mt-3 w-full text-sm text-brown-800">
      <thead>
        <tr class="border-b-2 border-brown-200 text-left">
          <th class="py-1 pr-4 font-semibold">
            kernel
          </th>
          <th class="py-1 pr-4 font-semibold">
            4 loops
          </th>
          <th class="py-1 pr-4 font-semibold">
            2 loops
          </th>
          <th class="py-1 font-semibold">
            scipy
          </th>
        </tr>
      </thead>
      <tbody>
        <tr class="border-b border-brown-100">
          <td class="py-1 pr-4">
            9*9 box
          </td>
          <td class="py-1 pr-4 font-mono">
            2.85 s
          </td>
          <td class="py-1 pr-4 font-mono">
            0.34 s
          </td>
          <td class="py-1 font-mono">
            0.01 s
          </td>
        </tr>
        <tr class="border-b border-brown-100">
          <td class="py-1 pr-4">
            D_x (1*2)
          </td>
          <td class="py-1 pr-4 font-mono">
            0.09 s
          </td>
          <td class="py-1 pr-4 font-mono">
            0.29 s
          </td>
          <td class="py-1 font-mono">
            1.4 ms
          </td>
        </tr>
        <tr class="border-b border-brown-100">
          <td class="py-1 pr-4">
            D_y (2*1)
          </td>
          <td class="py-1 pr-4 font-mono">
            0.09 s
          </td>
          <td class="py-1 pr-4 font-mono">
            0.28 s
          </td>
          <td class="py-1 font-mono">
            1.7 ms
          </td>
        </tr>
      </tbody>
    </table>
    <p>
      For the 9*9 box filter, the two-loop version is eight times faster than four-loop since
      81 multiply-adds per pixel get pushed into numpy instead of Python. scipy, being compiled in C, is
      about 23 times faster thatn my best on the box filter.
    </p>
    <p>
      For boundaries, my version only does zero fill like scipy's default <code>boundary="fill"</code>.
      That's why in my box-blurred selfie the edges get averaged with black, adding a
      dark frame around the image.
    </p>
    <ImageGrid class="grid-cols-2 sm:grid-cols-5">
      <PhotoFigure src="/photos/proj2/pt1_1/selfie_gray.jpg">
        me, grayscale
      </PhotoFigure>
      <PhotoFigure src="/photos/proj2/pt1_1/box.jpg">
        9*9 box, zero fill
      </PhotoFigure>
      <PhotoFigure src="/photos/proj2/pt1_1/box_symm.jpg">
        9*9 box, symmetric
      </PhotoFigure>
      <PhotoFigure src="/photos/proj2/pt1_1/dx.jpg">
        D_x
      </PhotoFigure>
      <PhotoFigure src="/photos/proj2/pt1_1/dy.jpg">
        D_y
      </PhotoFigure>
    </ImageGrid>

    <h3 id="part-1-2">
      Part 1.2: Finite difference operator
    </h3>
    <p>
      Convolving with D_x and D_y gives the partial
      derivatives, which light up at vertical and horizontal edges respectively (gray is zero, lighter is
      positive, darker is negative). The magnitude of the gradient indicates how steeply the intensity is changing
      per pixel, regardless direction:
    </p>
    <MathFormula tex="\lVert \nabla I \rVert = \sqrt{\left(\frac{\partial I}{\partial x}\right)^2 + \left(\frac{\partial I}{\partial y}\right)^2}, \quad \frac{\partial I}{\partial x} \approx I * D_x, \;\; \frac{\partial I}{\partial y} \approx I * D_y" />
    <p>
      To get an edge image, I binarize the magnitude with a threshold of 0.25, chosen by inspection from trial and error.
      A lower threshold (see leftmost image) picks up too much of the grass as
      noise, and going higher (rightmost) breaks up real edges like the tripod legs, and erases details like the buildings
      on the horizon. 0.25 keeps a little grass noise, but I make the tradeoff for a clean outline for the cameraman.
    </p>
    <ImageGrid class="grid-cols-2 sm:grid-cols-4">
      <PhotoFigure
        src="/photos/proj2/pt1_2/cameraman.jpg"
        img-class="aspect-square"
      >
        original
      </PhotoFigure>
      <PhotoFigure
        src="/photos/proj2/pt1_2/dx.jpg"
        img-class="aspect-square"
      >
        horizontal gradient
      </PhotoFigure>
      <PhotoFigure
        src="/photos/proj2/pt1_2/dy.jpg"
        img-class="aspect-square"
      >
        vertical gradient
      </PhotoFigure>
      <PhotoFigure
        src="/photos/proj2/pt1_2/mag.jpg"
        img-class="aspect-square"
      >
        gradient magnitude
      </PhotoFigure>
    </ImageGrid>
    <ImageGrid class="grid-cols-3 sm:grid-cols-3">
      <PhotoFigure
        src="/photos/proj2/pt1_2/edges_0.125.png"
        img-class="aspect-square"
      >
        threshold 0.125
      </PhotoFigure>
      <PhotoFigure
        src="/photos/proj2/pt1_2/edges.png"
        img-class="aspect-square"
      >
        threshold 0.25 (chosen)
      </PhotoFigure>
      <PhotoFigure
        src="/photos/proj2/pt1_2/edges_0.400.png"
        img-class="aspect-square"
      >
        threshold 0.4
      </PhotoFigure>
    </ImageGrid>

    <h3 id="part-1-3">
      Part 1.3: Derivative of Gaussian (DoG) filter
    </h3>
    <p>
      I blur the cameraman with a Gaussian (2px blur, 13*13 kernel, outer product of
      <code>cv2.getGaussianKernel</code> with itself) and then take the same derivatives. Blur amounts before correspond
      to the Gaussian's standard deviation in pixels. This basically removes the grass noise, makes the edges thicker, and
      lets me bring the threshold down to 0.05 while maintining a clean image.
    </p>
    <ImageGrid class="grid-cols-2 sm:grid-cols-5">
      <PhotoFigure
        src="/photos/proj2/pt1_3/blurred.jpg"
        img-class="aspect-square"
      >
        blurred, 2px
      </PhotoFigure>
      <PhotoFigure
        src="/photos/proj2/pt1_3/blur_dx.jpg"
        img-class="aspect-square"
      >
        blurred, ∂x
      </PhotoFigure>
      <PhotoFigure
        src="/photos/proj2/pt1_3/blur_dy.jpg"
        img-class="aspect-square"
      >
        blurred, ∂y
      </PhotoFigure>
      <PhotoFigure
        src="/photos/proj2/pt1_3/blur_mag.jpg"
        img-class="aspect-square"
      >
        magnitude
      </PhotoFigure>
      <PhotoFigure
        src="/photos/proj2/pt1_3/blur_edges.png"
        img-class="aspect-square"
      >
        edges (0.05)
      </PhotoFigure>
    </ImageGrid>
    <p>
      DoG filters convolving the Gaussian with D_x and D_y:
    </p>
    <ImageRow>
      <PhotoFigure
        src="/photos/proj2/pt1_3/gaussian_filter.png"
        img-class="aspect-square [image-rendering:pixelated]"
        class="w-28"
      >
        G
      </PhotoFigure>
      <PhotoFigure
        src="/photos/proj2/pt1_3/dog_x_filter.png"
        img-class="aspect-square [image-rendering:pixelated]"
        class="w-28"
      >
        G * D_x
      </PhotoFigure>
      <PhotoFigure
        src="/photos/proj2/pt1_3/dog_y_filter.png"
        img-class="aspect-square [image-rendering:pixelated]"
        class="w-28"
      >
        G * D_y
      </PhotoFigure>
    </ImageRow>
    <p>
      Applying them directly gives the same result as blurring first :)
    </p>
    <ImageGrid class="grid-cols-2 sm:grid-cols-4">
      <PhotoFigure
        src="/photos/proj2/pt1_3/dog_dx.jpg"
        img-class="aspect-square"
      >
        I * DoG_x
      </PhotoFigure>
      <PhotoFigure
        src="/photos/proj2/pt1_3/dog_dy.jpg"
        img-class="aspect-square"
      >
        I * DoG_y
      </PhotoFigure>
      <PhotoFigure
        src="/photos/proj2/pt1_3/dog_mag.jpg"
        img-class="aspect-square"
      >
        magnitude
      </PhotoFigure>
      <PhotoFigure
        src="/photos/proj2/pt1_3/dog_edges.png"
        img-class="aspect-square"
      >
        edges (0.05)
      </PhotoFigure>
    </ImageGrid>

    <h3 id="part-2-1">
      Part 2.1: Image "sharpening"
    </h3>
    <p>
      To sharpen, I blur the image with a 2px Gaussian, subtract the blurred copy from the original to get just the
      fine detail, and add 1.5 times that detail back on top. Since blurring is itself a convolution, all three steps become
      one kernel: the identity kernel scaled up by 2.5, minus 1.5 times the Gaussian. I checked that convolving with
      that single kernel gives the same result as doing the steps separately.
    </p>
    <ImageGrid class="grid-cols-2 sm:grid-cols-4">
      <PhotoFigure
        src="/photos/proj2/pt2_1/taj/original.jpg"
        img-class="aspect-auto"
      >
        original
      </PhotoFigure>
      <PhotoFigure
        src="/photos/proj2/pt2_1/taj/blurred.jpg"
        img-class="aspect-auto"
      >
        blurred, low freq
      </PhotoFigure>
      <PhotoFigure
        src="/photos/proj2/pt2_1/taj/high.jpg"
        img-class="aspect-auto"
      >
        original − blurred, high freq
      </PhotoFigure>
      <PhotoFigure
        src="/photos/proj2/pt2_1/taj/sharpened.jpg"
        img-class="aspect-auto"
      >
        sharpened by 1.5
      </PhotoFigure>
    </ImageGrid>
    <p>
      Varying the sharpening amount:
    </p>
    <ImageGrid class="grid-cols-2 sm:grid-cols-4">
      <PhotoFigure
        v-for="a in [0.5, 1, 2, 4]"
        :key="a"
        :src="`/photos/proj2/pt2_1/taj/alpha_${a}.jpg`"
        img-class="aspect-auto"
      >
        amount {{ a }}
      </PhotoFigure>
    </ImageGrid>
    <p>
      Here's the results of the same thing on "three generations" from Project 1:
    </p>
    <ImageGrid class="grid-cols-2 sm:grid-cols-4">
      <PhotoFigure
        src="/photos/proj2/pt2_1/other/original.jpg"
        img-class="aspect-auto"
      >
        original
      </PhotoFigure>
      <PhotoFigure
        src="/photos/proj2/pt2_1/other/blurred.jpg"
        img-class="aspect-auto"
      >
        blurred
      </PhotoFigure>
      <PhotoFigure
        src="/photos/proj2/pt2_1/other/high.jpg"
        img-class="aspect-auto"
      >
        high freq
      </PhotoFigure>
      <PhotoFigure
        src="/photos/proj2/pt2_1/other/sharpened.jpg"
        img-class="aspect-auto"
      >
        sharpened (amount 1.5)
      </PhotoFigure>
    </ImageGrid>
    <ImageGrid class="grid-cols-2 sm:grid-cols-4">
      <PhotoFigure
        v-for="a in [0.5, 1, 2, 4]"
        :key="a"
        :src="`/photos/proj2/pt2_1/other/alpha_${a}.jpg`"
        img-class="aspect-auto"
      >
        amount {{ a }}
      </PhotoFigure>
    </ImageGrid>
    <p>
      For evaluation, I used the sharp photo I took of Wheeler in Project 0, blurred it by 3px, and then tried to sharpen it back. The result
      definitely looks crisper than the blurred version, but it's missing the fine texture (stonework, window details, etc.) that the blur wiped out.
      Since sharpening only boosts the high frequencies that are still there, the result is sharper-looking big edges but that's it.
    </p>
    <ImageGrid class="grid-cols-3 sm:grid-cols-3">
      <PhotoFigure src="/photos/proj2/pt2_1/eval/original.jpg">
        original (sharp)
      </PhotoFigure>
      <PhotoFigure src="/photos/proj2/pt2_1/eval/blurred.jpg">
        blurred (3px)
      </PhotoFigure>
      <PhotoFigure src="/photos/proj2/pt2_1/eval/resharpened.jpg">
        re-sharpened
      </PhotoFigure>
    </ImageGrid>

    <h3 id="part-2-2">
      Part 2.2: Hybrid images
    </h3>
    <p>
      The more an image gets blurred, the lower its cutoff frequency. I line the two
      images up first using two points on each for the eyes, solving for the scale + rotation + translation that maps
      one pair onto the other.
    </p>
    <p>
      Here's the full process for Derek + Nutmeg (Derek blurred by 6px, Nutmeg's high pass with
      8px blur). The top row is the images and the bottom row is the log
      magnitude of their Fourier transforms. The low pass kills everything but a small blob in the
      middle, the high pass cuts out that middle, and the hybrid's spectrum is the two together.
    </p>
    <ImageGrid class="grid-cols-3 sm:grid-cols-5">
      <PhotoFigure
        src="/photos/proj2/pt2_2/derek_nutmeg/low_in.jpg"
        img-class="aspect-auto"
      >
        Derek (aligned)
      </PhotoFigure>
      <PhotoFigure
        src="/photos/proj2/pt2_2/derek_nutmeg/high_in.jpg"
        img-class="aspect-auto"
      >
        Nutmeg (aligned)
      </PhotoFigure>
      <PhotoFigure
        src="/photos/proj2/pt2_2/derek_nutmeg/low.jpg"
        img-class="aspect-auto"
      >
        low pass
      </PhotoFigure>
      <PhotoFigure
        src="/photos/proj2/pt2_2/derek_nutmeg/high.jpg"
        img-class="aspect-auto"
      >
        high pass
      </PhotoFigure>
      <PhotoFigure
        src="/photos/proj2/pt2_2/derek_nutmeg/hybrid.jpg"
        img-class="aspect-auto"
      >
        hybrid
      </PhotoFigure>
      <PhotoFigure
        src="/photos/proj2/pt2_2/derek_nutmeg/fft_low_in.jpg"
        img-class="aspect-auto"
      >
        FFT, Derek
      </PhotoFigure>
      <PhotoFigure
        src="/photos/proj2/pt2_2/derek_nutmeg/fft_high_in.jpg"
        img-class="aspect-auto"
      >
        FFT, Nutmeg
      </PhotoFigure>
      <PhotoFigure
        src="/photos/proj2/pt2_2/derek_nutmeg/fft_low.jpg"
        img-class="aspect-auto"
      >
        FFT, low pass
      </PhotoFigure>
      <PhotoFigure
        src="/photos/proj2/pt2_2/derek_nutmeg/fft_high.jpg"
        img-class="aspect-auto"
      >
        FFT, high pass
      </PhotoFigure>
      <PhotoFigure
        src="/photos/proj2/pt2_2/derek_nutmeg/fft_hybrid.jpg"
        img-class="aspect-auto"
      >
        FFT, hybrid
      </PhotoFigure>
    </ImageGrid>
    <p>
      Picking the cutoffs took some trial and error. If Derek's blur is too small, he's visible up close. If
      it's too big, he disappears from far away too. If Nutmeg's blur is too small, she's hard to see up close.
      If it's too big, she shows up from far away. I ended up going with 12px for Derek and 8px for Nutmeg:
    </p>
    <ImageGrid class="grid-cols-2 sm:grid-cols-4">
      <PhotoFigure
        v-for="s in [[3, 8], [12, 8], [6, 3], [6, 16]]"
        :key="s.join('_')"
        :src="`/photos/proj2/pt2_2/derek_nutmeg/hybrid_${s[0]}_${s[1]}.jpg`"
        img-class="aspect-auto"
      >
        Derek {{ s[0] }}px, Nutmeg {{ s[1] }}px
      </PhotoFigure>
    </ImageGrid>
    <p>
      An easier visualization of up close and far away:
    </p>
    <ImageRow class="items-end">
      <PhotoFigure
        src="/photos/proj2/pt2_2/derek_nutmeg/hybrid.jpg"
        img-class="aspect-auto"
        class="w-full sm:w-96"
      >
        up close
      </PhotoFigure>
      <PhotoFigure
        src="/photos/proj2/pt2_2/derek_nutmeg/hybrid.jpg"
        img-class="aspect-auto"
        class="w-20"
      >
        far away
      </PhotoFigure>
    </ImageRow>

    <p>
      Here's a combination of my friend, Adam, and me when we went Axe Throwing a few months back.
      Close up, Adam as a viking is most visible, but far away, it's just me in front of the target
      (this is unfortunately cropped but I'm happy because I hit the bullseye).
    </p>
    <HybridSet
      dir="pt2_2/own1"
    >
      <template #low>
        thumbs up (low freq)
      </template>
      <template #high>
        viking (high freq)
      </template>
    </HybridSet>

    <p>
      Here's a combination of two carvings I saw in Ellora when I visited India over summer.
      Honnestly, didn't end up working the greatest since the first carving is dark with
      lots of magnitude in the lower frequencies and the second carving is evenly lit with
      fairly weak high frequency magnitude.
    </p>
    <HybridSet
      dir="pt2_2/own2"
    >
      <template #low>
        first carving (low freq)
      </template>
      <template #high>
        second carving (high freq)
      </template>
    </HybridSet>

    <p>
      My brother and I have the same beanie and I have a selfie of the two of us in the same lighting, and same angle.
      Thought it would be funny to put them together, up close his beard and eyebrows show up, and from far away my smile comes out.
    </p>
    <HybridSet
      dir="pt2_2/extra1"
    >
      <template #low>
        me (low freq)
      </template>
      <template #high>
        my brother (high freq)
      </template>
    </HybridSet>

    <h3 id="part-2-3">
      Part 2.3: Gaussian and Laplacian stacks
    </h3>
    <p>
      For the Gaussian stack, I double the blur at every level starting at 2px. Adding up the
      whole Laplacian stack gives back the original exactly. Here are 6 levels for the apple and
      the orange. The Laplacian bands are pretty faint, so I show zero as mid gray and scale each
      band by its 99th percentile value so you can actually see them:
    </p>
    <template
      v-for="fruit in ['apple', 'orange']"
      :key="fruit"
    >
      <ImageGrid class="grid-cols-3 sm:grid-cols-6">
        <PhotoFigure
          v-for="i in [0, 1, 2, 3, 4, 5]"
          :key="`g${i}`"
          :src="`/photos/proj2/pt2_3/${fruit}/g${i}.jpg`"
          img-class="aspect-square"
        >
          {{ fruit }} G{{ i }}
        </PhotoFigure>
        <PhotoFigure
          v-for="i in [0, 1, 2, 3, 4, 5]"
          :key="`l${i}`"
          :src="`/photos/proj2/pt2_3/${fruit}/l${i}.jpg`"
          img-class="aspect-square"
        >
          {{ fruit }} L{{ i }}
        </PhotoFigure>
      </ImageGrid>
    </template>
    <p>
      Recreation of fig 3.42 from Szeliski:
    </p>
    <ImageGrid class="grid-cols-3 sm:grid-cols-3 max-w-xl mx-auto">
      <PhotoFigure
        src="/photos/proj2/pt2_3/fig342/apple_0.jpg"
        img-class="aspect-square"
      >
        (&zwnj;a) apple, level 0
      </PhotoFigure>
      <PhotoFigure
        src="/photos/proj2/pt2_3/fig342/orange_0.jpg"
        img-class="aspect-square"
      >
        (&zwnj;b) orange, level 0
      </PhotoFigure>
      <PhotoFigure
        src="/photos/proj2/pt2_3/fig342/combined_0.jpg"
        img-class="aspect-square"
      >
        (&zwnj;c) combined, level 0
      </PhotoFigure>
      <PhotoFigure
        src="/photos/proj2/pt2_3/fig342/apple_2.jpg"
        img-class="aspect-square"
      >
        (&zwnj;d) apple, level 2
      </PhotoFigure>
      <PhotoFigure
        src="/photos/proj2/pt2_3/fig342/orange_2.jpg"
        img-class="aspect-square"
      >
        (&zwnj;e) orange, level 2
      </PhotoFigure>
      <PhotoFigure
        src="/photos/proj2/pt2_3/fig342/combined_2.jpg"
        img-class="aspect-square"
      >
        (&zwnj;f) combined, level 2
      </PhotoFigure>
      <PhotoFigure
        src="/photos/proj2/pt2_3/fig342/apple_4.jpg"
        img-class="aspect-square"
      >
        (&zwnj;g) apple, level 4
      </PhotoFigure>
      <PhotoFigure
        src="/photos/proj2/pt2_3/fig342/orange_4.jpg"
        img-class="aspect-square"
      >
        (&zwnj;h) orange, level 4
      </PhotoFigure>
      <PhotoFigure
        src="/photos/proj2/pt2_3/fig342/combined_4.jpg"
        img-class="aspect-square"
      >
        (&zwnj;i) combined, level 4
      </PhotoFigure>
      <PhotoFigure
        src="/photos/proj2/pt2_3/fig342/apple_sum.jpg"
        img-class="aspect-square"
      >
        (&zwnj;j) apple, collapsed
      </PhotoFigure>
      <PhotoFigure
        src="/photos/proj2/pt2_3/fig342/orange_sum.jpg"
        img-class="aspect-square"
      >
        (&zwnj;k) orange, collapsed
      </PhotoFigure>
      <PhotoFigure
        src="/photos/proj2/pt2_3/fig342/combined_sum.jpg"
        img-class="aspect-square"
      >
        (&zwnj;l) combined, collapsed
      </PhotoFigure>
    </ImageGrid>

    <h3 id="part-2-4">
      Part 2.4: Multiresolution blending (a.k.a. the oraple!)
    </h3>
    <p>
      At each of the 6 levels, I weigh image A's Laplacian band by the level's blurred mask and image B's band by
      one minus the mask, add the two together, and then add up the results from every level to get the final image.
      Since the mask gets blurrier at each level, the low frequencies end up blended over a soft seam and the
      high frequencies over a sharp one, which is what makes the seam disappear.
    </p>
    <ImageGrid class="grid-cols-2 sm:grid-cols-2">
      <PhotoFigure
        src="/photos/proj2/pt2_4/oraple/a.jpg"
        img-class="aspect-square"
      >
        apple
      </PhotoFigure>
      <PhotoFigure
        src="/photos/proj2/pt2_4/oraple/b.jpg"
        img-class="aspect-square"
      >
        orange
      </PhotoFigure>
      <PhotoFigure
        src="/photos/proj2/pt2_4/oraple/naive.jpg"
        img-class="aspect-square"
      >
        hard mask
      </PhotoFigure>
      <PhotoFigure
        src="/photos/proj2/pt2_4/oraple/blend.jpg"
        img-class="aspect-square"
      >
        oraple!
      </PhotoFigure>
    </ImageGrid>

    <p>
      Here's a straight seam of two takeout tubs I got from Good Mong Kok in SF.
    </p>
    <BlendSet
      dir="pt2_4/own1"
    >
      <template #a>
        wontons
      </template>
      <template #b>
        noodles
      </template>
    </BlendSet>

    <p>
      For the irregular mask one, I masked the top of the Empire State Building and placed it into a photo I took
      from Doe. I scaled the building and pasted it in, traced its outline for the mask, and cut the mask
      off at the treeline so it looks like it's standing behind the trees. Both photos are at night, so the lighting
      mostly matches. The multiresolution blend takes care of the edge between New York's pitch black sky and
      Berkeley's hazy brown one.
    </p>
    <BlendSet
      dir="pt2_4/own2"
    >
      <template #a>
        Berkeley from Doe + Empire State, pasted
      </template>
      <template #b>
        Berkeley from Doe
      </template>
    </BlendSet>

    <p>
      Again from my summer in India, I lined up mosques from Fatehpur Sikri and the Taj Mahal on the width of their main domes
      to create one long mosque that goes from white marble to brown stone:
    </p>
    <BlendSet
      dir="pt2_4/extra1"
    >
      <template #a>
        mosque at the Taj Mahal
      </template>
      <template #b>
        Jama Masjid, Fatehpur Sikri
      </template>
    </BlendSet>

    <p>
      Here's the whole process for my favorite (the Empire State in Berkeley), laid out like Figure 10 in Burt annd Adelson:
    </p>
    <ImageGrid class="grid-cols-3 sm:grid-cols-6">
      <template
        v-for="side in ['a', 'b', 'combined']"
        :key="side"
      >
        <PhotoFigure
          v-for="i in [0, 1, 2, 3, 4, 5]"
          :key="`${side}_${i}`"
          :src="`/photos/proj2/pt2_4/own2/bands/${side}_${i}.jpg`"
          img-class="aspect-auto"
        >
          {{ side }}, L{{ i }}
        </PhotoFigure>
      </template>
    </ImageGrid>

    <h2 id="learned">
      What I learned
    </h2>
    <p>
      The coolest thing I learned from this project is how much you can do by picking the frequencies
      of ann image you'd like to keep. Sharpening basically just boosts the high frequencies, hybrids
      keeping the low ones from one image and the highs from another, and blending is just mixing separately
      for each frequency band. Every time I'd been introduced to images of Fourier transforms before, I've
      struggled really understanding how they correspond with the image they represent, so this project helped
      me sort of build that linking in my mind.
    </p>
  </div>
</template>
