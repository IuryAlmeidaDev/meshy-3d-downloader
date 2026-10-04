import io
import os
import sys
from PIL import Image, ImageFilter, ImageEnhance
import pygltflib
import trimesh

def inspect_glb(glb_path):
    """Retorna informacoes detalhadas sobre o modelo 3D."""
    if not os.path.exists(glb_path):
        return {"error": "Arquivo nao encontrado"}

    size_mb = os.path.getsize(glb_path) / (1024 * 1024)
    gltf = pygltflib.GLTF2().load(glb_path)
    
    total_vertices = 0
    total_triangles = 0
    for mesh in gltf.meshes:
        for prim in mesh.primitives:
            if prim.attributes.POSITION is not None:
                total_vertices += gltf.accessors[prim.attributes.POSITION].count
            if prim.indices is not None:
                total_triangles += gltf.accessors[prim.indices].count // 3

    texture_info = []
    for i, img in enumerate(gltf.images):
        texture_info.append({
            "index": i,
            "name": img.name or f"texture_{i}",
            "mime": img.mimeType
        })

    return {
        "path": glb_path,
        "size_mb": round(size_mb, 2),
        "vertices": total_vertices,
        "triangles": total_triangles,
        "textures_count": len(gltf.images),
        "textures": texture_info
    }

def upscale_textures_to_4k(glb_path, output_path=None, target_res=4096):
    """
    Extrai as texturas do modelo GLB, aplica upscaling para 4K (4096x4096)
    com aumento de nitidez e realce de micro-detalhes, e salva o GLB atualizado.
    """
    if not output_path:
        base, ext = os.path.splitext(glb_path)
        output_path = f"{base}_4K{ext}"

    print(f"[*] Carregando modelo: {glb_path}...")
    gltf = pygltflib.GLTF2().load(glb_path)

    if not gltf.images:
        print("[!] Este modelo nao possui texturas de imagem embutidas (e uma escultura de geometria pura).")
        print(f"[*] Geometria ja esta em ultra-definicao!")
        return glb_path

    print(f"[*] Encontradas {len(gltf.images)} texturas. Iniciando Upscale para {target_res}x{target_res} (4K)...")

    # Garante que os buffers estao decodificados
    gltf.convert_buffers(pygltflib.BufferFormat.BINARYBLOB)

    for i, img in enumerate(gltf.images):
        try:
            # Obtem os bytes da imagem
            img_data = gltf.get_data_from_buffer_uri(img.uri) if img.uri else None
            if not img_data and img.bufferView is not None:
                bv = gltf.bufferViews[img.bufferView]
                buffer_data = gltf.binary_blob()
                start = bv.byteOffset or 0
                end = start + bv.byteLength
                img_data = buffer_data[start:end]

            if not img_data:
                continue

            # Abre com Pillow
            orig_img = Image.open(io.BytesIO(img_data)).convert("RGBA")
            orig_w, orig_h = orig_img.size
            print(f"  -> Textura {i}: Resolução original: {orig_w}x{orig_h}")

            if orig_w >= target_res and orig_h >= target_res:
                print(f"     Ja esta em 4K ou superior ({orig_w}x{orig_h}). Mantendo.")
                continue

            # Upscale usando Lanczos de alta precisao
            upscaled = orig_img.resize((target_res, target_res), Image.Resampling.LANCZOS)

            # Aplica Unsharp Mask para recuperar bordas e micro-detalhes
            sharpened = upscaled.filter(ImageFilter.UnsharpMask(radius=2, percent=130, threshold=3))

            # Leve ganho de contraste para realce visual
            enhancer = ImageEnhance.Contrast(sharpened)
            enhanced = enhancer.enhance(1.05)

            # Salva de volta para PNG comprimido
            out_io = io.BytesIO()
            enhanced.save(out_io, format="PNG", optimize=True)
            new_bytes = out_io.getvalue()

            # Atualiza o GLTF
            gltf.set_image(img, new_bytes, mime_type="image/png")
            print(f"     [+] Upscale concluido: {target_res}x{target_res} (4K)")

        except Exception as e:
            print(f"  [!] Erro ao processar textura {i}: {e}")

    print(f"[*] Salvando modelo final 4K em: {output_path}...")
    gltf.save(output_path)
    print(f"[OK] Modelo 4K salvo com sucesso! ({os.path.getsize(output_path) / (1024*1024):.2f} MB)")
    return output_path

def convert_to_stl(glb_path, output_stl_path=None):
    """Converte o GLB para formato STL binario (pronto para impressao 3D)."""
    if not output_stl_path:
        base, _ = os.path.splitext(glb_path)
        output_stl_path = f"{base}.stl"

    print(f"[*] Convertendo {glb_path} para STL (Impressao 3D)...")
    mesh = trimesh.load(glb_path, force="mesh")
    mesh.export(output_stl_path, file_type="stl")
    print(f"[OK] Arquivo STL gerado: {output_stl_path} ({os.path.getsize(output_stl_path) / (1024*1024):.2f} MB)")
    return output_stl_path

def convert_to_obj(glb_path, output_obj_path=None):
    """Converte o GLB para formato OBJ + MTL (compativel com jogos e softwares 3D)."""
    if not output_obj_path:
        base, _ = os.path.splitext(glb_path)
        output_obj_path = f"{base}.obj"

    print(f"[*] Convertendo {glb_path} para OBJ...")
    mesh = trimesh.load(glb_path)
    mesh.export(output_obj_path, file_type="obj")
    print(f"[OK] Arquivo OBJ gerado: {output_obj_path}")
    return output_obj_path

if __name__ == "__main__":
    test_file = r"C:\Users\iuryc\Downloads\modelo_meshy_1791144671754.glb"
    if os.path.exists(test_file):
        info = inspect_glb(test_file)
        print("=== INFORMACOES DO MODELO ===")
        print(f"Arquivo: {info['path']}")
        print(f"Tamanho: {info['size_mb']} MB")
        print(f"Vertices: {info['vertices']:,}")
        print(f"Triangulos: {info['triangles']:,}")
        print(f"Texturas: {info['textures_count']}")
