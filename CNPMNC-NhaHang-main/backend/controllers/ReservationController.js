import Reservation from "../models/Reservation.js";
import Table from "../models/Table.js";

class ReservationController {
  // [GET] /api/reservations
  async getAllReservations(req, res) {
    try {
      const reservations = await Reservation.find().populate(
        "table user order"
      );
      res.json(reservations);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // [GET] /api/reservations/:id
  async getReservationById(req, res) {
    try {
      const reservation = await Reservation.findById(req.params.id).populate(
        "table user order"
      );
      if (!reservation)
        return res.status(404).json({ message: "Reservation not found" });
      res.json(reservation);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // [POST] /api/reservations/create
  async createReservation(req, res) {
    try {
      const { table, user, customerName, customerPhone, reservationTime, guests, note } = req.body;

      // ✅ KIỂM TRA THỜI GIAN KHÔNG ĐƯỢC QUÁ KHỨ
      const now = new Date();
      const requestedTime = new Date(reservationTime);
      if (requestedTime < now) {
        return res.status(400).json({
          message: "Không thể đặt bàn trong quá khứ. Vui lòng chọn thời gian tương lai.",
        });
      }

      // Kiểm tra bàn tồn tại
      const tableDoc = await Table.findById(table);
      if (!tableDoc)
        return res.status(404).json({ message: "Bàn không tồn tại" });

      // ✅ KIỂM TRA SỐ GHẾ
      if (guests > tableDoc.seats) {
        return res.status(400).json({
          message: `Bàn ${tableDoc.tableNumber} chỉ có ${tableDoc.seats} ghế, không đủ cho ${guests} người. Vui lòng chọn bàn khác.`,
        });
      }

      // ✅ KIỂM TRA TRÙNG LỊCH (2-HOUR SLOTS)
      const existingReservations = await Reservation.find({
        table: table,
        status: { $in: ["pending", "confirmed"] },
      });

      for (const existing of existingReservations) {
        const existingTime = new Date(existing.reservationTime);
        const timeDiffMinutes = Math.abs(requestedTime - existingTime) / 60000;

        // Nếu khoảng cách < 2 giờ (120 phút) → Trùng lịch
        if (timeDiffMinutes < 120) {
          const existingTimeStr = existingTime.toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
          });
          return res.status(400).json({
            message: `Bàn ${tableDoc.tableNumber} đã có đặt chỗ lúc ${existingTimeStr}. Mỗi đặt chỗ cách nhau tối thiểu 2 giờ. Vui lòng chọn giờ khác.`,
          });
        }
      }

      // Tạo reservation mới
      const newRes = new Reservation({
        table,
        user: user || null,
        customerName: customerName || null,
        customerPhone: customerPhone || null,
        reservationTime: reservationTime,
        guests,
        note,
        createdAt: new Date(),
        status: "pending",
      });
      await newRes.save();

      // ✅ KHÔNG CẬP NHẬT table.status NỮA (để tránh lock bàn)
      tableDoc.reservation = newRes._id;
      await tableDoc.save();

      res.status(201).json({
        message: "Đặt bàn thành công!",
        reservation: newRes,
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // [PUT] /api/reservations/:id
  async updateReservation(req, res) {
    try {
      const updated = await Reservation.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );
      if (!updated)
        return res.status(404).json({ message: "Reservation not found" });
      res.json({
        message: "Reservation updated successfully",
        reservation: updated,
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // [DELETE] /api/reservations/:id (hủy bàn)
  async cancelReservation(req, res) {
    try {
      const reservation = await Reservation.findById(req.params.id);
      if (!reservation)
        return res.status(404).json({ message: "Reservation not found" });

      // Cập nhật trạng thái reservation
      reservation.status = "cancelled";
      reservation.cancelledAt = new Date();
      await reservation.save();

      // ✅ CHỈ XÓA REFERENCE, KHÔNG ĐỔI STATUS
      // (Vì bàn có thể đang có khách khác)
      const table = await Table.findById(reservation.table);
      if (table) {
        table.reservation = null;
        await table.save();
      }

      res.json({
        message: "Đã hủy đặt bàn thành công",
        reservation,
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // [PATCH] /api/reservations/:id/status (xác nhận / cập nhật trạng thái)
  async updateStatus(req, res) {
    try {
      const { status } = req.body;
      const reservation = await Reservation.findById(req.params.id);
      if (!reservation)
        return res.status(404).json({ message: "Reservation not found" });

      reservation.status = status;
      await reservation.save();

      // ✅ CHỈ KHI KHÁCH ĐÃ TỚI (confirmed) MỚI ĐỔI SANG OCCUPIED
      const table = await Table.findById(reservation.table);
      if (table && status === "confirmed") {
        table.status = "occupied";
        await table.save();
      }
      // Không tự động đổi về available khi cancelled

      res.json({
        message: "Cập nhật trạng thái thành công",
        reservation,
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // [GET] /api/reservations/byTable/:id
  async getByTable(req, res) {
    try {
      const { id } = req.params;
      const reservations = await Reservation.find({ table: id }).populate(
        "table user order"
      );

      if (!reservations || reservations.length === 0) {
        return res
          .status(404)
          .json({ message: "Không có đặt bàn nào cho bàn này." });
      }

      res.status(200).json(reservations);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // [PATCH] /api/reservations/byTable/:id/status
async updateStatusByTable(req, res) {
  try {
    const { id } = req.params;
    const { confirmedBy } = req.body; // Nhân viên xác nhận (optional)

    // Lấy tất cả reservation pending cho bàn này
    const reservations = await Reservation.find({ table: id, status: "pending" });

    if (reservations.length === 0) {
      return res.status(404).json({ message: "Không có reservation pending nào." });
    }

    // Cập nhật tất cả sang "confirmed"
    const now = new Date();
    for (const r of reservations) {
      r.status = "confirmed";
      r.arrivalTime = now; // ✅ Lưu thời gian thực tế đến
      r.confirmedBy = confirmedBy || null;
      await r.save();
    }

    // Cập nhật trạng thái bàn sang occupied
    const table = await Table.findById(id);
    if (table) {
      table.status = "occupied";
      await table.save();
    }

    res.json({
      message: "Đã xác nhận khách tới thành công",
      reservations,
      table,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

  // [POST] /api/reservations/auto-cancel-overdue
  // ✅ AUTO-CANCEL NẾU QUÁ GIỜ 30 PHÚT
  async autoCancelOverdue(req, res) {
    try {
      const now = new Date();
      
      // Tìm tất cả reservation pending đã quá giờ 30 phút
      const overdueReservations = await Reservation.find({
        status: "pending",
      });

      const cancelledList = [];
      
      for (const reservation of overdueReservations) {
        const reservationTime = new Date(reservation.reservationTime);
        const minutesLate = (now - reservationTime) / 60000;

        // Nếu quá giờ 30 phút → Auto cancel
        if (minutesLate > 30) {
          reservation.status = "cancelled";
          reservation.cancelledAt = now;
          reservation.note = (reservation.note || "") + " [Auto-cancelled: No show after 30 mins]";
          await reservation.save();

          // Xóa reference từ table
          const table = await Table.findById(reservation.table);
          if (table) {
            table.reservation = null;
            await table.save();
          }

          cancelledList.push({
            reservationId: reservation._id,
            table: table?.tableNumber,
            reservationTime: reservationTime,
            minutesLate: Math.floor(minutesLate),
          });
        }
      }

      res.json({
        message: `Đã tự động hủy ${cancelledList.length} đặt chỗ quá hạn`,
        cancelled: cancelledList,
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

}

export default new ReservationController();
