import React from 'react';
import { Image, Trash2, CheckCircle, Plus } from 'lucide-react';

const QuestionForm = ({ question, index, onChange, onRemove, expanded, onToggleExpand }) => {
    const updateField = (field, value) => {
        onChange(index, { ...question, [field]: value });
    };

    const updateOption = (optIndex, field, value) => {
        const newOptions = [...question.options];
        newOptions[optIndex][field] = value;
        onChange(index, { ...question, options: newOptions });
    };

    const setCorrectOption = (optId) => {
        onChange(index, { ...question, correct_option: optId });
    };

    if (!expanded) {
        return (
            <div className="card" style={{ marginBottom: '1rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} onClick={onToggleExpand}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ background: 'var(--primary)', color: 'white', width: '2rem', height: '2rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                        {index + 1}
                    </div>
                    <span style={{ fontWeight: '500' }}>
                        {question.text || "New Question..."}
                    </span>
                </div>
                <button
                    onClick={(e) => { e.stopPropagation(); onRemove(index); }}
                    className="btn btn-outline"
                    style={{ color: 'var(--error)', borderColor: 'var(--error)', padding: '0.4rem' }}
                >
                    <Trash2 size={16} />
                </button>
            </div>
        );
    }

    return (
        <div className="card" style={{ marginBottom: '1.5rem', borderLeft: '4px solid var(--primary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ background: 'var(--primary)', color: 'white', width: '2rem', height: '2rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem' }}>
                        {index + 1}
                    </div>
                    Question Details
                </h4>
                <button onClick={() => onToggleExpand()} className="btn btn-outline" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>Collapse</button>
            </div>

            <div className="input-group">
                <textarea
                    className="input"
                    value={question.text}
                    onChange={(e) => updateField('text', e.target.value)}
                    placeholder="Enter your question here..."
                    rows={3}
                    style={{ resize: 'vertical', minHeight: '80px' }}
                />
            </div>

            {/* Image Upload */}
            <div style={{ marginBottom: '1.5rem' }}>
                <label className="label">Question Image</label>
                {!question.image_url && !question.file_preview ? (
                    <div
                        style={{ border: '2px dashed var(--border)', borderRadius: 'var(--radius)', padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', cursor: 'pointer', position: 'relative' }}
                        onClick={() => document.getElementById(`file-upload-${index}`).click()}
                    >
                        <input
                            id={`file-upload-${index}`}
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={(e) => {
                                if (e.target.files[0]) {
                                    const file = e.target.files[0];
                                    const preview = URL.createObjectURL(file);
                                    onChange(index, { ...question, file_obj: file, file_preview: preview });
                                }
                            }}
                        />
                        <Image style={{ display: 'block', margin: '0 auto 0.5rem' }} />
                        <span style={{ fontSize: '0.9rem' }}>Click to upload question image</span>
                    </div>
                ) : (
                    <div style={{ position: 'relative', width: 'fit-content' }}>
                        <img
                            src={question.file_preview || question.image_url}
                            alt="Question"
                            style={{ maxHeight: '200px', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}
                        />
                        <button
                            onClick={() => onChange(index, { ...question, file_obj: null, file_preview: null, image_url: null })}
                            className="btn"
                            style={{ position: 'absolute', top: '-10px', right: '-10px', background: 'var(--error)', color: 'white', padding: '0.25rem', borderRadius: '50%', height: '24px', width: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                )}
            </div>

            {/* Options */}
            <div style={{ marginBottom: '1.5rem' }}>
                <label className="label">Answer Options</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {question.options.map((opt, i) => (
                        <div key={opt.id} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                            <div
                                onClick={() => setCorrectOption(opt.id)}
                                style={{
                                    cursor: 'pointer',
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '50%',
                                    border: `2px solid ${question.correct_option === opt.id ? 'var(--success)' : 'var(--border)'}`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    background: question.correct_option === opt.id ? 'var(--success)' : 'transparent',
                                    flexShrink: 0
                                }}
                            >
                                {question.correct_option === opt.id && <CheckCircle size={14} />}
                            </div>
                            <span style={{ fontWeight: '600', width: '20px' }}>{opt.id}</span>
                            <input
                                className="input"
                                style={{ padding: '0.5rem 0.75rem' }}
                                value={opt.text}
                                onChange={(e) => updateOption(i, 'text', e.target.value)}
                                placeholder={`Option ${opt.id}`}
                            />
                        </div>
                    ))}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="label">Difficulty</label>
                    <select
                        className="input"
                        value={question.difficulty}
                        onChange={(e) => updateField('difficulty', e.target.value)}
                    >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                        <option value="pro">Pro</option>
                    </select>
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="label">Marks</label>
                    <input
                        type="number"
                        className="input"
                        value={question.marks}
                        onChange={(e) => updateField('marks', e.target.value === '' ? '' : parseFloat(e.target.value))}
                        min="0.5"
                        step="0.5"
                    />
                </div>
            </div>

            <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="label">Explanation (Optional)</label>
                <textarea
                    className="input"
                    value={question.explanation}
                    onChange={(e) => updateField('explanation', e.target.value)}
                    placeholder="Explain the correct answer..."
                    rows={2}
                />
            </div>

            <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                    onClick={() => onRemove(index)}
                    className="btn btn-outline"
                    style={{ color: 'var(--error)', borderColor: 'var(--error)', fontSize: '0.85rem', padding: '0.5rem 1rem' }}
                >
                    <Trash2 size={16} /> Delete Question
                </button>
            </div>
        </div>
    );
};

export default QuestionForm;
