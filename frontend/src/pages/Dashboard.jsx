import React, { useState, useEffect, useCallback } from 'react';
import { Link2, Settings, Plus, Upload, Key, X, ChevronRight, Loader } from 'lucide-react';
import UrlCard from '../components/UrlCard';
import { shortenUrl, getUserUrls, getSummary, bulkShorten } from '../services/api';
import { useAuth } from '../hooks/useAuth';

const Dashboard = () => {
    const { user } = useAuth();
    const [urls, setUrls] = useState([]);
    const [summary, setSummary] = useState({ totalLinks: 0, activeLinks: 0, totalClicks: 0 });
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [activeTab, setActiveTab] = useState('single'); // 'single' | 'bulk'
    const [bulkText, setBulkText] = useState('');
    const [bulkResults, setBulkResults] = useState([]);

    const [form, setForm] = useState({
        original_url: '',
        custom_slug: '',
        expiry_date: '',
        password: '',
    });

    const fetchData = useCallback(async () => {
        try {
            const [urlsRes, summaryRes] = await Promise.all([
                getUserUrls(page, 10),
                getSummary(),
            ]);
            setUrls(urlsRes.data.urls);
            setTotal(urlsRes.data.total);
            setSummary(summaryRes.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [page]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleShorten = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        setResult(null);
        try {
            const { data } = await shortenUrl(form);
            setResult(data);
            setForm({ original_url: '', custom_slug: '', expiry_date: '', password: '' });
            fetchData();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to shorten URL');
        } finally {
            setSubmitting(false);
        }
    };

    const handleBulk = async () => {
        if (!bulkText.trim()) return;
        const urls = bulkText
            .split('\n')
            .map(l => l.trim())
            .filter(Boolean)
            .map(url => ({ url }));
        try {
            const { data } = await bulkShorten(urls);
            setBulkResults(data.results);
            fetchData();
        } catch (err) {
            setError(err.response?.data?.error || 'Bulk shorten failed');
        }
    };

    return (
        <div className="page dashboard-page">
            {/* Stats Row */}
            <div className="stats-grid">
                <div className="stat-card">
                    <p className="stat-label">Total Links</p>
                    <p className="stat-value">{summary.totalLinks}</p>
                </div>
                <div className="stat-card">
                    <p className="stat-label">Active Links</p>
                    <p className="stat-value stat-green">{summary.activeLinks}</p>
                </div>
                <div className="stat-card">
                    <p className="stat-label">Total Clicks</p>
                    <p className="stat-value stat-blue">{summary.totalClicks}</p>
                </div>
            </div>

            {/* Shorten Box */}
            <div className="shorten-box">
                <div className="tab-row">
                    <button
                        className={`tab-btn ${activeTab === 'single' ? 'active' : ''}`}
                        onClick={() => setActiveTab('single')}
                    >
                        <Link2 size={15} /> Single URL
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'bulk' ? 'active' : ''}`}
                        onClick={() => setActiveTab('bulk')}
                    >
                        <Upload size={15} /> Bulk Shorten
                    </button>
                </div>

                {activeTab === 'single' ? (
                    <form onSubmit={handleShorten} className="shorten-form">
                        <div className="shorten-main-row">
                            <input
                                type="url"
                                className="form-input shorten-input"
                                placeholder="Paste your long URL here..."
                                value={form.original_url}
                                onChange={(e) => setForm({ ...form, original_url: e.target.value })}
                                required
                            />
                            <button type="submit" className="btn btn-primary btn-shorten" disabled={submitting}>
                                {submitting ? <Loader size={16} className="spin" /> : <><Plus size={16} /> Shorten</>}
                            </button>
                        </div>

                        <button
                            type="button"
                            className="advanced-toggle"
                            onClick={() => setShowAdvanced(!showAdvanced)}
                        >
                            <Settings size={14} /> Advanced options
                            <ChevronRight size={14} className={showAdvanced ? 'rotated' : ''} />
                        </button>

                        {showAdvanced && (
                            <div className="advanced-grid">
                                <div className="form-group">
                                    <label className="form-label">Custom slug (optional)</label>
                                    <div className="slug-input-row">
                                        <span className="slug-prefix">shortlinkx.com/</span>
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="my-custom-link"
                                            value={form.custom_slug}
                                            onChange={(e) => setForm({ ...form, custom_slug: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Expiry date (optional)</label>
                                    <input
                                        type="datetime-local"
                                        className="form-input"
                                        value={form.expiry_date}
                                        onChange={(e) => setForm({ ...form, expiry_date: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Password protect (optional)</label>
                                    <input
                                        type="password"
                                        className="form-input"
                                        placeholder="Set a link password..."
                                        value={form.password}
                                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                                    />
                                </div>
                            </div>
                        )}
                    </form>
                ) : (
                    <div className="bulk-section">
                        <p className="bulk-hint">Enter one URL per line (max 100)</p>
                        <textarea
                            className="form-input bulk-textarea"
                            rows={6}
                            placeholder="https://example.com/page1&#10;https://example.com/page2&#10;..."
                            value={bulkText}
                            onChange={(e) => setBulkText(e.target.value)}
                        />
                        <button className="btn btn-primary" onClick={handleBulk}>
                            <Upload size={16} /> Generate Short Links
                        </button>
                        {bulkResults.length > 0 && (
                            <div className="bulk-results">
                                {bulkResults.map((r, i) => (
                                    <div key={i} className={`bulk-result-row ${r.error ? 'bulk-error' : ''}`}>
                                        <span className="bulk-original">{r.original_url}</span>
                                        <span className="bulk-arrow">→</span>
                                        <span className="bulk-short">{r.error || r.short_url}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {error && <div className="alert alert-error">{error} <button onClick={() => setError('')}><X size={14} /></button></div>}

                {result && (
                    <div className="result-box">
                        <p className="result-label">✅ Short URL created!</p>
                        <a href={result.short_url} target="_blank" rel="noopener noreferrer" className="result-url">
                            {result.short_url}
                        </a>
                        {result.qr_code && (
                            <img src={result.qr_code} alt="QR Code" className="result-qr" />
                        )}
                    </div>
                )}
            </div>

            {/* URL List */}
            <div className="urls-section">
                <div className="section-header">
                    <h2 className="section-title">Your Links</h2>
                    <span className="section-count">{total} total</span>
                </div>

                {loading ? (
                    <div className="loading-state"><Loader size={24} className="spin" /> Loading links...</div>
                ) : urls.length === 0 ? (
                    <div className="empty-state">
                        <Link2 size={48} className="empty-icon" />
                        <p>No links yet. Shorten your first URL above!</p>
                    </div>
                ) : (
                    <div className="url-list">
                        {urls.map((url) => (
                            <UrlCard key={url.id} url={url} onRefresh={fetchData} />
                        ))}
                    </div>
                )}

                {total > 10 && (
                    <div className="pagination">
                        <button
                            className="btn btn-ghost btn-sm"
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                        >Previous</button>
                        <span className="page-info">Page {page}</span>
                        <button
                            className="btn btn-ghost btn-sm"
                            disabled={page * 10 >= total}
                            onClick={() => setPage(p => p + 1)}
                        >Next</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
