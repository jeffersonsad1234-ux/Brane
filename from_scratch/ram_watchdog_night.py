import subprocess, time, ctypes

def get_free_mb():
    r = subprocess.run(['wmic','OS','get','FreePhysicalMemory'], capture_output=True, text=True, creationflags=0x08000000)
    for l in r.stdout.strip().split('\n'):
        l = l.strip()
        if l.isdigit():
            return int(l) // 1024
    return 0

def kill_junk():
    names = ['net_updater64','SearchApp','SearchIndexer','StartMenuExperienceHost',
             'msedgewebview2','RuntimeBroker','PhoneExperienceHost','GameBarPresenceWriter',
             'hola','iVCam','MonectServer','cowork-svc','ollama','M365Copilot','DTAgent',
             'DTShellHlp','gamingservices','gamingservicesnet','Video.UI','spoolsv',
             'SecurityHealthService','igfxEM','igfxHK','igfxTray','NisSrv','CompPkgSrv',
             'WmiPrvSE','dllhost','conhost','sihost','taskhostw','ApplicationFrameHost',
             'SearchProtocolHost','SearchFilterHost','SystemSettings','TextInputHost']
    k = 0
    for n in names:
        r = subprocess.run(['wmic','process','where',f"Name='{n}.exe'",'get','ProcessId'],
                          capture_output=True, text=True, creationflags=0x08000000)
        for l in r.stdout.strip().split('\n'):
            l = l.strip()
            if l.isdigit():
                subprocess.run(['taskkill','/F','/PID',l], capture_output=True, creationflags=0x08000000)
                k += 1
    return k

def empty_working_sets():
    try:
        ctypes.windll.kernel32.SetProcessWorkingSetSize(-1, -1, -1)
    except:
        pass

print("RAM Watchdog Noturno - Rodando ate de.manha!")
print("Limpa a cada 2 minutos se RAM < 20%")

while True:
    free = get_free_mb()
    pct = free / 8098 * 100
    
    if pct < 20:
        killed = kill_junk()
        empty_working_sets()
        time.sleep(2)
        free2 = get_free_mb()
        print(f"[LIMPEZA] {free}MB -> {free2}MB | Matei {killed} processos")
    
    time.sleep(120)
