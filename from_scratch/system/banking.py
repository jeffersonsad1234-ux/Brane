"""BranPy Banking — Integração bancária real com PIX.

100% da branpy.com.br — Todos os direitos reservados.
Integração com APIs bancárias: Mercado Pago, PagSeguro, Asaas.

ATENÇÃO: Configure suas credenciais no config.json!
"""

import os
import json
import hashlib
import hmac
import base64
from pathlib import Path
from datetime import datetime
from typing import Dict, Optional, List
import urllib.request
import urllib.parse


class BankingAPI:
    """API Bancária — 100% branpy.com.br."""
    
    def __init__(self, config_path: str = None):
        self.config = self._load_config(config_path)
        self.providers = {
            "mercadopago": MercadoPagoAPI(self.config),
            "pagseguro": PagSeguroAPI(self.config),
            "asaas": AsaasAPI(self.config),
        }
        self.default_provider = self.config.get("default_provider", "mercadopago")
    
    def _load_config(self, config_path: str) -> Dict:
        """Carrega configuração bancária."""
        if config_path and os.path.exists(config_path):
            with open(config_path, 'r') as f:
                return json.load(f)
        
        # Config padrão
        return {
            "mercadopago": {
                "access_token": "",
                "public_key": "",
                "sandbox": True,
            },
            "pagseguro": {
                "email": "",
                "token": "",
                "sandbox": True,
            },
            "asaas": {
                "api_key": "",
                "sandbox": True,
            },
            "default_provider": "mercadopago",
            "owner": {
                "name": "Paulo Jefferson Nascimento do Rosário",
                "pix_key": "",
                "bank_account": "",
            }
        }
    
    # ==========================================
    # PIX
    # ==========================================
    
    def create_pix(self, amount: float, description: str, payer_name: str = "") -> Dict:
        """Cria cobrança PIX."""
        provider = self.providers[self.default_provider]
        return provider.create_pix(amount, description, payer_name)
    
    def check_pix_payment(self, tx_id: str) -> Dict:
        """Verifica pagamento PIX."""
        provider = self.providers[self.default_provider]
        return provider.check_payment(tx_id)
    
    def get_pix_qrcode(self, tx_id: str) -> Dict:
        """Retorna QR Code do PIX."""
        provider = self.providers[self.default_provider]
        return provider.get_qrcode(tx_id)
    
    # ==========================================
    # BOLETO
    # ==========================================
    
    def create_boleto(self, amount: float, description: str, due_date: str) -> Dict:
        """Cria boleto."""
        provider = self.providers[self.default_provider]
        return provider.create_boleto(amount, description, due_date)
    
    # ==========================================
    # CARTÃO
    # ==========================================
    
    def create_payment_card(self, amount: float, card_token: str, description: str) -> Dict:
        """Cria pagamento no cartão."""
        provider = self.providers[self.default_provider]
        return provider.create_card_payment(amount, card_token, description)
    
    # ==========================================
    # CONSULTAS
    # ==========================================
    
    def get_balance(self) -> Dict:
        """Retorna saldo (se disponível na API)."""
        provider = self.providers[self.default_provider]
        return provider.get_balance()
    
    def get_transactions(self, limit: int = 10) -> List[Dict]:
        """Retorna transações."""
        provider = self.providers[self.default_provider]
        return provider.get_transactions(limit)
    
    def get_transaction(self, tx_id: str) -> Dict:
        """Retorna detalhes de uma transação."""
        provider = self.providers[self.default_provider]
        return provider.get_transaction(tx_id)


