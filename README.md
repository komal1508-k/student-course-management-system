# Student Course Management System


A full-stack Student Course Management System built using Node.js, Express, MongoDB and Mongoose.

The application allows users to manage student and course records through a clean frontend interface and demonstrates CRUD operations, key constraints, reference relationships and MongoDB aggregation operations.

## Features

### Student Management
- Add students
- View students
- Update students
- Delete students
- Unique Student ID (`sid`)
- Filter students by minimum marks
- Sort students by marks or name

### Course Management
- Add courses
- View courses
- Update courses
- Delete courses
- Unique Course ID (`cid`)
- Assign courses only to existing students
- Student selection through dropdown

### Constraints
- Duplicate `sid` values are not allowed
- Duplicate `cid` values are not allowed
- `sid` in `course_master` acts as a reference to `student_master.sid`
- A course cannot be created for a student that does not exist
- A student cannot be deleted while a course is still referencing that student

## MongoDB Collections

### student_master

| Field | Description |
|---|---|
| sid | Unique student identifier |
| name | Student name |
| age | Student age |
| marks | Student marks |

### course_master

| Field | Description |
|---|---|
| cid | Unique course identifier |
| sid | Reference to student_master.sid |
| cname | Course name |

## MongoDB Aggregation Operations

MongoDB aggregation operations are integrated naturally into the website.

- `$match` - used for filtering students by minimum marks
- `$sort` - used for sorting students
- `$project` - used to return selected fields
- `$group` - used to calculate average and highest marks
- `$lookup` - used to combine student and course information

## Technology Stack

- HTML
- CSS
- JavaScript
- Node.js
- Express.js
- MongoDB
- Mongoose

## Project Structure

```text
mongodb-node-lab/
│
├── public/
│   └── index.html
│
├── server.js
├── package.json
├── package-lock.json
├── .gitignore
└── README.md
