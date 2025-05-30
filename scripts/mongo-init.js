// MongoDB initialization script
const db = db.getSiblingDB("express-app")

// Create collections with validation
db.createCollection("users", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["email", "username", "password", "firstName", "lastName"],
      properties: {
        email: {
          bsonType: "string",
          pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+.[a-zA-Z]{2,}$",
        },
        username: {
          bsonType: "string",
          minLength: 3,
          maxLength: 30,
        },
        password: {
          bsonType: "string",
          minLength: 6,
        },
        firstName: {
          bsonType: "string",
          maxLength: 50,
        },
        lastName: {
          bsonType: "string",
          maxLength: 50,
        },
        role: {
          bsonType: "string",
          enum: ["admin", "user", "moderator", "guest"],
        },
        isActive: {
          bsonType: "bool",
        },
      },
    },
  },
})

// Create indexes for performance
db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ username: 1 }, { unique: true })
db.users.createIndex({ email: 1, isActive: 1 })
db.users.createIndex({ username: 1, isActive: 1 })
db.users.createIndex({ role: 1, isActive: 1 })
db.users.createIndex({ createdAt: 1 })

print("Database initialization completed successfully")
