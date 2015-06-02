# API Reference

# Index

  * [User](#users): [new](#new-user), [update](#update-user), [get](#get-user), [list](#list-users)
  * Land: new, get, list, update, delete
  * Resources: new, get, list, update, delete
  * Resource categories: new, get, list, update, delete
  * Initiatives: new, get, list, update, delete

---

# Users routes

## New user

```
POST /api/v1/users
```

### Parameters

 - `name`: *string* User name
 - `email`: *string* User e-mail
 - `password`: *string* Password
 - `longitude`: *number* User longitude *(optional)*
 - `latitude`: *number* User latitude *(optional)*


### Possible responses

#### **Success**
  * Status: `201 (created)`
  * Response has created user as JSON:  
    ```json
    {
      "_id": 1,
      "name": "João da Silva",
      "location": [-3.53198127, -10.3964720]
    }
    ```

#### **Failure**
  * Status: `400 (bad request)`
  * Response includes errors as JSON


[back to index]

---


## Update user

**Authentication needed**: logged with same user id.

```
PUT /api/v1/users/:id
```

### Parameters

 - `name`: *string* User name *(optional)*
 - `currentPassword`: *string* Old password *(needed if new password is present)*
 - `password`: *string* New password *(optional)*
 - `longitude`: *number* User longitude *(optional)*
 - `latitute`: *number* User latitude *(optional)*

### Response

Status codes:
 - `200` Ok
 - `400` Bad request
 - `401` Unauthorized
 - `404` Not found

On success, returns the updated user.

[back to index]

---

## Get user

```
GET /api/v1/users/:id
```

### Parameters

This route doesn't accept parameters.

### Possible responses

#### **Success**
  * Status: `200 (OK)`
  * Response has user as JSON:  

#### **Failure**
  * Status: `400 (bad request)`
  * Response includes errors as JSON

#### **Not found**
  * Status: `404 (not found)`
  * Response includes errors as JSON

[back to index]

---

## Get user contributions

```
GET /api/v1/users/:id/contributions
```

### Parameters

This route doesn't accept parameters.

### Possible responses

* `200` status and JSON as example:

```javascript
{
  contributions: [ (area, resources and initiatives objects) ]
}
```
* 400 (bad request) and errors
* 404 (not found)

[back to index]

---

## List users

```
GET /api/v1/users
```

### Parameters

  - `perPage`: _number_ (default: 10)
  - `page`: _number_ (optional)

### Response

### Possible responses

#### **Success**
  * Status: `200 (OK)`
  * Response has pagination parameters and user list:

    ```javascript
    {
      count: 26,
      perPage: 10,
      page: 2,
      users: [{
        _id: 33,
        name: 'Mariazinha'
      },{
        _id: 55,
        name: 'Joãozinho'
      }]
    }
    ```

#### **Failure**
  * Status: `400 (bad request)`
  * Response includes errors as JSON

#### **Not found**
  * Status: `404 (not found)`
  * Response includes errors as JSON

[back to index]

[back to index]: #index

# Areas routes

## New area

```
POST /api/v1/areas/
```

### Parameters

 - `address` (*string*, ***required***)
 - `description` (*string*)
 - `geometry` (*[geojson]*)

### Responses

* `201` status + Area JSON object;
* `400` status + Error messages;

[back to index]

---

## Show area

```
GET /api/v1/areas/:area_id
```

Parameters:

* `area_id` (*integer,* ***required***)

### Responses

* `200` status + Area JSON object;
* `404` not found

[back to index]

---

## Udpate area

An area can updated by its creator or  admins.

```
PUT /api/v1/areas/:area_id
```

### Parameters

 - `address` (*string*, ***required***)
 - `description` (*string*)
 - `geometry` (*[geojson]*)

### Responses

* `200` (success) + Area JSON object;
* `400` (bad request) + Error messages;
* `401` (unauthorized);

[back to index]

---

## List areas

```
GET /api/v1/areas
```

Parameters:


* `page` (*integer*, default: `1`)
* `perPage` (*integer*, default: `30`, maximum: `100`)

Posible responses:

* `200` status and JSON as example:

```javascript
{
  count: 232,
  page: 3,
  perPage: 30
  areas: [ (area objects) ]
}
```

* `400` status for malformed parameters

[back to index]

# Initiatives routes

## New area

```
POST /api/v1/areas/
```

### Parameters

 - `name` (*string*, ***required***)
 - `description` (*string*)
 - `website` (*string*)
 - `facebook` (*string*)
 - `areas` (*[:area_id]*)

### Responses

* `201` status + Area JSON object;
* `400` status + Error messages;

[back to index]

---

## Show initiative

```
GET /api/v1/initiatives/:initiative_id
```

Parameters:

* `initiative_id` (*integer,* ***required***)

### Responses

* `200` status + Area JSON object;
* `404` not found

[back to index]

---

## Udpate initiative

An initiative can updated by its creator or admins.

```
PUT /api/v1/initiatives/:initiative_id
```

### Parameters

- `name` (*string*, ***required***)
- `description` (*string*)
- `website` (*string*)
- `facebook` (*string*)
- `areas` (*[:area_id]*)

### Responses

* `200` (success) + Area JSON object;
* `400` (bad request) + Error messages;
* `401` (unauthorized);

[back to index]

---

## List initiatives

```
GET /api/v1/initiatives
```

Parameters:


* `page` (*integer*, default: `1`)
* `perPage` (*integer*, default: `30`, maximum: `100`)

Posible responses:

* `200` status and JSON as example:

```javascript
{
  count: 232,
  page: 3,
  perPage: 30
  initiatives: [ (initiative objects) ]
}
```

* `400` status for malformed parameters

[back to index]

---

# Resource routes

## New resource

```
POST /api/v1/resource/
```

### Parameters

- `name` (*string*, ***required***)
- `description` (*string*)
- `category` (`['Supply', 'Tool', 'Knowledge', 'Work']`)

### Responses

* `201` status + Area JSON object;
* `400` status + Error messages;

[back to index]

---

## Show resource type

```
GET /api/v1/resources/:id
```

Parameters:

* `:id` (*integer,* ***required***)

### Responses

* `200` status + Area JSON object;
* `404` not found

[back to index]

---

## Udpate resource

```
PUT /api/v1/resource_types/:id
```

### Parameters

- `name` (*string*, ***required***)
- `description` (*string*)
- `category` (`['Supply', 'Tool', 'Knowledge', 'Work']`)

### Responses

* `200` (success) + Area JSON object;
* `400` (bad request) + Error messages;
* `401` (unauthorized);

[back to index]

---

## List resource

```
GET /api/v1/resource
```

Parameters:


* `page` (*integer*, default: `1`)
* `perPage` (*integer*, default: `30`, maximum: `100`)

Posible responses:

* `200` status and JSON as example:

```javascript
{
  count: 232,
  page: 3,
  perPage: 30
  resource: [ (resource types objects) ]
}
```

* `400` status for malformed parameters

[back to index]


[geojson]: http://geojson.org/geojson-spec.html
