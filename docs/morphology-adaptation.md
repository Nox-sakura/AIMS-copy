# 形态证据模块适配说明

## 范围

从 AIMS 的 `3ca24e29a4bcbb5925aec3d13ddfaaac3a004116` 补齐 AIMS-copy 缺失的页面、构建配置和演示数据。保留原有布局、字体、蓝绿配色、圆角与卡片选中效果。

原概念评分区改为「形态证据解析」，展示卵裂球大小均一性、细胞质表现、透明带完整性、碎片化程度。详情、报告预览、对比、教学和助手共用数据适配器。旧分数只作为兼容数据保留，不进入新观察、摘要或图表。

## 参考依据与边界

- 2021：A classification system of day 3 human embryos using deep learning，BSPC 70，102943；DOI：10.1016/j.bspc.2021.102943。形态评估与多网络分类思路。
- 2022：LWMA-Net: Light-weighted morphology attention learning for human embryo grading，Computers in Biology and Medicine 151，106242；DOI：10.1016/j.compbiomed.2022.106242。形态注意力与分级关注区域的可视化思路。

两篇研究均不能证明本项目四项观察的独立贡献百分比；本次没有新增已训练模型、分割测量或性能实验，也未把文献指标作为本项目实测性能。

## 数据接入

独立字段 `evidenceSchemaVersion: 1` 与 `morphologyEvidence`。每项包含 `id/status/observation/value/unit/source/method/region`。

- ID：C01、C02、C04、C08。
- status：pending、recorded、unreadable。
- source：manual_review、validated_measurement、demo；记录必须同时提供非空 method。
- 缺失记录显示待复核；null 不转为 0。真实数值 0 可以显示。示例保留演示标识。
- region：`{imageId, source, box: [x,y,width,height]}`，坐标相对原图归一化至 0–1；仅当前图像的有效区域可显示。
- image：`{id, src, source, heatmap?: {imageId, src}}`。关注区域图必须匹配 imageId。无区域时保留原图并提示无标注。

目前演示病例未提供可追溯的新形态记录，因此四项默认待复核。这是数据缺失状态，不是异常判定。接入方应提供真实记录，不能从旧评分或等级自动换算。数值缺少统一定义时，对比区保留空态而不绘制零值雷达图。

上传结果生成独立的内存报告并绑定上传图像，默认不带热图。现有后端若没有新字段，仍显示待复核。报告仍为演示内存存储，刷新后不会保留；本次未扩展数据库或持久化服务。报告摘要由已记录字段生成，避免缺数据时让语言模型补全形态。

## 训练场

统一参考文案：Grade 1 细胞均一，碎片 <10%；Grade 2 轻度不均一，碎片 10–25%；Grade 3 明显不均一，碎片 25–50%；Grade 4 严重碎片化，碎片 >50%。

碎片率只是综合分级参考；25% 是两段文献区间的交界，不能自动判级。多核不能单独等同于 Grade 4。原人工等级与模型等级保留，没有按新阈值批量改写。

现有 20 个演示案例缺乏可追溯形态标注，标记 `scoringEligible:false`，可提交、看反馈和累计完成数，但不计入一致率。核验后由维护者按标注来源逐例恢复计分。边界案例须提供 `annotationReference`，冲突案例 `annotationConflict:true` 仍排除。新练习记录携带参考版本，旧记录不自动并入新标准统计。没有可计分案例时显示「—」。

## 验证

- `npm test`：数据兼容、空值与零值、来源及方法约束、版本隔离、图像区域绑定、25% 边界与冲突处理。
- `npm run build`：生产构建通过；仍有原有包体积及浏览器数据版本提示。
- 浏览器：详情四卡与选中提示、报告预览四项表格、对比空态、训练选择及提交、助手摘要、上传图像到独立报告的流程均已检查。
- 未验证真实模型性能、外部教学服务或生产部署；浏览器打印仍沿用原有导出方式，检查了预览，未验证实体打印。
