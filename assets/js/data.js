/* =============================================================
 * 药搭子 · 药品知识库
 * -------------------------------------------------------------
 * 数据来源：国家药监局公开说明书要点、常见药学教材与公开科普资料
 * 整理方式：以「成分（ingredient）」为核心建模，药品只是成分的载体。
 *          这样「不同药名、相同成分」的重复用药才能被自动识别出来。
 *
 * ⚠️ 本项目为教学演示，数据经过精简，不能替代医嘱与说明书。
 * ============================================================= */

window.YDZ = window.YDZ || {};

/* ---------- 一、成分表 ---------- */
YDZ.INGREDIENTS = {
  ibuprofen:       { id: 'ibuprofen',       name: '布洛芬',         en: 'Ibuprofen',            class: '解热镇痛抗炎药（NSAIDs）', maxDaily: 1200, unit: 'mg' },
  acetaminophen:   { id: 'acetaminophen',   name: '对乙酰氨基酚',   en: 'Acetaminophen',        class: '解热镇痛药', maxDaily: 2000, unit: 'mg' },
  aspirin:         { id: 'aspirin',         name: '阿司匹林',       en: 'Aspirin',              class: '抗血小板 / 解热镇痛药', maxDaily: 300, unit: 'mg' },
  amoxicillin:     { id: 'amoxicillin',     name: '阿莫西林',       en: 'Amoxicillin',          class: '青霉素类抗生素' },
  cefuroxime:      { id: 'cefuroxime',      name: '头孢呋辛',       en: 'Cefuroxime',           class: '头孢菌素类抗生素' },
  azithromycin:    { id: 'azithromycin',    name: '阿奇霉素',       en: 'Azithromycin',         class: '大环内酯类抗生素' },
  clarithromycin:  { id: 'clarithromycin',  name: '克拉霉素',       en: 'Clarithromycin',       class: '大环内酯类抗生素' },
  metronidazole:   { id: 'metronidazole',   name: '甲硝唑',         en: 'Metronidazole',        class: '硝基咪唑类抗菌药' },
  omeprazole:      { id: 'omeprazole',      name: '奥美拉唑',       en: 'Omeprazole',           class: '质子泵抑制剂（PPI）' },
  montmorillonite: { id: 'montmorillonite', name: '蒙脱石',         en: 'Montmorillonite',      class: '止泻 / 消化道黏膜保护剂' },
  calcium:         { id: 'calcium',         name: '碳酸钙',         en: 'Calcium Carbonate',    class: '钙剂' },
  ferrous:         { id: 'ferrous',         name: '硫酸亚铁',       en: 'Ferrous Sulfate',      class: '铁剂' },
  levothyroxine:   { id: 'levothyroxine',   name: '左甲状腺素',     en: 'Levothyroxine',        class: '甲状腺激素' },
  warfarin:        { id: 'warfarin',        name: '华法林',         en: 'Warfarin',             class: '香豆素类抗凝药' },
  clopidogrel:     { id: 'clopidogrel',     name: '氯吡格雷',       en: 'Clopidogrel',          class: '抗血小板药' },
  atorvastatin:    { id: 'atorvastatin',    name: '阿托伐他汀',     en: 'Atorvastatin',         class: '他汀类调脂药' },
  metoprolol:      { id: 'metoprolol',      name: '美托洛尔',       en: 'Metoprolol',           class: 'β 受体阻滞剂' },
  nifedipine:      { id: 'nifedipine',      name: '硝苯地平',       en: 'Nifedipine',           class: '钙通道阻滞剂' },
  metformin:       { id: 'metformin',       name: '二甲双胍',       en: 'Metformin',            class: '双胍类降糖药' },
  glimepiride:     { id: 'glimepiride',     name: '格列美脲',       en: 'Glimepiride',          class: '磺脲类降糖药' },
  chlorpheniramine:{ id: 'chlorpheniramine',name: '氯苯那敏',       en: 'Chlorpheniramine',     class: '第一代抗组胺药' },
  loratadine:      { id: 'loratadine',      name: '氯雷他定',       en: 'Loratadine',           class: '第二代抗组胺药' },
  dextromethorphan:{ id: 'dextromethorphan',name: '右美沙芬',       en: 'Dextromethorphan',     class: '中枢性镇咳药' },
  pseudoephedrine: { id: 'pseudoephedrine', name: '伪麻黄碱',       en: 'Pseudoephedrine',      class: '鼻减充血剂' },
  caffeine:        { id: 'caffeine',        name: '咖啡因',         en: 'Caffeine',             class: '中枢兴奋药' },
  ethanol:         { id: 'ethanol',         name: '乙醇（酒精）',   en: 'Ethanol',              class: '溶剂 / 辅料' },
  glycyrrhizin:    { id: 'glycyrrhizin',    name: '甘草',           en: 'Glycyrrhizin',         class: '中药成分' },
  codeine:         { id: 'codeine',         name: '可待因',         en: 'Codeine',              class: '阿片类镇咳镇痛药' },
  diclofenac:      { id: 'diclofenac',      name: '双氯芬酸',       en: 'Diclofenac',           class: '外用 NSAIDs' },
  vitamin_c:       { id: 'vitamin_c',       name: '维生素 C',       en: 'Vitamin C',            class: '维生素' }
};

