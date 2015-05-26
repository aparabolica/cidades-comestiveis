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
POST /api/v1/area
```

### Parameters

 - `address` (*string*, ***required***)
 - `description` (*string*)
 - `geometry` (*[geojson]*)

### Responses

* `201` success
* `400` bad request

[back to index]

---

[geojson]: http://geojson.org/geojson-spec.html
