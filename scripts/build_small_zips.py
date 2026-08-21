import os
import zipfile
import shutil
from pathlib import Path

SOURCE_ROOT = Path(r"c:\Users\Krish\project\New folder\SmartRail-OS")
TARGET_ROOT = Path(r"c:\Users\Krish\project\New folder\SmartRail-OS Extened\smrtest")

# Excluded directories
EXCLUDE_DIRS = {
    "node_modules", ".venv", "venv", ".git", ".pytest_cache", 
    "dist", "build", ".dart_tool", ".idea", ".vscode", 
    "__pycache__", ".tox", ".mypy_cache", ".ruff_cache",
    ".gemini", ".serena", ".code-review-graph", "zips_for_claude"
}

# Excluded files
EXCLUDE_FILES = {
    "SmartRail_1Year_Data.csv", "smartrail_dev.db", "smartrailos_dev.db",
    "smartrailos_dev.db-wal", "smartrailos_dev.db-shm", "smartrailos_dev.db-journal",
    "tsconfig.tsbuildinfo", "repomix-output.md"
}

EXCLUDE_EXTS = {".pyc", ".pyo", ".pyd", ".db-wal", ".db-shm", ".db", ".log"}

def is_excluded(path: Path) -> bool:
    for part in path.parts:
        if part in EXCLUDE_DIRS:
            return True
    if path.name in EXCLUDE_FILES:
        return True
    if path.suffix in EXCLUDE_EXTS:
        return True
    return False

def sync_files(src_dir: Path, dst_dir: Path):
    print(f"[*] Syncing updated files from {src_dir.name} -> {dst_dir.name}...")
    count = 0
    for root, dirs, files in os.walk(src_dir):
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
        rel_root = Path(root).relative_to(src_dir)
        target_sub = dst_dir / rel_root
        target_sub.mkdir(parents=True, exist_ok=True)
        
        for f in files:
            src_file = Path(root) / f
            if is_excluded(src_file):
                continue
            dst_file = target_sub / f
            try:
                # Copy if dst doesn't exist or src is newer / different size
                if not dst_file.exists() or src_file.stat().st_mtime > dst_file.stat().st_mtime or src_file.stat().st_size != dst_file.stat().st_size:
                    shutil.copy2(src_file, dst_file)
                    count += 1
            except Exception as e:
                pass
    print(f"  [+] Synced {count} updated files to target directory.")

def make_zip(out_dir: Path, zip_name: str, root_dir: Path, include_paths: list[Path]):
    zip_path = out_dir / zip_name
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for inc_path in include_paths:
            full_path = root_dir / inc_path
            if not full_path.exists():
                continue
            
            if full_path.is_file():
                if not is_excluded(full_path):
                    arcname = str(full_path.relative_to(root_dir))
                    zf.write(full_path, arcname)
            else:
                for root, dirs, files in os.walk(full_path):
                    dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
                    for f in files:
                        file_p = Path(root) / f
                        if not is_excluded(file_p):
                            arcname = str(file_p.relative_to(root_dir))
                            zf.write(file_p, arcname)
                            
    size_kb = zip_path.stat().st_size / 1024
    if size_kb > 1024:
        print(f"  [+] {zip_name:<38} -> {size_kb/1024:.2f} MB")
    else:
        print(f"  [+] {zip_name:<38} -> {size_kb:.1f} KB")

def generate_all_zips(base_dir: Path):
    out_dir = base_dir / "zips_for_claude"
    out_dir.mkdir(parents=True, exist_ok=True)
    print(f"\n[*] Generating small modular Claude zips in: {out_dir}")
    
    # 1. Backend (FastAPI Core, Services, Repositories, Schemas, Tests)
    make_zip(out_dir, "01_backend_fastapi.zip", base_dir, [
        Path("backend/app"),
        Path("backend/tests"),
        Path("backend/alembic"),
        Path("backend/alembic.ini"),
        Path("backend/requirements.txt"),
        Path("backend/main.py"),
        Path("STARTUP.md"),
    ])
    
    # 2. Web Dashboard (React + TanStack Router + Tailwind)
    make_zip(out_dir, "02_web_dashboard.zip", base_dir, [
        Path("smartrailos_web/src"),
        Path("smartrailos_web/package.json"),
        Path("smartrailos_web/vite.config.ts"),
        Path("smartrailos_web/tsconfig.json"),
        Path("smartrailos_web/components.json"),
        Path("smartrailos_web/.env.example"),
    ])
    
    # 3. Mobile App (Flutter Dart source)
    make_zip(out_dir, "03_mobile_flutter.zip", base_dir, [
        Path("smartrailos_app/lib"),
        Path("smartrailos_app/pubspec.yaml"),
        Path("smartrailos_app/pubspec.lock"),
        Path("smartrailos_app/android"),
        Path("smartrailos_app/ios"),
        Path("smartrailos_app/web"),
    ])
    
    # 4. Hardware IoT & Sensor Simulators (ESP32 C++ firmware, Serial Bridge, Sensor Simulators)
    make_zip(out_dir, "04_hardware_iot_esp32.zip", base_dir, [
        Path("esp32-test"),
        Path("scripts"),
        Path("data_api"),
        Path("metro_engine_shared.py"),
    ])
    
    # 5. ML Estimation & Mathematical Models (RandomForest scripts, training pipeline, data generator)
    make_zip(out_dir, "05_ml_estimation_engine.zip", base_dir, [
        Path("passenger_estimation"),
    ])
    
    # 6. Architecture & System Docs
    make_zip(out_dir, "06_documentation_architecture.zip", base_dir, [
        Path("docs"),
        Path("README.md"),
        Path("STARTUP.md"),
        Path("project_details.md"),
    ])
    
    # 7. Complete Full-Stack Codebase (Code-Only compact bundle)
    make_zip(out_dir, "07_full_stack_code_complete.zip", base_dir, [
        Path("backend/app"),
        Path("backend/tests"),
        Path("backend/requirements.txt"),
        Path("smartrailos_web/src"),
        Path("smartrailos_web/package.json"),
        Path("smartrailos_web/vite.config.ts"),
        Path("smartrailos_web/tsconfig.json"),
        Path("smartrailos_app/lib"),
        Path("smartrailos_app/pubspec.yaml"),
        Path("esp32-test"),
        Path("scripts"),
        Path("data_api"),
        Path("docs"),
        Path("README.md"),
        Path("STARTUP.md"),
        Path("project_details.md"),
        Path("metro_engine_shared.py"),
    ])

def main():
    if TARGET_ROOT.exists():
        sync_files(SOURCE_ROOT, TARGET_ROOT)
        generate_all_zips(TARGET_ROOT)
    
    generate_all_zips(SOURCE_ROOT)
    print("\n[SUCCESS] All small modular zips created successfully!")

if __name__ == "__main__":
    main()
