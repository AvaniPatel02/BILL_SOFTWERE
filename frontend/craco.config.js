module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Find the source-map-loader rule and exclude html2pdf.js
      const sourceMapLoader = webpackConfig.module.rules.find(
        (rule) =>
          rule.oneOf &&
          rule.oneOf.some(
            (r) =>
              r.use &&
              r.use.some(
                (u) =>
                  typeof u === "object" &&
                  u.loader &&
                  u.loader.includes("source-map-loader")
              )
          )
      );
      if (sourceMapLoader) {
        sourceMapLoader.oneOf.forEach((r) => {
          if (
            r.use &&
            r.use.some(
              (u) =>
                typeof u === "object" &&
                u.loader &&
                u.loader.includes("source-map-loader")
            )
          ) {
            r.exclude = [
              ...(r.exclude || []),
              /node_modules[\\/]html2pdf\.js[\\/]/
            ];
          }
        });
      }
      return webpackConfig;
    },
  },
}; 