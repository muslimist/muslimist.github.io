module.exports = function(eleventyConfig) {
  // not working, copied manually
  //eleventyConfig.addPassthroughCopy({ "src/.wellknown": ".wellknown" });
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addPassthroughCopy({ "src/quran": "quran" });
  eleventyConfig.addPassthroughCopy({ "src/404.html": "404.html" });
  eleventyConfig.addPassthroughCopy({ "src/_config.yml": "_config.yml" });
  eleventyConfig.addPassthroughCopy({ "src/CNAME": "CNAME" });
  eleventyConfig.addPassthroughCopy({ "src/manifest.webmanifest": "manifest.webmanifest" });
  eleventyConfig.addPassthroughCopy({ "src/service-worker.js": "service-worker.js" });
  
  return {
    dir: {
      input: "src",
      output: "docs",
    }
  }
};