class MercadoPagoAPI:
    """API do Mercado Pago."""
    
    BASE_URL = "https://api.mercadopago.com"
    
    def __init__(self, config: Dict):
        self.config = config.get("mercadopago", {})
        self.access_token = self.config.get("access_token", "")
        self.sandbox = self.config.get("sandbox", True)
    
    def _request(self, method: str, endpoint: str, data: Dict = None) -> Dict:
        """Faz requisição à API."""
        url = f"{self.BASE_URL}{endpoint}"
        
        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json",
        }
        
        if data:
            data = json.dumps(data).encode('utf-8')
        
        req = urllib.request.Request(url, data=data, headers=headers, method=method)
        
        try:
            with urllib.request.urlopen(req) as response:
                return json.loads(response.read().decode('utf-8'))
        except Exception as e:
            return {"error": str(e)}
    
    def create_pix(self, amount: float, description: str, payer_name: str) -> Dict:
        """Cria cobrança PIX."""
        data = {
            "transaction_amount": amount,
            "description": description,
            "payment_method_id": "pix",
            "payer": {
                "email": "buyer@example.com",
                "first_name": payer_name,
            }
        }
        
        result = self._request("POST", "/v1/payments", data)
        
        if "id" in result:
            return {
                "status": "created",
                "id": result["id"],
                "amount": amount,
                "qr_code": result.get("point_of_interaction", {}).get("transaction_data", {}).get("qr_code", ""),
                "ticket_url": result.get("point_of_interaction", {}).get("transaction_data", {}).get("ticket_url", ""),
            }
        
        return result
    
    def check_payment(self, payment_id: str) -> Dict:
        """Verifica pagamento."""
        result = self._request("GET", f"/v1/payments/{payment_id}")
        return {
            "status": result.get("status", "unknown"),
            "status_detail": result.get("status_detail", ""),
            "amount": result.get("transaction_amount", 0),
        }
    
    def get_qrcode(self, payment_id: str) -> Dict:
        """Retorna QR Code."""
        result = self._request("GET", f"/v1/payments/{payment_id}")
        return {
            "qr_code": result.get("point_of_interaction", {}).get("transaction_data", {}).get("qr_code", ""),
            "ticket_url": result.get("point_of_interaction", {}).get("transaction_data", {}).get("ticket_url", ""),
        }
    
    def get_balance(self) -> Dict:
        """Retorna saldo."""
        # Mercado Pago não fornece saldo diretamente
        return {"balance": "N/A", "provider": "mercadopago"}
    
    def get_transactions(self, limit: int) -> List[Dict]:
        """Retorna transações."""
        result = self._request("GET", f"/v1/payments/search?limit={limit}")
        return result.get("results", [])


class PagSeguroAPI:
    """API do PagSeguro."""
    
    BASE_URL = "https://ws.pagseguro.uol.com.br"
    
    def __init__(self, config: Dict):
        self.config = config.get("pagseguro", {})
        self.email = self.config.get("email", "")
        self.token = self.config.get("token", "")
        self.sandbox = self.config.get("sandbox", True)
    
    def _request(self, method: str, endpoint: str, data: Dict = None) -> Dict:
        """Faz requisição à API."""
        url = f"{self.BASE_URL}{endpoint}"
        
        headers = {
            "Content-Type": "application/json",
        }
        
        if data:
            data = json.dumps(data).encode('utf-8')
        
        req = urllib.request.Request(url, data=data, headers=headers, method=method)
        
        try:
            with urllib.request.urlopen(req) as response:
                return json.loads(response.read().decode('utf-8'))
        except Exception as e:
            return {"error": str(e)}
    
    def create_pix(self, amount: float, description: str, payer_name: str) -> Dict:
        """Cria cobrança PIX."""
        data = {
            "charge": {
                "reference_id": f"BP{datetime.now().strftime('%Y%m%d%H%M%S')}",
                "description": description,
                "amount": {
                    "value": int(amount * 100),
                    "currency": "BRL"
                },
                "payment_method": {
                    "type": "PIX",
                    "pix": {
                        "expiration_date": datetime.now().isoformat()
                    }
                },
                "customer": {
                    "name": payer_name
                }
            }
        }
        
        result = self._request("POST", "/v2/charges", data)
        
        if "code" in result:
            return {
                "status": "created",
                "code": result["code"],
                "amount": amount,
                "pix_copy_paste": result.get("payment_method", {}).get("pix", {}).get("copy_paste", ""),
                "qrcode": result.get("payment_method", {}).get("pix", {}).get("qrcode", ""),
            }
        
        return result
    
    def check_payment(self, charge_code: str) -> Dict:
        """Verifica pagamento."""
        result = self._request("GET", f"/v2/charges/{charge_code}")
        return {
            "status": result.get("status", "unknown"),
            "amount": result.get("amount", {}).get("value", 0) / 100,
        }
    
    def get_balance(self) -> Dict:
        """Retorna saldo."""
        return {"balance": "N/A", "provider": "pagseguro"}
    
    def get_transactions(self, limit: int) -> List[Dict]:
        """Retorna transações."""
        result = self._request("GET", f"/v2/transactions?limit={limit}")
        return result.get("transactions", [])


