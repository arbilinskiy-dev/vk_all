from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import httpx

import models
from database import get_db

router = APIRouter(prefix="/api/vk-test", tags=["vk-test"])

# Configuration (In production, use env vars)
# App 1 (Original)
VK_APP_ID_1 = 54423358
VK_CLIENT_SECRET_1 = "wQ0ANYum4o5HK0cVoGxt"

# App 2 (New)
VK_APP_ID_2 = 54422343
VK_CLIENT_SECRET_2 = "TJW7a1TlVEnjgskq5d7w"

APPS_CONFIG = {
    str(VK_APP_ID_1): VK_CLIENT_SECRET_1,
    str(VK_APP_ID_2): VK_CLIENT_SECRET_2
}

# Redirect URI must match what is configured in VK App (even if not used for redirect in embedded OneTap)
# For OneTap/SDK, it's often the origin or a specific callback
VK_REDIRECT_URI = "https://718f01ee96c1.ngrok-free.app" # Update this to your current ngrok

class VKExchangeRequest(BaseModel):
    code: str
    device_id: str
    code_verifier: str = "" 
    redirect_uri: str = "" # Allow frontend to dictate redirect_uri to match exactly
    app_id: int = VK_APP_ID_1 # Default to App 1 if not specified

@router.post("/exchange-token")
async def exchange_token(data: VKExchangeRequest, db: Session = Depends(get_db)):
    # Use URI from frontend if provided, else fallback to env/const
    final_redirect_uri = data.redirect_uri if data.redirect_uri else VK_REDIRECT_URI
    
    current_app_id = str(data.app_id)
    current_client_secret = APPS_CONFIG.get(current_app_id)
    
    if not current_client_secret:
         raise HTTPException(status_code=400, detail=f"Unknown App ID: {data.app_id}")

    print(f"🔄 VK Test (App {data.app_id}): Exchanging code {data.code[:5]}...")
    print(f"    Verifier: {data.code_verifier[:5] if data.code_verifier else 'None'}")
    print(f"    RedirectURI: {final_redirect_uri}")
    
    # 1. Exchange Code for Access Token (Server-Side)
    async with httpx.AsyncClient() as client:
        # ⚠️ REVERTED: id.vk.com/oauth2/auth is the correct endpoint for VK ID codes
        # despite the confusing name (it handles exchange too).
        url = "https://id.vk.com/oauth2/auth"
        
        data_body = {
            "grant_type": "authorization_code",
            "client_id": data.app_id,
            "client_secret": current_client_secret,
            "redirect_uri": final_redirect_uri,
            "code": data.code,
            "device_id": data.device_id
        }
        
        # If frontend sent code_verifier (PKCE), add it
        if data.code_verifier:
             data_body["code_verifier"] = data.code_verifier

        # LOGGING PARAMS (Safety: mask secret)
        safe_params = data_body.copy()
        safe_params['client_secret'] = '***'
        print(f"📡 Sending POST request to VK: {url} with body: {safe_params}")

        try:
            # Note: id.vk.com usually expects POST for token exchange
            resp = await client.post(url, data=data_body)
            
            print(f"DEBUG: VK Response Status: {resp.status_code}")
            # print(f"DEBUG: VK Response Body: {resp.text}")

            resp_data = resp.json()
        except Exception as e:
            print(f"❌ JSON/Network Error: {e}")
            raise HTTPException(status_code=500, detail=f"Network error: {e}")

        if "error" in resp_data:
            print(f"❌ VK Error: {resp_data}")
            raise HTTPException(status_code=400, detail=f"VK Error: {resp_data.get('error_description')}")

        print(f"✅ Token received! User ID: {resp_data.get('user_id')}")
        print(f"🔍 Token Scopes: {resp_data.get('scope')}") # Log the actual scopes
        
        # 2. (Optional) Fetch User Info Server-Side to prove we have access
        access_token = resp_data["access_token"]
        user_id = resp_data["user_id"]
        
        # Test request to groups.get
        # NOTE: filter='admin,editor,moderator' only returns managed groups.
        # If testing with a regular user, this might be empty.
        groups_params = {
            "access_token": access_token,
            "v": "5.199",
            "user_id": user_id,
            "extended": 1,
            # "filter": "admin,editor,moderator" # Commented out to see ALL groups for debugging
        }
        
        groups_resp = await client.get(
            "https://api.vk.com/method/groups.get",
            params=groups_params
        )
        groups_data = groups_resp.json()
        
        if "error" in groups_data:
            print(f"❌ groups.get Error: {groups_data['error']}")
            # Don't fail the whole request, but include error in response
            groups_sample = {"error": groups_data['error']}
        else:
            groups_sample = groups_data.get("response", {}).get("items", [])[:3]

        # 3. Получаем информацию о пользователе
        user_info_params = {
            "access_token": access_token,
            "v": "5.199",
            "user_ids": user_id,
            "fields": "photo_100,photo_200,first_name,last_name"
        }
        
        user_info_resp = await client.get(
            "https://api.vk.com/method/users.get",
            params=user_info_params
        )
        user_info_data = user_info_resp.json()
        
        user_info = {}
        if "response" in user_info_data and len(user_info_data["response"]) > 0:
            user_info = user_info_data["response"][0]
            print(f"👤 User Info: {user_info.get('first_name')} {user_info.get('last_name')}")

        # 4. Сохраняем или обновляем пользователя в базе
        vk_user_id_str = str(user_id)
        existing_user = db.query(models.VkUser).filter(models.VkUser.vk_user_id == vk_user_id_str).first()
        
        # Рассчитываем время истечения токена
        expires_in = resp_data.get("expires_in", 0)
        token_expires_at = datetime.utcnow() + timedelta(seconds=expires_in) if expires_in else None
        
        if existing_user:
            # Обновляем существующего пользователя
            existing_user.first_name = user_info.get("first_name")
            existing_user.last_name = user_info.get("last_name")
            existing_user.photo_url = user_info.get("photo_200") or user_info.get("photo_100")
            existing_user.access_token = access_token
            existing_user.refresh_token = resp_data.get("refresh_token")
            existing_user.token_expires_at = token_expires_at
            existing_user.scope = resp_data.get("scope")
            existing_user.app_id = str(data.app_id)
            existing_user.last_login = datetime.utcnow()
            existing_user.is_active = True
            print(f"🔄 Updated existing VK user: {vk_user_id_str}")
        else:
            # Создаём нового пользователя
            new_user = models.VkUser(
                vk_user_id=vk_user_id_str,
                first_name=user_info.get("first_name"),
                last_name=user_info.get("last_name"),
                photo_url=user_info.get("photo_200") or user_info.get("photo_100"),
                access_token=access_token,
                refresh_token=resp_data.get("refresh_token"),
                token_expires_at=token_expires_at,
                scope=resp_data.get("scope"),
                app_id=str(data.app_id),
                is_active=True,
                last_login=datetime.utcnow(),
                created_at=datetime.utcnow()
            )
            db.add(new_user)
            print(f"✅ Created new VK user: {vk_user_id_str}")
        
        db.commit()

        print(f"DEBUG: VK Response Body: {resp.text}")
        return {
            "auth_data": resp_data,
            "user_info": user_info,
            "groups_sample": groups_sample,
            "saved_to_db": True
        }


