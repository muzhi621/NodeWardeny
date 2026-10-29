// 阿里云 FC Web 函数 / 自定义运行时 启动入口。
//
// 启动前设置 FC 环境下的安全默认值，然后加载 esbuild 打包好的 server/index.mjs
// （纯 JS，运行时无需 tsx/esbuild，跨平台通用，避免 Windows/Linux 二进制差异）。
//
// 为什么需要它：FC 代码目录只读，仅 /tmp 可写。这里把 DATA_DIR 默认指向 /tmp，
// 保证开箱即用（仍可被环境变量覆盖）。

process.env.NODE_ENV = process.env.NODE_ENV || 'production';
// 可写数据目录：默认 /tmp（FC 唯一可写区），可用 DATA_DIR 环境变量覆盖
process.env.DATA_DIR = process.env.DATA_DIR || '/tmp/nodewarden';
process.env.ATTACHMENTS_DIR = process.env.ATTACHMENTS_DIR || `${process.env.DATA_DIR}/attachments`;
// 监听端口：FC「监听端口」默认 9000，保持一致（可用 PORT 覆盖）
process.env.PORT = process.env.PORT || '9000';

// 1) 注册 cloudflare:workers 桩（打包产物里仍有该 import，运行时映射为桩）
await import('./server/register-cf-stub.mjs');

// 2) 启动打包好的服务（纯 JS）
await import('./server/index.mjs');
