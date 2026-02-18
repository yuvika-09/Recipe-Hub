const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema({

  user: String,   

  message: String,

  type: String,     

  read: {
    type: Boolean,
    default: false
  }

}, { timestamps: true });

module.exports =
  mongoose.model("Notification", NotificationSchema);
