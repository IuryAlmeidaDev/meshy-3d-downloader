import io
import os
import sys
from PIL import Image, ImageFilter, ImageEnhance
import pygltflib
import trimesh

try:
    import fast_simplification
except ImportError:
    fast_simplification = None

DOWNLOADS_DIR = os.path.join(os.path.expanduser("~"), "Downloads")

def inspect_glb(glb_path):
    """Retorna informacoes detalhadas sobre geometria e texturas do modelo 3D."""
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
    com aumento de nitidez (Unsharp Mask) e realce de micro-detalhes.
    """
    if not output_path:
        base, ext = os.path.splitext(glb_path)
        output_path = f"{base}_4K{ext}"

    print(f"[*] Carregando modelo: {glb_path}...")
    gltf = pygltflib.GLTF2().load(glb_path)

    if not gltf.images:
        return {
            "status": "warning",
            "message": "Este modelo nao possui texturas 2D (e uma escultura de geometria pura). A geometria ja esta na definicao maxima!",
            "output": glb_path
        }

    print(f"[*] Encontradas {len(gltf.images)} texturas. Iniciando Upscale para {target_res}x{target_res} (4K)...")
    gltf.convert_buffers(pygltflib.BufferFormat.BINARYBLOB)

    for i, img in enumerate(gltf.images):
        try:
            img_data = gltf.get_data_from_buffer_uri(img.uri) if img.uri else None
            if not img_data and img.bufferView is not None:
                bv = gltf.bufferViews[img.bufferView]
                buffer_data = gltf.binary_blob()
                start = bv.byteOffset or 0
                end = start + bv.byteLength
                img_data = buffer_data[start:end]

            if not img_data:
                continue

            orig_img = Image.open(io.BytesIO(img_data)).convert("RGBA")
            orig_w, orig_h = orig_img.size

            if orig_w >= target_res and orig_h >= target_res:
                continue

            upscaled = orig_img.resize((target_res, target_res), Image.Resampling.LANCZOS)
            sharpened = upscaled.filter(ImageFilter.UnsharpMask(radius=2, percent=130, threshold=3))
            enhancer = ImageEnhance.Contrast(sharpened)
            enhanced = enhancer.enhance(1.05)

            out_io = io.BytesIO()
            enhanced.save(out_io, format="PNG", optimize=True)
            new_bytes = out_io.getvalue()

            gltf.set_image(img, new_bytes, mime_type="image/png")
            print(f"  [+] Textura {i} upscaled para 4K ({target_res}x{target_res})")
        except Exception as e:
            print(f"  [!] Erro na textura {i}: {e}")

    gltf.save(output_path)
    size_mb = os.path.getsize(output_path) / (1024 * 1024)
    return {
        "status": "success",
        "output": output_path,
        "size_mb": round(size_mb, 2),
        "message": f"Texturas aumentadas para 4K com sucesso ({size_mb:.2f} MB)!"
    }

def optimize_for_games(glb_path, target_faces=25000, output_path=None):
    """
    Reduz a contagem de poligonos (decimacao inteligente) para jogos (Roblox, Unity, Godot).
    Transforma malhas pesadas de milhoes de faces em versoes super leves preservando silhueta.
    """
    if not output_path:
        base, ext = os.path.splitext(glb_path)
        output_path = f"{base}_LowPoly_{target_faces // 1000}k{ext}"

    print(f"[*] Otimizando {glb_path} para Jogos (Alvo: {target_faces:,} faces)...")
    mesh = trimesh.load(glb_path, force="mesh")
    orig_faces = len(mesh.faces)

    if orig_faces <= target_faces:
        return {
            "status": "info",
            "message": f"O modelo ja possui poucas faces ({orig_faces:,}), nao precisa de reducao.",
            "output": glb_path
        }

    try:
        # Usa fast_simplification com Quadric Error Metric
        simplified = mesh.simplify_quadric_decimation(face_count=target_faces)
        simplified.export(output_path)
        new_size_mb = os.path.getsize(output_path) / (1024 * 1024)
        print(f"[OK] Otimizado: {orig_faces:,} -> {len(simplified.faces):,} faces ({new_size_mb:.2f} MB)")
        return {
            "status": "success",
            "output": output_path,
            "orig_faces": orig_faces,
            "new_faces": len(simplified.faces),
            "size_mb": round(new_size_mb, 2),
            "message": f"Otimizado com sucesso: {orig_faces:,} -> {len(simplified.faces):,} faces!"
        }
    except Exception as e:
        return {"status": "error", "message": f"Erro na otimizacao: {str(e)}"}

def repair_for_3d_print(glb_path, output_stl_path=None):
    """
    Repara e valida a geometria para impressao 3D:
    - Fecha buracos abertos (Watertight / Manifold)
    - Corrige normais invertidas
    - Remove vertices e faces degeneradas
    - Salva como STL binario pronto para fatiamento
    """
    if not output_stl_path:
        base, _ = os.path.splitext(glb_path)
        output_stl_path = f"{base}_Reparado_3DPrint.stl"

    print(f"[*] Reparando modelo para Impressao 3D: {glb_path}...")
    mesh = trimesh.load(glb_path, force="mesh")

    was_watertight = mesh.is_watertight
    mesh.update_faces(mesh.nondegenerate_faces())
    mesh.update_faces(mesh.unique_faces())
    trimesh.repair.fill_holes(mesh)
    trimesh.repair.fix_normals(mesh)
    trimesh.repair.fix_winding(mesh)

    is_watertight_now = mesh.is_watertight
    mesh.export(output_stl_path, file_type="stl")
    size_mb = os.path.getsize(output_stl_path) / (1024 * 1024)

    status_str = "Totalmente Estanque (100% Watertight)" if is_watertight_now else "Melhorado para impressao"
    print(f"[OK] STL Reparado: {output_stl_path} | {status_str} | {size_mb:.2f} MB")

    return {
        "status": "success",
        "output": output_stl_path,
        "was_watertight": was_watertight,
        "is_watertight": is_watertight_now,
        "size_mb": round(size_mb, 2),
        "message": f"Modelo reparado e salvo em STL ({status_str})!"
    }

def split_mesh_parts(glb_path, output_dir=None):
    """
    Identifica ilhas geometricas desconectadas e divide o modelo em arquivos separados
    (ex: base, personagem, armas, acessorios).
    """
    base_name = os.path.splitext(os.path.basename(glb_path))[0]
    if not output_dir:
        output_dir = os.path.join(DOWNLOADS_DIR, f"{base_name}_pecas")

    os.makedirs(output_dir, exist_ok=True)
    print(f"[*] Separando pecas desconectadas de {glb_path}...")

    mesh = trimesh.load(glb_path)
    parts = mesh.split() if hasattr(mesh, "split") else [mesh]

    if len(parts) <= 1:
        return {
            "status": "info",
            "message": "O modelo e uma peca solida unica (nao possui partes soltas para dividir).",
            "parts_count": 1
        }

    saved_files = []
    for i, part in enumerate(parts):
        part_path = os.path.join(output_dir, f"{base_name}_parte_{i + 1}.glb")
        part.export(part_path)
        saved_files.append(part_path)

    print(f"[OK] {len(parts)} pecas separadas salvas em: {output_dir}")
    return {
        "status": "success",
        "parts_count": len(parts),
        "output_dir": output_dir,
        "files": saved_files,
        "message": f"Modelo dividido em {len(parts)} pecas individuais com sucesso!"
    }

def convert_to_stl(glb_path, output_stl_path=None):
    """Converte o GLB para formato STL binario (pronto para impressao 3D)."""
    if not output_stl_path:
        base, _ = os.path.splitext(glb_path)
        output_stl_path = f"{base}.stl"

    mesh = trimesh.load(glb_path, force="mesh")
    mesh.export(output_stl_path, file_type="stl")
    size_mb = os.path.getsize(output_stl_path) / (1024 * 1024)
    return {
        "status": "success",
        "output": output_stl_path,
        "size_mb": round(size_mb, 2),
        "message": f"STL gerado com sucesso ({size_mb:.2f} MB)!"
    }

def convert_to_obj(glb_path, output_obj_path=None):
    """Converte o GLB para formato OBJ + MTL."""
    if not output_obj_path:
        base, _ = os.path.splitext(glb_path)
        output_obj_path = f"{base}.obj"

    mesh = trimesh.load(glb_path)
    mesh.export(output_obj_path, file_type="obj")
    return {
        "status": "success",
        "output": output_obj_path,
        "message": "OBJ gerado com sucesso!"
    }
