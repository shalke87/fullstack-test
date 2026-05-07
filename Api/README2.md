# Entries integration

## APIs

### Create Entry

#### Create an entry (any logged user)

```js
POST /entries
```

**Auth:** required  
**Permissions:** any authenticated user

**Body:**
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| type | string | yes | `income` or `expense` |
| amount | number | yes | min 0 |
| description | string | yes | max 256 chars |
| date | string | yes | ISO 8601 format |

**Response 201:**
```json
{
  "_id": "...",
  "type": "expense",
  "amount": 150,
  "description": "Pranzo di lavoro",
  "date": "2026-05-03T00:00:00.000Z",
  "user": { "id": "..." },
  "createdAt": "...",
  "updatedAt": "..."
}
```

**Errors:** `400` validation error, `401` unauthorized

---

### Read all entries

#### Get all entries (filtered by role)

```js
GET /entries
```

**Auth:** required  
**Permissions:** superuser sees all, admin sees company entries, user sees own entries

**Query params:**
| Param | Type | Notes |
|-------|------|-------|
| limit | number | items per page |
| sorter | string | field to sort by, e.g. `-createdAt` |
| nextKey | string | cursor for pagination |

**Response 200:** array of entries

**Errors:** `401` unauthorized, `403` forbidden

---

### Read Entry

#### Get an entry by id

```js
GET /entries/:entryId
```

**Auth:** required  
**Permissions:** superuser, admin of same company, owner of the entry

**Response 200:**
```json
{
  "_id": "...",
  "type": "expense",
  "amount": 150,
  "description": "Pranzo di lavoro",
  "date": "2026-05-03T00:00:00.000Z",
  "user": { "id": "...", "fullname": "..." },
  "company": { "id": "...", "name": "..." },
  "createdAt": "...",
  "updatedAt": "..."
}
```

**Errors:** `401` unauthorized, `404` not found

---

### Update Entry

#### Update an entry by id

```js
PATCH /entries/:entryId
```

**Auth:** required  
**Permissions:** superuser, admin of same company, owner of the entry

**Body:**
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| type | string | no | `income` or `expense` |
| amount | number | no | min 0 |
| description | string | no | max 256 chars |
| date | string | no | ISO 8601 format |

**Response 200:** updated entry object

**Errors:** `400` validation error, `401` unauthorized, `404` not found

---

### Delete Entry

#### Delete an entry by id

```js
DELETE /entries/:entryId
```

**Auth:** required  
**Permissions:** superuser, admin of same company, owner of the entry

**Response 200:**
```json
{ "message": "Entry deleted successfully" }
```

**Errors:** `401` unauthorized or insufficient permissions, `404` not found