# Test Credentials - BRANE

## Local (test environment) Admin
- **Email**: admin@brane.com
- **Senha**: Admin123!
- **Role**: admin

## Local Test Buyer (used for permission/notification tests)
- **Email**: buyer.test.permission@example.com
- **Senha**: Test1234!
- **Role**: buyer

## Production Admin (MongoDB Atlas via Railway)
- **Email**: admin@brane.com
- **Senha**: Admin123!@#
- **Role**: admin
- **User ID**: user_6d98bdcaf5d7

## MongoDB Atlas
- **Cluster**: cluster0.f2m0c4y.mongodb.net
- **Database**: brane_db
- **User**: brane_user
- **Password**: Simple2026pass
- **Connection String**: 
  `mongodb+srv://brane_user:Simple2026pass@cluster0.f2m0c4y.mongodb.net/brane_db?retryWrites=true&w=majority`

## Backend Railway (Production)
- **URL**: https://brane-production-3c87.up.railway.app
- **Status**: ONLINE
- **JWT_SECRET**: BraneJWT2026Secure

## Frontend Cloudflare
- **REACT_APP_BACKEND_URL**: https://brane-production-3c87.up.railway.app (sem /api no final)

## Observação importante
- Ao criar uma loja com a conta admin, o backend altera o role de `admin` para `seller`. 
  Para ações administrativas posteriores, restaurar via DB:
  `db.users.update_one({'email':'admin@brane.com'}, {'$set':{'role':'admin'}})`
