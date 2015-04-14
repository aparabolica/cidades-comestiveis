## Shared Resources

### New resource

**Authentication needed**: be logged as user.

```
POST /api/v1/resources
```

#### Input

 - `categories`: *array* of category ids
 - `description`: *string* short explanation of resource
 - `available_at`: *date* formatted as [ISO 8601]
 - `expires_at`: *date* formatted as [ISO 8601]


#### Response

Status codes:
 - `201` Created successfully
 - `400` Bad request

On success, returns the created resource.

[back to index]

---

### Get resource

**Authentication needed**: none.

```
GET /api/v1/resources/:id
```

#### Options parameters

* populate_categories: any value passed will cause the response to include category objects.

#### Response

Object containing resource data

Status codes:
 - `200` Ok
 - `400` Bad request

Example:

```json
{
  "id": 1,
  "categories": [22,35,24],
  "location": [-12.5198127, -22.33232720]
}
```

[back to index]

---

### List resources

```
GET /api/v1/resources
```

#### Input filter parameters

  * `per_page`: _number_ default: 10. maximum: 20 (optional)
  * `page`: _number_ (optional)
  * `categories`: _string_ category ids, separated by comma

#### Response

Object containing resource data

Status codes:
 - `200` Ok
 - `400` Bad request

Response body:
 - `count` _int_
 - `per_page` _int_
 - `page` _int_
 - `data` _[resouce_id]_

(back to index)

---


### Update resource

**Authentication needed**: should be resource owner.

```
PUT /api/v1/resources/:id
```

#### Input parameters

- `categories`: *array* of category ids
- `description`: *string* short explanation of resource
- `available_at`: *date* formatted as [ISO 8601]
- `expires_at`: *date* formatted as [ISO 8601]

#### Response

Status codes:
 - `200` Ok
 - `400` Bad request
 - `401` Unauthorized
 - `404` Not found

On success, returns the updated resource.

[back to index]

### Delete resource

Authentication needed: must be resource owner or admin.

```
DELETE /api/v1/resources/:id
```

#### Response

Status codes:
 - `204` Deleted successfully
 - `401` Unauthorized
 - `404` Resource not found

 [back to index]

[back to index]: #index

[ISO 8601]: https://en.wikipedia.org/wiki/ISO_8601
