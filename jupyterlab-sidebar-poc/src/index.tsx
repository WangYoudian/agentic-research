import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
  ILayoutRestorer,
} from '@jupyterlab/application';
import { ReactWidget } from '@jupyterlab/ui-components';
import React, { useState } from 'react';

import '../style/index.css';

/**
 * React 组件：按钮计数 + 输入回显。
 * 对比 Lumino Widget 版：状态由 React 管理，state 变化自动重渲染，无需手动操作 DOM。
 */
function CounterBlock() {
  const [count, setCount] = useState(0);
  const [echo, setEcho] = useState('');

  const onKeyDown = (evt: React.KeyboardEvent<HTMLInputElement>): void => {
    if (evt.key === 'Enter') {
      setEcho(`你输入了：${evt.currentTarget.value}`);
    }
  };

  return (
    <div className="sidebar-poc-body">
      <button className="sidebar-poc-btn" onClick={() => setCount(c => c + 1)}>
        点我 +1
      </button>
      <p className="sidebar-poc-counter">
        点击次数：<span>{count}</span>
      </p>
      <input placeholder="输入内容后回车" onKeyDown={onKeyDown} />
      <p className="sidebar-poc-echo">{echo}</p>
    </div>
  );
}

/**
 * 整个侧边栏内容（React 树）。
 */
function SidebarPocApp() {
  return (
    <>
      <div className="sidebar-poc-header">
        <h2>Sidebar POC (ReactWidget)</h2>
        <p>
          这是 ReactWidget 版本：外层是 Lumino Widget（可 dock / 关闭 / 恢复），
          内层是 React 组件（状态自动重渲染）。改 <code>src/index.tsx</code> 后执行{' '}
          <code>npm run build</code> 并刷新即可。
        </p>
      </div>
      <CounterBlock />
      <div className="sidebar-poc-footer">
        <span>
          token: <code>ILayoutRestorer</code> + <code>ReactWidget</code>
        </span>
      </div>
    </>
  );
}

/**
 * 插件入口。用 ReactWidget.create() 把 React 组件包成 Lumino Widget，
 * 再走 app.shell 左侧栏与 ILayoutRestorer。
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'sidebar-poc:plugin',
  description: 'A JupyterLab sidebar extension POC (ReactWidget).',
  autoStart: true,
  requires: [ILayoutRestorer],
  activate: (app: JupyterFrontEnd, restorer: ILayoutRestorer): void => {
    const widget = ReactWidget.create(<SidebarPocApp />);
    widget.id = 'sidebar-poc-panel';
    widget.title.label = 'POC Panel';
    widget.title.caption = 'Sidebar POC (ReactWidget)';
    widget.title.closable = true;
    widget.addClass('sidebar-poc');

    // 左侧栏：rank 越大越靠下
    app.shell.add(widget, 'left', { rank: 900 });

    // 注册到 layout restorer，关闭后可恢复
    restorer.add(widget, 'sidebar-poc-panel');

    console.log('sidebar-poc: ReactWidget plugin activated');
  },
};

export default plugin;
