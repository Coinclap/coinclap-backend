import { Document } from "mongoose"

export interface IPlanDocument extends Document {
  name: string
  price: number
  validityDays: number
  perks: string[]
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}