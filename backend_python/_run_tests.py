"""Скрипт для запуска тестов team-модуля и вывода результата."""
import subprocess
import sys
import os

os.chdir(r'C:\Users\nikita79882\Desktop\vk planer code\12.02.2026\backend_python')

result = subprocess.run(
    [sys.executable, '-m', 'pytest', 'tests/team/test_team_integration.py', '--tb=short', '-q'],
    capture_output=True, text=True, timeout=300
)

outpath = os.path.join(r'C:\Users\nikita79882\Desktop\vk planer code\12.02.2026', 'test_output.txt')
with open(outpath, 'w', encoding='utf-8') as f:
    f.write("=== STDOUT ===\n")
    f.write(result.stdout or "EMPTY")
    f.write("\n=== STDERR ===\n")
    f.write(result.stderr or "EMPTY")
    f.write(f"\n=== RETURNCODE: {result.returncode} ===\n")

# Последние строки
lines = (result.stdout or "").strip().split('\n')
for line in lines[-5:]:
    print(line)
print(f"RC={result.returncode}")
print(f"File: {outpath}")
