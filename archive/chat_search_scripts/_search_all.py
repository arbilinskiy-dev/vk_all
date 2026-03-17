import json, os, glob

ws_root = os.path.join(os.environ['APPDATA'], 'Code', 'User', 'workspaceStorage')

# Search ALL workspace storages for chats mentioning author-writer + Jarvis/post
for ws_dir in os.listdir(ws_root):
    ws_path = os.path.join(ws_root, ws_dir)
    if not os.path.isdir(ws_path):
        continue
    
    chat_dir = os.path.join(ws_path, 'chatSessions')
    if not os.path.isdir(chat_dir):
        continue
    
    for fname in os.listdir(chat_dir):
        fpath = os.path.join(chat_dir, fname)
        if not os.path.isfile(fpath):
            continue
        
        try:
            with open(fpath, 'r', encoding='utf-8') as f:
                content = f.read()
        except:
            continue
        
        # Check if this chat has BOTH author-writer invocation AND Jarvis
        has_author = 'author-writer' in content or 'author_writer' in content or 'ghostwriter' in content.lower()
        has_jarvis = 'джарвис' in content.lower() or 'jarvis' in content.lower()
        has_post = 'напиши пост' in content.lower() or 'пост про' in content.lower() or 'пост о ' in content.lower() or 'в стиле автора' in content.lower()
        
        if has_author and has_jarvis and has_post:
            print(f'MATCH: {ws_dir}/{fname}')
            
            # Extract user messages
            for line in content.split('\n'):
                if not line.strip():
                    continue
                try:
                    obj = json.loads(line)
                except:
                    continue
                
                if obj.get('kind') == 0:
                    reqs = obj.get('v', {}).get('requests', [])
                    for i, req in enumerate(reqs):
                        msg = req.get('message', {})
                        text = msg.get('text', '') if isinstance(msg, dict) else ''
                        if text and not text.startswith('<context') and not text.startswith('<environment'):
                            print(f'  INIT MSG: {text[:500]}')
                
                elif obj.get('kind') == 2:
                    k = obj.get('k', [])
                    v = obj.get('v')
                    if k and k[0] == 'requests' and isinstance(v, list):
                        for req in v:
                            msg = req.get('message', {})
                            text = msg.get('text', '') if isinstance(msg, dict) else ''
                            if text and not text.startswith('<context') and not text.startswith('<environment') and len(text) < 2000:
                                if any(kw in text.lower() for kw in ['джарвис', 'jarvis', 'автор', 'пост', 'напиши', 'скилл', 'стиле']):
                                    print(f'  UPDATE MSG: {text[:500]}')
            print()

print('DONE')
