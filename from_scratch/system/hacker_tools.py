"""BranPy Hacker Tools — Ferramentas de segurança ofensiva e defensiva.

100% da branpy.com.br — Todos os direitos reservados.
Ferramentas de hacking ético: scan, exploit, defesa, monitoramento.

ATENÇÃO: Use apenas em sistemas que você tem autorização!
"""

import os
import sys
import socket
import struct
import textwrap
import subprocess
import threading
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Optional, Tuple
from concurrent.futures import ThreadPoolExecutor, as_completed


class HackerTools:
    """Ferramentas de hacking — 100% branpy.com.br."""
    
    def __init__(self):
        self.results = []
        
    # ==========================================
    # SCAN DE PORTAS
    # ==========================================
    
    def port_scanner(self, host: str, port_range: Tuple[int, int] = (1, 1024), threads: int = 100) -> List[Dict]:
        """Scanner de portas rápido com threads."""
        open_ports = []
        
        def scan_port(port):
            try:
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                sock.settimeout(1)
                result = sock.connect_ex((host, port))
                if result == 0:
                    try:
                        service = socket.getservbyport(port)
                    except:
                        service = "unknown"
                    open_ports.append({"port": port, "service": service, "status": "open"})
                sock.close()
            except:
                pass
        
        with ThreadPoolExecutor(max_workers=threads) as executor:
            futures = [executor.submit(scan_port, port) for port in range(port_range[0], port_range[1] + 1)]
            for future in as_completed(futures):
                pass
        
        return sorted(open_ports, key=lambda x: x["port"])
    
    def quick_scan(self, host: str) -> List[Dict]:
        """Scan rápido das portas comuns."""
        common_ports = [21, 22, 23, 25, 53, 80, 110, 143, 443, 993, 995, 1433, 3306, 3389, 5432, 8080, 8443]
        return self.port_scanner(host, (min(common_ports), max(common_ports)), 50)
    
    # ==========================================
    # VULNERABILITY SCANNER
    # ==========================================
    
    def vulnerability_scan(self, host: str) -> List[Dict]:
        """Scan básico de vulnerabilidades."""
        vulnerabilities = []
        
        # Verificar portas vulneráveis
        vuln_ports = {
            21: "FTP - Possível vulnerabilidade: anonymous login",
            22: "SSH - Verificar versão",
            23: "Telnet - Inseguro! Transmitte texto puro",
            25: "SMTP - Possível relay aberto",
            53: "DNS - Possível zone transfer",
            80: "HTTP - Verificar versão do servidor",
            135: "RPC - Possível exploração",
            139: "NetBIOS - Possível信息泄漏",
            443: "HTTPS - Verificar certificado",
            445: "SMB - Possível EternalBlue",
            1433: "MSSQL - Verificar credenciais padrão",
            3306: "MySQL - Verificar credenciais padrão",
            3389: "RDP - Verificar credenciais padrão",
            5432: "PostgreSQL - Verificar credenciais padrão",
            8080: "HTTP Proxy - Verificar configuração",
        }
        
        for port, desc in vuln_ports.items():
            try:
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                sock.settimeout(1)
                result = sock.connect_ex((host, port))
                if result == 0:
                    vulnerabilities.append({
                        "port": port,
                        "vulnerability": desc,
                        "severity": "medium",
                        "status": "open"
                    })
                sock.close()
            except:
                pass
        
        return vulnerabilities
    
    # ==========================================
    # SNIFFER DE REDE
    # ==========================================
    
    def network_sniffer(self, interface: str = None, count: int = 100) -> List[Dict]:
        """Sniffer de rede (requer admin/root)."""
        packets = []
        
        try:
            import scapy.all as scapy
            
            def packet_handler(packet):
                if packet.haslayer(scapy.IP):
                    packets.append({
                        "src_ip": packet[scapy.IP].src,
                        "dst_ip": packet[scapy.IP].dst,
                        "protocol": packet[scapy.IP].proto,
                        "size": len(packet),
                        "time": datetime.now().isoformat(),
                    })
            
            scapy.sniff(iface=interface, count=count, prn=packet_handler)
        except ImportError:
            packets.append({"error": "Scapy não instalado. pip install scapy"})
        except Exception as e:
            packets.append({"error": str(e)})
        
        return packets
    
    # ==========================================
    # KEYLOGGER (para teste de segurança)
    # ==========================================
    
    def keylogger_detector(self) -> Dict:
        """Detecta keyloggers no sistema."""
        suspicious = []
        
        # Processos suspeitos
        import psutil
        for proc in psutil.process_iter(['name', 'exe']):
            try:
                name = proc.info['name'].lower()
                if any(kw in name for kw in ['keylog', 'hook', 'capture', 'spy', 'monitor']):
                    suspicious.append({
                        "process": proc.info['name'],
                        "pid": proc.pid,
                        "exe": proc.info.get('exe', 'unknown'),
                        "reason": "Nome suspeito"
                    })
            except:
                pass
        
        return {
            "suspicious": suspicious,
            "count": len(suspicious),
            "status": "clean" if len(suspicious) == 0 else "warning"
        }
    
    # ==========================================
    # FIREWALL
    # ==========================================
    
    def firewall_status(self) -> Dict:
        """Verifica status do firewall."""
        try:
            if sys.platform == 'win32':
                result = subprocess.run(
                    ['netsh', 'advfirewall', 'show', 'allprofiles'],
                    capture_output=True, text=True
                )
                return {"status": "active" if "ON" in result.stdout else "inactive", "raw": result.stdout}
            else:
                result = subprocess.run(['ufw', 'status'], capture_output=True, text=True)
                return {"status": "active" if "active" in result.stdout.lower() else "inactive", "raw": result.stdout}
        except Exception as e:
            return {"error": str(e)}
    
    def block_ip(self, ip: str) -> bool:
        """Bloqueia IP no firewall."""
        try:
            if sys.platform == 'win32':
                subprocess.run([
                    'netsh', 'advfirewall', 'firewall', 'add', 'rule',
                    f'name="Block {ip}"', 'dir=in', 'action=block', f'remoteip={ip}'
                ], check=True)
            else:
                subprocess.run(['ufw', 'deny', 'from', ip], check=True)
            return True
        except:
            return False
    
    def unblock_ip(self, ip: str) -> bool:
        """Desbloqueia IP no firewall."""
        try:
            if sys.platform == 'win32':
                subprocess.run([
                    'netsh', 'advfirewall', 'firewall', 'delete', 'rule',
                    f'name="Block {ip}"'
                ], check=True)
            else:
                subprocess.run(['ufw', 'delete', 'deny', 'from', ip], check=True)
            return True
        except:
            return False
    
    # ==========================================
    # BRUTE FORCE
    # ==========================================
    
    def ssh_brute_force(self, host: str, username: str, wordlist: str) -> List[Dict]:
        """Brute force SSH (apenas para teste autorizado)."""
        results = []
        
        try:
            with open(wordlist, 'r', encoding='utf-8', errors='ignore') as f:
                passwords = f.read().splitlines()
        except:
            return [{"error": "Wordlist não encontrada"}]
        
        for password in passwords[:100]:  # Limitar a 100 tentativas
            try:
                # Apenas verificar se a conexão é possível
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                sock.settimeout(1)
                result = sock.connect_ex((host, 22))
                sock.close()
                
                if result == 0:
                    results.append({
                        "password": password,
                        "status": "attempted",
                        "success": False  # Não realmente conectar por segurança
                    })
            except:
                pass
        
        return results
    
    # ==========================================
    # SQL INJECTION TESTER
    # ==========================================
    
    def sql_injection_test(self, url: str) -> List[Dict]:
        """Testa vulnerabilidades de SQL Injection."""
        payloads = [
            "' OR '1'='1",
            "' OR '1'='1' --",
            "' OR '1'='1' /*",
            "admin' --",
            "1' UNION SELECT null,null,null --",
            "' UNION SELECT username,password FROM users --",
        ]
        
        results = []
        for payload in payloads:
            try:
                import requests
                test_url = f"{url}?id={payload}"
                response = requests.get(test_url, timeout=5)
                
                if response.status_code == 200 and ("error" not in response.text.lower()):
                    results.append({
                        "payload": payload,
                        "status": "potentially_vulnerable",
                        "response_code": response.status_code,
                    })
                else:
                    results.append({
                        "payload": payload,
                        "status": "protected",
                        "response_code": response.status_code,
                    })
            except:
                results.append({
                    "payload": payload,
                    "status": "error",
                })
        
        return results
    
    # ==========================================
    # XSS TESTER
    # ==========================================
    
    def xss_test(self, url: str) -> List[Dict]:
        """Testa vulnerabilidades de XSS."""
        payloads = [
            "<script>alert('XSS')</script>",
            "<img src=x onerror=alert('XSS')>",
            "<svg onload=alert('XSS')>",
            "javascript:alert('XSS')",
            "'-alert('XSS')-'",
        ]
        
        results = []
        for payload in payloads:
            try:
                import requests
                test_url = f"{url}?q={payload}"
                response = requests.get(test_url, timeout=5)
                
                if payload in response.text:
                    results.append({
                        "payload": payload,
                        "status": "vulnerable",
                        "response_code": response.status_code,
                    })
                else:
                    results.append({
                        "payload": payload,
                        "status": "protected",
                        "response_code": response.status_code,
                    })
            except:
                results.append({
                    "payload": payload,
                    "status": "error",
                })
        
        return results
    
    # ==========================================
    # EXPLOIT FRAMEWORK
    # ==========================================
    
    def exploit_check(self, host: str, exploit: str) -> Dict:
        """Verifica se um exploit é aplicável."""
        known_exploits = {
            "eternalblue": {"port": 445, "service": "SMB", "cve": "CVE-2017-0144"},
            "heartbleed": {"port": 443, "service": "HTTPS", "cve": "CVE-2014-0160"},
            "shellshock": {"port": 80, "service": "HTTP", "cve": "CVE-2014-6271"},
        }
        
        if exploit in known_exploits:
            info = known_exploits[exploit]
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(1)
            result = sock.connect_ex((host, info["port"]))
            sock.close()
            
            return {
                "exploit": exploit,
                "cve": info["cve"],
                "port": info["port"],
                "service": info["service"],
                "vulnerable": result == 0,
                "status": "check_required" if result == 0 else "not_vulnerable"
            }
        
        return {"error": "Exploit desconhecido"}
    
    # ==========================================
    # WIFI HANDLER
    # ==========================================
    
    def wifi_scan(self) -> List[Dict]:
        """Escaneia redes WiFi disponíveis."""
        networks = []
        try:
            if sys.platform == 'win32':
                result = subprocess.run(
                    ['netsh', 'wlan', 'show', 'networks', 'mode=bssid'],
                    capture_output=True, text=True
                )
                # Parse do output
                current = {}
                for line in result.stdout.split('\n'):
                    if 'SSID' in line:
                        if current:
                            networks.append(current)
                        current = {"ssid": line.split(':')[-1].strip()}
                    elif 'BSSID' in line:
                        current["bssid"] = line.split(':')[-1].strip()
                    elif 'Signal' in line:
                        current["signal"] = line.split(':')[-1].strip()
                    elif 'Authentication' in line:
                        current["auth"] = line.split(':')[-1].strip()
                if current:
                    networks.append(current)
            else:
                result = subprocess.run(['iwlist', 'scan'], capture_output=True, text=True)
                # Parse do output Linux
                pass
        except Exception as e:
            networks.append({"error": str(e)})
        
        return networks
    
    # ==========================================
    # DEFESAS
    # ==========================================
    
    def generate_defense_rules(self) -> Dict:
        """Gera regras de defesa."""
        return {
            "firewall": [
                "Bloquear portas não utilizadas",
                "Permitir apenas tráfego necessário",
                "Monitorar conexões suspeitas",
            ],
            "ids": [
                "Instalar Snort ou Suricata",
                "Configurar regras de detecção",
                "Monitorar logs",
            ],
            "hardening": [
                "Desabilitar serviços desnecessários",
                "Atualizar sistema regularmente",
                "Usar senhas fortes",
                "Habilitar 2FA",
            ],
            "monitoring": [
                "Monitorar logs de acesso",
                "Alertar sobre atividades suspeitas",
                "Auditar permissões regularmente",
            ],
        }
    
    def security_audit(self) -> Dict:
        """Auditoria de segurança básica."""
        issues = []
        
        # Verificar firewall
        firewall = self.firewall_status()
        if firewall.get("status") != "active":
            issues.append({"severity": "high", "issue": "Firewall desativado"})
        
        # Verificar processos suspeitos
        keylogger = self.keylogger_detector()
        if keylogger["count"] > 0:
            issues.append({"severity": "high", "issue": f"{keylogger['count']} processos suspeitos encontrados"})
        
        # Verificar portas abertas
        import psutil
        connections = psutil.net_connections()
        listening = [c for c in connections if c.status == 'LISTEN']
        if len(listening) > 10:
            issues.append({"severity": "medium", "issue": f"{len(listening)} portas abertas"})
        
        return {
            "issues": issues,
            "score": max(0, 100 - len(issues) * 10),
            "status": "secure" if len(issues) == 0 else "warning"
        }


# ==========================================
# EXECUÇÃO
# ==========================================

if __name__ == "__main__":
    tools = HackerTools()
    
    print("=" * 60)
    print("BRANPY HACKER TOOLS — Ferramentas de Segurança")
    print("100% branpy.com.br")
    print("=" * 60)
    
    print("\n[AUDITORIA] Verificando segurança do sistema...")
    audit = tools.security_audit()
    print(f"  Score: {audit['score']}/100")
    print(f"  Status: {audit['status']}")
    if audit['issues']:
        print("  Problemas:")
        for issue in audit['issues']:
            print(f"    - [{issue['severity']}] {issue['issue']}")
    
    print("\n[DEFESA] Regras de segurança:")
    rules = tools.generate_defense_rules()
    for category, items in rules.items():
        print(f"  {category}:")
        for item in items:
            print(f"    - {item}")
    
    print("\n[WIFI] Redes disponíveis:")
    networks = tools.wifi_scan()
    for net in networks:
        if "ssid" in net:
            print(f"  {net['ssid']} - {net.get('signal', 'N/A')}")
    
    print("\n" + "=" * 60)
    print("Hacker Tools pronto!")
    print("=" * 60)
