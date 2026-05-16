const mongoose = require('mongoose');

const TeamPhotoSchema = new mongoose.Schema(
  {
    division: {
      type: String,
      required: true,
      enum: ['group', 'bphi', 'komisi1', 'komisi2', 'komisi3', 'komisi4'],
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    cloudinaryPublicId: {
      type: String,
      required: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    uploadedBy: {
      type: String, // adminId dari token
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model('TeamPhoto', TeamPhotoSchema);