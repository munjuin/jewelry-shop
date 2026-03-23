// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    // 전역적으로 무시할 파일/폴더 추가
    ignores: ['eslint.config.mjs', 'dist/', 'node_modules/', 'coverage/'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    // 언어 옵션 및 환경 설정
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      // TS 프로젝트는 기본적으로 ESM 형식을 사용하므로 'module' 권장
      sourceType: 'module',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    // 규칙 설정
    rules: {
      // 프로젝트 특성에 맞춘 규칙 조정
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      
      // Prettier 규칙 (eslint-plugin-prettier/recommended 이후에 배치하여 덮어쓰기)
      "prettier/prettier": ["error", { endOfLine: "auto" }],
    },
  },
  // Prettier 설정은 항상 마지막에 위치하여 다른 서식 규칙과 충돌을 방지합니다.
  eslintPluginPrettierRecommended,
);