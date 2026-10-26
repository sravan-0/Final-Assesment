
import { useCallback, useEffect, useMemo, useState } from 'react';
import { NavLink, Route, Routes, useNavigate } from 'react-router-dom';

const emptyFeedback = {
  courseName: '',
  feedbackComments: '',
  feedbackRating: 5
};

function FeedbackAdminApp() {
  const [feedbackList, setFeedbackList] = useState([]);
  const [loadingFeedback, setLoadingFeedback] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [message, setMessage] = useState('');
  const [savingFeedback, setSavingFeedback] = useState(false);
  const navigate = useNavigate();

  const fetchFeedback = useCallback(async () => {
    try {
      setLoadingFeedback(true);
      const response = await fetch('/api/feedback');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Unable to load feedback.');
      }

      setFeedbackList(result);
    } catch (error) {
      setMessage(error.message || 'Unable to connect to the server.');
    } finally {
      setLoadingFeedback(false);
    }
  }, []);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  const filteredFeedback = useMemo(() => {
    const searchValue = searchText.trim().toLowerCase();

    if (!searchValue) return feedbackList;

    return feedbackList.filter((feedback) =>
      [feedback.courseId, feedback.courseName, feedback.feedbackComments]
        .some((value) => String(value).toLowerCase().includes(searchValue))
    );
  }, [feedbackList, searchText]);

  const averageRating = feedbackList.length
    ? (
      feedbackList.reduce(
        (total, feedback) => total + Number(feedback.feedbackRating),
        0
      ) / feedbackList.length
    ).toFixed(1)
    : '—';

  async function saveFeedback(formData, feedbackId) {
    try {
      setSavingFeedback(true);

      const response = await fetch(
        feedbackId ? `/api/feedback/${feedbackId}` : '/api/feedback',
        {
          method: feedbackId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Unable to save feedback.');
      }

      if (feedbackId) {
        setFeedbackList((currentList) =>
          currentList.map((feedback) =>
            feedback._id === feedbackId ? result : feedback
          )
        );
        setMessage('Feedback updated successfully.');
      } else {
        setFeedbackList((currentList) => [result, ...currentList]);
        setMessage('Feedback added successfully.');
      }

      setSelectedFeedback(null);
      navigate('/');
    } catch (error) {
      setMessage(error.message || 'Unable to save feedback.');
    } finally {
      setSavingFeedback(false);
    }
  }

  async function deleteFeedback(feedbackId) {
    const feedback = feedbackList.find(
      (entry) => entry._id === feedbackId
    );

    if (
      !feedback ||
      !window.confirm(`Delete feedback for ${feedback.courseName}?`)
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/feedback/${feedbackId}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Unable to delete feedback.');
      }

      setFeedbackList((currentList) =>
        currentList.filter((entry) => entry._id !== feedbackId)
      );
      setMessage('Feedback deleted successfully.');
    } catch (error) {
      setMessage(error.message || 'Unable to delete feedback.');
    }
  }

  function startNewFeedback() {
    setSelectedFeedback(null);
  }

  function startEditingFeedback(feedback) {
    setSelectedFeedback(feedback);
    navigate('/add-feedback');
  }

  return (
    <div className="app">
      <header className="site-header">
        <div className="header-content">
          <NavLink to="/" className="site-name" onClick={() => setSelectedFeedback(null)}>
            MERN Project
          </NavLink>

          <nav className="top-navigation">
            <NavLink to="/" end className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              Dashboard
            </NavLink>

            <NavLink
              to="/add-feedback"
              onClick={startNewFeedback}
              className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
            >
              Add Feedback
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="main-content">
        {message && (
          <div className="message-box" role="status">
            <span>{message}</span>
            <button type="button" onClick={() => setMessage('')}>Close</button>
          </div>
        )}

        <Routes>
          <Route
            path="/"
            element={
              <DashboardPage
                feedbackList={filteredFeedback}
                totalFeedback={feedbackList.length}
                averageRating={averageRating}
                loadingFeedback={loadingFeedback}
                searchText={searchText}
                setSearchText={setSearchText}
                onEdit={startEditingFeedback}
                onDelete={deleteFeedback}
              />
            }
          />

          <Route
            path="/add-feedback"
            element={
              <FeedbackForm
                key={selectedFeedback?._id || 'new-feedback'}
                selectedFeedback={selectedFeedback}
                savingFeedback={savingFeedback}
                onSave={saveFeedback}
                onCancel={() => {
                  setSelectedFeedback(null);
                  navigate('/');
                }}
              />
            }
          />

          <Route
            path="*"
            element={
              <section className="simple-section">
                <h1>Page not found</h1>
                <button className="button button-dark" onClick={() => navigate('/')}>
                  Back to Dashboard
                </button>
              </section>
            }
          />
        </Routes>
      </main>

    </div>
  );
}