/* ---------- 二、药品表 ---------- */
/* freq：每日服药次数；timing：与进餐的关系；gap：需要与其他药拉开间隔的规则（小时） */
YDZ.DRUGS = [
  {
    id: 'fenbid', name: '布洛芬缓释胶囊', brand: '芬必得', ingredients: ['ibuprofen'],
    category: '解热镇痛', otc: true, form: '缓释胶囊', strength: '0.3 g',
    doseText: '每次 1 粒', freq: 2, timing: '餐后', maxPerDay: 2,
    tags: ['退烧', '止痛', '头痛', '痛经'],
    cautions: ['消化道溃疡或出血史者禁用', '孕晚期禁用', '不可与其他 NSAIDs 同服']
  },
  {
    id: 'motrin', name: '布洛芬混悬液', brand: '美林', ingredients: ['ibuprofen'],
    category: '解热镇痛', otc: true, form: '混悬液', strength: '100 mg/5 mL',
    doseText: '儿童按体重 5–10 mg/kg', freq: 3, timing: '餐后', maxPerDay: 4,
    tags: ['儿童退烧', '退烧'],
    cautions: ['3 个月以下婴儿禁用', '脱水或肾功能不全儿童慎用']
  },
  {
    id: 'tylenol', name: '对乙酰氨基酚片', brand: '泰诺林', ingredients: ['acetaminophen'],
    category: '解热镇痛', otc: true, form: '片剂', strength: '0.5 g',
    doseText: '每次 1 片', freq: 3, timing: '餐后', maxPerDay: 4,
    tags: ['退烧', '止痛', '头痛'],
    cautions: ['每日总量不得超过 2 g（超量伤肝）', '服药期间禁止饮酒']
  },
  {
    id: 'ganmaoling', name: '感冒灵颗粒', brand: '999', ingredients: ['acetaminophen', 'caffeine', 'chlorpheniramine'],
    category: '感冒用药', otc: true, form: '颗粒剂', strength: '10 g/袋',
    doseText: '每次 1 袋，开水冲服', freq: 3, timing: '餐后', maxPerDay: 3,
    tags: ['感冒', '鼻塞', '头痛'],
    cautions: ['已含对乙酰氨基酚，不可再叠加退烧药', '服药后易困倦，勿驾车']
  },
  {
    id: 'gankang', name: '复方氨酚烷胺片', brand: '感康', ingredients: ['acetaminophen', 'caffeine', 'chlorpheniramine'],
    category: '感冒用药', otc: true, form: '片剂', strength: '复方',
    doseText: '每次 1 片', freq: 2, timing: '餐后', maxPerDay: 2,
    tags: ['感冒', '流感', '鼻塞'],
    cautions: ['含对乙酰氨基酚，避免与退烧药叠加', '前列腺肥大者慎用']
  },
  {
    id: 'baijiahei', name: '氨酚伪麻美芬片', brand: '白加黑', ingredients: ['acetaminophen', 'pseudoephedrine', 'dextromethorphan'],
    category: '感冒用药', otc: true, form: '片剂', strength: '复方',
    doseText: '日片每次 1 片', freq: 3, timing: '餐后', maxPerDay: 3,
    tags: ['感冒', '咳嗽', '鼻塞'],
    cautions: ['高血压、甲亢患者慎用', '含对乙酰氨基酚，勿与退烧药同服']
  },
  {
    id: 'aspirin_ec', name: '阿司匹林肠溶片', brand: '拜阿司匹灵', ingredients: ['aspirin'],
    category: '心脑血管', otc: false, form: '肠溶片', strength: '100 mg',
    doseText: '每次 1 片，每日 1 次', freq: 1, timing: '餐前', maxPerDay: 1,
    tags: ['抗血小板', '心梗二级预防'],
    cautions: ['有出血倾向者禁用', '儿童病毒感染时禁用（瑞氏综合征）']
  },
  {
    id: 'amoxicillin_cap', name: '阿莫西林胶囊', brand: '', ingredients: ['amoxicillin'],
    category: '抗感染', otc: false, form: '胶囊', strength: '0.25 g',
    doseText: '每次 2 粒', freq: 3, timing: '餐后', maxPerDay: 4,
    tags: ['细菌感染', '咽炎'],
    cautions: ['青霉素过敏者禁用', '必须足疗程使用，不可自行停药']
  },
  {
    id: 'cefuroxime_tab', name: '头孢呋辛酯片', brand: '西力欣', ingredients: ['cefuroxime'],
    category: '抗感染', otc: false, form: '片剂', strength: '0.25 g',
    doseText: '每次 1 片', freq: 2, timing: '餐后', maxPerDay: 2,
    tags: ['细菌感染', '呼吸道感染'],
    cautions: ['服药期间及停药后 7 天内严禁饮酒', '头孢过敏者禁用']
  },
  {
    id: 'azithromycin_tab', name: '阿奇霉素片', brand: '希舒美', ingredients: ['azithromycin'],
    category: '抗感染', otc: false, form: '片剂', strength: '0.25 g',
    doseText: '每次 2 片，每日 1 次', freq: 1, timing: '餐前', maxPerDay: 1,
    tags: ['支原体感染', '呼吸道感染'],
    cautions: ['QT 间期延长者慎用', '不宜与含铝镁抗酸药同服']
  },
  {
    id: 'clarithromycin_tab', name: '克拉霉素片', brand: '克拉仙', ingredients: ['clarithromycin'],
    category: '抗感染', otc: false, form: '片剂', strength: '0.25 g',
    doseText: '每次 1 片', freq: 2, timing: '餐后', maxPerDay: 2,
    tags: ['幽门螺杆菌', '呼吸道感染'],
    cautions: ['与他汀类合用可致横纹肌溶解', '肝功能不全者慎用']
  },
  {
    id: 'metronidazole_tab', name: '甲硝唑片', brand: '', ingredients: ['metronidazole'],
    category: '抗感染', otc: false, form: '片剂', strength: '0.2 g',
    doseText: '每次 1 片', freq: 3, timing: '餐后', maxPerDay: 3,
    tags: ['牙周感染', '幽门螺杆菌'],
    cautions: ['服药期间及停药后 3 天内严禁饮酒', '孕早期慎用']
  },
  {
    id: 'omeprazole_cap', name: '奥美拉唑肠溶胶囊', brand: '洛赛克', ingredients: ['omeprazole'],
    category: '消化系统', otc: false, form: '肠溶胶囊', strength: '20 mg',
    doseText: '每次 1 粒', freq: 1, timing: '餐前 30 分钟', maxPerDay: 2,
    tags: ['胃酸', '胃溃疡', '反酸'],
    cautions: ['长期使用可能影响镁与 B12 吸收', '与氯吡格雷合用需评估']
  },
  {
    id: 'smecta', name: '蒙脱石散', brand: '思密达', ingredients: ['montmorillonite'],
    category: '消化系统', otc: true, form: '散剂', strength: '3 g/袋',
    doseText: '每次 1 袋，温水冲服', freq: 3, timing: '空腹', maxPerDay: 3,
    gap: { hours: 2, reason: '蒙脱石会吸附其他药物，降低其吸收' },
    tags: ['腹泻', '止泻'],
    cautions: ['与其他口服药需间隔 2 小时以上', '便秘者慎用']
  },
  {
    id: 'caltrate', name: '碳酸钙 D3 片', brand: '钙尔奇', ingredients: ['calcium'],
    category: '营养补充', otc: true, form: '片剂', strength: '600 mg',
    doseText: '每次 1 片', freq: 1, timing: '餐后', maxPerDay: 2,
    gap: { hours: 4, reason: '钙会与左甲状腺素、铁剂形成难溶复合物，影响吸收' },
    tags: ['补钙', '骨质疏松'],
    cautions: ['高钙血症、肾结石患者慎用', '与左甲状腺素间隔 4 小时']
  },
  {
    id: 'ferrous_tab', name: '硫酸亚铁片', brand: '', ingredients: ['ferrous'],
    category: '营养补充', otc: true, form: '片剂', strength: '0.3 g',
    doseText: '每次 1 片', freq: 3, timing: '餐后', maxPerDay: 3,
    gap: { hours: 4, reason: '铁剂与钙剂、左甲状腺素相互影响吸收' },
    tags: ['补铁', '贫血'],
    cautions: ['可使大便变黑，属正常现象', '与浓茶、咖啡同服影响吸收']
  },
  {
    id: 'euthyrox', name: '左甲状腺素钠片', brand: '优甲乐', ingredients: ['levothyroxine'],
    category: '内分泌', otc: false, form: '片剂', strength: '50 µg',
    doseText: '每次 1 片，晨起空腹', freq: 1, timing: '空腹', maxPerDay: 1,
    gap: { hours: 4, reason: '钙剂、铁剂、蒙脱石均会显著降低其吸收' },
    tags: ['甲减', '甲状腺'],
    cautions: ['必须空腹服用，服后 30 分钟再进食', '与钙铁剂间隔 4 小时']
  },
  {
    id: 'warfarin_tab', name: '华法林钠片', brand: '', ingredients: ['warfarin'],
    category: '心脑血管', otc: false, form: '片剂', strength: '2.5 mg',
    doseText: '按 INR 调整，每日 1 次', freq: 1, timing: '固定时间', maxPerDay: 1,
    tags: ['抗凝', '房颤', '血栓'],
    cautions: ['需定期监测 INR', '与阿司匹林、布洛芬合用出血风险显著升高', '忌大量食用富含维生素 K 的绿叶菜']
  },
  {
    id: 'plavix', name: '硫酸氢氯吡格雷片', brand: '波立维', ingredients: ['clopidogrel'],
    category: '心脑血管', otc: false, form: '片剂', strength: '75 mg',
    doseText: '每次 1 片，每日 1 次', freq: 1, timing: '餐后', maxPerDay: 1,
    tags: ['抗血小板', '支架术后', '脑梗'],
    cautions: ['与奥美拉唑合用可能降低疗效', '术前需遵医嘱停药']
  },
  {
    id: 'lipitor', name: '阿托伐他汀钙片', brand: '立普妥', ingredients: ['atorvastatin'],
    category: '心脑血管', otc: false, form: '片剂', strength: '20 mg',
    doseText: '每次 1 片，每晚 1 次', freq: 1, timing: '睡前', maxPerDay: 1,
    tags: ['降脂', '血脂'],
    cautions: ['出现肌肉酸痛、酱油色尿应立即就医', '避免与大环内酯类抗生素合用']
  },
  {
    id: 'betaloc', name: '琥珀酸美托洛尔缓释片', brand: '倍他乐克', ingredients: ['metoprolol'],
    category: '心脑血管', otc: false, form: '缓释片', strength: '47.5 mg',
    doseText: '每次 1 片，每日 1 次', freq: 1, timing: '餐后', maxPerDay: 1,
    tags: ['降压', '心率控制'],
    cautions: ['不可突然停药', '哮喘患者慎用']
  },
  {
    id: 'adalat', name: '硝苯地平控释片', brand: '拜新同', ingredients: ['nifedipine'],
    category: '心脑血管', otc: false, form: '控释片', strength: '30 mg',
    doseText: '每次 1 片，每日 1 次', freq: 1, timing: '空腹', maxPerDay: 1,
    tags: ['降压', '心绞痛'],
    cautions: ['整片吞服，不可掰开嚼碎', '避免与葡萄柚汁同服']
  },
  {
    id: 'glucophage', name: '盐酸二甲双胍片', brand: '格华止', ingredients: ['metformin'],
    category: '内分泌', otc: false, form: '片剂', strength: '0.5 g',
    doseText: '每次 1 片', freq: 2, timing: '餐中或餐后', maxPerDay: 3,
    tags: ['降糖', '糖尿病'],
    cautions: ['肾功能不全者禁用', '服药期间避免饮酒（乳酸酸中毒风险）', '做增强 CT 前需停药']
  },
  {
    id: 'amaryl', name: '格列美脲片', brand: '亚莫利', ingredients: ['glimepiride'],
    category: '内分泌', otc: false, form: '片剂', strength: '2 mg',
    doseText: '每次 1 片，早餐前', freq: 1, timing: '餐前', maxPerDay: 1,
    tags: ['降糖', '糖尿病'],
    cautions: ['易发生低血糖，随身携带糖块', '与阿司匹林合用低血糖风险升高']
  },
  {
    id: 'claritin', name: '氯雷他定片', brand: '开瑞坦', ingredients: ['loratadine'],
    category: '抗过敏', otc: true, form: '片剂', strength: '10 mg',
    doseText: '每次 1 片，每日 1 次', freq: 1, timing: '餐后', maxPerDay: 1,
    tags: ['过敏', '荨麻疹', '鼻炎'],
    cautions: ['肝功能不全者需减量', '嗜睡副作用较第一代轻']
  },
  {
    id: 'pyrilamine', name: '马来酸氯苯那敏片', brand: '扑尔敏', ingredients: ['chlorpheniramine'],
    category: '抗过敏', otc: true, form: '片剂', strength: '4 mg',
    doseText: '每次 1 片', freq: 3, timing: '餐后', maxPerDay: 3,
    tags: ['过敏', '荨麻疹'],
    cautions: ['服药后明显困倦，禁止驾车', '老年人易出现口干、排尿困难']
  },
  {
    id: 'dextromethorphan_syr', name: '右美沙芬愈创甘油醚糖浆', brand: '惠菲宁', ingredients: ['dextromethorphan'],
    category: '呼吸系统', otc: true, form: '糖浆', strength: '复方',
    doseText: '每次 10 mL', freq: 3, timing: '餐后', maxPerDay: 3,
    tags: ['干咳', '咳嗽'],
    cautions: ['痰多者不宜使用', '不可与单胺氧化酶抑制剂合用']
  },
  {
    id: 'huoxiang', name: '藿香正气水', brand: '太极', ingredients: ['ethanol'],
    category: '中成药', otc: true, form: '酊剂', strength: '10 mL/支',
    doseText: '每次 1 支', freq: 2, timing: '餐后', maxPerDay: 2,
    tags: ['中暑', '胃肠不适', '腹泻'],
    cautions: ['含乙醇 40%–50%，严禁与头孢类、甲硝唑同用', '服药后禁止驾车']
  },
  {
    id: 'licorice_tab', name: '复方甘草片', brand: '', ingredients: ['glycyrrhizin', 'codeine'],
    category: '中成药', otc: false, form: '片剂', strength: '复方',
    doseText: '每次 2 片', freq: 3, timing: '餐后', maxPerDay: 3,
    tags: ['止咳', '化痰'],
    cautions: ['含阿片粉，连续服用不超过 7 天', '高血压、低钾血症患者慎用']
  },
  {
    id: 'vitamin_c_tab', name: '维生素 C 片', brand: '', ingredients: ['vitamin_c'],
    category: '营养补充', otc: true, form: '片剂', strength: '0.1 g',
    doseText: '每次 1 片', freq: 2, timing: '餐后', maxPerDay: 3,
    tags: ['补充维生素', '免疫力'],
    cautions: ['长期大剂量服用突然停药可能引起反跳性坏血病']
  },
  {
    id: 'voltaren_gel', name: '双氯芬酸二乙胺乳胶剂', brand: '扶他林', ingredients: ['diclofenac'],
    category: '外用止痛', otc: true, form: '凝胶', strength: '1%',
    doseText: '外用，涂于患处', freq: 3, timing: '按需', maxPerDay: 4,
    tags: ['外用', '关节痛', '肌肉痛'],
    cautions: ['仅限外用，不可口服', '破损皮肤禁用']
  }
];

