import json
import urllib.parse

def seed_registered_faces():
    path = 'firestore_local.json'
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    svg_template = """<svg xmlns="http://www.w3.org/2000/svg" width="260" height="260" viewBox="0 0 260 260">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e293b"/>
    </linearGradient>
    <linearGradient id="badgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#06b6d4"/>
      <stop offset="100%" stop-color="#3b82f6"/>
    </linearGradient>
  </defs>
  <rect width="260" height="260" fill="url(#bgGrad)" rx="16"/>
  <rect x="10" y="10" width="240" height="240" fill="none" stroke="rgba(6,182,212,0.4)" stroke-width="2" rx="12"/>
  <circle cx="130" cy="95" r="48" fill="#cbd5e1"/>
  <path d="M 50 230 C 50 170, 210 170, 210 230 Z" fill="#334155"/>
  <polygon points="130,190 110,165 150,165" fill="#f8fafc"/>
  <polygon points="126,185 134,185 136,230 124,230" fill="#0284c7"/>
  <circle cx="215" cy="45" r="18" fill="url(#badgeGrad)"/>
  <text x="215" y="51" fill="#ffffff" font-family="sans-serif" font-size="14" font-weight="bold" text-anchor="middle">✓</text>
  <rect x="25" y="212" width="210" height="24" fill="rgba(15,23,42,0.85)" rx="6"/>
  <text x="130" y="228" fill="#38bdf8" font-family="sans-serif" font-size="10" font-weight="bold" text-anchor="middle" letter-spacing="0.5">REGISTERED OFFICIAL PHOTO</text>
</svg>"""

    data_uri = 'data:image/svg+xml;utf8,' + urllib.parse.quote(svg_template)

    for v_id, voter in data.get('users', {}).items():
        if not voter.get('registered_face_image'):
            voter['registered_face_image'] = data_uri

    if 'VOTER-1006' in data.get('users', {}):
        data['users']['VOTER-1006']['voted'] = False
        data['users']['VOTER-1006']['eligible'] = True
        data['users']['VOTER-1006']['status'] = 'active'
        data['users']['VOTER-1006']['registered_face_image'] = data_uri

    # Also update biometric_templates for VOTER-1006
    if 'VOTER-1006' in data.get('biometric_templates', {}):
        data['biometric_templates']['VOTER-1006']['face_image_base64'] = data_uri

    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)

    print('Successfully seeded registered_face_image in firestore_local.json')

if __name__ == '__main__':
    seed_registered_faces()
