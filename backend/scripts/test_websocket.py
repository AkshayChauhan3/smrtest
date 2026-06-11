import asyncio
import websockets
import json

async def listen():
    uri = "ws://localhost:8000/api/v1/ws/realtime"
    print(f"Connecting to {uri}...")
    
    try:
        async with websockets.connect(uri) as websocket:
            print("Connected! Waiting for live events...")
            while True:
                message = await websocket.recv()
                data = json.loads(message)
                print("\n--- NEW LIVE EVENT ---")
                print(f"Event Type: {data.get('event_type')}")
                print(json.dumps(data.get("data", {}), indent=2))
                
    except websockets.exceptions.ConnectionClosed:
        print("Connection closed by the server.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(listen())