/* ---------- 三、相互作用表（成分 × 成分） ---------- */
/* level: high = 高风险，应避免；medium = 需注意 / 调整；low = 一般提示 */
YDZ.INTERACTIONS = [
  { a: 'ibuprofen', b: 'aspirin', level: 'high',
    title: '出血风险叠加，且布洛芬会削弱阿司匹林的抗血小板作用',
    detail: '两者同属 NSAIDs，合用显著增加胃肠道出血风险；布洛芬还会竞争性占据血小板 COX-1 位点，使阿司匹林的心血管保护作用下降。',
    advice: '如需退烧止痛，改用对乙酰氨基酚；长期服阿司匹林者应避免自行加用布洛芬。' },

  { a: 'ibuprofen', b: 'warfarin', level: 'high',
    title: '出血风险显著升高',
    detail: '布洛芬损伤胃黏膜并抑制血小板，与华法林叠加后消化道出血风险成倍增加。',
    advice: '必须止痛时咨询医生，优先选择对乙酰氨基酚并监测 INR。' },

  { a: 'aspirin', b: 'warfarin', level: 'high',
    title: '抗凝 + 抗血小板，出血风险高',
    detail: '两者作用于不同环节，合用后出血事件明显增多，尤其是有消化道溃疡史者。',
    advice: '仅在医生明确评估后联用，定期监测 INR 与大便颜色。' },

  { a: 'ibuprofen', b: 'clopidogrel', level: 'high',
    title: '消化道出血风险升高',
    detail: 'NSAIDs 的胃黏膜损伤与氯吡格雷的抗血小板作用叠加。',
    advice: '尽量避免；确需使用时加用胃黏膜保护剂并观察黑便。' },

  { a: 'aspirin', b: 'clopidogrel', level: 'medium',
    title: '双联抗血小板治疗，需医嘱',
    detail: '支架术后常用组合，但出血风险高于单药。',
    advice: '属医生处方方案，不可自行加药或停药。' },

  { a: 'acetaminophen', b: 'ethanol', level: 'high',
    title: '肝毒性风险显著增加',
    detail: '酒精诱导肝药酶，使对乙酰氨基酚的有毒代谢产物 NAPQI 生成增多，容易造成急性肝损伤。',
    advice: '服退烧药期间及前后 3 天禁止饮酒，包括藿香正气水等含醇制剂。' },

  { a: 'cefuroxime', b: 'ethanol', level: 'high',
    title: '双硫仑样反应，可能危及生命',
    detail: '头孢类会抑制乙醛脱氢酶，酒精代谢停在乙醛阶段，出现面红、心悸、胸闷、血压下降甚至休克。',
    advice: '用药期间及停药后 7 天内绝对禁酒，包括藿香正气水、酒心巧克力、含醇藿香剂。' },

  { a: 'metronidazole', b: 'ethanol', level: 'high',
    title: '双硫仑样反应',
    detail: '甲硝唑抑制乙醛代谢，与酒精同用可引发剧烈不适。',
    advice: '用药期间及停药后 3 天内禁酒及含醇制剂。' },

  { a: 'omeprazole', b: 'clopidogrel', level: 'medium',
    title: '可能降低氯吡格雷的抗血小板效果',
    detail: '奥美拉唑抑制 CYP2C19，而氯吡格雷需要经该酶活化。',
    advice: '需要护胃时，优先选择泮托拉唑等对 CYP2C19 影响小的药物。' },

  { a: 'atorvastatin', b: 'clarithromycin', level: 'high',
    title: '横纹肌溶解风险',
    detail: '克拉霉素强烈抑制 CYP3A4，使阿托伐他汀血药浓度大幅升高，可致肌痛、肌溶解、急性肾损伤。',
    advice: '抗感染期间暂停他汀，或用阿奇霉素等替代，出现肌痛立即就医。' },

  { a: 'atorvastatin', b: 'azithromycin', level: 'medium',
    title: '他汀浓度可能升高',
    detail: '大环内酯类可影响他汀代谢，风险低于克拉霉素但需留意肌肉症状。',
    advice: '用药期间注意有无肌肉酸痛、乏力。' },

  { a: 'chlorpheniramine', b: 'ethanol', level: 'medium',
    title: '中枢抑制叠加，嗜睡加重',
    detail: '第一代抗组胺药本身有镇静作用，酒精会明显放大这种抑制。',
    advice: '服药期间禁止饮酒和驾车。' },

  { a: 'chlorpheniramine', b: 'dextromethorphan', level: 'medium',
    title: '中枢抑制作用叠加',
    detail: '两者均可抑制中枢，合用后嗜睡、头晕更明显，过量有呼吸抑制风险。',
    advice: '避免同时服用多种复方感冒药。' },

  { a: 'codeine', b: 'dextromethorphan', level: 'high',
    title: '呼吸抑制风险',
    detail: '两者均为中枢性镇咳药，合用可显著抑制呼吸中枢。',
    advice: '严禁同时使用两种镇咳药；12 岁以下儿童禁用可待因。' },

  { a: 'codeine', b: 'chlorpheniramine', level: 'medium',
    title: '中枢抑制叠加',
    detail: '抗组胺药的镇静作用会加重阿片类的抑制。',
    advice: '老年人、呼吸功能不全者避免合用。' },

  { a: 'metformin', b: 'ethanol', level: 'medium',
    title: '乳酸酸中毒风险',
    detail: '酒精增加乳酸生成，二甲双胍减少乳酸清除，两者叠加可诱发乳酸酸中毒。',
    advice: '服药期间避免饮酒。' },

  { a: 'ibuprofen', b: 'metoprolol', level: 'medium',
    title: '可能减弱降压效果',
    detail: 'NSAIDs 引起水钠潴留并抑制前列腺素，可对抗 β 受体阻滞剂的降压作用。',
    advice: '监测血压，长期止痛请咨询医生。' },

  { a: 'ibuprofen', b: 'nifedipine', level: 'medium',
    title: '可能减弱降压效果',
    detail: 'NSAIDs 的水钠潴留作用会部分抵消钙通道阻滞剂的降压效果。',
    advice: '短期使用影响有限，长期合用需监测血压。' },

  { a: 'aspirin', b: 'glimepiride', level: 'medium',
    title: '低血糖风险升高',
    detail: '水杨酸类可增强磺脲类降糖药的降糖作用，老年人风险更高。',
    advice: '注意监测血糖，随身携带糖块。' },

  { a: 'pseudoephedrine', b: 'metoprolol', level: 'medium',
    title: '升压作用与降压药相互对抗',
    detail: '伪麻黄碱收缩血管升高血压，抵消 β 受体阻滞剂效果，还可能引起心悸。',
    advice: '高血压患者选择不含伪麻黄碱的感冒药。' },

  { a: 'pseudoephedrine', b: 'nifedipine', level: 'low',
    title: '血压可能波动',
    detail: '减充血剂可轻度升高血压。',
    advice: '监测血压，避免睡前服用。' },

  { a: 'acetaminophen', b: 'warfarin', level: 'medium',
    title: '长期大剂量可能升高 INR',
    detail: '连续多日使用对乙酰氨基酚可增强华法林抗凝作用。',
    advice: '短期偶用影响小，连续使用需监测 INR。' },

  { a: 'glycyrrhizin', b: 'warfarin', level: 'medium',
    title: '可能影响抗凝稳定性',
    detail: '甘草中的甘草酸可引起水钠潴留与低钾，间接影响抗凝与心律。',
    advice: '服华法林期间避免长期含服甘草片。' },

  { a: 'diclofenac', b: 'aspirin', level: 'low',
    title: '同类药物叠加',
    detail: '外用双氯芬酸全身吸收有限，但仍属同类 NSAIDs。',
    advice: '大面积长期外用时应告知医生正在服用的抗血小板药。' },

  { a: 'caffeine', b: 'dextromethorphan', level: 'low',
    title: '可能加重心悸与失眠',
    detail: '咖啡因的中枢兴奋作用与镇咳药合用时，个别人会出现心慌。',
    advice: '晚间避免服用含咖啡因的复方感冒药。' }
];

