"""
mca_service.py — MCA 推理服务

两种运行模式：
  真实模式：加载 MCA_embryo checkpoints，调用 MCAInference.predict_single()
  仿真模式：无 checkpoint 时自动启用，返回格式完全一致的确定性仿真数据
"""
import os
import sys
import time
import hashlib
import numpy as np
from typing import Optional

# ── 前端 concepts.js 中的 10 个概念 ID 与论文概念名的映射 ──
FRONTEND_CONCEPTS = [
    ("C01", "uniform cell size"),          # 对调后 C01 = 细胞大小均一性
    ("C02", "clear cytoplasm"),            # C02 = 细胞质清晰度
    ("C03", "symmetrical blastomeres"),    # 对调后 C03 = 卵裂球对称性
    ("C04", "intact zona pellucida"),      # C04 = 透明带完整性
    ("C05", "rapid cleavage rate"),        # C05 = 分裂速率
    ("C06", "minimal metabolic debris"),   # C06 = 代谢碎屑
    ("C07", "smooth membrane boundaries"), # C07 = 膜边界平滑度
    ("C08", "minor fragmentation"),        # C08 = 碎片化程度（负向）
    ("C09", "pronounced vacuolation"),     # C09 = 空泡化程度（负向）
    ("C10", "disorganized cell structures"),# C10 = 细胞结构紊乱（负向）
]

GRADE_LABELS_CN = {0: "一级胚胎", 1: "二级胚胎", 2: "三级胚胎", 3: "四级胚胎"}
GRADE_NAMES = {0: "Grade 1", 1: "Grade 2", 2: "Grade 3", 3: "Grade 4"}

# 正向概念（C01-C07）的典型分数区间（按等级）
SIMULATED_POS_SCORES = {
    0: [92, 88, 90, 88, 86, 84, 83],  # Grade 1
    1: [72, 76, 68, 70, 65, 63, 60],  # Grade 2
    2: [48, 44, 42, 38, 35, 32, 28],  # Grade 3
    3: [22, 18, 15, 12, 10,  8,  7],  # Grade 4
}
# 负向概念（C08-C10）的典型分数
SIMULATED_NEG_SCORES = {
    0: [ 5,  2,  3],
    1: [24,  9, 14],
    2: [60, 42, 35],
    3: [84, 68, 60],
}
# 各等级的 XAI 贡献百分比基准（正向+负向合计100%）
SIMULATED_PERCENTS = {
    0: [18.50, 12.00, 16.50, 14.00, 10.50, 9.50, 8.00,  5.00, 3.50, 2.50],
    1: [14.50, 11.00, 13.50, 12.00,  9.00, 8.50, 6.50, 14.50, 5.50, 5.00],
    2: [ 9.50,  8.00,  8.50,  7.50,  6.50, 6.00, 5.00, 24.00,14.50,10.50],
    3: [ 4.80,  3.50,  4.20,  3.80,  3.00, 3.20, 2.50, 34.50,22.00,18.50],
}


def _image_hash_seed(image_bytes: bytes) -> int:
    """从图像字节生成确定性随机种子（相同图像每次结果一致）。"""
    return int(hashlib.md5(image_bytes).hexdigest()[:8], 16)


def _simulate_prediction(image_bytes: bytes) -> dict:
    """
    仿真模式推理：基于图像哈希生成确定性结果。
    输出格式与真实模式完全一致。
    """
    t0 = time.time()
    seed = _image_hash_seed(image_bytes)
    rng = np.random.RandomState(seed % (2**31))

    # 用哈希决定等级（分布模拟真实数据集：G1>G2>G3>G4）
    grade_probs_raw = rng.dirichlet([4.0, 6.0, 3.0, 2.0])
    predicted_grade = int(np.argmax(grade_probs_raw))

    # 按等级生成概念分数（加小幅高斯噪声）
    pos_base = SIMULATED_POS_SCORES[predicted_grade]
    neg_base = SIMULATED_NEG_SCORES[predicted_grade]
    pos_scores = [max(0, min(100, int(v + rng.normal(0, 3)))) for v in pos_base]
    neg_scores = [max(0, min(100, int(v + rng.normal(0, 2)))) for v in neg_base]

    pct_base = list(SIMULATED_PERCENTS[predicted_grade])
    pct_noise = rng.normal(0, 0.3, 10)
    pcts = [max(0.5, round(p + n, 2)) for p, n in zip(pct_base, pct_noise)]
    # 归一化到100%
    total = sum(pcts)
    pcts = [round(p / total * 100, 2) for p in pcts]

    # 前端 conceptScores 格式
    all_scores = pos_scores + neg_scores
    frontend_scores = [
        {"id": cid, "score": score, "percent": pct}
        for (cid, _), score, pct in zip(FRONTEND_CONCEPTS, all_scores, pcts)
    ]

    # concept_scores（英文名→float）
    concept_scores_dict = {
        name: round(score / 100.0, 4)
        for (_, name), score in zip(FRONTEND_CONCEPTS, all_scores)
    }

    # 各等级概率（使真实感更强）
    grade_probs = {GRADE_NAMES[i]: round(float(grade_probs_raw[i]), 4) for i in range(4)}

    # 置信度
    confidence = float(grade_probs_raw[predicted_grade])

    # AI 决策文本（模拟 report_generator.py 的输出）
    cn_concepts = [
        "细胞大小均一性", "细胞质清晰度", "卵裂球对称性",
        "透明带完整性", "分裂速率", "代谢碎屑", "膜边界平滑度",
        "碎片化程度", "空泡化程度", "细胞结构紊乱",
    ]
    grade_cn = GRADE_LABELS_CN[predicted_grade]
    pos_top = sorted(
        [(cn_concepts[i], pcts[i]) for i in range(7)],
        key=lambda x: -x[1]
    )[:3]
    neg_top = sorted(
        [(cn_concepts[i + 7], pcts[i + 7]) for i in range(3)],
        key=lambda x: -x[1]
    )[:2]

    decision_parts = [
        f"该胚胎综合评估为{grade_cn}，"
        f"主要依据：{pos_top[0][0]}（{pos_top[0][1]:.2f}%）、"
        f"{pos_top[1][0]}（{pos_top[1][1]:.2f}%）及"
        f"{pos_top[2][0]}（{pos_top[2][1]:.2f}%）。"
    ]
    if neg_top:
        decision_parts.append(
            f"需关注：{neg_top[0][0]}（{neg_top[0][1]:.2f}%）"
            + (f"及{neg_top[1][0]}（{neg_top[1][1]:.2f}%）" if len(neg_top) > 1 else "") + "。"
        )

    elapsed = (time.time() - t0) * 1000 + rng.uniform(200, 800)  # 仿真推理耗时

    return {
        "predicted_grade": predicted_grade,
        "grade_name": GRADE_NAMES[predicted_grade],
        "grade_label_cn": grade_cn,
        "confidence": round(confidence, 4),
        "grade_probabilities": grade_probs,
        "concept_scores": concept_scores_dict,
        "frontend_concept_scores": frontend_scores,
        "ai_decision": "".join(decision_parts),
        "inference_time_ms": round(elapsed, 1),
        "simulated": True,
    }


