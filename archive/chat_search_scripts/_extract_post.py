import json, os, re

chatFile = os.path.join(os.environ['APPDATA'], 'Code', 'User', 'workspaceStorage', 
    'aad39539e71dbb81f38375af28f2d071', 'chatSessions', 
    '9107b46f-2f2e-4660-8747-6c1ca19bf184.jsonl')

# Собираем все ответы нейронки (kind=2, которые содержат response)
all_responses = []
all_user_msgs = []

with open(chatFile, 'r', encoding='utf-8') as f:
    for line_num, line in enumerate(f, 1):
        line = line.strip()
        if not line:
            continue
        try:
            obj = json.loads(line)
        except:
            continue
        
        kind = obj.get('kind')
        
        if kind == 0:
            # Начальные данные сессии
            reqs = obj.get('v', {}).get('requests', [])
            for i, req in enumerate(reqs):
                # Пользовательское сообщение
                msg = req.get('message', {})
                if isinstance(msg, dict):
                    val = msg.get('value', '')
                elif isinstance(msg, str):
                    val = msg
                else:
                    val = ''
                if val and not val.startswith('<context') and not val.startswith('<environment'):
                    all_user_msgs.append(f"[REQ {i}] {val[:500]}")
                
                # Ответ нейронки
                resp = req.get('response', [])
                if isinstance(resp, list):
                    for r in resp:
                        if isinstance(r, dict):
                            v = r.get('value', '')
                            if v and isinstance(v, str) and len(v) > 200:
                                # Скорее всего текст поста
                                if any(kw in v.lower() for kw in ['джарвис', 'jarvis', 'тони', 'железн', 'помощник', 'мстител', 'старк', 'пост', 'код', 'агент']):
                                    all_responses.append(f"--- RESPONSE (line {line_num}, len={len(v)}) ---\n{v[:3000]}\n")
        
        elif kind == 2:
            k = obj.get('k', [])
            v = obj.get('v')
            
            # Пользовательские сообщения
            if k and k[-1] == 'message':
                if isinstance(v, dict):
                    val = v.get('value', '')
                elif isinstance(v, str):
                    val = v
                else:
                    val = ''
                if val and not val.startswith('<context') and not val.startswith('<environment') and len(val) > 5:
                    all_user_msgs.append(f"[UPD k={k}] {val[:500]}")
            
            # Ответы нейронки (response в разных форматах)
            if isinstance(v, list):
                for item in v:
                    if isinstance(item, dict):
                        val = item.get('value', '')
                        if val and isinstance(val, str) and len(val) > 200:
                            if any(kw in val.lower() for kw in ['джарвис', 'jarvis', 'тони', 'железн', 'помощник', 'мстител', 'старк', 'агент', 'код', 'пост']):
                                all_responses.append(f"--- RESPONSE (line {line_num}, k={k}, len={len(val)}) ---\n{val[:3000]}\n")
            elif isinstance(v, str) and len(v) > 200:
                if any(kw in v.lower() for kw in ['джарвис', 'jarvis', 'тони', 'железн', 'помощник', 'мстител', 'старк']):
                    all_responses.append(f"--- RESPONSE (line {line_num}, k={k}, len={len(v)}) ---\n{v[:3000]}\n")

print("=" * 60)
print("USER MESSAGES:")
print("=" * 60)
for m in all_user_msgs:
    print(m)
    print("---")

print("\n" + "=" * 60)
print(f"RELEVANT RESPONSES ({len(all_responses)}):")
print("=" * 60)
for r in all_responses[:10]:
    print(r)
