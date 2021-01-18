module.exports = function(eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  return {
    dir: {
      input: "src",
      output: "docs",
    }
  }
};