function DashboardPage({
  feedbackList,
  totalFeedback,
  averageRating,
  loadingFeedback,
  searchText,
  setSearchText,
  onEdit,
  onDelete
}) {
  return (
    <section className="simple-section">
      <div className="section-heading">
        <div>
          <h1>Feedback</h1>
          <p>View and manage submitted course feedback.</p>
        </div>
      </div>

      <div className="summary-grid">
        <div className="summary-box">
          <p>Total Feedback</p>
          <h2>{totalFeedback}</h2>
        </div>

        <div className="summary-box">
          <p>Average Rating</p>
          <h2>{averageRating}{averageRating !== '—' ? ' / 5' : ''}</h2>
        </div>
      </div>

      <div className="table-heading">
        <h2>Course Feedback</h2>

        <input
          type="search"
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
          placeholder="Search feedback..."
          aria-label="Search feedback"
          className="search-input"
        />
      </div>

      <div className="table-container">
        <table className="feedback-table">
          <thead>
            <tr>
              <th>Course ID</th>
              <th>Course Name</th>
              <th>Duration</th>
              <th>Overall Rating</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {loadingFeedback ? (
              <tr>
                <td colSpan="5" className="table-message">
                  Loading feedback...
                </td>
              </tr>
            ) : feedbackList.length === 0 ? (
              <tr>
                <td colSpan="5" className="table-message">
                  No feedback found.
                </td>
              </tr>
            ) : (
              feedbackList.map((feedback) => (
                <tr key={feedback._id}>
                  <td>{feedback.courseId}</td>
                  <td>
                    <strong>{feedback.courseName}</strong>
                    <p className="feedback-preview">
                      {feedback.feedbackComments}
                    </p>
                  </td>
                  <td>{feedback.courseDuration}</td>
                  <td>{feedback.feedbackRating} / 5</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="button button-outline"
                        onClick={() => onEdit(feedback)}
                      >
                        Update
                      </button>
                      <button
                        className="button button-delete"
                        onClick={() => onDelete(feedback._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function FeedbackForm({ selectedFeedback, savingFeedback, onSave, onCancel }) {
  const [formData, setFormData] = useState(
    selectedFeedback
      ? {
        courseName: selectedFeedback.courseName,
        feedbackComments: selectedFeedback.feedbackComments,
        feedbackRating: selectedFeedback.feedbackRating
      }
      : emptyFeedback
  );

  const [formError, setFormError] = useState('');

  function updateField(event) {
    const { name, value } = event.target;

    setFormData((currentData) => ({
      ...currentData,
      [name]: name === 'feedbackRating' ? Number(value) : value
    }));

    setFormError('');
  }

  function submitForm(event) {
    event.preventDefault();

    if (!formData.courseName.trim() || !formData.feedbackComments.trim()) {
      setFormError('Please fill in all fields.');
      return;
    }

    onSave(
      {
        ...formData,
        courseName: formData.courseName.trim(),
        feedbackComments: formData.feedbackComments.trim(),
        feedbackRating: Number(formData.feedbackRating)
      },
      selectedFeedback?._id
    );
  }

  return (
    <section className="form-section">
      <h1>{selectedFeedback ? 'Update Feedback' : 'Add Feedback'}</h1>
      <p className="form-intro">
        Enter the course details and submit your feedback below.
      </p>

      <form className="feedback-form" onSubmit={submitForm}>
        <div className="form-field">
          <label htmlFor="courseName">Course Name</label>
          <input
            id="courseName"
            name="courseName"
            type="text"
            value={formData.courseName}
            onChange={updateField}
            placeholder="Enter course name"
            maxLength={100}
            required
          />
        </div>

        <div className="form-field">
          <label htmlFor="feedbackComments">Feedback Comments</label>
          <textarea
            id="feedbackComments"
            name="feedbackComments"
            value={formData.feedbackComments}
            onChange={updateField}
            placeholder="Write your feedback"
            rows={5}
            maxLength={1000}
            required
          />
        </div>

        <div className="form-field">
          <label htmlFor="feedbackRating">Feedback Rating</label>
          <select
            id="feedbackRating"
            name="feedbackRating"
            value={formData.feedbackRating}
            onChange={updateField}
          >
            <option value={1}>1 - Poor</option>
            <option value={2}>2 - Fair</option>
            <option value={3}>3 - Good</option>
            <option value={4}>4 - Very Good</option>
            <option value={5}>5 - Excellent</option>
          </select>
        </div>

        {formError && <p className="form-error">{formError}</p>}

        <div className="form-buttons">
          <button
            type="button"
            className="button button-outline"
            onClick={onCancel}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="button button-dark"
            disabled={savingFeedback}
          >
            {savingFeedback
              ? 'Saving...'
              : selectedFeedback
                ? 'Update Feedback'
                : 'Submit Feedback'}
          </button>
        </div>
      </form>
    </section>
  );
}

export default FeedbackAdminApp;
