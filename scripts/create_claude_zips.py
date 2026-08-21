import os
import zipfile
import shutil
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
OUTPUT_DIR = ROOT_DIR / "zips_for_claude"
OUTPUT_DIR.mkdir(exist_ok=True)

# Common exclusion patterns
EXCLUDE_DIRS = {
    "node_modules", ".venv", "venv", ".git", ".pytest_cache", 
    "dist", "build", ".dart_tool", ".idea", ".vscode", 
    "__pycache__", ".tox", ".mypy_cache", ".ruff_cache",
    ".gemini", ".serena", ".code-review-graph"
}
EXCLUDE_FILES = {
    "SmartRail_1Year_Data.csv", "smartrail_dev.db", "smartrailos_dev.db",
    "smartrailos_dev.db-wal", "smartrailos_dev.db-shm", "tsconfig.tsbuildinfo",
    "repomix-output.md"
}
EXCLUDE_EXTS = {".pyc", ".pyo", ".pyd", ".db-wal", ".db-shm"}

def is_excluded(path: Path) -> bool:
    for part in path.parts:
        if part in EXCLUDE_DIRS:
            return True
    if path.name in EXCLUDE_FILES:
        return True
    if path.suffix in EXCLUDE_EXTS:
        return True
    return False

def make_zip(zip_name: str, include_paths: list[Path]):
    zip_path = OUTPUT_DIR / zip_name
    print(f"[*] Creating {zip_name}...")
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for inc_path in include_paths:
            full_path = ROOT_DIR / inc_path
            if not full_path.exists():
                print(f"  [-] Path not found: {inc_path}")
                continue
            
            if full_path.is_file():
                if not is_excluded(full_path):
                    arcname = str(full_path.relative_to(ROOT_DIR))
                    zf.write(full_path, arcname)
            else:
                for root, dirs, files in os.walk(full_path):
                    dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
                    for f in files:
                        file_p = Path(root) / f
                        if not is_excluded(file_p):
                            arcname = str(file_p.relative_to(ROOT_DIR))
                            zf.write(file_p, arcname)
                            
    size_mb = zip_path.stat().st_size / (1024 * 1024)
    print(f"  [+] {zip_name} created: {size_mb:.2f} MB")

def main():
    print(f"Creating Claude-optimized zip bundles in: {OUTPUT_DIR}\n")
    
    # 1. Backend
    make_zip("smartrail_01_backend.zip", [
        Path("backend"),
        Path("STARTUP.md"),
        Path("README.md"),
        Path("metro_engine_shared.py"),
    ])
    
    # 2. Web Dashboard
    make_zip("smartrail_02_web_dashboard.zip", [
        Path("smartrailos_web/src"),
        Path("smartrailos_web/public"),
        Path("smartrailos_web/package.json"),
        Path("smartrailos_web/vite.config.ts"),
        Path("smartrailos_web/tsconfig.json"),
        Path("smartrailos_web/components.json"),
        Path("smartrailos_web/.env.example"),
        Path("smartrailos_web/README.md"),
    ])
    
    # 3. Mobile App (Flutter)
    make_zip("smartrail_03_mobile_app.zip", [
        Path("smartrailos_app/lib"),
        Path("smartrailos_app/assets"),
        Path("smartrailos_app/pubspec.yaml"),
        Path("smartrailos_app/pubspec.lock"),
        Path("smartrailos_app/android"),
        Path("smartrailos_app/ios"),
        Path("smartrailos_app/web"),
        Path("smartrailos_app/README.md"),
    ])
    
    # 4. ML, Hardware & Documentation
    make_zip("smartrail_04_ml_hardware_docs.zip", [
        Path("passenger_estimation"),
        Path("esp32-test"),
        Path("data_api"),
        Path("scripts"),
        Path("docs"),
        Path("README.md"),
        Path("STARTUP.md"),
        Path("project_details.md"),
    ])
    
    # 5. Complete Codebase (Compact)
    make_zip("smartrail_05_complete_all_in_one.zip", [
        Path("backend"),
        Path("smartrailos_web/src"),
        Path("smartrailos_web/public"),
        Path("smartrailos_web/package.json"),
        Path("smartrailos_web/vite.config.ts"),
        Path("smartrailos_web/tsconfig.json"),
        Path("smartrailos_web/components.json"),
        Path("smartrailos_web/.env.example"),
        Path("smartrailos_app/lib"),
        Path("smartrailos_app/pubspec.yaml"),
        Path("passenger_estimation"),
        Path("esp32-test"),
        Path("data_api"),
        Path("scripts"),
        Path("docs"),
        Path("README.md"),
        Path("STARTUP.md"),
        Path("project_details.md"),
        Path("metro_engine_shared.py"),
    ])

    print("\n[SUCCESS] All zip files created successfully in zips_for_claude/ folder!")

if __name__ == "__main__":
    main()
