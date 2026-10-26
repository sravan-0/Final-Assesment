require("node:dns/promises").setServers(["8.8.8.8", "1.1.1.1"]);
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const FeedbackEntry = require('./models/FeedbackEntry');

const feedbackServer = express();
const serverPort = process.env.PORT || 5000;

feedbackServer.use(cors());
feedbackServer.use(express.json());

feedbackServer.get('/api/health', (request, response) => {
  response.json({ status: 'ok' });
});

feedbackServer.get('/api/feedback', async (request, response) => {
  try {
    const feedbackEntries = await FeedbackEntry.find().sort({ createdAt: -1 });
    response.json(feedbackEntries);
  } catch (error) {
    response.status(500).json({ message: 'Feedback could not be loaded.' });
  }
});

feedbackServer.get('/api/feedback/:feedbackId', async (request, response) => {
  try {
    const selectedFeedback = await FeedbackEntry.findById(request.params.feedbackId);
    if (!selectedFeedback) {
      return response.status(404).json({ message: 'Feedback entry was not found.' });
    }
    response.json(selectedFeedback);
  } catch (error) {
    response.status(400).json({ message: 'The feedback ID is not valid.' });
  }
});

feedbackServer.post('/api/feedback', async (request, response) => {
  try {
    const { courseName, feedbackComments, feedbackRating } = request.body;
    if (!courseName?.trim() || !feedbackComments?.trim() || feedbackRating === undefined) {
      return response.status(400).json({ message: 'Complete all feedback fields before saving.' });
    }
    const nextCourseNumber = await FeedbackEntry.countDocuments() + 1;
    const createdFeedback = await FeedbackEntry.create({
      courseId: `CRS-${String(Date.now()).slice(-5)}${String(nextCourseNumber).padStart(2, '0')}`,
      courseName,
      feedbackComments,
      feedbackRating,
      courseDuration: '8 weeks'
    });
    response.status(201).json(createdFeedback);
  } catch (error) {
    response.status(400).json({ message: 'Feedback could not be saved. Check the values and try again.' });
  }
});

feedbackServer.put('/api/feedback/:feedbackId', async (request, response) => {
  try {
    const { courseName, feedbackComments, feedbackRating } = request.body;
    if (!courseName?.trim() || !feedbackComments?.trim() || feedbackRating === undefined) {
      return response.status(400).json({ message: 'Complete all feedback fields before updating.' });
    }
    const updatedFeedback = await FeedbackEntry.findByIdAndUpdate(
      request.params.feedbackId,
      { courseName, feedbackComments, feedbackRating },
      { new: true, runValidators: true }
    );
    if (!updatedFeedback) {
      return response.status(404).json({ message: 'Feedback entry was not found.' });
    }
    response.json(updatedFeedback);
  } catch (error) {
    response.status(400).json({ message: 'Feedback could not be updated. Check the values and try again.' });
  }
});

feedbackServer.delete('/api/feedback/:feedbackId', async (request, response) => {
  try {
    const removedFeedback = await FeedbackEntry.findByIdAndDelete(request.params.feedbackId);
    if (!removedFeedback) {
      return response.status(404).json({ message: 'Feedback entry was not found.' });
    }
    response.json({ message: 'Feedback deleted successfully.' });
  } catch (error) {
    response.status(400).json({ message: 'Feedback could not be deleted.' });
  }
});

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    feedbackServer.listen(serverPort, () => {
      process.stdout.write(`Feedback API is running on port ${serverPort}\n`);
    });
  })
  .catch((connectionError) => {
    process.stderr.write('MongoDB connection failed. Check backend/.env and Atlas network access.\n');
    process.stderr.write(`${connectionError.message}\n`);
    process.exit(1);
  });
