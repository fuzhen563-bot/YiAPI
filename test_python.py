print("START")
import os
print("CWD:", os.getcwd())
print("Python works!")
# List current dir
try:
    files = os.listdir(".")
    for f in files[:10]:
        print("  ", f)
except Exception as e:
    print("Error listing:", e)
# Check yiapi dir
Y = r"D:\亦梓科技人工智能部\api\yiapi"
print("\nYiapi dir contents:")
try:
    for f in os.listdir(Y):
        if f.endswith(".exe") or f == ".env" or f == "yiapi.db":
            print("  ", f, os.path.getsize(os.path.join(Y, f)))
except Exception as e:
    print("Error:", e)
print("\nDONE")