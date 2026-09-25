/**
 * 胚胎评估概念定义列表
 *
 * 概念名称来源：
 *   论文《Explainable embryo grading based on multi-level concept alignment
 *   without explicit labels》Table 1 — Retained Concepts 列
 *
 * direction: 'pos' 正向（得分越高越好）| 'neg' 负向（得分越高越差）
 * grade:     该概念主要影响的评级区间
 * shortDesc: 卡片展示用通俗解释（一句话，面向临床医生）
 *
 * 评级阈值参考（第3天卵裂期胚胎）：
 *   Grade 1 — 6–8个卵裂球，碎片化 < 10%，卵裂球均一对称，无多核化
 *   Grade 2 — 6–8个卵裂球，碎片化 10–25%，轻度不均一
 *   Grade 3 — 碎片化 25–50%，或卵裂球数目不足
 *   Grade 4 — 碎片化 > 50%，或严重形态异常
 */
export const concepts = [

  // ══ 形态学正向指标（C01–C07）══════════════════════════════════════

  {
    id: 'C01',
    name: '细胞大小均一性',
    nameEn: 'uniform cell size',
    category: '形态学',
    direction: 'pos',
    weight: 0.15,
    grade: 1,
    description: '卵裂球大小均匀一致，排列规则，是优质胚胎（Grade 1）的核心正向指标',
    shortDesc: '各卵裂球体积一致，发育同步性好',
  },

  {
    id: 'C02',
    name: '细胞质清晰度',
    nameEn: 'clear cytoplasm',
    category: '形态学',
    direction: 'pos',
    weight: 0.10,
    grade: 1,
    description: '细胞质均匀透明，无明显颗粒或空泡，与 Grade 1 高度相关',
    shortDesc: '细胞质均一透明，无异常颗粒',
  },

  {
    id: 'C03',
    name: '卵裂球对称性',
    nameEn: 'symmetrical blastomeres',
    category: '形态学',
    direction: 'pos',
    weight: 0.12,
    grade: 1,
    description: '各卵裂球体积一致，发育同步性好，正向指标',
    shortDesc: '各卵裂球体积相近，分裂同步',
  },

  {
    id: 'C04',
    name: '透明带完整性',
    nameEn: 'intact zona pellucida',
    category: '形态学',
    direction: 'pos',
    weight: 0.08,
    grade: 1,
    description: '透明带光滑完整，边界清晰，Grade 1 的重要正向指标',
    shortDesc: '透明带结构完整，厚薄均匀',
  },

  {
    id: 'C05',
    name: '分裂速率',
    nameEn: 'rapid cleavage rate',
    category: '动力学',
    direction: 'pos',
    weight: 0.08,
    grade: 1,
    description: '细胞分裂速率与标准时序吻合，发育潜能良好',
    shortDesc: '卵裂球数目符合授精后时序期望',
  },

  {
    id: 'C06',
    name: '代谢碎屑',
    nameEn: 'minimal metabolic debris',
    category: '动力学',
    direction: 'pos',
    weight: 0.12,
    grade: 1,
    description: '胞内代谢残余物极少，细胞质干净，Grade 1 正向指标',
    shortDesc: '胞质代谢残余极少，环境干净',
  },

  {
    id: 'C07',
    name: '膜边界平滑度',
    nameEn: 'smooth membrane boundaries',
    category: '动力学',
    direction: 'pos',
    weight: 0.08,
    grade: 1,
    description: '细胞膜边界光滑规整，无皱缩或不规则形态',
    shortDesc: '遵循正常 1→2→4→8 卵裂规律',
  },

  // ══ 负向风险指标（C08–C10）══════════════════════════════════════

  {
    id: 'C08',
    name: '碎片化程度',
    nameEn: 'minor fragmentation',
    category: '异常',
    direction: 'neg',
    weight: 0.15,
    grade: 2,
    description: '胚胎碎片化比例，Grade 1 极低（<5%），Grade 4 超过50%，负向指标',
    shortDesc: '胞质碎片比例，超过 10% 影响评级',
  },

  {
    id: 'C09',
    name: '空泡化程度',
    nameEn: 'pronounced vacuolation',
    category: '异常',
    direction: 'neg',
    weight: 0.05,
    grade: 3,
    description: '细胞质内空泡数量与大小，Grade 3/4 明显增多，负向指标',
    shortDesc: '细胞质内存在液性空泡，影响发育',
  },

  {
    id: 'C10',
    name: '细胞结构紊乱',
    nameEn: 'disorganized cell structures',
    category: '异常',
    direction: 'neg',
    weight: 0.07,
    grade: 3,
    description: 'Grade 3/4 中细胞排列混乱，结构完整性丧失，负向指标',
    shortDesc: '细胞排列紊乱，结构完整性受损',
  },

]
