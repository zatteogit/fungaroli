"""Visible SVG geometry/paint fingerprint, unaffected by metadata updates."""
import hashlib
import json


def fingerprint(root):
    content=[]
    for group in root:
        if not group.get('data-part'):
            continue
        for node in group.iter():
            if node.tag.rsplit('}',1)[-1]in['path','ellipse','circle','polygon']:
                content.append({'part':group.get('data-part'),'tag':node.tag,'attributes':dict(sorted(node.attrib.items()))})
    return hashlib.sha256(json.dumps(content,sort_keys=True,separators=(',',':')).encode()).hexdigest()
