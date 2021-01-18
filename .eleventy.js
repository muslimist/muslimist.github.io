module.exports = function(eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addPassthroughCopy({ "src/.wellknown": ".wellknown" });
  eleventyConfig.addPassthroughCopy({ "CNAME": "CNAME" });
  eleventyConfig.addPassthroughCopy({ "src/manifest.webmanifest": "manifest.webmanifest" });
  eleventyConfig.addPassthroughCopy({ "src/service-worker.js": "service-worker.js" });
  eleventyConfig.addPassthroughCopy({ "src/_config.yml": "_config.yml" });
  return {
    dir: {
      input: "src",
      output: "docs",
    }
  }
};