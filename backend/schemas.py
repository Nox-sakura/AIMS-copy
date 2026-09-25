"""
schemas.py — 请求/响应数据结构定义
"""
from pydantic import BaseModel
from typing import Dict, List, Optional


class PredictResponse(BaseModel):
    """POST /api/mca/predict 的响应体"""
    # 评级结果
    predicted_grade: int                        # 0-indexed: 0=Grade1, 1=Grade2, 2=Grade3, 3=Grade4
    grade_name: str                             # "Grade 1" | "Grade 2" | "Grade 3" | "Grade 4"
    grade_label_cn: str                         # "一级胚胎" | "二级胚胎" | "三级胚胎" | "四级胚胎"
    confidence: float                           # 最高等级的置信度，0-1

    # 各等级概率
    grade_probabilities: Dict[str, float]       # {"Grade 1": 0.85, "Grade 2": 0.10, ...}

    # 概念分数（全量，与前端 concepts.js C01-C10 对应）
    concept_scores: Dict[str, float]            # {"symmetrical blastomeres": 0.92, ...}

    # 前端 conceptScores 格式（id + score + percent，直接填入 assessments.js）
    frontend_concept_scores: List[Dict]         # [{"id":"C01","score":92,"percent":18.50}, ...]

    # 旧版兼容文本字段；形态观察展示不使用该字段
    ai_decision: str

    # 处理耗时（毫秒）
    inference_time_ms: float

    # 是否为仿真模式
    simulated: bool


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    device: str
    simulated: bool