# ===== ENDPOINTS ДЛЯ УПРАВЛЕНИЯ VK ПОЛЬЗОВАТЕЛЯМИ =====

@router.get("/users/current")
def get_current_vk_user(db: Session = Depends(get_db)):
    """
    Получает текущего активного VK пользователя (последний авторизовавшийся с активным токеном).
    """
    user = db.query(models.VkUser).filter(
        models.VkUser.is_active == True
    ).order_by(models.VkUser.last_login.desc()).first()
    
    if not user:
        return None
    
    return {
        "vk_user_id": user.vk_user_id,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "photo_url": user.photo_url,
        "is_active": user.is_active,
    }


@router.get("/users")
def get_vk_users(db: Session = Depends(get_db)):
    """
    Получает список всех авторизованных VK пользователей.
    """
    users = db.query(models.VkUser).order_by(models.VkUser.last_login.desc()).all()
    
    return [
        {
            "vk_user_id": u.vk_user_id,
            "first_name": u.first_name,
            "last_name": u.last_name,
            "photo_url": u.photo_url,
            "email": u.email,
            "scope": u.scope,
            "app_id": u.app_id,
            "is_active": u.is_active,
            "access_token": u.access_token,
            "last_login": u.last_login.isoformat() if u.last_login else None,
            "created_at": u.created_at.isoformat() if u.created_at else None,
            "token_expires_at": u.token_expires_at.isoformat() if u.token_expires_at else None,
        }
        for u in users
    ]


