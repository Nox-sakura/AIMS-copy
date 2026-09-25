"""
main.py — FastAPI 应用入口
运行方式：uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
"""
import time
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .schemas import PredictResponse, HealthResponse
from .mca_service import get_service

app = FastAPI(
    title="MCA Embryo Grading API",
    version="1.0.0",
    description="MCA 胚胎质量评估后端服务（支持真实推理与仿真模式）",
)

# CORS：允许本地 Vite 开发服务器访问
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    """预热：启动时初始化推理服务。"""
    get_service()
    print("[FastAPI] MCA 服务已就绪")


@app.get("/api/mca/health", response_model=HealthResponse)
async def health():
    """健康检查，前端可用于检测后端是否在线。"""
    svc = get_service()
    return HealthResponse(
        status="ok",
        model_loaded=not svc.simulated,
        device=svc.device,
        simulated=svc.simulated,
    )


@app.post("/api/mca/predict", response_model=PredictResponse)
async def predict(file: UploadFile = File(...)):
    """
    接收胚胎图像，返回评级结果与概念分数。

    请求：multipart/form-data，字段名 file，支持 JPEG/PNG
    响应：PredictResponse JSON
    """
    # 文件类型校验
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="仅支持图像文件（JPEG/PNG）")

    image_bytes = await file.read()
    if len(image_bytes) == 0:
        raise HTTPException(status_code=400, detail="图像文件为空")

    svc = get_service()
    result = svc.predict(image_bytes, filename=file.filename or "upload.jpg")
    return PredictResponse(**result)
