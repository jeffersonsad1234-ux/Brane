"""BranPy PC Control — Controle total do computador.

100% da branpy.com.br — Todos os direitos reservados.
Controla absolutamente tudo no PC: arquivos, processos, rede, sistema.

Rodar: python pc_control.py
"""

import os
import sys
import json
import shutil
import psutil
import socket
import subprocess
import platform
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Optional, Any


class PCController:
    """Controlador total do PC — 100% branpy.com.br."""
    
    def __init__(self):
        self.system = platform.system()
        self.hostname = socket.gethostname()
        self.user = os.getenv('USERNAME', os.getenv('USER', 'unknown'))
        
    # ==========================================
    # INFORMAÇÕES DO SISTEMA
    # ==========================================
    
    def get_system_info(self) -> Dict:
        """Retorna informações completas do sistema."""
        return {
            "system": self.system,
            "node": platform.node(),
            "release": platform.release(),
            "version": platform.version(),
            "machine": platform.machine(),
            "processor": platform.processor(),
            "python": platform.python_version(),
            "hostname": self.hostname,
            "user": self.user,
            "ip": self.get_ip(),
        }
    
    def get_ip(self) -> str:
        """Retorna IP local."""
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(("8.8.8.8", 80))
            ip = s.getsockname()[0]
            s.close()
            return ip
        except:
            return "127.0.0.1"
    
    def get_public_ip(self) -> str:
        """Retorna IP público."""
        try:
            import requests
            return requests.get('https://api.ipify.org').text
        except:
            return "unknown"
    
    # ==========================================
    # PROCESSOS
    # ==========================================
    
    def list_processes(self) -> List[Dict]:
        """Lista todos os processos."""
        processes = []
        for proc in psutil.process_iter(['pid', 'name', 'username', 'cpu_percent', 'memory_percent']):
            try:
                processes.append(proc.info)
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                pass
        return processes
    
    def kill_process(self, pid: int) -> bool:
        """Mata processo por PID."""
        try:
            proc = psutil.Process(pid)
            proc.kill()
            return True
        except:
            return False
    
    def kill_process_by_name(self, name: str) -> int:
        """Mata processos por nome."""
        killed = 0
        for proc in psutil.process_iter(['pid', 'name']):
            try:
                if name.lower() in proc.info['name'].lower():
                    proc.kill()
                    killed += 1
            except:
                pass
        return killed
    
    def start_process(self, command: str) -> subprocess.Popen:
        """Inicia processo."""
        return subprocess.Popen(command, shell=True)
    
    # ==========================================
    # ARQUIVOS
    # ==========================================
    
    def list_files(self, path: str = ".") -> List[Dict]:
        """Lista arquivos em um diretório."""
        files = []
        for item in Path(path).iterdir():
            files.append({
                "name": item.name,
                "path": str(item),
                "type": "dir" if item.is_dir() else "file",
                "size": item.stat().st_size if item.is_file() else 0,
                "modified": datetime.fromtimestamp(item.stat().st_mtime).isoformat(),
            })
        return files
    
    def read_file(self, path: str) -> str:
        """Lê arquivo."""
        with open(path, 'r', encoding='utf-8', errors='ignore') as f:
            return f.read()
    
    def write_file(self, path: str, content: str) -> bool:
        """Escreve em arquivo."""
        try:
            with open(path, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        except:
            return False
    
    def delete_file(self, path: str) -> bool:
        """Deleta arquivo."""
        try:
            os.remove(path)
            return True
        except:
            return False
    
    def copy_file(self, src: str, dst: str) -> bool:
        """Copia arquivo."""
        try:
            shutil.copy2(src, dst)
            return True
        except:
            return False
    
    def move_file(self, src: str, dst: str) -> bool:
        """Move arquivo."""
        try:
            shutil.move(src, dst)
            return True
        except:
            return False
    
    def create_directory(self, path: str) -> bool:
        """Cria diretório."""
        try:
            os.makedirs(path, exist_ok=True)
            return True
        except:
            return False
    
    def search_files(self, path: str, pattern: str) -> List[str]:
        """Busca arquivos por padrão."""
        import glob
        return glob.glob(os.path.join(path, pattern), recursive=True)
    
    # ==========================================
    # REDE
    # ==========================================
    
    def get_network_info(self) -> Dict:
        """Retorna informações de rede."""
        return {
            "interfaces": dict(psutil.net_if_addrs()),
            "connections": self.get_connections(),
            "traffic": dict(psutil.net_io_counters()._asdict()),
        }
    
    def get_connections(self) -> List[Dict]:
        """Retorna conexões de rede."""
        connections = []
        for conn in psutil.net_connections():
            connections.append({
                "fd": conn.fd,
                "family": str(conn.family),
                "type": str(conn.type),
                "laddr": str(conn.laddr) if conn.laddr else None,
                "raddr": str(conn.raddr) if conn.raddr else None,
                "status": conn.status,
                "pid": conn.pid,
            })
        return connections
    
    def scan_port(self, host: str, port: int) -> bool:
        """Escaneia porta."""
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(1)
            result = sock.connect_ex((host, port))
            sock.close()
            return result == 0
        except:
            return False
    
    def scan_ports(self, host: str, start: int = 1, end: int = 1024) -> List[int]:
        """Escaneia faixa de portas."""
        open_ports = []
        for port in range(start, end + 1):
            if self.scan_port(host, port):
                open_ports.append(port)
        return open_ports
    
    def ping(self, host: str) -> bool:
        """Faz ping."""
        try:
            param = "-n" if self.system == "Windows" else "-c"
            result = subprocess.run(
                ["ping", param, "1", host],
                capture_output=True, timeout=5
            )
            return result.returncode == 0
        except:
            return False
    
    def traceroute(self, host: str) -> List[str]:
        """Faz traceroute."""
        try:
            param = "-d" if self.system == "Windows" else ""
            result = subprocess.run(
                ["tracert" if self.system == "Windows" else "traceroute", host],
                capture_output=True, text=True, timeout=30
            )
            return result.stdout.split('\n')
        except:
            return []
    
    # ==========================================
    # SISTEMA
    # ==========================================
    
    def get_disk_usage(self) -> List[Dict]:
        """Retorna uso de disco."""
        disks = []
        for partition in psutil.disk_partitions():
            try:
                usage = psutil.disk_usage(partition.mountpoint)
                disks.append({
                    "device": partition.device,
                    "mountpoint": partition.mountpoint,
                    "total": usage.total,
                    "used": usage.used,
                    "free": usage.free,
                    "percent": usage.percent,
                })
            except:
                pass
        return disks
    
    def get_memory_usage(self) -> Dict:
        """Retorna uso de memória."""
        mem = psutil.virtual_memory()
        return {
            "total": mem.total,
            "available": mem.available,
            "percent": mem.percent,
            "used": mem.used,
            "free": mem.free,
        }
    
    def get_cpu_usage(self) -> Dict:
        """Retorna uso de CPU."""
        return {
            "percent": psutil.cpu_percent(interval=1),
            "count": psutil.cpu_count(),
            "frequency": psutil.cpu_freq()._asdict() if psutil.cpu_freq() else None,
        }
    
    def get_battery(self) -> Optional[Dict]:
        """Retorna status da bateria."""
        battery = psutil.sensors_battery()
        if battery:
            return {
                "percent": battery.percent,
                "power_plugged": battery.power_plugged,
                "time_left": battery.secsleft,
            }
        return None
    
    def shutdown(self, delay: int = 0) -> bool:
        """Desliga o PC."""
        try:
            if self.system == "Windows":
                subprocess.run(["shutdown", "/s", "/t", str(delay)])
            else:
                subprocess.run(["shutdown", "-h", f"+{delay // 60}"])
            return True
        except:
            return False
    
    def restart(self, delay: int = 0) -> bool:
        """Reinicia o PC."""
        try:
            if self.system == "Windows":
                subprocess.run(["shutdown", "/r", "/t", str(delay)])
            else:
                subprocess.run(["shutdown", "-r", f"+{delay // 60}"])
            return True
        except:
            return False
    
    def hibernate(self) -> bool:
        """Hiberna o PC."""
        try:
            if self.system == "Windows":
                subprocess.run(["rundll32.exe", "powrprof.dll,SetSuspendState", "0,1,0"])
            else:
                subprocess.run(["systemctl", "hibernate"])
            return True
        except:
            return False
    
    # ==========================================
    # COMANDOS
    # ==========================================
    
    def execute_command(self, command: str) -> Dict:
        """Executa comando do sistema."""
        try:
            result = subprocess.run(
                command,
                shell=True,
                capture_output=True,
                text=True,
                timeout=30
            )
            return {
                "stdout": result.stdout,
                "stderr": result.stderr,
                "returncode": result.returncode,
                "success": result.returncode == 0,
            }
        except subprocess.TimeoutExpired:
            return {"error": "Comando expirou (30s)"}
        except Exception as e:
            return {"error": str(e)}
    
    def execute_python(self, code: str) -> Dict:
        """Executa código Python."""
        try:
            result = subprocess.run(
                [sys.executable, "-c", code],
                capture_output=True,
                text=True,
                timeout=30
            )
            return {
                "stdout": result.stdout,
                "stderr": result.stderr,
                "returncode": result.returncode,
                "success": result.returncode == 0,
            }
        except Exception as e:
            return {"error": str(e)}
    
    # ==========================================
    # MONITORAMENTO
    # ==========================================
    
    def monitor_realtime(self, duration: int = 10) -> List[Dict]:
        """Monitora sistema em tempo real."""
        data = []
        for _ in range(duration):
            data.append({
                "timestamp": datetime.now().isoformat(),
                "cpu": self.get_cpu_usage()["percent"],
                "memory": self.get_memory_usage()["percent"],
                "disk": self.get_disk_usage()[0]["percent"] if self.get_disk_usage() else 0,
            })
            import time
            time.sleep(1)
        return data
    
    def get_all(self) -> Dict:
        """Retorna tudo de uma vez."""
        return {
            "system": self.get_system_info(),
            "cpu": self.get_cpu_usage(),
            "memory": self.get_memory_usage(),
            "disk": self.get_disk_usage(),
            "battery": self.get_battery(),
            "network": self.get_network_info(),
            "processes": len(self.list_processes()),
        }


# ==========================================
# EXECUÇÃO
# ==========================================

if __name__ == "__main__":
    import json
    
    pc = PCController()
    
    print("=" * 60)
    print("BRANPY PC CONTROL — Controle Total do Computador")
    print("100% branpy.com.br")
    print("=" * 60)
    
    print("\n[INFO] Informações do Sistema:")
    info = pc.get_system_info()
    for key, value in info.items():
        print(f"  {key}: {value}")
    
    print("\n[CPU] Uso de CPU:")
    cpu = pc.get_cpu_usage()
    print(f"  Uso: {cpu['percent']}%")
    print(f"  Cores: {cpu['count']}")
    
    print("\n[MEMÓRIA] Uso de Memória:")
    mem = pc.get_memory_usage()
    print(f"  Total: {mem['total'] / (1024**3):.2f} GB")
    print(f"  Usado: {mem['used'] / (1024**3):.2f} GB")
    print(f"  Livre: {mem['free'] / (1024**3):.2f} GB")
    print(f"  Uso: {mem['percent']}%")
    
    print("\n[DISCO] Uso de Disco:")
    for disk in pc.get_disk_usage():
        print(f"  {disk['device']}: {disk['percent']}% ({disk['free'] / (1024**3):.2f} GB livre)")
    
    print("\n[REDE] Conexões:")
    connections = pc.get_connections()
    print(f"  Total: {len(connections)} conexões")
    
    print("\n[PROCESSOS] Top 10:")
    processes = pc.list_processes()
    processes.sort(key=lambda x: x.get('memory_percent', 0) or 0, reverse=True)
    for proc in processes[:10]:
        print(f"  {proc['name']} (PID: {proc['pid']}) - {proc.get('memory_percent', 0):.1f}%")
    
    print("\n" + "=" * 60)
    print("PC Control pronto! Pronto para uso.")
    print("=" * 60)
