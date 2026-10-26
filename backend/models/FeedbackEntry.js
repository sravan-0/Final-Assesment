const mongoose = require('mongoose');

const feedbackEntrySchema = new mongoose.Schema({
  courseId: {
    type: String,
    unique: true,
    required: true
  },
  courseName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  courseDuration: {
    type: String,
    default: '8 weeks'
  },
  feedbackComments: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  feedbackRating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  }
}, { timestamps: true });

module.exports = mongoose.model('FeedbackEntry', feedbackEntrySchema);
