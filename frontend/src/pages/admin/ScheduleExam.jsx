import React, { useState, useEffect } from 'react';
import api from '../../api';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Calendar, Clock, CheckSquare, Search, Copy } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';

const ScheduleExam = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { showNotification } = useNotifications();

    // Cascading state
    const [groups, setGroups] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [papers, setPapers] = useState([]);
    const [chapters, setChapters] = useState([]);
    const [availableQuestions, setAvailableQuestions] = useState([]);
    const [selectedQuestionIds, setSelectedQuestionIds] = useState([]);

    const [formData, setFormData] = useState({
        title: '',
        group_id: '',
        subject_id: '',
        paper_id: '',
        chapter_id: '',
        start_time: '',
        end_time: '',
        duration_minutes: 60
    });

    // Initial load: Groups and potential Clone State
    useEffect(() => {
        api.get('/hierarchy/groups').then(res => {
            setGroups(res.data);

            // Handle Cloning State Injection
            if (location.state?.cloneFrom) {
                const src = location.state.cloneFrom;

                setFormData(prev => ({
                    ...prev,
                    title: `${src.title} (Clone)`,
                    group_id: src.group_id || '',
                    subject_id: src.subject_id || '',
                    paper_id: src.paper_id || '',
                    chapter_id: src.chapter_id || '',
                    duration_minutes: src.duration_minutes || 60,
                    start_time: '',
                    end_time: ''
                }));

                if (src.exam_questions && src.exam_questions.length > 0) {
                    const clonedQuestions = src.exam_questions.map(eq => eq.question).filter(q => q);
                    setSelectedQuestionIds(clonedQuestions.map(q => q.id));
                }

                showNotification("Exam schema cloned successfully! Please set new start and end times.", "success");
            }
        }).catch(err => {
            showNotification("Failed to load groups.", "error");
        });
    }, [location.state]);

    // Load Subjects
    useEffect(() => {
        if (formData.group_id) {
            api.get(`/hierarchy/groups/${formData.group_id}/subjects`).then(res => {
                setSubjects(res.data);
            });
        }
    }, [formData.group_id]);

    // Load Papers
    useEffect(() => {
        if (formData.subject_id) {
            api.get(`/hierarchy/subjects/${formData.subject_id}/papers`).then(res => {
                setPapers(res.data);
            });
        }
    }, [formData.subject_id]);

    // Load Chapters
    useEffect(() => {
        if (formData.paper_id) {
            api.get(`/hierarchy/papers/${formData.paper_id}/chapters`).then(res => {
                setChapters(res.data);
            });
        }
    }, [formData.paper_id]);

    // Load Questions
    useEffect(() => {
        // Always load all questions for the chapter so the teacher can select from the full pool
        if (formData.chapter_id) {
            api.get(`/exams/chapter-questions/${formData.chapter_id}`).then(res => {
                setAvailableQuestions(res.data);
            }).catch(err => {
                showNotification("Failed to load questions.", "error");
            });
        }
        // Once initialized, clear clone state so user can freely change chapters later
        if (location.state?.cloneFrom && formData.chapter_id) {
            window.history.replaceState({}, document.title)
        }
    }, [formData.chapter_id, location.state]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        let updates = { [name]: value };

        if (name === 'group_id') {
            updates.subject_id = '';
            updates.paper_id = '';
            updates.chapter_id = '';
            setSubjects([]);
            setPapers([]);
            setChapters([]);
            setAvailableQuestions([]);
            setSelectedQuestionIds([]);
        } else if (name === 'subject_id') {
            updates.paper_id = '';
            updates.chapter_id = '';
            setPapers([]);
            setChapters([]);
            setAvailableQuestions([]);
            setSelectedQuestionIds([]);
        } else if (name === 'paper_id') {
            updates.chapter_id = '';
            setChapters([]);
            setAvailableQuestions([]);
            setSelectedQuestionIds([]);
        } else if (name === 'chapter_id') {
            setAvailableQuestions([]);
            setSelectedQuestionIds([]);
        }

        setFormData(prev => ({ ...prev, ...updates }));
    };

    const toggleQuestion = (questionId) => {
        setSelectedQuestionIds(prev => {
            if (prev.includes(questionId)) {
                return prev.filter(id => id !== questionId);
            } else {
                return [...prev, questionId];
            }
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (selectedQuestionIds.length === 0) {
            showNotification("Please select at least one question.", "warning");
            return;
        }

        try {
            const payload = {
                title: formData.title,
                group_id: parseInt(formData.group_id),
                subject_id: parseInt(formData.subject_id),
                paper_id: parseInt(formData.paper_id),
                chapter_id: parseInt(formData.chapter_id),
                start_time: new Date(formData.start_time).toISOString(),
                end_time: new Date(formData.end_time).toISOString(),
                duration_minutes: parseInt(formData.duration_minutes),
                question_ids: selectedQuestionIds
            };

            await api.post('/exams/', payload);
            showNotification("Exam Scheduled Successfully!", "success");
            navigate('/dashboard');
        } catch (error) {
            console.error("Schedule failed", error);
            const msg = error.response?.data?.detail || error.message || "Failed to schedule exam";
            showNotification(`Error: ${msg}`, "error");
        }
    };

    return (
        <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '3rem' }}>
            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <Link to="/dashboard" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.9rem' }}>&larr; Back to Dashboard</Link>
                    <h2 style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {location.state?.cloneFrom ? <Copy size={24} color="var(--primary)" /> : null}
                        {location.state?.cloneFrom ? "Clone Exam Configuration" : "Schedule New Exam"}
                    </h2>
                </div>
            </div>

            <div className="card" style={{ marginBottom: '2rem' }}>
                <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Exam Configuration</h3>
                <form onSubmit={handleSubmit}>

                    <div className="input-group">
                        <label className="label">Exam Title</label>
                        <input
                            type="text"
                            className="input"
                            name="title"
                            placeholder="e.g. Weekly Assessment 1"
                            value={formData.title}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="input-group">
                            <label className="label">Group</label>
                            <select className="input" name="group_id" value={formData.group_id} onChange={handleChange} required>
                                <option value="">-- Select Group --</option>
                                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                            </select>
                        </div>

                        <div className="input-group">
                            <label className="label">Subject</label>
                            <select className="input" name="subject_id" value={formData.subject_id} onChange={handleChange} required disabled={!formData.group_id}>
                                <option value="">-- Select Subject --</option>
                                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>

                        <div className="input-group">
                            <label className="label">Paper</label>
                            <select className="input" name="paper_id" value={formData.paper_id} onChange={handleChange} required disabled={!formData.subject_id}>
                                <option value="">-- Select Paper --</option>
                                {papers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>

                        <div className="input-group">
                            <label className="label">Chapter</label>
                            <select className="input" name="chapter_id" value={formData.chapter_id} onChange={handleChange} required disabled={!formData.paper_id}>
                                <option value="">-- Select Chapter --</option>
                                {chapters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                        <div className="input-group">
                            <label className="label">Start Time</label>
                            <input
                                type="datetime-local"
                                className="input"
                                name="start_time"
                                value={formData.start_time}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="input-group">
                            <label className="label">End Time</label>
                            <input
                                type="datetime-local"
                                className="input"
                                name="end_time"
                                value={formData.end_time}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label className="label">Duration (Minutes)</label>
                        <div style={{ position: 'relative' }}>
                            <Clock size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                            <input
                                type="number"
                                className="input"
                                name="duration_minutes"
                                style={{ paddingLeft: '2.5rem' }}
                                value={formData.duration_minutes}
                                onChange={handleChange}
                                min="5"
                                required
                            />
                        </div>
                    </div>

                    {/* Question Selection Area */}
                    {formData.chapter_id && (
                        <div style={{ marginTop: '2rem' }}>
                            <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                                <span>Select Questions</span>
                                <span style={{ fontSize: '0.9rem', color: 'var(--primary)' }}>
                                    {selectedQuestionIds.length} / {availableQuestions.length} Selected
                                </span>
                            </h3>

                            {availableQuestions.length === 0 ? (
                                <div style={{ padding: '2rem', textAlign: 'center', background: 'var(--bg-secondary)', borderRadius: '8px', color: 'var(--text-muted)' }}>
                                    No active questions found in this chapter.
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '400px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                                    {availableQuestions.map((q, idx) => (
                                        <div
                                            key={q.id}
                                            onClick={() => toggleQuestion(q.id)}
                                            style={{
                                                display: 'flex', gap: '1rem', padding: '1rem',
                                                background: selectedQuestionIds.includes(q.id) ? 'rgba(56, 189, 248, 0.05)' : '#fff',
                                                border: `1px solid ${selectedQuestionIds.includes(q.id) ? 'var(--primary)' : 'var(--border)'}`,
                                                borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s'
                                            }}
                                        >
                                            <div style={{ marginTop: '2px' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedQuestionIds.includes(q.id)}
                                                    onChange={() => { }} // handled by parent onClick
                                                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                                />
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: '500', marginBottom: '0.5rem' }}>
                                                    Q{idx + 1}: {q.text}
                                                </div>
                                                {q.image_url && (
                                                    <div style={{ marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                                                        <img src={q.image_url.startsWith('http') ? q.image_url : `http://localhost:8000${q.image_url}`} alt="Question Reference" style={{ maxHeight: '100px', borderRadius: '4px', border: '1px solid var(--border)' }} />
                                                    </div>
                                                )}
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                    <div style={{ background: q.correct_option === 'A' ? '#dcfce7' : 'var(--bg-secondary)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>A: {q.option_a}</div>
                                                    <div style={{ background: q.correct_option === 'B' ? '#dcfce7' : 'var(--bg-secondary)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>B: {q.option_b}</div>
                                                    <div style={{ background: q.correct_option === 'C' ? '#dcfce7' : 'var(--bg-secondary)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>C: {q.option_c}</div>
                                                    <div style={{ background: q.correct_option === 'D' ? '#dcfce7' : 'var(--bg-secondary)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>D: {q.option_d}</div>
                                                </div>
                                            </div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                                                [{q.marks} Marks | {q.difficulty}]
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '2rem' }} disabled={selectedQuestionIds.length === 0}>
                        <Calendar size={18} /> Schedule Exam
                    </button>

                </form>
            </div>
        </div>
    );
};

export default ScheduleExam;
