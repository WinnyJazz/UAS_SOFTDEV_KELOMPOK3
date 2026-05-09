// Abstract base - dipakai sebagai mixin / discriminator base untuk Notifikasi
// Karena MongoDB tidak punya abstract class, kita buat sebagai utility

const mongoose = require("mongoose");

const NotifiablePlugin = (schema) => {
  schema.methods.getId = function () {
    return this._id.toString();
  };

  schema.methods.getPesanNotifikasi = function () {
    // Override di masing-masing model yang implement Notifiable
    throw new Error("getPesanNotifikasi() harus di-override");
  };
};

module.exports = NotifiablePlugin;