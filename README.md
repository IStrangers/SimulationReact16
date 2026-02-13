

# SimulationReact

一个用于学习和理解 React 16 核心原理的轻量级模拟实现。

## 简介

SimulationReact 是一个基于 React 16 核心概念构建的教学性项目，旨在帮助开发者深入理解 React 的内部工作原理。通过阅读和实践这个项目，你将能够掌握 React 的核心机制，包括 Fiber 架构、调和算法、组件生命周期以及 Hooks 等重要概念。

本项目完整实现了 React 的核心功能，包括类组件、函数组件、状态管理、Refs 和 Effects 等特性。虽然这是一个简化版本，但它保留了 React 的核心设计思想，是学习 React 源码的优秀入门资源。

## 软件架构

本项目采用 Monorepo 结构组织，包含以下核心包：

**packages/react** - React 核心包，提供创建组件和元素的核心 API。主要功能包括 createElement 用于创建 React 元素、Component 作为所有类组件的基类支持 setState 方法、useState 和 useReducer Hooks 用于函数组件状态管理，以及完整的 Fiber 调和系统处理组件更新。

**packages/react-dom** - DOM 渲染包，负责将 React 元素渲染到真实的 DOM 环境中。提供了 render 函数将元素挂载到指定容器、DOM 节点的创建和更新逻辑、以及针对不同节点类型的处理机制。

**packages/shared** - 共享工具包，包含整个项目共用的工具函数。这些工具用于类型检查、字符串处理、数组操作等基础功能，为其他包提供通用的辅助功能。

**packages/types** - TypeScript 类型定义包，声明了项目中使用的所有类型常量。包括节点类型标识如 TAG_ELEMENT 和 TAG_TEXT，以及副作用类型如 PLACEMENT 和 DELETION。

项目的核心架构基于 Fiber 实现，这是一种新的调和引擎，它允许 React 将协调工作拆分成小单元，并在必要时暂停、恢复或放弃这些工作。这种设计使得 React 能够在保持 UI 响应性的同时，实现更复杂的特性如并发模式和 Suspense。

## 核心功能

本项目实现了 React 16 的核心功能集。组件系统方面，支持类组件继承自 Component 基类并使用 setState 更新状态，同时支持函数组件配合 Hooks 实现状态和副作用管理。Fiber 架构方面，实现了增量渲染机制，能够将渲染工作拆分成小单元执行，支持任务调度和优先级管理。

调和算法方面，采用双缓冲技术处理 Fiber 树对比，通过 reconcileChildren 实现高效的子节点协调，支持三种类型的副作用标记：PLACEMENT 用于新节点插入、UPDATE 用于现有节点更新、DELETION 用于节点删除。

Hooks 系统方面，useState 提供基本的状态管理功能，useReducer 支持更复杂的状态逻辑，两个 Hooks 都完整实现了更新队列机制。DOM 操作方面，支持原生 HTML 元素的创建和更新、属性设置和对比、文本节点处理，以及注释节点的渲染。

## 安装教程

本项目使用 pnpm 作为包管理器，采用 Monorepo 方式管理多个子包。确保你的开发环境中已安装 Node.js 和 pnpm。

克隆项目仓库到本地后，进入项目根目录执行 pnpm install 安装所有依赖。安装完成后，可以使用以下命令进行开发构建。

开发模式构建会启动监听模式，自动重新构建修改的文件：
```bash
pnpm run dev
```

生产模式构建会生成优化后的输出文件：
```bash
pnpm run build
```

## 使用说明

### 基本示例

创建一个简单的 HTML 文件引入构建后的 React 和 ReactDOM 库，即可开始使用：

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>SimulationReact 示例</title>
</head>
<body>
  <div id="root"></div>
  <script src="./dist/react.iife.js"></script>
  <script src="./dist/react-dom.iife.js"></script>
  <script>
    const { createElement, Component } = React;
    const { render } = ReactDOM;

    class Counter extends Component {
      constructor(props) {
        super(props);
        this.state = { count: 0 };
      }

      handleClick = () => {
        this.setState({ count: this.state.count + 1 });
      }

      render() {
        return createElement(
          'div',
          { onClick: this.handleClick },
          createElement('h1', null, '计数器'),
          createElement('p', null, `当前计数: ${this.state.count}`)
        );
      }
    }

    render(
      createElement(Counter),
      document.getElementById('root')
    );
  </script>
</body>
</html>
```

### 函数组件示例

使用 Hooks 创建函数组件：

```javascript
const { createElement, useState, Component } = React;

function Counter() {
  const [count, setCount] = useState(0);

  return createElement(
    'div',
    { onClick: () => setCount(count + 1) },
    createElement('h2', null, '函数组件计数器'),
    createElement('p', null, `点击次数: ${count}`)
  );
}

render(
  createElement(Counter),
  document.getElementById('root')
);
```

### 嵌套组件示例

构建更复杂的组件树结构：

```javascript
function App() {
  return createElement(
    'div',
    { className: 'app' },
    createElement(
      'header',
      null,
      createElement('h1', null, '我的应用')
    ),
    createElement(
      'main',
      null,
      createElement(Article, { title: '学习 React' }),
      createElement(Article, { title: '使用 SimulationReact' })
    )
  );
}

function Article({ title }) {
  return createElement(
    'article',
    null,
    createElement('h3', null, title),
    createElement('p', null, '这是文章内容的描述...')
  );
}
```

## 项目结构

```
SimulationReact/
├── packages/
│   ├── react/                 # React 核心包
│   │   ├── index.ts          # 导出 createElement 和 Component
│   │   ├── src/
│   │   │   ├── component.ts  # Component 类实现
│   │   │   ├── scheduler.ts  # Fiber 调度系统
│   │   │   └── updater.ts    # 状态更新队列
│   │   └── package.json
│   ├── react-dom/            # DOM 渲染包
│   │   ├── index.ts         # 导出 render 函数
│   │   └── package.json
│   ├── shared/              # 共享工具
│   │   ├── index.ts
│   │   ├── src/
│   │   │   └── utils.ts     # 工具函数集合
│   │   └── package.json
│   └── types/               # 类型定义
│       ├── src/
│       │   ├── effectType.ts  # 副作用类型
│       │   └── nodeType.ts    # 节点类型
│       └── package.json
├── test/                    # 测试构建产物
├── scripts/                 # 构建脚本
├── package.json
├── tsconfig.json
└── pnpm-lock.yaml
```

## 参与贡献

欢迎对本项目进行贡献！你可以通过以下方式参与：

**问题反馈**：如果你发现了 bug 或有任何建议，请通过 Gitee 的 Issues 页面提交详细的问题描述，包括复现步骤和期望行为。

**代码贡献**：Fork 本仓库，创建新分支实现你的功能或修复问题，提交 Pull Request 前确保代码符合项目的编码规范。

**文档完善**：帮助完善项目文档、添加更多使用示例、改进注释说明，让项目更易于理解和使用。

## 许可证

本项目采用 MIT 许可证开源。

## 学习资源

本项目参考了 React 16 的核心设计思想，适合作为学习 React 内部原理的入门材料。建议配合 React 官方文档和源码阅读，以获得更深入的理解。通过本项目的学习，你将能够更好地理解 React 的工作原理，为阅读官方源码打下坚实的基础。