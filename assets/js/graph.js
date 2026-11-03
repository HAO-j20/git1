/* =============================================================
 * 药搭子 · 关系图谱
 * -------------------------------------------------------------
 * 不引入 d3 之类的图形库，手写一个够用的力导向布局：
 *   · 节点之间互相排斥（库仑力）
 *   · 有边相连的节点互相吸引（胡克弹簧）
 *   · 所有节点被轻轻拉向画布中心，避免飘走
 * 迭代若干轮后直接渲染成 SVG，交互简单、体积为零。
 * ============================================================= */

(function (YDZ) {
  'use strict';

  var SVG_NS = 'http://www.w3.org/2000/svg';

  function el(name, attrs) {
    var node = document.createElementNS(SVG_NS, name);
    for (var k in attrs) {
      if (Object.prototype.hasOwnProperty.call(attrs, k)) node.setAttribute(k, attrs[k]);
    }
    return node;
  }

  /* 力导向布局 */
  function layout(nodes, links, width, height) {
    var cx = width / 2, cy = height / 2;

    nodes.forEach(function (n, i) {
      var angle = (i / nodes.length) * Math.PI * 2;
      var radius = Math.min(width, height) * 0.28;
      n.x = cx + Math.cos(angle) * radius;
      n.y = cy + Math.sin(angle) * radius;
      n.vx = 0; n.vy = 0;
    });

    var byId = {};
    nodes.forEach(function (n) { byId[n.id] = n; });

    for (var iter = 0; iter < 420; iter++) {
      /* 1. 排斥 */
      for (var i = 0; i < nodes.length; i++) {
        for (var j = i + 1; j < nodes.length; j++) {
          var a = nodes[i], b = nodes[j];
          var dx = b.x - a.x, dy = b.y - a.y;
          var dist2 = dx * dx + dy * dy || 0.01;
          var dist = Math.sqrt(dist2);
          var force = 14000 / dist2;
          var fx = (dx / dist) * force;
          var fy = (dy / dist) * force;
          a.vx -= fx; a.vy -= fy;
          b.vx += fx; b.vy += fy;
        }
      }

      /* 2. 吸引 */
      links.forEach(function (l) {
        var a = byId[l.source], b = byId[l.target];
        if (!a || !b) return;
        var dx = b.x - a.x, dy = b.y - a.y;
        var dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
        var ideal = l.kind === 'risk' ? 200 : 105;
        var force = (dist - ideal) * 0.04;
        var fx = (dx / dist) * force;
        var fy = (dy / dist) * force;
        a.vx += fx; a.vy += fy;
        b.vx -= fx; b.vy -= fy;
      });

      /* 3. 向心 + 阻尼 + 边界 */
      nodes.forEach(function (n) {
        n.vx += (cx - n.x) * 0.006;
        n.vy += (cy - n.y) * 0.006;
        n.vx *= 0.85;
        n.vy *= 0.85;
        n.x += n.vx;
        n.y += n.vy;
        var pad = n.r + 42;
        n.x = Math.max(pad, Math.min(width - pad, n.x));
        n.y = Math.max(pad + 10, Math.min(height - pad - 10, n.y));
      });
    }
  }

  /**
   * 渲染图谱
   * @param {SVGElement} svg
   * @param {Array} cart     [{ drugId }]
   * @param {Object} analysis 引擎返回的分析结果
   */
  function render(svg, cart, analysis) {
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    var width = 720, height = 460;
    svg.setAttribute('viewBox', '0 0 ' + width + ' ' + height);

    if (!cart.length) {
      var hint = el('text', {
        x: width / 2, y: height / 2, 'text-anchor': 'middle',
        'font-size': '14', fill: '#94a3b8'
      });
      hint.textContent = '往药箱里加几种药，这里会长出一张关系图';
      svg.appendChild(hint);
      return;
    }

    var drugs = cart.map(function (c) { return YDZ.engine.drugById(c.drugId); }).filter(Boolean);

    /* --- 组装节点 --- */
    var nodes = [];
    var nodeIndex = {};
    var links = [];

    drugs.forEach(function (d) {
      var id = 'drug:' + d.id;
      nodeIndex[id] = { id: id, type: 'drug', label: d.brand || shortDrugName(d.name), r: 21 };
      nodes.push(nodeIndex[id]);
    });

    var ingSeen = {};
    drugs.forEach(function (d) {
      d.ingredients.forEach(function (ing) {
        var nid = 'ing:' + ing;
        if (!ingSeen[ing]) {
          ingSeen[ing] = true;
          var ingInfo = YDZ.INGREDIENTS[ing] || { name: ing };
          nodeIndex[nid] = { id: nid, type: 'ingredient', label: ingInfo.name, r: 12 };
          nodes.push(nodeIndex[nid]);
        }
        links.push({ source: 'drug:' + d.id, target: nid, kind: 'contains' });
      });
    });

    /* --- 风险边：直接连在成分之间 --- */
    (analysis ? analysis.risks : []).forEach(function (r) {
      if (r.type !== 'interaction' && r.type !== 'duplicate') return;
      var ings = (r.ingredients || []).filter(function (x) { return ingSeen[x]; });
      for (var i = 0; i < ings.length; i++) {
        for (var j = i + 1; j < ings.length; j++) {
          links.push({
            source: 'ing:' + ings[i], target: 'ing:' + ings[j],
            kind: 'risk', level: r.level
          });
        }
      }
      /* 重复成分：给这个成分自己挂一个「重复」标记 */
      if (r.type === 'duplicate' && ings.length === 1 && nodeIndex['ing:' + ings[0]]) {
        nodeIndex['ing:' + ings[0]].flagged = true;
      }
    });

    layout(nodes, links, width, height);

    /* --- 绘制边 --- */
    var edgeLayer = el('g', {});
    var byId = {};
    nodes.forEach(function (n) { byId[n.id] = n; });

    links.forEach(function (l) {
      var a = byId[l.source], b = byId[l.target];
      if (!a || !b) return;

      if (l.kind === 'risk') {
        edgeLayer.appendChild(el('line', {
          x1: a.x, y1: a.y, x2: b.x, y2: b.y,
          stroke: l.level === 'high' ? '#e5484d' : (l.level === 'medium' ? '#ef8b1f' : '#3e63dd'),
          'stroke-width': l.level === 'high' ? 2.4 : 1.6,
          'stroke-dasharray': l.level === 'high' ? '' : '5 4',
          'stroke-opacity': .72,
          'stroke-linecap': 'round'
        }));
      } else {
        edgeLayer.appendChild(el('line', {
          x1: a.x, y1: a.y, x2: b.x, y2: b.y,
          stroke: '#cbd5e1', 'stroke-width': 1.2, 'stroke-opacity': .9
        }));
      }
    });
    svg.appendChild(edgeLayer);

    /* --- 绘制节点 --- */
    var nodeLayer = el('g', {});
    nodes.forEach(function (n) {
      var g = el('g', { class: 'node-group' });

      g.appendChild(el('circle', {
        class: 'node-circle',
        cx: n.x, cy: n.y, r: n.r,
        fill: n.type === 'drug' ? '#0e9f8e' : (n.flagged ? '#e5484d' : '#94a3b8'),
        'fill-opacity': n.type === 'drug' ? .95 : (n.flagged ? .95 : .5),
        stroke: n.type === 'drug' ? '#0b7f72' : (n.flagged ? '#c93a3f' : '#7c8a9c'),
        'stroke-width': n.type === 'drug' ? 2 : 1.2
      }));

      /* 药品节点用一个小圆点做「药丸」意象，避免中文塞进圆里被截断 */
      if (n.type === 'drug') {
        g.appendChild(el('circle', {
          cx: n.x, cy: n.y, r: 7,
          fill: '#ffffff', 'fill-opacity': .9
        }));
      }

      var label = el('text', {
        class: 'node-label',
        x: n.x, y: n.y + n.r + (n.type === 'drug' ? 16 : 14),
        'text-anchor': 'middle',
        'font-weight': n.type === 'drug' ? '700' : '400',
        fill: n.type === 'drug' ? '#0f172a' : '#64748b'
      });
      label.textContent = n.type === 'drug' ? shortDrugName(n.label) : n.label;
      g.appendChild(label);

      nodeLayer.appendChild(g);
    });
    svg.appendChild(nodeLayer);
  }

  /* 图谱里药名太长会互相压住，去掉剂型后缀 */
  function shortDrugName(name) {
    return name.replace(/(缓释胶囊|肠溶胶囊|肠溶片|控释片|缓释片|混悬液|乳胶剂|糖浆|颗粒|胶囊|片|散|水)$/g, '');
  }

  YDZ.graph = { render: render };
})(window.YDZ);
