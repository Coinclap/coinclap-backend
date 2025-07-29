import { BaseRepository } from './base.repository';
import {
  type ITransactionDocument,
  TransactionModel,
  TransactionStatus,
} from '../models/transaction.model';
import mongoose from 'mongoose';

export class TransactionRepository extends BaseRepository<ITransactionDocument> {
  constructor() {
    super(TransactionModel);
  }

  public async findByEmail(email: string): Promise<ITransactionDocument[]> {
    return await this.model.find({ email: email.toLowerCase() }).sort({ createdAt: -1 }).exec();
  }

  public async findSuccessfulTransactionByEmail(
    email: string
  ): Promise<ITransactionDocument | null> {
    return await this.model
      .findOne({ email: email.toLowerCase(), status: TransactionStatus.SUCCESS })
      .sort({ createdAt: -1 })
      .exec();
  }

  public async findByRedeemCode(redeemCode: string): Promise<ITransactionDocument | null> {
    return await this.model.findOne({ redeemCode, status: TransactionStatus.SUCCESS }).exec();
  }

  public async findByOrderId(orderId: string): Promise<ITransactionDocument | null> {
    return await this.model.findOne({ orderId }).exec();
  }

  // Add this new method to handle custom order ID searches
  public async findByCustomOrderId(customOrderId: string): Promise<ITransactionDocument | null> {
    try {
      // Try to extract transaction ID from custom order ID format
      let transactionId = customOrderId;
      
      if (customOrderId.startsWith('ORDER_')) {
        transactionId = customOrderId.replace('ORDER_', '');
      }
      
      // Try to find by transaction ID if it's a valid ObjectId
      if (mongoose.Types.ObjectId.isValid(transactionId)) {
        const transactionById = await this.model.findById(transactionId).exec();
        if (transactionById) {
          return transactionById;
        }
      }
      
      // Fallback: search by orderId field containing the custom order ID
      return await this.model.findOne({ 
        $or: [
          { orderId: customOrderId },
          { orderId: transactionId }
        ]
      }).exec();
    } catch (error) {
      console.error('Error finding transaction by custom order ID:', error);
      return null;
    }
  }

  public async updateTransactionStatus(
    id: string,
    status: TransactionStatus,
    paymentDetails?: {
      paymentId?: string;
      redeemCode?: string;
      invoiceNo?: string;
      expiryDate?: Date;
    }
  ): Promise<ITransactionDocument | null> {
    return await this.model
      .findByIdAndUpdate(
        id,
        {
          status,
          ...(paymentDetails || {}),
        },
        { new: true }
      )
      .exec();
  }

  public async getLatestInvoiceNumber(): Promise<string | null> {
    const latestTransaction = await this.model
      .findOne({ invoiceNo: { $exists: true } })
      .sort({ createdAt: -1 })
      .select('invoiceNo')
      .exec();

    return latestTransaction?.invoiceNo || null;
  }
}