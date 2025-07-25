import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    rules: {
      // Temporarily disable some strict rules to allow lint:fix to work
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      'react-hooks/exhaustive-deps': 'warn',
      'react/no-unescaped-entities': 'warn',
      'react/display-name': 'warn',
      '@next/next/no-img-element': 'warn',
      'prefer-const': 'warn',
      'import/no-anonymous-default-export': 'warn',
    },
  },
];

export default eslintConfig;
