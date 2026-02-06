# Love Coupons

Документация по backend (авторизация + пользователи).

## База URL

По умолчанию backend слушает порт из `PORT` (см. `backend/.env`). Например:

```
http://localhost:3120
```

## Авторизация

Есть 2 эндпоинта: регистрация и логин. Оба возвращают одинаковую структуру ответа.

### Структура ответа (AuthResponse)

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "login": "user_login",
    "name": "User Name",
    "createdAt": "2026-02-02T12:34:56.789Z"
  },
  "accessToken": "jwt_access_token"
}
```

- `accessToken` — JWT токен доступа.
- `createdAt` приходит как строка в формате ISO.

### POST /auth/register

Создание аккаунта.

**Тело запроса:**

```json
{
  "email": "user@example.com",
  "login": "user_login",
  "name": "User Name",
  "password": "plain_password"
}
```

**Успешный ответ:** `201 Created` + `AuthResponse` (см. выше).

**Ошибки:**

- `409 Conflict` — логин или email уже существует.

**Пример:**

```bash
curl -X POST http://localhost:3120/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "login": "user_login",
    "name": "User Name",
    "password": "plain_password"
  }'
```

### POST /auth/login

Вход в систему.

**Тело запроса:**

```json
{
  "login": "user_login_or_email",
  "password": "plain_password"
}
```

- Поле `login` принимает **логин** или **email**.

**Успешный ответ:** `201 Created` + `AuthResponse` (см. выше).

**Ошибки:**

- `401 Unauthorized` — неверные логин/email или пароль.

**Пример:**

```bash
curl -X POST http://localhost:3120/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "login": "user_login_or_email",
    "password": "plain_password"
  }'
```

## Пользователи

### GET /users

Получить всех пользователей.

**Успешный ответ:** `200 OK` + массив пользователей.

```json
[
  {
    "id": "2d8a918e-3a13-4173-945e-ba8662cdfd99",
    "email": "bigteamer@yandex.ru",
    "login": "papaya",
    "name": "Владимир",
    "createdAt": "2026-02-02T09:17:26.372Z"
  },
  {
    "id": "237dee27-49ec-4b94-840d-314a3c7d91a3",
    "email": "okroshka@yandex.ru",
    "login": "okroshka",
    "name": "Кисечка",
    "createdAt": "2026-02-02T12:09:54.008Z"
  }
]
```

**Пример:**

```bash
curl http://localhost:3120/users
```

## Пары

Все эндпоинты раздела требуют авторизации (Bearer `accessToken` из `/auth/login` или `/auth/register`).

### Структура ответа (CoupleDto)

```json
{
  "id": "uuid",
  "firstUser": {
    "id": "uuid",
    "email": "first@example.com",
    "login": "first_login",
    "name": "First Name",
    "createdAt": "2026-02-02T12:34:56.789Z"
  },
  "secondUser": {
    "id": "uuid",
    "email": "second@example.com",
    "login": "second_login",
    "name": "Second Name",
    "createdAt": "2026-02-02T12:35:12.123Z"
  },
  "createdAt": "2026-02-02T12:40:00.000Z"
}
```

### GET /couples

Получить пару текущего пользователя.

**Успешный ответ:** `200 OK` + `CoupleDto` (см. выше).

**Ошибки:**

- `404 Not Found` — у пользователя нет пары.
- `401 Unauthorized` — невалидный или отсутствует токен.

**Пример:**

```bash
curl http://localhost:3120/couples \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### POST /couples/pair

Создать пару с другим пользователем по его `id`.

**Тело запроса:**

```json
{
  "coupleUser": "uuid_of_other_user"
}
```

**Успешный ответ:** `201 Created` + `CoupleDto` (см. выше).

**Ошибки:**

- `400 Bad Request` — если пытаетесь создать пару с самим собой.
- `404 Not Found` — второй пользователь не найден.
- `409 Conflict` — у одного из пользователей уже есть пара.
- `401 Unauthorized` — невалидный или отсутствует токен.

**Пример:**

```bash
curl -X POST http://localhost:3120/couples/pair \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "coupleUser": "uuid_of_other_user"
  }'
```

### POST /couples/unpair

Удалить текущую пару.

**Успешный ответ:** `201 Created` без тела ответа.

**Ошибки:**

- `404 Not Found` — пары не существует.
- `401 Unauthorized` — невалидный или отсутствует токен.

**Пример:**

```bash
curl -X POST http://localhost:3120/couples/unpair \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```
