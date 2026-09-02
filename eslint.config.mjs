import nextConfig from "eslint-config-next";

const eslintConfig = [
  ...nextConfig,
  {
    ignores: ["src/generated/**", "scripts/backup/**"],
  },
];

export default eslintConfig;
