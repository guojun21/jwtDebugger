# JWT Debugger

一个类似 [jwt.io](https://jwt.io) 的本地 JWT 解析工具，使用 React 构建。

## 功能特性

- 🔍 **JWT 解码**: 解析 JWT 的 Header、Payload 和 Signature
- 🎨 **语法高亮**: 不同颜色区分 JWT 的三个部分
- 📊 **双视图模式**: JSON 和表格两种展示方式
- ⏰ **时间戳转换**: 自动转换 exp、iat、nbf 等时间字段
- ✅ **过期检测**: 自动检测 JWT 是否已过期
- 🔒 **本地解析**: 所有解析在浏览器本地完成，不发送任何数据到服务器

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm start
```

访问 http://localhost:3000 即可使用。

### 构建生产版本

```bash
npm run build
```

## 使用方法

1. 将 JWT 粘贴到左侧输入框
2. 右侧会自动显示解码后的 Header 和 Payload
3. 点击"表格"按钮可以切换到表格视图
4. 点击"示例"按钮可以加载一个示例 JWT

## 技术栈

- React 18
- 纯 CSS（暗色主题）

## 安全说明

所有 JWT 解析均在浏览器本地完成，不会将您的 Token 发送到任何服务器。但请注意：

- 不要在公共电脑上解析包含敏感信息的 JWT
- JWT 中的信息是 Base64 编码的，而非加密的，任何人都可以解码
- 本工具不验证签名，仅做解码展示

## 参考

- [jwt.io](https://jwt.io) - JWT 官方调试工具
- [RFC 7519](https://tools.ietf.org/html/rfc7519) - JSON Web Token 规范
