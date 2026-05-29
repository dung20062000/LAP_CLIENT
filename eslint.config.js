/**
 * Người tạo: DungBT
 * Ngày tạo: 29/05/2026
 * Cấu hình ESLint cho LAP_CLIENT — Angular 21 + TypeScript strict mode
 */
import tsparser from '@typescript-eslint/parser';
import tseslintPlugin from '@typescript-eslint/eslint-plugin';
import angularEslintPlugin from '@angular-eslint/eslint-plugin';
import angularTemplateEslintPlugin from '@angular-eslint/eslint-plugin-template';
import angularParser from '@angular-eslint/template-parser';
import { fixupPluginRules, includeIgnoreFile } from '@eslint/compat';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const root = __dirname;

export default [
  // Bỏ qua các đường dẫn trong .gitignore
  includeIgnoreFile(`${root}/.gitignore`),

  // Cấu hình cho file TypeScript / JavaScript
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': fixupPluginRules(tseslintPlugin),
      '@angular': fixupPluginRules(angularEslintPlugin),
    },
    rules: {
      // Quy tắc TypeScript
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],
      '@typescript-eslint/explicit-function-return-type': ['error', {
        allowExpressions: true,
        allowTypedFunctionExpressions: true,
      }],

      // Quy tắc Angular
      '@angular/component-class-suffix': 'error',
      '@angular/component-max-inline-declarations': ['warn', {
        template: 3,
        styles: 2,
      }],
      '@angular/contextual-lifecycle': 'error',
      '@angular/no-attribute-decorator': 'error',
      '@angular/no-input-prefix': ['error', {
        prefixes: ['ng', 'ngx', 'mat'],
      }],
      '@angular/no-output-native': 'error',
      '@angular/no-output-on-prefix': 'error',
      '@angular/no-output-rename': 'error',
      '@angular/relative-url-prefix': 'error',
      '@angular/use-component-selector': 'error',
      '@angular/use-component-view-encapsulation': 'error',
      '@angular/use-injectable-provided-in': 'error',

      // Thực hành chung
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-unused-vars': 'off',
    },
  },

  // Cấu hình cho Angular HTML Templates
  {
    files: ['**/*.html'],
    languageOptions: {
      parser: angularParser,
    },
    plugins: {
      '@angular-eslint/template': fixupPluginRules(angularTemplateEslintPlugin),
    },
    rules: {
      // Accessibility
      '@angular-eslint/template/alt-text': 'error',
      '@angular-eslint/template/elements-content': 'error',
      '@angular-eslint/template/label-has-associated-control': 'error',
      '@angular-eslint/template/table-scope': 'error',
      '@angular-eslint/template/valid-aria': 'error',
      '@angular-eslint/template/no-positive-tabindex': 'error',
      '@angular-eslint/template/interactive-supports-focus': 'error',
      '@angular-eslint/template/click-events-have-key-events': 'error',
      '@angular-eslint/template/mouse-events-have-key-events': 'error',

      // Tắt i18n vì dự án dùng custom TranslationService, không phải Angular i18n
      '@angular-eslint/template/i18n': 'off',

      // Quy tắc khác
      '@angular-eslint/template/no-inline-styles': 'off',
      '@angular-eslint/template/no-negated-async': 'error',
      '@angular-eslint/template/use-track-by-function': 'error',
      '@angular-eslint/template/prefer-control-flow': 'error',

      // Thứ tự thuộc tính bắt buộc:
      // StructuralDirectives → TemplateRef → AttributeBinding → InputBinding → TwoWayBinding → OutputBinding
      '@angular-eslint/template/attributes-order': ['error', {
        alphabetical: false,
        order: [
          'STRUCTURAL_DIRECTIVE',  // @if, @for, @switch
          'TEMPLATE_REFERENCE',   // #var
          'ATTRIBUTE_BINDING',    // [attr.xxx]
          'INPUT_BINDING',        // [prop]
          'TWO_WAY_BINDING',      // [(ngModel)]
          'OUTPUT_BINDING',       // (event)
        ],
      }],

      // Khác
      '@angular-eslint/template/banana-in-box': 'error',
      '@angular-eslint/template/no-distracting-elements': 'error',
      '@angular-eslint/template/no-duplicate-attributes': 'error',
      '@angular-eslint/template/no-nested-tags': 'error',
      '@angular-eslint/template/prefer-self-closing-tags': 'warn',
    },
  },

  // Các file / thư mục cần bỏ qua khi lint
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      '.angular/**',
      'coverage/**',
      '*.spec.ts',
    ],
  },
];
