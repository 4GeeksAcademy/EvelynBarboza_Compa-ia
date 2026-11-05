from getpass import getpass

from auth_data import get_all_users, get_user_by_email, update_user
from users import UserCreate, register


def main():
    if any(user["role"] == "admin" and user["is_active"] for user in get_all_users()):
        raise SystemExit("Ya existe un administrador activo. Usa esa cuenta para crear empleados.")

    email = input("Email del primer administrador: ").strip()
    existing = get_user_by_email(email)
    if existing:
        confirmation = input("La cuenta ya existe. Escribe ADMIN para promoverla: ")
        if confirmation != "ADMIN":
            raise SystemExit("Operacion cancelada.")
        if not existing["is_active"]:
            raise SystemExit("La cuenta esta inactiva; revisa su estado antes de promoverla.")
        update_user(existing["id"], {"role": "admin"})
    else:
        name = input("Nombre: ").strip()
        phone = input("Telefono: ").strip()
        password = getpass("Contrasena (minimo 8 caracteres): ")
        if len(password) < 8 or password != getpass("Repite la contrasena: "):
            raise SystemExit("La contrasena no cumple el minimo o no coincide.")
        result = register(UserCreate(email=email, password=password, name=name, phone=phone))
        update_user(result["user"]["id"], {"role": "admin"})

    print("Administrador preparado. Ya puedes iniciar sesion en el backoffice.")


if __name__ == "__main__":
    main()
