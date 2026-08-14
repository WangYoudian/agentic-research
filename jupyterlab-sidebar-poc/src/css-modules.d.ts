/**
 * CSS 模块类型声明。
 * 让 TypeScript 认识 `import '../style/index.css'` 这类 side-effect 导入。
 * 实际打包由 Rspack/webpack 处理，TS 只需不报错即可。
 */
declare module '*.css';
