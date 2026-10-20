from ultralytics import YOLO
import os

# Load our trained pothole detection model
MODEL_PATH = os.path.join(os.path.dirname(__file__), "best.pt")
model = YOLO(MODEL_PATH)


def detect_potholes(image_path: str, save_dir: str = "uploads/results"):
    """
    Runs YOLO detection on the given image.
    Returns: pothole_count, severity_score (1-10), result_image_path
    """
    os.makedirs(save_dir, exist_ok=True)

    results = model.predict(source=image_path, save=True, project=save_dir, name="detect", exist_ok=True)

    result = results[0]
    pothole_count = len(result.boxes)

    # Calculate severity (1-10) based on count + average confidence + box sizes
    if pothole_count == 0:
        severity = 0
    else:
        avg_conf = float(result.boxes.conf.mean())
        # More potholes + higher confidence = higher severity
        severity = min(10, round((pothole_count * 2) + (avg_conf * 3)))
        severity = max(1, severity)

    # Path to the saved result image (with bounding boxes)
    result_image_path = os.path.join(save_dir, "detect", os.path.basename(image_path))

    return {
        "pothole_count": pothole_count,
        "severity": severity,
        "result_image_path": result_image_path
    }


# Quick test when run directly
if __name__ == "__main__":
    test_image = "../ml/dataset/images"  # update with a real test image path
    print("Model loaded successfully ✅")
    print(f"Model classes: {model.names}")