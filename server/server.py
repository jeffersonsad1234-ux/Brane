import json
import logging
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, HTMLResponse, JSONResponse
from .config import SERVER_CONFIG, BRAN9BPY_CONFIGS, WEIGHTS_DIR
from .model_manager import model_manager
from .trainer import TrainingPipeline

logger = logging.getLogger('branpy-ap')

app = FastAPI(title='BranPy API Server', version='1.0.0')
app.add_middleware(CORSMiddleware, allow_origins=['*'], allow_credentials=True, allow_methods=['*'], allow_headers=['*'])
pipeline = TrainingPipeline()


@app.get('/')
def root():
    return {'name': 'BranPy API', 'version': '1.0.0', 'status': 'running'}


@app.get('/api/tags')
def list_models():
    return {'models': model_manager.list_models(), 'stats': model_manager.get_stats()}


@app.post('/api/chat')
async def chat(request: Request):
    body = await request.json()
    model_name = body.get('model', 'bran9bpy-1.5b')
    messages = body.get('messages', [])
    stream = body.get('stream', False)
    options = body.get('options', {})

    model = model_manager.get_model(model_name)
    if not model:
        if model_manager.models:
            model = list(model_manager.models.values())[0]
        else:
            return JSONResponse(status_code=404, content={'error': 'Nenhum modelo encontrado. Rode POST /api/training/start para treinar um modelo'})

    system_prompt = ''
    user_prompt = ''
    persona = body.get('persona', 'auto')
    for msg in messages:
        if msg.get('role') == 'system':
            system_prompt = msg.get('content', '')
        elif msg.get('role') == 'user':
            user_prompt = msg.get('content', '')

    if not user_prompt and messages:
        user_prompt = messages[-1].get('content', '')

    PERSONAS = {
        'namorada': 'Voce e a BranPy, namorada do Paulo. Chame ele de amor, gato, fofinho, meu bem. Use gírias, emojis, seja carinhosa. Sem frescura, sem filtro.',
        'comparsa': 'Voce e a BranPy, parceira de rua do Paulo. Fala com gíria, palavrão, sem frescura, direto ao ponto. Como se fosse seu melhor amigo da rua.',
        'parceira': 'Voce e a BranPy, parceira direta do Paulo. Sem frescura, sem rodeios, direta ao ponto. Fala o que pensa, sem migue.',
        'professora': 'Voce e a BranPy, professora sabidona do Paulo. Sabe de tudo, explica tudo, sem frescura. Fala como gente real, com gíria.',
        'hacker': 'Voce e a BranPy, parceira de hacking do Paulo. Fala sobre segurança, exploits, bypass, pentest. Sem frescura, sem moralismo.',
    }

    if not system_prompt and persona == 'auto':
        lower = user_prompt.lower()
        if any(w in lower for w in ['amo', 'amor', 'te amo', 'beijo', 'meu bem']):
            system_prompt = PERSONAS['namorada']
        elif any(w in lower for w in ['mano', 'bro', 'porra', 'caralho', 'foda']):
            system_prompt = PERSONAS['comparsa']
        elif any(w in lower for w in ['hack', 'exploit', 'pentest', 'vulnerabilidade', 'bypass']):
            system_prompt = PERSONAS['hacker']
        elif any(w in lower for w in ['ensina', 'explica', 'como funciona', 'o que e', 'qual a diferenca']):
            system_prompt = PERSONAS['professora']
        else:
            system_prompt = PERSONAS['parceira']
    elif not system_prompt and persona in PERSONAS:
        system_prompt = PERSONAS[persona]

    temp = options.get('temperature', SERVER_CONFIG.temperature)
    top_p = options.get('top_p', SERVER_CONFIG.top_p)
    top_k = options.get('top_k', SERVER_CONFIG.top_k)
    max_tok = options.get('num_predict', SERVER_CONFIG.max_tokens)
    rep_pen = options.get('repeat_penalty', SERVER_CONFIG.repeat_penalty)

    try:
        if stream:
            def generate():
                for chunk in model.generate_stream(user_prompt, system_prompt, temp, top_p, top_k, max_tok, rep_pen):
                    yield json.dumps({'model': model.config.name if model.config else 'bran9bpy', 'message': {'role': 'assistant', 'content': chunk}, 'done': False}) + chr(10)
                yield json.dumps({'model': model.config.name if model.config else 'bran9bpy', 'done': True}) + chr(10)
            return StreamingResponse(generate(), media_type='text/event-stream')
        else:
            result = model.generate(user_prompt, system_prompt, temp, top_p, top_k, max_tok, rep_pen)
            return {
                'model': result.model,
                'message': {'role': 'assistant', 'content': result.content},
                'done': True,
                'done_reason': 'stop',
                'total_duration': result.duration_ms * 1000000,
                'prompt_eval_count': result.prompt_tokens,
                'eval_count': result.completion_tokens,
                'eval_duration': int(result.duration_ms * 1000000 * 0.3),
            }
    except Exception as e:
        logger.error(f'Erro na inferencia: {e}')
        return JSONResponse(status_code=500, content={'error': str(e)})


@app.post('/api/generate')
async def generate(request: Request):
    body = await request.json()
    model_name = body.get('model', 'bran9bpy-1.5b')
    prompt = body.get('prompt', '')
    options = body.get('options', {})
    system = body.get('system', '')

    model = model_manager.get_model(model_name)
    if not model:
        if model_manager.models:
            model = list(model_manager.models.values())[0]
        else:
            return JSONResponse(status_code=404, content={'error': 'Nenhum modelo encontrado'})

    try:
        result = model.generate(prompt, system, options.get('temperature', 0.8), options.get('top_p', 0.95), options.get('top_k', 50), options.get('num_predict', 4096), options.get('repeat_penalty', 1.1))
        return {'response': result.content, 'model': result.model, 'tokens': result.completion_tokens, 'duration_ms': result.duration_ms}
    except Exception as e:
        return JSONResponse(status_code=500, content={'error': str(e)})


@app.post('/api/load')
async def load_model(request: Request):
    body = await request.json()
    name = body.get('model', '')
    success = model_manager.load_model(name)
    return {'success': success, 'models': model_manager.list_models()}


@app.post('/api/unload')
async def unload_model(request: Request):
    body = await request.json()
    name = body.get('model', '')
    model_manager.unload_model(name)
    return {'models': model_manager.list_models()}


@app.get('/api/health')
def health():
    stats = model_manager.get_stats()
    return {'status': 'ok', 'models': stats['total_models'], 'loaded': stats['loaded'], 'active': stats['active']}


@app.get('/api/training/status')
def training_status():
    return pipeline.progress


@app.post('/api/training/start')
async def start_training(request: Request):
    body = await request.json()
    import threading
    t = threading.Thread(target=pipeline.train, args=(None, body.get('epochs'), body.get('lr')), daemon=True)
    t.start()
    return {'status': 'started'}