/* ---------- 四、需要拉开服用间隔的规则（小时） ---------- */
YDZ.GAP_RULES = [
  { a: 'montmorillonite', b: '*', hours: 2, reason: '蒙脱石会吸附其他口服药，降低其吸收' },
  { a: 'calcium', b: 'levothyroxine', hours: 4, reason: '钙影响左甲状腺素吸收' },
  { a: 'ferrous', b: 'levothyroxine', hours: 4, reason: '铁影响左甲状腺素吸收' },
  { a: 'calcium', b: 'ferrous', hours: 2, reason: '钙与铁竞争吸收通道' }
];

/* ---------- 五、特殊人群提示 ---------- */
YDZ.POPULATIONS = {
  elderly: {
    label: '老年人（≥65 岁）',
    rules: [
      { match: ['chlorpheniramine'], level: 'medium', text: '第一代抗组胺药易致口干、排尿困难、跌倒，老年人优先选氯雷他定。' },
      { match: ['ibuprofen', 'diclofenac'], level: 'medium', text: 'NSAIDs 增加老年人消化道出血与肾损伤风险，尽量短期小剂量。' },
      { match: ['glimepiride'], level: 'high', text: '磺脲类在老年人中低血糖风险高，需格外注意。' },
      { match: ['warfarin'], level: 'medium', text: '老年人对抗凝更敏感，需更频繁监测 INR。' }
    ]
  },
  child: {
    label: '儿童',
    rules: [
      { match: ['aspirin'], level: 'high', text: '儿童病毒感染时使用阿司匹林可能诱发瑞氏综合征，应禁用。' },
      { match: ['codeine'], level: 'high', text: '12 岁以下儿童禁用可待因。' },
      { match: ['ibuprofen'], level: 'medium', text: '3 个月以下婴儿禁用布洛芬。' }
    ]
  },
  pregnancy: {
    label: '孕期 / 哺乳期',
    rules: [
      { match: ['ibuprofen', 'diclofenac'], level: 'high', text: '孕晚期禁用 NSAIDs，可能致胎儿动脉导管早闭。' },
      { match: ['warfarin'], level: 'high', text: '华法林有致畸风险，孕期禁用。' },
      { match: ['metronidazole'], level: 'medium', text: '孕早期慎用甲硝唑。' },
      { match: ['clarithromycin'], level: 'medium', text: '孕期慎用克拉霉素。' }
    ]
  },
  liver: {
    label: '肝功能不全',
    rules: [
      { match: ['acetaminophen'], level: 'high', text: '肝功能不全者对乙酰氨基酚需减量，每日不超过 1.5 g。' },
      { match: ['atorvastatin'], level: 'medium', text: '活动性肝病禁用他汀类。' },
      { match: ['clarithromycin'], level: 'medium', text: '肝功能不全者需调整大环内酯类剂量。' }
    ]
  },
  kidney: {
    label: '肾功能不全',
    rules: [
      { match: ['ibuprofen', 'diclofenac'], level: 'high', text: '肾功能不全者应避免 NSAIDs。' },
      { match: ['metformin'], level: 'high', text: 'eGFR < 30 禁用二甲双胍，造影检查前需停药。' },
      { match: ['montmorillonite'], level: 'low', text: '严重便秘者慎用蒙脱石。' }
    ]
  }
};
