"""
Тест исправленной логики _adjust_amounts
"""
import sys
import os

# Добавляем путь к backend в sys.path
backend_path = os.path.join(os.path.dirname(__file__), 'szworker', 'backend')
sys.path.insert(0, backend_path)

from models.task import Task  # type: ignore
from services.generator import DocumentGeneratorService  # type: ignore

# Создаем моковые задачи
tasks_data = [
    {"id": 1, "price_per_unit": 20000, "unit": "шт", "min_quantity": 1, "max_quantity": 2},
    {"id": 2, "price_per_unit": 1500, "unit": "шт", "min_quantity": 10, "max_quantity": 50},
    {"id": 3, "price_per_unit": 15000, "unit": "шт", "min_quantity": 1, "max_quantity": 4},
    {"id": 4, "price_per_unit": 800, "unit": "час", "min_quantity": 10, "max_quantity": 80},
    {"id": 5, "price_per_unit": 35000, "unit": "шт", "min_quantity": 1, "max_quantity": 2},
]

class MockTask:
    def __init__(self, **kwargs):
        for k, v in kwargs.items():
            setattr(self, k, v)

tasks = [MockTask(**t) for t in tasks_data]

# Создаем экземпляр сервиса (без реальной БД)
generator = DocumentGeneratorService(None)

# Создаем тестовые позиции
items = [
    (tasks[0], 1.0, 20000.0),
    (tasks[1], 10.0, 15000.0),
    (tasks[2], 1.0, 15000.0),
    (tasks[3], 96.57, 77256.0),  # Эта позиция вызывала проблему
    (tasks[4], 1.0, 33000.0),
]

print("📊 Исходные позиции:")
print("Task | Кол-во | Цена | Сумма")
print("-" * 60)
total = 0
for i, (task, qty, amt) in enumerate(items, 1):
    print(f"{i:4d} | {qty:6.2f} | {task.price_per_unit:8.2f} | {amt:10.2f}")
    total += amt
print(f"\nИТОГО: {total:.2f}")

target = 40000.0  # Целевая сумма
print(f"\n🎯 Целевая сумма: {target:.2f}")
print(f"📉 Разница: {target - total:.2f}")

# Корректируем
adjusted = generator._adjust_amounts(items, target)

print("\n✅ Скорректированные позиции:")
print("Task | Кол-во | Цена | Сумма")
print("-" * 60)
new_total = 0
for i, (task, qty, amt) in enumerate(adjusted, 1):
    print(f"{i:4d} | {qty:6.2f} | {task.price_per_unit:8.2f} | {amt:10.2f}")
    new_total += amt
    if qty < 0:
        print(f"  ⚠️  ВНИМАНИЕ: Отрицательное количество!")

print(f"\nНОВОЕ ИТОГО: {new_total:.2f}")
print(f"Разница с целью: {abs(target - new_total):.2f}")

if abs(target - new_total) < 0.1:
    print("✅ Корректировка работает правильно!")
else:
    print("❌ Всё ещё есть расхождение")

# Проверяем что нет отрицательных количеств
has_negative = any(qty < 0 for _, qty, _ in adjusted)
if has_negative:
    print("❌ ОШИБКА: Есть отрицательные количества!")
else:
    print("✅ Все количества положительные!")
