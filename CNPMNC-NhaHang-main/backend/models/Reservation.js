import mongoose from 'mongoose';

// Defining a Model
const Schema = mongoose.Schema;
const Reservation = mongoose.Schema({
    table: { type: Schema.Types.ObjectId, ref: 'Table' },
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    customerName: { type: String }, // Tên khách vãng lai
    customerPhone: { type: String }, // SĐT khách vãng lai
    reservationTime: { type: Date }, // Thời gian đặt (dự kiến)
    arrivalTime: { type: Date }, // Thời gian thực tế đến
    status: { type: String, enum: ['pending','confirmed','cancelled'], default: 'pending' },
    guests: { type: Number, default: 1 },
    note: String,
    order: { type: Schema.Types.ObjectId, ref: 'Order' }, // Order của reservation này
    cancelledAt: Date, // Thời gian hủy
    createdAt: { type: Date }, // Thời gian tạo reservation
    confirmedBy: { type: Schema.Types.ObjectId, ref: 'User' }, // Nhân viên xác nhận
})

export default mongoose.model('Reservation', Reservation); // Accessing a Model