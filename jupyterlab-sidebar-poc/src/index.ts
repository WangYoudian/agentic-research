import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
  ILayoutRestorer,
} from '@jupyterlab/application';
import { Widget } from '@lumino/widgets';

import '../style/index.css';

/**
 * 一个简单的左侧边栏 Widget。
 *
 * 关键 API（对应 jupyter-architecture.md 第四章）：
 * - app.shell.add(widget, 'left', { rank })：把 widget 放进左侧栏
 * - restorer.add(widget, id)：让 JupyterLab 记住其状态（关闭后可从 View 菜单/命令恢复）
 */
class SidebarPocPanel extends Widget {
  private _clickCount = 0;

  constructor() {
    super();
    this.id = 'sidebar-poc-panel';
    this.title.label = 'POC Panel';
    this.title.caption = 'Sidebar POC（左侧边栏示例）';
    this.title.closable = true;
    this.addClass('sidebar-poc');

    this.node.innerHTML = `
      <div class="sidebar-poc-header">
        <h2>Sidebar POC</h2>
        <p>这是一个左侧边栏扩展 POC。<br/>改 <code>src/index.ts</code> 后执行 <code>npm run build</code> 并刷新即可看到变化。</p>
      </div>
      <div class="sidebar-poc-body">
        <button class="sidebar-poc-btn" id="poc-increment">点我 +1</button>
        <p class="sidebar-poc-counter">点击次数：<span id="poc-count">0</span></p>
        <input id="poc-input" placeholder="输入内容后回车" />
        <p class="sidebar-poc-echo" id="poc-echo"></p>
      </div>
      <div class="sidebar-poc-footer">
        <span>token: <code>ILayoutRestorer</code></span>
      </div>
    `;

    this.node
      .querySelector('#poc-increment')!
      .addEventListener('click', this._increment);
    (this.node.querySelector('#poc-input') as HTMLInputElement).addEventListener(
      'keydown',
      this._echo as EventListener
    );
  }

  private _increment = (): void => {
    this._clickCount += 1;
    this.node.querySelector('#poc-count')!.textContent = String(this._clickCount);
  };

  private _echo = (evt: KeyboardEvent): void => {
    if (evt.key !== 'Enter') {
      return;
    }
    const input = this.node.querySelector('#poc-input') as HTMLInputElement;
    const echo = this.node.querySelector('#poc-echo')!;
    echo.textContent = `你输入了：${input.value}`;
  };
}

/**
 * 插件入口。id 需全局唯一（惯例 <包名>:<插件名>）。
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'sidebar-poc:plugin',
  description: 'A JupyterLab sidebar extension POC.',
  autoStart: true,
  requires: [ILayoutRestorer],
  activate: (app: JupyterFrontEnd, restorer: ILayoutRestorer): void => {
    const panel = new SidebarPocPanel();

    // 左侧栏：rank 越大越靠下
    app.shell.add(panel, 'left', { rank: 900 });

    // 注册到 layout restorer，关闭后可恢复
    restorer.add(panel, 'sidebar-poc-panel');

    console.log('sidebar-poc: plugin activated');
  },
};

export default plugin;
