/* =============================================================
 * 药搭子 · 风险引擎与服药排程
 * -------------------------------------------------------------
 * 这一层不依赖界面，纯粹做两件事：
 *   1. analyze()  —— 把「药箱」翻译成「风险清单」
 *   2. schedule() —— 把「频次 + 间隔要求」翻译成「一天的时间表」
 * 之所以独立成层，是因为它最容易单独测试，也最容易讲清楚。
 * ============================================================= */

(function (YDZ) {
  'use strict';

  /* ---------- 常量 ---------- */

  /* 单项扣分，同时给总分设一个下限，避免「风险多到 0 分」看起来像程序坏了 */
  var LEVEL_WEIGHT = { high: 25, medium: 10, low: 4 };
  var MAX_PENALTY = 85;
  var LEVEL_ORDER = { high: 0, medium: 1, low: 2 };

  /* 部分药品的单次主成分剂量（mg），用于计算每日总量 */
  var DOSE_MG = {
    tylenol:          { acetaminophen: 500 },
    ganmaoling:       { acetaminophen: 200 },
    gankang:          { acetaminophen: 250 },
    baijiahei:        { acetaminophen: 325 },
    fenbid:           { ibuprofen: 300 },
    aspirin_ec:       { aspirin: 100 }
  };

  /* 不同服药频次对应的基准时间（分钟，从 0 点算起） */
  var FREQ_SLOTS = {
    1: [480],
    2: [480, 1200],
    3: [480, 780, 1140],
    4: [480, 720, 1020, 1320]
  };

  /* 与进餐关系的偏移量（分钟） */
  var TIMING_OFFSET = {
    '空腹': -30,
    '餐前': -30,
    '餐前 30 分钟': -30,
    '餐中': 0,
    '餐中或餐后': 15,
    '餐后': 30,
    '睡前': 0,
    '固定时间': 0,
    '按需': 0
  };

  /* ---------- 工具 ---------- */

  function toMinutes(hhmm) {
    var p = hhmm.split(':');
    return parseInt(p[0], 10) * 60 + parseInt(p[1], 10);
  }

  function toHHMM(minutes) {
    minutes = Math.max(0, Math.min(23 * 60 + 59, Math.round(minutes)));
    var h = Math.floor(minutes / 60);
    var m = minutes % 60;
    return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
  }

  function drugById(id) {
    for (var i = 0; i < YDZ.DRUGS.length; i++) {
      if (YDZ.DRUGS[i].id === id) return YDZ.DRUGS[i];
    }
    return null;
  }

  function ingredientName(id) {
    var it = YDZ.INGREDIENTS[id];
    return it ? it.name : id;
  }

  /* 两味成分之间是否有相互作用 */
  function findInteraction(a, b) {
    for (var i = 0; i < YDZ.INTERACTIONS.length; i++) {
      var it = YDZ.INTERACTIONS[i];
      if ((it.a === a && it.b === b) || (it.a === b && it.b === a)) return it;
    }
    return null;
  }

  /* 两味成分之间是否有间隔要求 */
  function findGap(a, b) {
    for (var i = 0; i < YDZ.GAP_RULES.length; i++) {
      var g = YDZ.GAP_RULES[i];
      if (g.a === a && g.b === b) return g;
      if (g.a === b && g.b === a) return g;
      if (g.a === a && g.b === '*') return g;
      if (g.a === b && g.b === '*') return g;
    }
    return null;
  }

  /* =============================================================
   * 一、风险分析
   * ============================================================= */

  /**
   * @param {Array}  cart  药箱条目 [{ drugId, customFreq? }]
   * @param {Object} opts  { population: 'elderly'|'child'|'pregnancy'|'liver'|'kidney'|null }
   * @returns {Object} { risks, summary, score }
   */
  function analyze(cart, opts) {
    opts = opts || {};
    var risks = [];

    var drugs = cart.map(function (c) { return drugById(c.drugId); }).filter(Boolean);

    /* ---- 1. 重复成分：不同药名，相同成分 ---- */
    var byIngredient = {};
    drugs.forEach(function (d) {
      d.ingredients.forEach(function (ing) {
        if (!byIngredient[ing]) byIngredient[ing] = [];
        byIngredient[ing].push(d);
      });
    });

    Object.keys(byIngredient).forEach(function (ing) {
      var list = byIngredient[ing];
      if (list.length < 2) return;

      var names = list.map(function (d) { return d.name; });
      var isHigh = ['acetaminophen', 'ibuprofen', 'chlorpheniramine', 'caffeine'].indexOf(ing) >= 0;

      risks.push({
        id: 'dup-' + ing,
        type: 'duplicate',
        level: isHigh ? 'high' : 'medium',
        title: '重复用药：' + list.length + ' 种药都含「' + ingredientName(ing) + '」',
        detail: '「' + names.join('」「') + '」中都含有' + ingredientName(ing) +
                '，同时服用等于加大了单种成分的剂量，可能出现超量。',
        advice: ing === 'acetaminophen'
          ? '对乙酰氨基酚每日总量不得超过 2 g，请只保留其中一种，或严格计算总量。'
          : '同类成分不建议叠加，保留一种即可。',
        drugs: list.map(function (d) { return d.id; }),
        ingredients: [ing]
      });
    });

    /* ---- 2. 相互作用：成分两两配对 ---- */
    var seenPair = {};
    drugs.forEach(function (d1, i) {
      drugs.forEach(function (d2, j) {
        if (j <= i) return;
        d1.ingredients.forEach(function (a) {
          d2.ingredients.forEach(function (b) {
            var it = findInteraction(a, b);
            if (!it) return;
            var key = [it.a, it.b].sort().join('|');
            if (seenPair[key]) return;
            seenPair[key] = true;

            risks.push({
              id: 'int-' + key,
              type: 'interaction',
              level: it.level,
              title: it.title,
              detail: it.detail,
              advice: it.advice,
              drugs: [d1.id, d2.id],
              ingredients: [it.a, it.b]
            });
          });
        });
      });
    });

    /* ---- 3. 特殊人群 ---- */
    if (opts.population && YDZ.POPULATIONS[opts.population]) {
      var pop = YDZ.POPULATIONS[opts.population];
      var ingSet = {};
      drugs.forEach(function (d) {
        d.ingredients.forEach(function (ing) { ingSet[ing] = d; });
      });

      pop.rules.forEach(function (rule, idx) {
        var hit = rule.match.filter(function (m) { return ingSet[m]; });
        if (!hit.length) return;
        var hitDrugs = hit.map(function (m) { return ingSet[m]; });

        risks.push({
          id: 'pop-' + opts.population + '-' + idx,
          type: 'population',
          level: rule.level,
          title: pop.label + '：' + hit.map(ingredientName).join('、') + ' 需特别留意',
          detail: rule.text,
          advice: '建议在医生或药师指导下调整剂量或更换品种。',
          drugs: hitDrugs.map(function (d) { return d.id; }),
          ingredients: hit
        });
      });
    }

    /* ---- 4. 每日总量 ---- */
    drugs.forEach(function (d) {
      var mg = DOSE_MG[d.id];
      if (!mg) return;
      Object.keys(mg).forEach(function (ing) {
        var limit = (YDZ.INGREDIENTS[ing] || {}).maxDaily;
        if (!limit) return;
        var total = mg[ing] * (d.freq || 1);
        if (total > limit) {
          risks.push({
            id: 'dose-' + d.id,
            type: 'dose',
            level: 'high',
            title: '每日总量超限：' + d.name,
            detail: '按每日 ' + d.freq + ' 次计算，' + ingredientName(ing) +
                    ' 日总量约 ' + total + ' mg，已超过建议上限 ' + limit + ' mg。',
            advice: '请减少次数或改用其他成分，必要时咨询药师。',
            drugs: [d.id],
            ingredients: [ing]
          });
        }
      });
    });

    /* ---- 5. 排序与评分 ---- */
    risks.sort(function (x, y) {
      if (LEVEL_ORDER[x.level] !== LEVEL_ORDER[y.level]) return LEVEL_ORDER[x.level] - LEVEL_ORDER[y.level];
      return x.title.localeCompare(y.title);
    });

    var penalty = 0;
    risks.forEach(function (r) { penalty += LEVEL_WEIGHT[r.level] || 0; });

    var summary = {
      high: risks.filter(function (r) { return r.level === 'high'; }).length,
      medium: risks.filter(function (r) { return r.level === 'medium'; }).length,
      low: risks.filter(function (r) { return r.level === 'low'; }).length,
      total: risks.length
    };

    return {
      risks: risks,
      summary: summary,
      score: Math.max(15, 100 - Math.min(MAX_PENALTY, penalty))
    };
  }

  /* =============================================================
   * 二、服药排程
   * ============================================================= */

  /* 找出两种药之间是否存在间隔要求（跨全部成分） */
  function gapBetween(d1, d2) {
    var best = null;
    d1.ingredients.forEach(function (a) {
      d2.ingredients.forEach(function (b) {
        var g = findGap(a, b);
        if (g && (!best || g.hours > best.hours)) best = g;
      });
    });
    return best;
  }

  /**
   * 生成一天服药时间表
   * @param {Array} cart [{ drugId }]
   * @returns {Object} { slots, conflicts, stats }
   */
  function schedule(cart) {
    var drugs = cart.map(function (c) { return drugById(c.drugId); }).filter(Boolean);

    /* 1. 初始化每一剂的基准时间 */
    var events = [];
    drugs.forEach(function (d) {
      if (d.timing === '按需') return;              /* 外用药不排进时间表 */
      var times = FREQ_SLOTS[Math.min(4, Math.max(1, d.freq || 1))] || FREQ_SLOTS[2];
      var offset = TIMING_OFFSET[d.timing];
      if (typeof offset !== 'number') offset = 0;

      times.forEach(function (t) {
        var minute = d.timing === '睡前' ? 21 * 60 + 30 : t + offset;
        var safe = Math.max(6 * 60, Math.min(23 * 60, minute));
        events.push({ drugId: d.id, drug: d, preferred: safe, minute: safe });
      });
    });

    /* 2. 冲突修复：每轮挑出一个冲突，把「可动」的那剂挪到最合适的位置 */
    var blocked = {};
    var guard = 0;

    while (guard++ < 300) {
      var pair = findConflict(events, blocked);
      if (!pair) break;

      var mover = chooseMover(pair.e1, pair.e2);
      var target = bestRelocation(mover, events);

      if (target === null || target === mover.minute) {
        blocked[pair.key] = true;
        continue;
      }
      mover.minute = target;
    }

    /* 3. 收敛后统计剩余冲突（同一种药对只报一次） */
    var conflicts = [];
    var seenConflict = {};

    for (var ci = 0; ci < events.length; ci++) {
      for (var cj = ci + 1; cj < events.length; cj++) {
        var ea = events[ci], eb = events[cj];
        if (ea.drugId === eb.drugId) continue;

        var cg = gapBetween(ea.drug, eb.drug);
        if (!cg) continue;
        if (Math.abs(ea.minute - eb.minute) >= cg.hours * 60) continue;

        var ckey = [ea.drugId, eb.drugId].sort().join('|');
        if (seenConflict[ckey]) continue;
        seenConflict[ckey] = true;

        var early = ea.minute <= eb.minute ? ea : eb;
        var late = ea.minute <= eb.minute ? eb : ea;

        conflicts.push({
          a: early.drug, b: late.drug, hours: cg.hours, reason: cg.reason,
          aTime: toHHMM(early.minute), bTime: toHHMM(late.minute)
        });
      }
    }

    /* 3. 组装成时间轴 */
    events.sort(function (a, b) { return a.minute - b.minute; });

    var slots = [];
    events.forEach(function (e) {
      var last = slots[slots.length - 1];
      if (last && Math.abs(last.minute - e.minute) < 30) {
        last.items.push(e);
      } else {
        slots.push({ minute: e.minute, time: toHHMM(e.minute), items: [e] });
      }
    });

    /* 4. 去重：同一时间同一药只出现一次 */
    slots.forEach(function (s) {
      var seen = {};
      s.items = s.items.filter(function (it) {
        if (seen[it.drugId]) return false;
        seen[it.drugId] = true;
        return true;
      });
    });

    var first = slots.length ? slots[0].minute : 0;
    var lastM = slots.length ? slots[slots.length - 1].minute : 0;

    return {
      slots: slots,
      conflicts: conflicts,
      stats: {
        drugCount: drugs.length,
        doseCount: events.length,
        first: slots.length ? toHHMM(first) : '--:--',
        last: slots.length ? toHHMM(lastM) : '--:--'
      }
    };
  }

  /* ---------- 排程辅助函数 ---------- */

  /* 找出第一个尚未被判为「无解」的间隔冲突 */
  function findConflict(events, blocked) {
    for (var i = 0; i < events.length; i++) {
      for (var j = i + 1; j < events.length; j++) {
        var a = events[i], b = events[j];
        if (a.drugId === b.drugId) continue;

        var g = gapBetween(a.drug, b.drug);
        if (!g) continue;
        if (Math.abs(a.minute - b.minute) >= g.hours * 60) continue;

        var key = i + '-' + j;
        if (blocked[key]) continue;

        return { e1: a, e2: b, gap: g, key: key };
      }
    }
    return null;
  }

  /* 谁更应该被挪动：优先挪那个自带「间隔声明」的药（如蒙脱石、钙剂） */
  function chooseMover(e1, e2) {
    if (e1.drug.gap && !e2.drug.gap) return e1;
    if (e2.drug.gap && !e1.drug.gap) return e2;
    if ((e1.drug.freq || 2) !== (e2.drug.freq || 2)) {
      return (e1.drug.freq || 2) < (e2.drug.freq || 2) ? e1 : e2;
    }
    return e2;
  }

  /* 在 06:00–23:00 之间找一个代价最小的合法位置 */
  function bestRelocation(mover, events) {
    var best = null;
    var bestCost = Infinity;

    for (var t = 6 * 60; t <= 23 * 60; t += 15) {
      if (!fits(t, mover, events)) continue;

      var cost = Math.abs(t - mover.preferred);
      /* 同一时刻已经堆了别的药，稍微避让一下，界面更好看 */
      for (var i = 0; i < events.length; i++) {
        if (events[i] !== mover && Math.abs(events[i].minute - t) < 30) cost += 20;
      }

      if (cost < bestCost) { bestCost = cost; best = t; }
    }
    return best;
  }

  /* 把某一剂放到 candidate 分钟，是否不与任何约束冲突 */
  function fits(candidate, mover, events) {
    for (var i = 0; i < events.length; i++) {
      var other = events[i];
      if (other === mover) continue;

      /* 同一种药的不同剂量之间至少间隔 4 小时 */
      if (other.drugId === mover.drugId) {
        if (Math.abs(other.minute - candidate) < 240) return false;
        continue;
      }

      var g = gapBetween(mover.drug, other.drug);
      if (g && Math.abs(other.minute - candidate) < g.hours * 60) return false;
    }
    return true;
  }

  /* ---------- 对外暴露 ---------- */
  YDZ.engine = {
    analyze: analyze,
    schedule: schedule,
    toMinutes: toMinutes,
    toHHMM: toHHMM,
    drugById: drugById,
    gapBetween: gapBetween
  };
})(window.YDZ);
