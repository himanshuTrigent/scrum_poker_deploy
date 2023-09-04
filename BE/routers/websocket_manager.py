from fastapi import APIRouter, WebSocket
from routers.data_manager import delete_users, delete_room
from tinydb import TinyDB, Query, where
import json
import asyncio
import random


router = APIRouter()

room_websockets = {}


async def change_admin(room_id: str, user_id: str):
    db = TinyDB('rooms_data_db.json')
    rooms = db.table('rooms')
    Room = Query()
    room_document = rooms.search(where('roomId') == room_id)
    if rooms.contains(where('roomId') == room_id):
        response_user_action = {
            'actionType': 'CHANGE_ADMIN', 'userData': []}
        users_list = room_document[0]['users']
        admin_user_index = next((index for (index, user) in enumerate(
            users_list) if user['userId'] == user_id and user['isAdmin'] == True), None)
        if admin_user_index != None:
            previous_admin_user = users_list[admin_user_index]
            del users_list[admin_user_index]
            if (len(users_list)):
                new_admin_user = random.choice(users_list)
                users_list.append(previous_admin_user)
                for user in room_document[0]['users']:
                    if user_id == user['userId']:
                        user['isAdmin'] = False
                        response_user_action['userData'].append(user)
                    if user['userId'] == new_admin_user['userId']:
                        user['isAdmin'] = True
                        response_user_action['userData'].append(user)
                rooms.update(room_document[0], Room.roomId == room_id)
                for websocket in room_websockets[room_id]:
                    if user_id != websocket['user_id']:
                        await websocket['websocket'].send_text(json.dumps(response_user_action))


async def send_message(room_id: str, websocket, user_id, actionType: str):
    db = TinyDB('rooms_data_db.json')
    rooms = db.table('rooms')
    Room = Query()
    Users = Query()
    users = rooms.search(Room.users.any(Users.userId == user_id) & (Room.roomId == room_id))[
        0]['users']
    user_index = next((index for (index, user) in enumerate(
        users) if user['userId'] == user_id), None)
    for web in room_websockets.get(room_id, []):
        if actionType == "NEW_USER_JOINED":
            if web["websocket"] == websocket:
                await web['websocket'].send_text(json.dumps({"actionType": "ACTIVE_USERS_LIST", "userData": users}))
            else:
                await web['websocket'].send_text(json.dumps({"actionType": actionType, "userData": users[user_index]}))
        elif actionType == "USER_LEFT" and web['websocket'] != websocket:
            await web['websocket'].send_text(json.dumps({"actionType": actionType, "userData": users[user_index]}))


async def delete_user(websocket, room_id, user_id):
    websocket_key = next((index for (index, websocket_dict) in enumerate(
        room_websockets[room_id]) if websocket_dict['websocket'] == websocket), None)
    del room_websockets[room_id][websocket_key]
    delete_users(room_id, user_id)
    await asyncio.sleep(10)
    if room_id in room_websockets and len(room_websockets[room_id]) == 0:
        del room_websockets[room_id]
        delete_room(room_id)


@router.websocket("/room/{room_id}")
async def websocket_endpoint(room_id: str, websocket: WebSocket):
    db = TinyDB('rooms_data_db.json')
    rooms = db.table('rooms')
    await websocket.accept()
    if rooms.contains(where('roomId') == room_id):
        rooms = db.table('rooms')
        Room = Query()
        room_data_users = rooms.search(Room.roomId == room_id)[0]['users']
        user_id = room_data_users[-1]['userId']
    if room_id not in room_websockets:
        room_websockets[room_id] = []
    room_websockets[room_id].append(
        {"websocket": websocket, "user_id": user_id})
    await send_message(room_id, websocket, user_id, "NEW_USER_JOINED")
    try:
        while True:
            await websocket.receive_text()
    except Exception as e:
        await send_message(room_id, websocket, user_id, "USER_LEFT")
        await change_admin(room_id, user_id)
        await delete_user(websocket, room_id, user_id)
        return e
