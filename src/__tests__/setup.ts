import { DatabaseConfig } from "../config/database"
import { jest, beforeAll, afterAll, afterEach } from "@jest/globals"

// Mock logger for tests
jest.mock("../utils/logger")

// Setup test database
beforeAll(async () => {
  process.env.NODE_ENV = "test"
  process.env.MONGODB_URI = "mongodb://localhost:27017/express-app-test"

  const database = DatabaseConfig.getInstance()
  await database.connect()
})

afterAll(async () => {
  const database = DatabaseConfig.getInstance()
  await database.disconnect()
})

// Clean up after each test
afterEach(async () => {
  // Clear all collections
  const mongoose = require("mongoose")
  const collections = mongoose.connection.collections

  for (const key in collections) {
    const collection = collections[key]
    await collection.deleteMany({})
  }
})