@router.delete("/users/{vk_user_id}")
def delete_vk_user(vk_user_id: str, db: Session = Depends(get_db)):
    """
    Удаляет VK пользователя из базы.
    """
    user = db.query(models.VkUser).filter(models.VkUser.vk_user_id == vk_user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db.delete(user)
    db.commit()
    
    return {"success": True, "deleted_user_id": vk_user_id}


@router.get("/users/{vk_user_id}/groups")
async def get_user_groups(vk_user_id: str, db: Session = Depends(get_db)):
    """
    Получает список групп VK пользователя.
    """
    user = db.query(models.VkUser).filter(models.VkUser.vk_user_id == vk_user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if not user.access_token:
        raise HTTPException(status_code=400, detail="User has no access token")
    
    # Проверяем истечение токена
    if user.token_expires_at and user.token_expires_at < datetime.utcnow():
        raise HTTPException(status_code=401, detail="Token expired")
    
    async with httpx.AsyncClient() as client:
        # Сначала пробуем получить группы, где пользователь админ/редактор
        groups_params = {
            "access_token": user.access_token,
            "v": "5.199",
            "extended": 1,
            "filter": "admin,editor,moder",
            "fields": "members_count,photo_200,description"
        }
        
        groups_resp = await client.get(
            "https://api.vk.com/method/groups.get",
            params=groups_params
        )
        groups_data = groups_resp.json()
        
        if "error" in groups_data:
            # Если ошибка, пробуем без фильтра
            del groups_params["filter"]
            groups_resp = await client.get(
                "https://api.vk.com/method/groups.get",
                params=groups_params
            )
            groups_data = groups_resp.json()
        
        if "error" in groups_data:
            return {
                "success": False,
                "error": groups_data["error"],
                "groups": []
            }
        
        groups = groups_data.get("response", {}).get("items", [])
        count = groups_data.get("response", {}).get("count", 0)
        
        return {
            "success": True,
            "count": count,
            "groups": groups
        }


# ===== STANDALONE АВТОРИЗАЦИЯ =====

class StandaloneCallbackRequest(BaseModel):
    access_token: str
    user_id: str
    expires_in: int = 0
    app_id: int = 7017349

@router.post("/standalone-callback")
async def standalone_callback(data: StandaloneCallbackRequest, db: Session = Depends(get_db)):
    """
    Обрабатывает callback от Standalone OAuth авторизации.
    Сохраняет токен и информацию о пользователе в БД.
    """
    print(f"🔑 Standalone callback for user {data.user_id}, app {data.app_id}")
    
    async with httpx.AsyncClient() as client:
        # Получаем информацию о пользователе
        user_info_params = {
            "access_token": data.access_token,
            "v": "5.199",
            "user_ids": data.user_id,
            "fields": "photo_100,photo_200,first_name,last_name"
        }
        
        user_info_resp = await client.get(
            "https://api.vk.com/method/users.get",
            params=user_info_params
        )
        user_info_data = user_info_resp.json()
        
        user_info = {}
        if "response" in user_info_data and len(user_info_data["response"]) > 0:
            user_info = user_info_data["response"][0]
            print(f"👤 Standalone User: {user_info.get('first_name')} {user_info.get('last_name')}")
        
        # Тестируем groups.get чтобы убедиться что токен работает
        groups_params = {
            "access_token": data.access_token,
            "v": "5.199",
            "extended": 1,
            "filter": "admin,editor,moder",
            "count": 3
        }
        
        groups_resp = await client.get(
            "https://api.vk.com/method/groups.get",
            params=groups_params
        )
        groups_data = groups_resp.json()
        
        groups_test = None
        if "error" in groups_data:
            print(f"⚠️ groups.get test failed: {groups_data['error']}")
            groups_test = {"error": groups_data["error"]}
        else:
            groups_test = groups_data.get("response", {})
            print(f"✅ groups.get test OK, found {groups_test.get('count', 0)} managed groups")
    
    # Рассчитываем время истечения токена
    token_expires_at = None
    if data.expires_in > 0:
        token_expires_at = datetime.utcnow() + timedelta(seconds=data.expires_in)
    
    # Сохраняем или обновляем пользователя в БД
    vk_user_id_str = str(data.user_id)
    existing_user = db.query(models.VkUser).filter(models.VkUser.vk_user_id == vk_user_id_str).first()
    
    if existing_user:
        existing_user.first_name = user_info.get("first_name")
        existing_user.last_name = user_info.get("last_name")
        existing_user.photo_url = user_info.get("photo_200") or user_info.get("photo_100")
        existing_user.access_token = data.access_token
        existing_user.token_expires_at = token_expires_at
        existing_user.scope = "standalone_full"  # Маркер что это Standalone токен
        existing_user.app_id = str(data.app_id)
        existing_user.last_login = datetime.utcnow()
        existing_user.is_active = True
        print(f"🔄 Updated existing VK user (Standalone): {vk_user_id_str}")
    else:
        new_user = models.VkUser(
            vk_user_id=vk_user_id_str,
            first_name=user_info.get("first_name"),
            last_name=user_info.get("last_name"),
            photo_url=user_info.get("photo_200") or user_info.get("photo_100"),
            access_token=data.access_token,
            token_expires_at=token_expires_at,
            scope="standalone_full",
            app_id=str(data.app_id),
            is_active=True,
            last_login=datetime.utcnow(),
            created_at=datetime.utcnow()
        )
        db.add(new_user)
        print(f"✅ Created new VK user (Standalone): {vk_user_id_str}")
    
    db.commit()
    
    return {
        "success": True,
        "user_info": user_info,
        "groups_test": groups_test,
        "token_expires_at": token_expires_at.isoformat() if token_expires_at else None
    }
