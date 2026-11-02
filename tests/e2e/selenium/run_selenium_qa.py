#!/usr/bin/env python3
"""
PETWO QA Automation — Selenium Suite Runner & Reporting Engine
"""
import sys
import subprocess
import os


def main():
    print("🐾 ===================================================")
    print("🐾 PETWO QA AUTOMATION — SELENIUM SUITE RUNNER")
    print("🐾 Target Geography: Hyderabad / Pan-India Multi-Tenant")
    print("🐾 ===================================================\n")

    current_dir = os.path.dirname(os.path.abspath(__file__))
    report_file = os.path.join(current_dir, "selenium-report.html")

    # Check if pytest is available
    cmd = [
        sys.executable,
        "-m",
        "pytest",
        current_dir,
        "-v",
        f"--html={report_file}",
        "--self-contained-html",
    ]

    print(f"Executing command: {' '.join(cmd)}\n")
    try:
        result = subprocess.run(cmd, check=False)
        print(f"\nExecution finished with exit code: {result.returncode}")
        if os.path.exists(report_file):
            print(f"📊 HTML Test Report generated at: {report_file}")
        return result.returncode
    except Exception as e:
        print(f"Error running Selenium tests: {e}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
