from ultralytics import YOLO

# Load pretrained YOLOv8 nano model
model = YOLO("yolov8n.pt")

# Train on pothole dataset
model.train(
    data="dataset_yolo/pothole.yaml",
    epochs=30,
    imgsz=640,
    batch=8,
    name="pothole_model"
)

print("✅ Training complete!")