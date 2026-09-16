// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({

  modules: [
    "@nuxt/eslint",
    "@nuxt/fonts",
    "@nuxtjs/tailwindcss",
    "@nuxt/icon",
  ],
  devtools: { enabled: true },
  app: {
    head: {
      title: "CS180",
      titleTemplate: title => (title ? `${title} - CS180` : "CS180"),
      link: [
        { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
      ],
      meta: [
        {
          name: "description",
          content: "Project write-ups for CS180: Intro to Computer Vision and Computational Photography.",
        },
      ],
    },
  },
  css: ["katex/dist/katex.min.css"],
  compatibilityDate: "2025-07-15",

  eslint: {
    config: {
      stylistic: true,
    },
  },
});
