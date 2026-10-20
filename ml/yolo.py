from ultralytics import YOLO

# Load pretrained YOLOv8 nano model (downloads automatically first time)
model = YOLO("yolov8n.pt")

# Run on a sample image (built-in test image)
results = model.predict(source="https://ultralytics.com/images/bus.jpg", save=True)

print("✅ YOLO is working!")
print(f"Detected {len(results[0].boxes)} objects")