class MCAService:
    """
    MCA 推理服务，自动检测模型权重是否存在。
    - 有权重 → 真实推理（调用 MCAInference）
    - 无权重 → 仿真模式（_simulate_prediction）
    """

    def __init__(self):
        self.engine = None
        self.simulated = True
        self.device = "cpu"
        self._try_load_engine()

    def _try_load_engine(self):
        """尝试加载真实 MCA 模型。"""
        ckpt = os.environ.get(
            "MCA_CHECKPOINT",
            os.path.join(os.path.dirname(__file__), "MCA_embryo", "checkpoints", "stage2_best.pth"),
        )
        try:
            # 动态加载 MCA_embryo 模块（避免顶层导入失败影响启动）
            mca_root = os.path.join(os.path.dirname(__file__), "MCA_embryo")
            if mca_root not in sys.path:
                sys.path.insert(0, mca_root)

            from inference import MCAInference  # noqa
            import torch
            device = "cuda" if torch.cuda.is_available() else "cpu"
            self.engine = MCAInference(ckpt_path=ckpt, device=device)
            self.simulated = False
            self.device = device
            print(f"[MCAService] 真实模型已加载，设备：{device}")
        except Exception as e:
            print(f"[MCAService] 模型加载失败，启用仿真模式：{e}")
            self.simulated = True

    def predict(self, image_bytes: bytes, filename: str = "upload.jpg") -> dict:
        """统一推理入口，自动选择真实/仿真模式。"""
        if self.simulated or self.engine is None:
            return _simulate_prediction(image_bytes)

        # ── 真实推理 ──
        import tempfile, torch
        t0 = time.time()
        with tempfile.NamedTemporaryFile(suffix=os.path.splitext(filename)[1] or ".jpg", delete=False) as f:
            f.write(image_bytes)
            tmp_path = f.name

        try:
            raw = self.engine.predict_single(tmp_path, top_k=10)
        finally:
            os.unlink(tmp_path)

        elapsed = (time.time() - t0) * 1000
        g = raw["predicted_grade"]

        # 将全量概念分数映射到前端 C01-C10 格式
        cs = raw["concept_scores"]  # {en_name: float}
        frontend_scores = []
        for i, (cid, en_name) in enumerate(FRONTEND_CONCEPTS):
            score_float = cs.get(en_name, 0.0)
            score_int = min(100, max(0, int(score_float * 100)))
            # 用重要性权重估算百分比
            wts = self.engine.model.get_concept_importance().numpy()  # (4, M)
            all_names = self.engine.concepts
            idx = all_names.index(en_name) if en_name in all_names else -1
            pct = round(abs(float(wts[g, idx])) * 100 / (abs(wts[g]).sum() + 1e-8) * 100, 2) if idx >= 0 else 0.0
            frontend_scores.append({"id": cid, "score": score_int, "percent": pct})

        return {
            "predicted_grade": g,
            "grade_name": raw["grade_name"],
            "grade_label_cn": GRADE_LABELS_CN[g],
            "confidence": round(max(raw["grade_probabilities"].values()), 4),
            "grade_probabilities": raw["grade_probabilities"],
            "concept_scores": {en: round(v, 4) for en, v in cs.items()},
            "frontend_concept_scores": frontend_scores,
            "ai_decision": raw["diagnosis_report"],
            "inference_time_ms": round(elapsed, 1),
            "simulated": False,
        }


# 全局单例（FastAPI 启动时初始化一次）
_service: Optional[MCAService] = None


def get_service() -> MCAService:
    global _service
    if _service is None:
        _service = MCAService()
    return _service
