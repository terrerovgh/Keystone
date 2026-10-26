"""Descarga solo los PDF oficiales del catálogo y registra su integridad, sin alterar su contenido."""
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from hashlib import sha256
from pathlib import Path
from urllib.request import Request, urlopen
import json
import zipfile

root = Path(__file__).resolve().parent.parent
catalog_path = root / 'public/legal/catalog.json'
catalog = json.loads(catalog_path.read_text())

def archive(item):
    if 'localPath' not in item:
        return
    destination = root / 'public' / item['localPath'].lstrip('/')
    try:
        request = Request(item['url'], headers={'User-Agent': 'KeystoneStudio-Documentation/1.0'})
        with urlopen(request, timeout=40) as response:
            payload = response.read(20_000_001)
            resolved = response.url
        if len(payload) > 20_000_000 or not payload.startswith(b'%PDF-'):
            raise ValueError('La respuesta no es un PDF admitido')
        destination.write_bytes(payload)
        item.update(sha256=sha256(payload).hexdigest(), bytes=len(payload), resolvedUrl=resolved,
                    retrievedAt=datetime.now(timezone.utc).isoformat(), archiveStatus='archived')
        item.pop('archiveError', None)
        print(item['id'], len(payload), 'bytes')
    except Exception as error:
        item['archiveStatus'] = 'unavailable'
        item['archiveError'] = str(error)
        # Una descarga fallida no se presenta como una copia válida.
        item.pop('sha256', None)
        item.pop('bytes', None)
        destination.unlink(missing_ok=True)
        print(item['id'], 'NO ARCHIVADO:', error)

with ThreadPoolExecutor(max_workers=4) as executor:
    list(executor.map(archive, catalog['documents']))
catalog_path.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + '\n')
with zipfile.ZipFile(root / 'public/legal/expediente-oficial.zip', 'w', zipfile.ZIP_DEFLATED) as package:
    package.write(catalog_path, 'catalog.json')
    for item in catalog['documents']:
        if item.get('archiveStatus') == 'archived':
            package.write(root / 'public' / item['localPath'].lstrip('/'), Path(item['localPath']).name)
    guide = root / 'docs/legal-and-compliance.md'
    if guide.exists():
        package.write(guide, 'LEEME.md')
