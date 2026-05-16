import subprocess, time, os, urllib.request

Y = r"D:\亦梓科技人工智能部\api\yiapi"
OUT = os.path.join(Y, "start_result.txt")

with open(OUT, "w", encoding="utf-8") as f:
    # 1. Check files
    f.write("=== 1. Files ===\n")
    for fn in ["yiapi.exe", ".env", "yiapi.db"]:
        p = os.path.join(Y, fn)
        sz = os.path.getsize(p) if os.path.exists(p) else -1
        f.write("  %s: %d\n" % (fn, sz))

    # 2. Kill old
    f.write("\n=== 2. Kill old ===\n")
    subprocess.run(["taskkill", "/F", "/IM", "yiapi.exe"], capture_output=True)
    time.sleep(2)
    f.write("  killed\n")

    # 3. Start
    f.write("\n=== 3. Start service ===\n")
    env = os.environ.copy()
    env["THEME"] = "default"
    env["PORT"] = "3000"
    exe = os.path.join(Y, "yiapi.exe")
    proc = subprocess.Popen(
        [exe],
        cwd=Y, env=env,
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
    )
    f.write("  PID: %d\n" % proc.pid)
    f.flush()

    # 4. Wait 15s for service to start
    f.write("\n=== 4. Waiting 15s ===\n")
    f.flush()
    time.sleep(15)

    # 5. Check process
    f.write("\n=== 5. Process check ===\n")
    r = subprocess.run(["tasklist"], capture_output=True, text=True)
    found = [l for l in r.stdout.split("\n") if "yiapi" in l.lower()]
    if found:
        for line in found:
            f.write("  RUNNING: %s\n" % line)
    else:
        f.write("  NOT RUNNING!\n")

    # 6. Check log
    f.write("\n=== 6. Log tail ===\n")
    logf = os.path.join(Y, "logs", "oneapi-20260512.log")
    if os.path.exists(logf):
        with open(logf, errors="replace") as lf:
            lines = lf.readlines()
        for l in lines[-15:]:
            f.write("  %s\n" % l.rstrip())
    else:
        f.write("  NO LOG FILE!\n")

    # 7. Test API endpoints
    f.write("\n=== 7. API tests ===\n")
    for ep in ["/api/status", "/api/models", "/api/plan", "/"]:
        try:
            r2 = urllib.request.urlopen("http://localhost:3000" + ep, timeout=5)
            body = r2.read().decode()[:200]
            f.write("  %s [HTTP %d]: %s\n" % (ep, r2.status, body))
        except Exception as e:
            f.write("  %s ERROR: %s\n" % (ep, e))

    # 8. Check port
    f.write("\n=== 8. Port check ===\n")
    r3 = subprocess.run(["netstat", "-ano"], capture_output=True, text=True)
    lines3000 = [l for l in r3.stdout.split("\n") if ":3000" in l]
    if lines3000:
        for line in lines3000:
            f.write("  %s\n" % line)
    else:
        f.write("  Port 3000 not listening!\n")

    f.write("\n=== DONE ===\n")

print("Result in: " + OUT)