class AsaasAPI:
    """API do Asaas."""
    
    BASE_URL = "https://api.asaas.com"
    
    def __init__(self, config: Dict):
        self.config = config.get("asaas", {})
        self.api_key = self.config.get("api_key", "")
        self.sandbox = self.config.get("sandbox", True)
        
        if self.sandbox:
            self.BASE_URL = "https://sandbox.asaas.com"
    
    def _request(self, method: str, endpoint: str, data: Dict = None) -> Dict:
        """Faz requisição à API."""
        url = f"{self.BASE_URL}{endpoint}"
        
        headers = {
            "access_token": self.api_key,
            "Content-Type": "application/json",
        }
        
        if data:
            data = json.dumps(data).encode('utf-8')
        
        req = urllib.request.Request(url, data=data, headers=headers, method=method)
        
        try:
            with urllib.request.urlopen(req) as response:
                return json.loads(response.read().decode('utf-8'))
        except Exception as e:
            return {"error": str(e)}
    
    def create_pix(self, amount: float, description: str, payer_name: str) -> Dict:
        """Cria cobrança PIX."""
        data = {
            "billingType": "PIX",
            "value": amount,
            "description": description,
            "dueDate": datetime.now().strftime("%Y-%m-%d"),
        }
        
        result = self._request("POST", "/v3/payments", data)
        
        if "id" in result:
            return {
                "status": "created",
                "id": result["id"],
                "amount": amount,
                "pixCopyPaste": result.get("pixCopyPaste", ""),
                "payload": result.get("payload", ""),
            }
        
        return result
    
    def check_payment(self, payment_id: str) -> Dict:
        """Verifica pagamento."""
        result = self._request("GET", f"/v3/payments/{payment_id}")
        return {
            "status": result.get("status", "unknown"),
            "amount": result.get("value", 0),
        }
    
    def get_balance(self) -> Dict:
        """Retorna saldo."""
        result = self._request("GET", "/v3/accounts/balance")
        return {"balance": result.get("balance", 0), "provider": "asaas"}
    
    def get_transactions(self, limit: int) -> List[Dict]:
        """Retorna transações."""
        result = self._request("GET", f"/v3/payments?limit={limit}")
        return result.get("data", [])


# ==========================================
# EXECUÇÃO
# ==========================================

if __name__ == "__main__":
    print("=" * 60)
    print("BRANPY BANKING — Integração Bancária")
    print("100% branpy.com.br")
    print("=" * 60)
    
    banking = BankingAPI()
    
    print("\n[CONFIG] Configuração atual:")
    print(f"  Provedor padrão: {banking.default_provider}")
    print(f"  Sandbox: {banking.config.get(banking.default_provider, {}).get('sandbox', True)}")
    
    print("\n[PROVEDORES] Disponíveis:")
    for name, provider in banking.providers.items():
        print(f"  - {name}")
    
    print("\n[COMO USAR]")
    print("  1. Configure suas credenciais no config.json")
    print("  2. Use banking.create_pix(valor, descrição) para criar cobrança")
    print("  3. Use banking.check_payment(id) para verificar pagamento")
    print("  4. Use banking.get_balance() para consultar saldo")
    
    print("\n" + "=" * 60)
    print("Banking API pronto! Configure suas credenciais para usar.")
    print("=" * 60)
