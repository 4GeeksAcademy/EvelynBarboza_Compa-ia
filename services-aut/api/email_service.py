import json
import os
import urllib.request


RESEND_API_KEY = os.getenv("RESEND_API_KEY")
RESEND_FROM_EMAIL = os.getenv(
    "RESEND_FROM_EMAIL",
    "onboarding@resend.dev"
)


def send_reset_email(to_email: str, reset_link: str) -> None:
    html = f"""
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Restablecer contrasena</h2>
        <p>
            Recibimos una solicitud para restablecer tu contrasena.
            Si fuiste vos, hace clic en el siguiente enlace:
        </p>
        <p>
            <a href="{reset_link}" style="color: #2563eb;">
                Restablecer mi contrasena
            </a>
        </p>
        <p>Este enlace vence en 30 minutos.</p>
        <p>Si no solicitaste esto, podes ignorar este email.</p>
    </div>
    """

    payload = json.dumps({
        "from": RESEND_FROM_EMAIL,
        "to": [to_email],
        "subject": "Restablecer tu contrasena",
        "html": html
    }).encode("utf-8")

    request = urllib.request.Request(
        "https://api.resend.com/emails",
        data=payload,
        method="POST",
        headers={
            "Authorization": f"Bearer {RESEND_API_KEY}",
            "Content-Type": "application/json",
            # Cloudflare bloquea el User-Agent por defecto de urllib.
            "User-Agent": "Mozilla/5.0"
        }
    )

    with urllib.request.urlopen(request) as response:
        response.read()
