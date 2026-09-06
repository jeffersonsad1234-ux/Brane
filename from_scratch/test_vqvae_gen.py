import sys, os, torch
sys.path.insert(0, r'D:\BRANPY-AI\from_scratch')
from vqvae import create_vqvae

save_dir = r'D:\BRANPY-AI\from_scratch\weights\vqvae_128'
ckpt = torch.load(os.path.join(save_dir, 'model_best.pt'), map_location='cpu', weights_only=False)
model = create_vqvae('small')
model.load_state_dict(ckpt['model_state_dict'], strict=False)
model.eval()

loss = ckpt.get('loss', 0)
print(f'Loss do modelo: {loss:.4f}')

with torch.no_grad():
    gen = model.generate(n_samples=6)
    for i, img in enumerate(gen):
        img = (img.permute(1, 2, 0) + 1) / 2 * 255
        img = img.clamp(0, 255).byte()
        path = os.path.join(save_dir, f'test_gen_{i}.ppm')
        with open(path, 'wb') as f:
            f.write(f'P6\n128 128\n255\n'.encode())
            for y in range(128):
                for x in range(128):
                    r, g, b = img[y, x].tolist()
                    f.write(bytes([r, g, b]))
        print(f'Gerada: {path}')

print('Pronto! Abra os .ppm com qualquer visualizador de imagem.')
