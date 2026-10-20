import os
import xml.etree.ElementTree as ET
import shutil
import random

# Paths (matching your folder structure)
ANNOTATIONS_DIR = "dataset/annotations"
IMAGES_DIR = "dataset/images"
OUTPUT_DIR = "dataset_yolo"

# Create output structure
for folder in ["images/train", "images/val", "labels/train", "labels/val"]:
    os.makedirs(os.path.join(OUTPUT_DIR, folder), exist_ok=True)

# Get all xml files
xml_files = [f for f in os.listdir(ANNOTATIONS_DIR) if f.endswith(".xml")]
random.shuffle(xml_files)

split_idx = int(len(xml_files) * 0.8)
train_files = xml_files[:split_idx]
val_files = xml_files[split_idx:]


def convert_annotation(xml_file, split):
    tree = ET.parse(os.path.join(ANNOTATIONS_DIR, xml_file))
    root = tree.getroot()

    filename = root.find("filename").text
    img_w = int(root.find("size/width").text)
    img_h = int(root.find("size/height").text)

    base_name = os.path.splitext(filename)[0]

    img_src = None
    for ext in [".jpg", ".jpeg", ".png", ".JPG", ".PNG"]:
        possible = os.path.join(IMAGES_DIR, base_name + ext)
        if os.path.exists(possible):
            img_src = possible
            img_ext = ext
            break

    if img_src is None:
        print(f"⚠️ Image not found for {xml_file} (looked for {base_name})")
        return

    img_dst = os.path.join(OUTPUT_DIR, "images", split, base_name + img_ext)
    shutil.copy(img_src, img_dst)

    label_path = os.path.join(OUTPUT_DIR, "labels", split, base_name + ".txt")
    with open(label_path, "w") as f:
        for obj in root.findall("object"):
            bbox = obj.find("bndbox")
            xmin = float(bbox.find("xmin").text)
            ymin = float(bbox.find("ymin").text)
            xmax = float(bbox.find("xmax").text)
            ymax = float(bbox.find("ymax").text)

            x_center = ((xmin + xmax) / 2) / img_w
            y_center = ((ymin + ymax) / 2) / img_h
            width = (xmax - xmin) / img_w
            height = (ymax - ymin) / img_h

            f.write(f"0 {x_center:.6f} {y_center:.6f} {width:.6f} {height:.6f}\n")


print(f"Processing {len(train_files)} training files...")
for xml_file in train_files:
    convert_annotation(xml_file, "train")

print(f"Processing {len(val_files)} validation files...")
for xml_file in val_files:
    convert_annotation(xml_file, "val")

yaml_content = f"""train: {os.path.abspath(os.path.join(OUTPUT_DIR, 'images/train'))}
val: {os.path.abspath(os.path.join(OUTPUT_DIR, 'images/val'))}

nc: 1
names: ['pothole']
"""

with open(os.path.join(OUTPUT_DIR, "pothole.yaml"), "w") as f:
    f.write(yaml_content)

print("✅ Conversion complete! Dataset ready for training.")
print(f"Train images: {len(train_files)}")
print(f"Val images: {len(val_files)}")


