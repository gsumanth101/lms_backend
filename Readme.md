# SmartLMS Backend

This is the backend for the SmartLMS application. It provides APIs for managing users, faculties, courses, and universities.

## Table of Contents

- [Installation](#installation)
- [Configuration](#configuration)
- [Endpoints](#endpoints)
  - [Admin Endpoints](#admin-endpoints)
  - [User Endpoints](#user-endpoints)
  - [Faculty Endpoints](#faculty-endpoints)

## Installation

1. Clone the repository:
   ```sh
   git clone https://github.com/yourusername/smartlms-backend.git
   cd smartlms-backend



## Configuration
The application uses environment variables for configuration. Create a .env file in the root directory and add the following variables:

- JWT_SECRET: Secret key for JWT authentication.
- MONGODB_URI: MongoDB connection URI.
- EMAIL_USER: Email user for sending emails.
- EMAIL_PASS: Email password for sending emails.

## Endpoints
Admin Endpoints
Register Admin
URL: /admin/register
Method: POST
Description: Register a new admin.
Request Body

{
  "name": "Admin Name",
  "email": "admin@example.com",
  "password": "password"
}

## Admin Login
URL: /admin/login
Method: POST
Description: Admin login.
Request Body:
{
  "email": "admin@example.com",
  "password": "password"
}

## Create University
URL: /admin/add_org
Method: POST
Description: Create a new university.

{
  "name": "University Name",
  "location": "University Location",
}

##  Get Universities
URL: /admin/org
Method: GET
Description: Get all universities.

## Get University by ID
URL: /admin/org/:universityId
Method: GET
Description: Get a university by ID.

##  Update University
URL: /admin/org/:universityId
Method: PUT
Description: Update a university by ID.

{
  "name": "Updated University Name",
  "location": "Updated University Location",
  "established": "2023-01-01"
}

## Create Course
URL: /admin/add_course
Method: POST
Description: Create a new course.

{
  "name": "Course Name",
  "description": "Course Description",
  "universities": ["universityId1", "universityId2"]
}


## Get Courses
URL: /admin/courses
Method: GET
Description: Get all courses.


## Bulk Upload Users
URL: /admin/upload-users
Method: POST
Description: Bulk upload users from a file.
Request Body: Form-data with a file field named file.

## Get Admin by ID
URL: /admin/user/:adminId
Method: GET
Description: Get an admin by ID.

## Get Users by University
URL: /admin/users/:universityId
Method: GET
Description: Get users by university ID.

## Get User by ID
URL: /admin/user/:userId
Method: GET
Description: Get a user by ID.


## Update User
URL: /admin/user/:userId
Method: PUT
Description: Update a user by ID.
Request Body:
User Endpoints
{
  "regd_no": "12345",
  "name": "Updated User Name",
  "email": "updateduser@example.com",
  "stream": "Updated Stream",
  "year": "Updated Year",
  "password": "Updated Password"
}
